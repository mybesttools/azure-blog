---
title: "How to make code-only pipelines for Azure Functions"
excerpt: "A step-by-step guide to make fast ci/cd pipelines."
coverImage: "/assets/blog/python_code_only_pipelines/Code.png"
date: "2025-12-18T10:00:00.322Z"
author:
  name: "Mike van der Sluis"
  picture: "/assets/blog/authors/mike2.jpg"
ogImage:
  url: "/assets/blog/python_code_only_pipelines/Code.png"
---

# How to Build Lightning-Fast Code-Only Pipelines for Azure Functions

When deploying Python Azure Functions, package installation can take 15-20 minutes per deployment. For a project with three Function Apps running data pipelines, this means **45-60 minutes** just to update a few lines of code. That's unacceptable for agile development.

Here's how we reduced code-only deployments from **20 minutes to under 3 minutes** using a backup/restore pattern.

## The Problem: Package Installation Bottleneck

Our Data-Ingest Function App includes heavy dependencies:
- **numpy**, **pandas**, **pyarrow** for data processing
- **deltalake** for Delta Lake integration
- **azure-storage-blob**, **azure-identity** for cloud integration

Total package size: **488 MB**

Traditional deployment approaches:

1. **Build packages remotely** (Oryx/Kudu): ❌ Doesn't work with `PublicNetworkAccess: Disabled`
2. **Include packages in ZIP**: ✅ Works, but results in 120-140 MB artifacts and slow uploads
3. **Install during deployment**: ⏱️ Takes 15-20 minutes every time

For code-only changes (bug fixes, logic updates), reinstalling hundreds of megabytes of unchanged packages is wasteful.

## The Solution: Backup Once, Restore Instantly

We implemented a two-pipeline strategy:

### Main Pipeline (Full Deployment)
- Installs all packages with `pip install --target`
- Creates 120-140 MB ZIP with code + packages
- Deploys to Function App (~20 minutes)
- **Timer function creates verified backup** after deployment

### Minimal Pipeline (Code-Only)
- Creates tiny ZIP with just Python code (~100 KB)
- Deploys in seconds
- **Restores packages from backup** via `mv` command (instant)
- Timer recreates backup for next deployment

**Result**: Code changes deploy in **2-3 minutes** instead of 20.

## Implementation Details

### 1. Timer Function for Backup Creation

We added a timer-triggered function that runs every 5 minutes:

```python
@bp.schedule(
    schedule="0 */5 * * * *",
    arg_name="timer",
    run_on_startup=False
)
def create_package_backup(timer: func.TimerRequest) -> None:
    packages_dir = Path("/home/site/wwwroot/.python_packages")
    backup_dir = Path("/home/data/.python_packages_backup")
    
    # Check if backup is current
    if backup_dir.exists():
        backup_init = backup_dir / "lib/site-packages/azure/functions/__init__.py"
        packages_init = packages_dir / "lib/site-packages/azure/functions/__init__.py"
        
        if backup_init.exists() and backup_init.stat().st_mtime >= packages_init.stat().st_mtime:
            logger.info("✓ Backup is current - no update needed")
            return
    
    # Verify packages are importable
    logger.info("Verifying packages are functional...")
    env = os.environ.copy()
    env["PYTHONPATH"] = str(packages_dir / "lib/site-packages")
    result = subprocess.run(
        ["python3", "-c", "import azure.functions; import azure.storage.blob; import azure.identity"],
        env=env,
        capture_output=True,
        timeout=30
    )
    
    if result.returncode != 0:
        logger.error("Package import verification failed")
        return
    
    # Create backup
    if backup_dir.exists():
        shutil.rmtree(backup_dir)
    
    shutil.copytree(packages_dir, backup_dir)
    
    # Create readiness marker
    marker_file = backup_dir / ".backup_ready"
    marker_file.write_text(
        f"Backup completed: {time.strftime('%Y-%m-%d %H:%M:%S')}\n"
        f"Size: {size_mb:.1f} MB\n"
        f"Verified: azure.functions, azure.storage.blob, azure.identity\n"
    )
    
    logger.info(f"✅ Backup created and verified (Size: {size_mb:.1f} MB)")
```

**Key features:**

- **Freshness check**: Skips backup if current (uses timestamp comparison)
- **Import verification**: Ensures packages are functional before backup
- **Subprocess environment**: Uses `os.environ.copy()` to preserve all env vars
- **Readiness marker**: `.backup_ready` file indicates backup is complete and verified
- **Timeout handling**: 20-minute function timeout for large package sets

### 2. Minimal Pipeline with Backup Restore

The minimal pipeline uses Azure CLI and Kudu API to restore packages:

```yaml
- task: AzureCLI@2
  displayName: '📦 Restore packages from backup'
  inputs:
    azureSubscription: '$(azureServiceConnection)'
    scriptType: 'bash'
    scriptLocation: 'inlineScript'
    inlineScript: |
      # Get Kudu credentials
      CREDS=$(az functionapp deployment list-publishing-credentials \
        --name $FUNCTION_APP \
        --resource-group $RESOURCE_GROUP \
        --query "{username:publishingUserName, password:publishingPassword}" \
        -o json)
      
      USERNAME=$(echo $CREDS | jq -r '.username')
      PASSWORD=$(echo $CREDS | jq -r '.password')
      
      # Restore via Kudu command API
      RESTORE_CMD='bash -c "
        if [ ! -d /home/data/.python_packages_backup ]; then 
          echo BACKUP_NOT_FOUND; exit 1
        fi && 
        if [ ! -f /home/data/.python_packages_backup/.backup_ready ]; then 
          echo BACKUP_NOT_READY; exit 1
        fi && 
        cat /home/data/.python_packages_backup/.backup_ready && 
        rm -rf /home/site/wwwroot/.python_packages && 
        mv /home/data/.python_packages_backup /home/site/wwwroot/.python_packages && 
        echo RESTORE_SUCCESS
      "'
      
      RESTORE_RESPONSE=$(curl -s -X POST \
        -u "$USERNAME:$PASSWORD" \
        "https://$FUNCTION_APP.scm.azurewebsites.net/api/command" \
        -H "Content-Type: application/json" \
        -d "{\"command\": \"$RESTORE_CMD\", \"dir\": \"/home/site/wwwroot\"}")
      
      if echo "$RESTORE_RESPONSE" | grep -q "RESTORE_SUCCESS"; then
        echo "✅ Packages restored from backup successfully"
      elif echo "$RESTORE_RESPONSE" | grep -q "BACKUP_NOT_READY"; then
        echo "⚠️ Backup incomplete - wait for timer to finish"
        exit 1
      else
        echo "❌ Restore failed"
        exit 1
      fi
```

**Critical optimizations:**
- **Check `.backup_ready` marker**: Prevents restoring incomplete backups
- **Use `mv` instead of `cp`**: Instant move vs 15-20 minute copy for 488 MB
- **Kudu command API**: Direct shell access to Function App filesystem
- **Clear error handling**: Actionable messages if backup not ready

## Key Learnings

### 1. Subprocess Environment Preservation

**Problem**: Using `env={"PYTHONPATH": "..."}` replaces entire environment, breaking imports.

```python
# ❌ WRONG - replaces environment
result = subprocess.run(
    ["python3", "-c", "import azure.functions"],
    env={"PYTHONPATH": str(packages_dir)}
)
```

**Solution**: Use `os.environ.copy()` to preserve all variables:

```python
# ✅ CORRECT - preserves environment
env = os.environ.copy()
env["PYTHONPATH"] = str(packages_dir / "lib/site-packages")
result = subprocess.run(
    ["python3", "-c", "import azure.functions"],
    env=env
)
```

### 2. Function Timeout Configuration

Default Azure Functions timeout is **5 minutes** (Consumption plan) or **30 minutes** (Premium/Dedicated). For backup operations with large packages, increase the timeout in `host.json`:

```json
{
  "version": "2.0",
  "functionTimeout": "00:20:00"
}
```

This allows Data-Ingest's 488 MB backup to complete (~15-20 minutes for copy + verification).

### 3. Backup Readiness Marker

Don't assume a backup directory exists = backup is complete. Data-Ingest's backup takes 15-20 minutes to create. If a minimal pipeline runs during this time, it would restore an incomplete backup.

**Solution**: Create a marker file **after** verification:

```python
marker_file = backup_dir / ".backup_ready"
marker_file.write_text(f"Backup completed: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
```

Minimal pipelines check for this marker before restoring.

### 4. Use `mv` Instead of `cp` for Restore

Copying 488 MB takes 15-20 minutes. Moving is **instant** (filesystem pointer update):

```bash
# ❌ Slow: cp -r /backup /target (15-20 min for 488 MB)
# ✅ Fast: mv /backup /target (instant)
```

After the move, the timer function recreates the backup for the next deployment.

### 5. Backup Freshness Optimization

Initially, the timer created a new backup every 5 minutes, even if nothing changed. This wasted resources.

**Solution**: Compare timestamps before backup:

```python
packages_mtime = packages_init.stat().st_mtime
backup_mtime = backup_init.stat().st_mtime

if backup_mtime >= packages_mtime:
    logger.info("✓ Backup is current - no update needed")
    return
```

This reduced unnecessary 3-minute backup operations from running constantly to only after deployments.

## Results

### Deployment Times

| Deployment Type | Before | After | Improvement |
|----------------|--------|-------|-------------|
| Data-In (31 MB packages) | 3-5 min | 2-3 min | ~40% faster |
| Data-Ingest (488 MB packages) | 20 min | 2-3 min | **85% faster** |
| Data-Out (similar to Data-In) | 3-5 min | 2-3 min | ~40% faster |

### Developer Experience

**Before**: Making a code change required a full 20-minute deployment. Developers would context-switch during builds, losing focus.

**After**: Code changes deploy in 2-3 minutes. Fast enough to stay in flow state.

### CI/CD Pipeline Efficiency

With three Function Apps and frequent updates:
- **Before**: 3 × 20 min = 60 minutes per deployment round
- **After**: 3 × 3 min = 9 minutes per deployment round
- **Savings**: 51 minutes per deployment (85% reduction)

For a team making 5 deployments per day: **4+ hours saved daily**.

## When to Use This Pattern

This pattern works best when:

✅ **Heavy dependencies**: Your Function App has large packages (>100 MB)  
✅ **Frequent deployments**: You deploy code changes multiple times daily  
✅ **Code-only changes**: Most updates don't change `requirements.txt`  
✅ **Private endpoints**: Your Function App uses `PublicNetworkAccess: Disabled` (Oryx won't work)  

This pattern may not be needed if:

❌ **Small packages**: Total dependencies <50 MB (pip install is fast enough)  
❌ **Infrequent deploys**: Weekly releases (speed less critical)  
❌ **Public endpoints**: Oryx/Kudu remote build works fine  

## Conclusion

By separating "full deployment with packages" from "code-only deployment," we achieved **85% faster deployments** for our heaviest Function App while maintaining reliability through verified backups and readiness markers.

The key insights:
1. **Create verified backups** after main deployments
2. **Use markers** to ensure backup completeness
3. **Move, don't copy** for instant restore
4. **Preserve environments** in subprocess calls
5. **Check freshness** to avoid unnecessary work

This pattern has transformed our development workflow, enabling rapid iteration without sacrificing safety or reliability.

## Code Repository

Full implementation available in our [GitHub repository](https://github.com/mybesttools/azure-blog), including:

- Timer function code (`/public/sourcecode/codeonly/functions/maintenance_operations.py`)
- Main pipeline (`/public/sourcecode/codeonly/azure-pipelines.yml`)
- Minimal pipeline (`/public/sourcecode/codeonly/azure-pipelines-minimal.yml`)
- Host configuration (`/public/sourcecode/codeonly/host.json`)

---

**Questions or improvements?** Share your experiences with Azure Functions CI/CD optimization in the comments section below powered by GitHub Discussions. You can also open an [issue](https://github.com/mybesttools/azure-blog/issues) or [discussion](https://github.com/mybesttools/azure-blog/discussions) directly on our GitHub repository!
