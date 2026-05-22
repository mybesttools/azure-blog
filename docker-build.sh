#!/bin/bash

# Docker build script with environment variables
# Usage: ./docker-build.sh [tag]

# Load environment variables from .env.local
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Get the git commit hash for tagging
GIT_HASH=$(git rev-parse HEAD)
TAG=${1:-$GIT_HASH}

echo "Building Docker image with tag: $TAG"
echo "Shopify Domain: $NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN"
echo "Site URL: $NEXT_PUBLIC_SITE_URL"

# Build the Docker image with build arguments
docker build \
  --build-arg NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN="$NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN" \
  --build-arg NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN="$NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN" \
  --build-arg NEXT_PUBLIC_SITE_URL="$NEXT_PUBLIC_SITE_URL" \
  -t azure-blog:$TAG \
  -t azure-blog:latest \
  .

echo "Build complete! Tagged as:"
echo "  - azure-blog:$TAG"
echo "  - azure-blog:latest"
