# Azure Deployment Guide

## Prerequisites
- Azure account
- Azure CLI installed
- Docker installed locally

## Deployment Options

This guide covers three deployment options for Azure:

1. **Azure Container Instances** (Recommended) - ~$10-15/month
   - Simple, cost-effective, easy to manage, ideal for blogs and low-traffic sites
2. **Azure App Service** - ~$18/month
   - Traditional PaaS, simple deployment, good for standard workloads
3. **Azure Container Apps** - ~$20-25/month
   - Advanced features with automatic scaling, managed HTTPS, best for high-traffic production

All options use MongoDB Atlas (free tier) for the database.

## Recommended: Azure Container Instances Deployment

Azure Container Instances provides a simple, cost-effective way to run containerized applications without managing infrastructure. Perfect for blogs and low to medium traffic sites.

### Prerequisites
1. Complete MongoDB Atlas setup (see below)
2. Build and push Docker image to Azure Container Registry (see below)

### 1. Set up MongoDB Atlas (Free Tier)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP and Azure IPs (0.0.0.0/0 for development)
5. Get your connection string

### 2. Set up Azure Container Registry

#### Create a Resource Group
```bash
az group create --name azure-blog-rg --location eastus
```

#### Create Azure Container Registry
```bash
az acr create \
  --resource-group azure-blog-rg \
  --name yourblogacr \
  --sku Basic
```

#### Build and Push Docker Image
```bash
# Login to ACR
az acr login --name yourblogacr

# Build the image
docker build -t yourblogacr.azurecr.io/azure-blog:latest .

# Push to ACR
docker push yourblogacr.azurecr.io/azure-blog:latest
```

### 3. Deploy to Azure Container Instances

#### Create Container Instance with ACR Authentication
```bash
az container create \
  --resource-group azure-blog-rg \
  --name azure-blog \
  --image yourblogacr.azurecr.io/azure-blog:latest \
  --registry-login-server yourblogacr.azurecr.io \
  --registry-username $(az acr credential show --name yourblogacr --query username -o tsv) \
  --registry-password $(az acr credential show --name yourblogacr --query passwords[0].value -o tsv) \
  --dns-name-label your-unique-dns-name \
  --ports 3000 \
  --environment-variables \
    MONGODB_URI="your-mongodb-atlas-connection-string" \
    PAYLOAD_SECRET="your-generated-secret-key" \
    PAYLOAD_PUBLIC_SERVER_URL="http://your-unique-dns-name.eastus.azurecontainer.io:3000" \
    NEXT_PUBLIC_SERVER_URL="http://your-unique-dns-name.eastus.azurecontainer.io:3000" \
  --cpu 1 \
  --memory 1.5
```

**Note**: Replace `your-unique-dns-name` with a globally unique DNS label for your container.

#### Verify Deployment
```bash
# Check container status
az container show \
  --resource-group azure-blog-rg \
  --name azure-blog \
  --query "{FQDN:ipAddress.fqdn,ProvisioningState:provisioningState}" \
  --output table

# View logs
az container logs \
  --resource-group azure-blog-rg \
  --name azure-blog
```

### 4. Access Your Blog

- Blog: `http://your-unique-dns-name.eastus.azurecontainer.io:3000`
- Admin Panel: `http://your-unique-dns-name.eastus.azurecontainer.io:3000/admin`

### 5. Update the Application

When you need to deploy updates:

```bash
# Build and push new image
docker build -t yourblogacr.azurecr.io/azure-blog:latest .
docker push yourblogacr.azurecr.io/azure-blog:latest

# Delete and recreate the container
az container delete \
  --resource-group azure-blog-rg \
  --name azure-blog \
  --yes

# Recreate with the same command as above
az container create \
  --resource-group azure-blog-rg \
  --name azure-blog \
  --image yourblogacr.azurecr.io/azure-blog:latest \
  --registry-login-server yourblogacr.azurecr.io \
  --registry-username $(az acr credential show --name yourblogacr --query username -o tsv) \
  --registry-password $(az acr credential show --name yourblogacr --query passwords[0].value -o tsv) \
  --dns-name-label your-unique-dns-name \
  --ports 3000 \
  --environment-variables \
    MONGODB_URI="your-mongodb-atlas-connection-string" \
    PAYLOAD_SECRET="your-generated-secret-key" \
    PAYLOAD_PUBLIC_SERVER_URL="http://your-unique-dns-name.eastus.azurecontainer.io:3000" \
    NEXT_PUBLIC_SERVER_URL="http://your-unique-dns-name.eastus.azurecontainer.io:3000" \
  --cpu 1 \
  --memory 1.5
```

### Cost Breakdown (Container Instances)
- Azure Container Instances (1 vCPU, 1.5GB RAM): ~$10-15/month
- Azure Container Registry (Basic): ~$5/month
- MongoDB Atlas (Free tier): $0

**Total: ~$15-20/month**

**Benefits of Container Instances:**
- Simple and cost-effective
- No infrastructure management
- Fast deployment
- Pay only for actual usage
- Perfect for blogs and low to medium traffic sites

## Alternative: Azure App Service

For traditional PaaS deployment (~$18/month):

#### Create a Resource Group
```bash
az group create --name azure-blog-rg --location eastus
```

## Alternative: Azure App Service

For traditional PaaS deployment (~$18/month):

#### Create an App Service Plan (Linux, Basic B1)
```bash
az appservice plan create \
  --name azure-blog-plan \
  --resource-group azure-blog-rg \
  --is-linux \
  --sku B1
```

#### Create a Web App for Containers
```bash
az webapp create \
  --resource-group azure-blog-rg \
  --plan azure-blog-plan \
  --name your-blog-name \
  --deployment-container-image-name yourblogacr.azurecr.io/azure-blog:latest \
  --docker-registry-server-url https://yourblogacr.azurecr.io
```

#### Configure Environment Variables
```bash
az webapp config appsettings set \
  --resource-group azure-blog-rg \
  --name your-blog-name \
  --settings \
    MONGODB_URI="your-mongodb-atlas-connection-string" \
    PAYLOAD_SECRET="your-generated-secret-key" \
    PAYLOAD_PUBLIC_SERVER_URL="https://your-blog-name.azurewebsites.net" \
    NEXT_PUBLIC_SERVER_URL="https://your-blog-name.azurewebsites.net"
```

**Access**: `https://your-blog-name.azurewebsites.net`

**Cost**: ~$18/month (App Service B1 + ACR)

## Alternative: Azure Container Apps (Recommended for Production)

## Alternative: Azure Container Apps

For high-traffic production workloads with auto-scaling (~$20-25/month):

#### Create Container Apps Environment
```bash
az containerapp env create \
  --name azure-blog-env \
  --resource-group azure-blog-rg \
  --location eastus
```

#### Create Container App
```bash
az containerapp create \
  --name azure-blog-app \
  --resource-group azure-blog-rg \
  --environment azure-blog-env \
  --image yourblogacr.azurecr.io/azure-blog:latest \
  --registry-server yourblogacr.azurecr.io \
  --target-port 3000 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3 \
  --cpu 0.5 \
  --memory 1.0Gi \
  --env-vars \
    MONGODB_URI="your-mongodb-atlas-connection-string" \
    PAYLOAD_SECRET="your-generated-secret-key" \
    PAYLOAD_PUBLIC_SERVER_URL="https://azure-blog-app.{location}.azurecontainerapps.io" \
    NEXT_PUBLIC_SERVER_URL="https://azure-blog-app.{location}.azurecontainerapps.io"
```

**Access**: Container Apps provides a managed HTTPS endpoint automatically.

**Cost**: ~$20-25/month (Container Apps + ACR)

**Benefits**: Automatic scaling, managed HTTPS, zero-downtime deployments

## Maintenance and Troubleshooting

### View Container Logs (Container Instances)
```bash
# Real-time logs
az container logs \
  --resource-group azure-blog-rg \
  --name azure-blog \
  --follow

# Check container status
az container show \
  --resource-group azure-blog-rg \
  --name azure-blog \
  --output table
```

### View Logs (App Service)
```bash
az webapp log tail --name your-blog-name --resource-group azure-blog-rg
```

### Troubleshooting

**Container won't start:**
- Check logs: `az container logs --resource-group azure-blog-rg --name azure-blog`
- Verify environment variables are set correctly
- Ensure MongoDB connection string is valid

**Can't access admin panel:**
- Verify the container is running: `az container show --resource-group azure-blog-rg --name azure-blog`
- Check FQDN is correct
- Ensure ports are properly configured (port 3000)

### Create First Admin User

After deployment, navigate to `/admin` and create your first user account.
