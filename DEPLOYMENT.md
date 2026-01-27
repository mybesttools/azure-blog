# Azure Deployment Guide

## Prerequisites
- Azure account
- Azure CLI installed
- Docker installed locally

## Low-Cost Deployment Option

This guide deploys the blog as a containerized application on Azure App Service with MongoDB Atlas (free tier).

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

## Alternative: Even Lower Cost with Azure Container Instances

For even lower costs (~$10/month), you can use Azure Container Instances instead of App Service:

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
