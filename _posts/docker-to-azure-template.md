---
title: "How to deploy a simple Docker container to Azure"
excerpt: "A step-by-step guide to deploying your first Docker container on Azure, including prerequisites, setup, and troubleshooting tips."
coverImage: "/assets/blog/docker-to-azure/docker.png"
date: "2025-08-29T10:00:00.322Z"
author:
  name: "Mike van der Sluis"
  picture: "/assets/blog/authors/mike2.jpg"
ogImage:
  url: "/assets/blog/preview/cover.jpg"
---

Deploying Docker containers to Azure is a great way to get your applications running in the cloud quickly and efficiently. In this article, we'll walk through the process step by step.

## Prerequisites

- An Azure account
- Docker installed locally
- Azure CLI installed

## Step 1: Prepare Your Docker Image

First, create a simple Flask app. In your project folder, create a file named `app.py`:

```python
from flask import Flask
app = Flask(__name__)

@app.route('/')
def home():
  return '<h1>This is a flask Python web app!</h1>'

if __name__ == '__main__':
  app.run(host='0.0.0.0', port=80, debug=True)

```

Next, create a `Dockerfile` in the same folder:

```dockerfile
# Python runtime
FROM python:3.14.0b4-slim-bullseye

# Set working directory
WORKDIR /app

# Copy content
COPY . /app

RUN pip install flask

EXPOSE 80

CMD ["python", "app.py"]
```

Build your Docker image:

```bash
docker build -t myapp:latest .
```

## Step 2: Push the Image to Azure Container Registry

Create an Azure Container Registry (ACR) and push your image:

```bash
az acr create --resource-group myResourceGroup --name myRegistry --sku Basic
az acr login --name myRegistry
docker tag myapp:latest myregistry.azurecr.io/myapp:latest
docker push myregistry.azurecr.io/myapp:latest
```

## Step 3: Deploy the Container to Azure

There are actually several ways to deploy your container to Azure. Here are three common options:

### Option 1: Azure Container Instances (ACI)

This is the simplest way to run a container without managing servers.

**Bash:**

```bash
az container create --resource-group myResourceGroup \
  --name myContainer \
  --image myregistry.azurecr.io/myapp:latest \
  --dns-name-label myapp-demo \
  --ports 80
```

**Bicep:**

```bicep
resource containerGroup 'Microsoft.ContainerInstance/containerGroups@2023-05-01' = {
  name: 'myContainer'
  location: resourceGroup().location
  properties: {
    containers: [
      {
        name: 'myContainer'
        properties: {
          image: 'myregistry.azurecr.io/myapp:latest'
          ports: [
            {
              port: 80
            }
          ]
          resources: {
            requests: {
              cpu: 1
              memoryInGb: 1.5
            }
          }
        }
      }
    ]
    osType: 'Linux'
    ipAddress: {
      type: 'Public'
      dnsNameLabel: 'myapp-demo'
      ports: [
        {
          protocol: 'Tcp'
          port: 80
        }
      ]
    }
    imageRegistryCredentials: [
      {
        server: 'myregistry.azurecr.io'
        username: '<acr-username>'
        password: '<acr-password>'
      }
    ]
  }
}
```

### Option 2: Azure Web App for Containers

This option lets you deploy containers as web apps with scaling and integrated features.

**Bash:**

```bash
az appservice plan create --name myAppServicePlan --resource-group myResourceGroup --is-linux --sku B1
az webapp create --resource-group myResourceGroup \
  --plan myAppServicePlan \
  --name myWebAppName \
  --deployment-container-image-name myregistry.azurecr.io/myapp:latest
az webapp config container set --name myWebAppName --resource-group myResourceGroup \
  --docker-custom-image-name myregistry.azurecr.io/myapp:latest \
  --docker-registry-server-url https://myregistry.azurecr.io
```

**Bicep:**

```bicep
resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: 'myAppServicePlan'
  location: resourceGroup().location
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2022-03-01' = {
  name: 'myWebAppName'
  location: resourceGroup().location
  kind: 'app,linux,container'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      appCommandLine: ''
      linuxFxVersion: 'DOCKER|myregistry.azurecr.io/myapp:latest'
      containerRegistryServerUrl: 'https://myregistry.azurecr.io'
      containerRegistryUser: '<acr-username>'
      containerRegistryPassword: '<acr-password>'
    }
  }
}
```

### Option 3: Azure Container Apps

This is a modern, serverless container platform for microservices and apps.

**Bash:**

```bash
az containerapp env create --name myContainerAppEnv --resource-group myResourceGroup --location eastus
az containerapp create --name myContainerApp --resource-group myResourceGroup \
  --environment myContainerAppEnv \
  --image myregistry.azurecr.io/myapp:latest \
  --target-port 80 \
  --ingress 'external'
```

**Bicep:**

```bicep
resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: 'myContainerAppEnv'
  location: resourceGroup().location
}

resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'myContainerApp'
  location: resourceGroup().location
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 80
      }
      registries: [
        {
          server: 'myregistry.azurecr.io'
          username: '<acr-username>'
          password: '<acr-password>'
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'myapp'
          image: 'myregistry.azurecr.io/myapp:latest'
        }
      ]
    }
  }
}
```

Choose the option that best fits your needs. For most simple scenarios, ACI is the fastest way to get started.

## Step 4: Verify the Deployment

Check the status of your container:

```bash
az container show --resource-group myResourceGroup --name myContainer --query "instanceView.state"
```

To access your running app, open the DNS name provided by Azure (e.g., `http://myapp-demo.region.azurecontainer.io`).

## Troubleshooting

**Common issues:**

- Image not found: Double-check your image tag and registry name.
- Port not exposed: Ensure your Dockerfile exposes the correct port and your Azure container is configured to use it.
- Authentication errors: Make sure you are logged in to Azure and ACR.

## Conclusion

You have now deployed a simple Dockerized Flask app to Azure! Next steps could include scaling your container, setting up monitoring, or deploying to Azure App Service for more features.

---

Feel free to replace the placeholder text and commands with your actual content and instructions!
