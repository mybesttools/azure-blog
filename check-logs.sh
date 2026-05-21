#!/bin/bash
# Quick script to fetch Azure container logs
az container logs \
  --resource-group "${AZURE_RESOURCE_GROUP:-azure-blog}" \
  --name azure-blog \
  --container-name app \
  --tail 50
