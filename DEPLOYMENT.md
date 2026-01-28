# Azure Deployment Guide

## Prerequisites
- Azure account
- Azure CLI installed
- Docker installed locally

## Deployment Options

This guide covers three deployment options for Azure:

1. **Azure Container Apps** (Recommended for Production) - ~$20-25/month
   - Automatic scaling, managed HTTPS, best for production
2. **Azure App Service** - ~$18/month
   - Traditional PaaS, simple deployment, good for standard workloads
3. **Azure Container Instances** - ~$10/month
   - Budget option, suitable for development or low-traffic sites

All options use MongoDB Atlas (free tier) for the database.

## Low-Cost Deployment Option

This section covers Azure App Service deployment. For Container Apps (recommended for production), see the section below.

### 1. Set up MongoDB Atlas (Free Tier)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP and Azure IPs (0.0.0.0/0 for development)
5. Get your connection string

### 2. Deploy to Azure App Service

#### Create a Resource Group
```bash
az group create --name azure-blog-rg --location eastus
```

#### Create an App Service Plan (Linux, Basic B1 - ~$13/month)
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
  --deployment-container-image-name nginx
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

#### Enable Container Logging
```bash
az webapp log config \
  --name your-blog-name \
  --resource-group azure-blog-rg \
  --docker-container-logging filesystem
```

### 3. Deploy Using Azure Container Registry

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

#### Configure Web App to use ACR
```bash
az webapp config container set \
  --name your-blog-name \
  --resource-group azure-blog-rg \
  --docker-custom-image-name yourblogacr.azurecr.io/azure-blog:latest \
  --docker-registry-server-url https://yourblogacr.azurecr.io
```

### 4. Set up Continuous Deployment (Optional)

Enable CI/CD webhook:
```bash
az webapp deployment container config \
  --name your-blog-name \
  --resource-group azure-blog-rg \
  --enable-cd true
```

### 5. Access Your Blog

- Blog: `https://your-blog-name.azurewebsites.net`
- Admin Panel: `https://your-blog-name.azurewebsites.net/admin`

## Cost Breakdown (Approximate)

- Azure App Service (B1): ~$13/month
- Azure Container Registry (Basic): ~$5/month
- MongoDB Atlas (Free tier): $0

**Total: ~$18/month**

## Alternative: Azure Container Apps (Recommended for Production)

Azure Container Apps is a modern, fully managed container platform with automatic scaling and built-in load balancing. This is the recommended option for production workloads.

### Prerequisites
- Complete steps 1-3 above (MongoDB Atlas and Azure Container Registry)

### Deploy to Azure Container Apps

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

**Note**: Replace `{location}` with your actual Azure region (e.g., `eastus`).

#### Enable ACR Authentication
```bash
az containerapp registry set \
  --name azure-blog-app \
  --resource-group azure-blog-rg \
  --server yourblogacr.azurecr.io \
  --username $(az acr credential show --name yourblogacr --query username -o tsv) \
  --password $(az acr credential show --name yourblogacr --query passwords[0].value -o tsv)
```

#### Update Container App (For redeployments)
```bash
# Build and push new image
docker build -t yourblogacr.azurecr.io/azure-blog:latest .
docker push yourblogacr.azurecr.io/azure-blog:latest

# Update the container app
az containerapp update \
  --name azure-blog-app \
  --resource-group azure-blog-rg \
  --image yourblogacr.azurecr.io/azure-blog:latest
```

### Cost Breakdown (Container Apps)
- Azure Container Apps (0.5 vCPU, 1GB RAM): ~$15-20/month
- Azure Container Registry (Basic): ~$5/month
- MongoDB Atlas (Free tier): $0

**Total: ~$20-25/month**

**Benefits of Container Apps:**
- Automatic scaling (0 to multiple replicas)
- Built-in HTTPS with managed certificates
- Integrated ingress/load balancing
- Simplified deployment and updates
- Better for production workloads

## Alternative: Lower Cost with Azure Container Instances

For development or low-traffic sites (~$10/month), you can use Azure Container Instances:

```bash
az container create \
  --resource-group azure-blog-rg \
  --name azure-blog \
  --image yourblogacr.azurecr.io/azure-blog:latest \
  --dns-name-label your-unique-dns-name \
  --ports 3000 \
  --environment-variables \
    MONGODB_URI="your-connection-string" \
    PAYLOAD_SECRET="your-secret" \
    PAYLOAD_PUBLIC_SERVER_URL="http://your-unique-dns-name.eastus.azurecontainer.io:3000" \
  --cpu 1 \
  --memory 1.5
```

## Maintenance

### Update the Application
```bash
# Build new image
docker build -t yourblogacr.azurecr.io/azure-blog:latest .

# Push to ACR
docker push yourblogacr.azurecr.io/azure-blog:latest

# Restart the web app
az webapp restart --name your-blog-name --resource-group azure-blog-rg
```

### View Logs
```bash
az webapp log tail --name your-blog-name --resource-group azure-blog-rg
```

### Create First Admin User

After deployment, navigate to `/admin` and create your first user account.
