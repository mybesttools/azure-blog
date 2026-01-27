# Setup Guide

This guide will help you set up the Azure Blog with Payload CMS for local development and production deployment.

## Prerequisites

- Node.js 20 or higher
- MongoDB (local installation or MongoDB Atlas account)
- Docker (optional, for containerized deployment)
- Azure account (for production deployment)

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up MongoDB

You have two options for MongoDB:

**Option A: Local MongoDB with Docker**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:7
```

**Option B: MongoDB Atlas (Free Tier)**
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user
3. Whitelist your IP address (0.0.0.0/0 for development)
4. Get your connection string

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and set the following variables:

```env
# Generate a secret key (run: openssl rand -base64 32)
PAYLOAD_SECRET=your-generated-secret-key-here

# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/azure-blog
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/azure-blog

# Server URL
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

### 4. Start the Development Server

```bash
npm run dev
```

The application will be available at:
- **Blog**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin

### 5. Create Your First Admin User

1. Navigate to http://localhost:3000/admin
2. Fill in the registration form to create your first admin user
3. You'll be automatically logged in to the admin panel

### 6. Create Your First Blog Post

1. In the admin panel, click on "Posts" in the sidebar
2. Click "Create New"
3. Fill in:
   - Title
   - Excerpt
   - Content (use the rich text editor)
   - Date
   - Author name
   - Slug (URL-friendly version of the title)
   - Status (set to "Published" to make it visible)
4. Click "Save"

Your post will now appear on the blog homepage!

## Migrating Existing Posts

If you have existing markdown posts in the `_posts` directory, you can migrate them:

```bash
npm run migrate
```

This script will:
- Read all `.md` files from the `_posts` directory
- Parse the front matter and content
- Create corresponding posts in the CMS
- Skip posts that already exist

## Running in Production Mode

To test the production build locally:

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## Docker Development

To run the entire stack (app + MongoDB) with Docker Compose:

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## Troubleshooting

### MongoDB Connection Error

If you see "Error: cannot connect to MongoDB":
- Ensure MongoDB is running: `docker ps` or check MongoDB Atlas
- Verify your `MONGODB_URI` in `.env`
- For MongoDB Atlas, ensure your IP is whitelisted

### PAYLOAD_SECRET Missing Error

If you see "PAYLOAD_SECRET is missing":
- Generate a secure secret: `openssl rand -base64 32`
- Add it to your `.env` file

### Build Errors

If the build fails:
- Ensure all dependencies are installed: `npm install`
- Delete `.next` folder and rebuild: `rm -rf .next && npm run build`
- Check for TypeScript errors: `npx tsc --noEmit`

### Admin Panel Not Loading

If the admin panel doesn't load:
- Clear your browser cache
- Check browser console for errors
- Verify MongoDB is connected
- Ensure you have created an admin user

## Next Steps

- [Azure Deployment Guide](./DEPLOYMENT.md) - Deploy to Azure
- [Payload CMS Documentation](https://payloadcms.com/docs) - Learn more about Payload CMS
- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features

## Features

### Content Management
- Rich text editor with Lexical
- Media library for images
- Draft and published post status
- Version history (drafts)

### Technical Features
- Server-side rendering for SEO
- Dynamic routing
- TypeScript for type safety
- Tailwind CSS for styling
- MongoDB for data storage

### Admin Panel Features
- User authentication
- Role-based access control
- Media upload and management
- Post creation and editing
- Built-in search and filtering
