"""
Maintenance operations for our Function App

Timer-triggered functions for backup creation and package management.
"""

import azure.functions as func
import logging
import os
import subprocess
import shutil
from pathlib import Path

logger = logging.getLogger(__name__)

# Create a Blueprint for maintenance operations
bp = func.Blueprint()

@bp.schedule(
    schedule="0 */5 * * * *",  # Run every 5 minutes
    arg_name="timer",
    run_on_startup=False
)
def create_package_backup(timer: func.TimerRequest) -> None:
    """
    Create backup of .python_packages after successful deployment
    
    Schedule: Every 5 minutes (ensures backup exists after deployments)
    This ensures backup is created shortly after main pipeline deployments
    """
    logger.info("Starting package backup creation")
    
    packages_dir = Path("/home/site/wwwroot/.python_packages")
    backup_dir = Path("/home/data/.python_packages_backup")
    
    try:
        # Check if packages exist and are valid
        azure_functions_init = packages_dir / "lib/site-packages/azure/functions/__init__.py"
        if not azure_functions_init.exists():
            logger.warning("No valid packages found - skipping backup")
            return
        
        logger.info("✓ Valid packages found")
        
        # Check if backup already exists and is current
        if backup_dir.exists():
            backup_init = backup_dir / "lib/site-packages/azure/functions/__init__.py"
            if backup_init.exists():
                # Compare modification times
                packages_mtime = azure_functions_init.stat().st_mtime
                backup_mtime = backup_init.stat().st_mtime
                
                if backup_mtime >= packages_mtime:
                    logger.info("✓ Backup is current - no update needed")
                    logger.info(f"   Backup timestamp: {backup_init.stat().st_mtime}")
                    logger.info(f"   Packages timestamp: {azure_functions_init.stat().st_mtime}")
                    return
                else:
                    logger.info(f"⚠ Backup is outdated (packages modified {packages_mtime - backup_mtime:.0f}s ago)")
            else:
                logger.warning("Backup exists but is incomplete - will recreate")
        else:
            logger.info("No backup found - creating initial backup")
        
        # Verify packages are importable (azure.functions is core dependency)
        logger.info("Verifying packages are functional...")
        env = os.environ.copy()
        env["PYTHONPATH"] = str(packages_dir / "lib/site-packages")
        
        # Log environment for debugging
        logger.info(f"Environment keys available: {sorted(env.keys())}")
        logger.info(f"PYTHONPATH set to: {env.get('PYTHONPATH')}")
        logger.info(f"LD_LIBRARY_PATH: {env.get('LD_LIBRARY_PATH', 'NOT SET')}")
        
        result = subprocess.run(
            [
                "python3", "-c",
                "import azure.functions; import azure.storage.blob; import azure.identity"
            ],
            env=env,
            capture_output=True,
            timeout=30
        )
        
        if result.returncode != 0:
            logger.error(f"Package import verification failed: {result.stderr.decode()}")
            logger.warning("Skipping backup due to import errors")
            return
        
        logger.info("✓ Package imports verified successfully")
        
        # Remove old backup if exists
        if backup_dir.exists():
            logger.info("Removing old backup...")
            shutil.rmtree(backup_dir)
        
        # Create new backup
        logger.info("Creating backup...")
        backup_dir.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(packages_dir, backup_dir)
        
        # Verify backup integrity
        backup_init = backup_dir / "lib/site-packages/azure/functions/__init__.py"
        if not backup_init.exists():
            logger.error("Backup creation failed - missing files")
            shutil.rmtree(backup_dir)
            return
        
        # Verify backup is importable
        env = os.environ.copy()
        env["PYTHONPATH"] = str(backup_dir / "lib/site-packages")
        result = subprocess.run(
            ["python3", "-c", "import azure.functions; import azure.storage.blob; import azure.identity"],
            env=env,
            capture_output=True,
            timeout=30
        )
        
        if result.returncode != 0:
            logger.error(f"Backup import verification failed: {result.stderr.decode()}")
            shutil.rmtree(backup_dir)
            return
        
        # Get backup size
        total_size = sum(f.stat().st_size for f in backup_dir.rglob('*') if f.is_file())
        size_mb = total_size / (1024 * 1024)
        
        # Create marker file to indicate backup is complete and ready
        marker_file = backup_dir / ".backup_ready"
        import time
        marker_file.write_text(
            f"Backup completed: {time.strftime('%Y-%m-%d %H:%M:%S')}\n"
            f"Size: {size_mb:.1f} MB\n"
            f"Source: {packages_dir}\n"
            f"Verified: azure.functions, azure.storage.blob, azure.identity\n"
        )
        
        logger.info(f"✅ Backup created and verified (Size: {size_mb:.1f} MB)")
        logger.info(f"   Location: {backup_dir}")
        logger.info(f"   Marker: {marker_file}")
        logger.info("   Minimal pipeline can now deploy code-only updates")
        
    except subprocess.TimeoutExpired:
        logger.error("Package verification timed out")
    except Exception as e:
        logger.error(f"Backup creation failed: {e}", exc_info=True)
