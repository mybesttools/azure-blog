# Azure Blog - Server-Side CMS

A modern blog powered by Next.js and Payload CMS, designed for deployment on low-cost Linux hosting in Azure.

## Features

- **Server-Side Rendering**: Dynamic content served from a headless CMS
- **Payload CMS**: Powerful, self-hosted content management system with admin panel
- **MongoDB**: Flexible document database for content storage
- **Docker Support**: Containerized for easy deployment
- **Azure Ready**: Optimized for Azure App Service and Container Instances
- **Low Cost**: Can run on Azure B1 plan (~$13/month) + MongoDB Atlas free tier

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or MongoDB Atlas)
- Docker (for containerized deployment)

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd azure-blog
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set:
- `PAYLOAD_SECRET`: A secret key for Payload (generate with `openssl rand -base64 32`)
- `MONGODB_URI`: Your MongoDB connection string

4. Start MongoDB locally (if using Docker):
```bash
docker run -d -p 27017:27017 --name mongodb mongo:7
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) to view the blog
7. Access the admin panel at [http://localhost:3000/admin](http://localhost:3000/admin)

### First Time Setup

1. Navigate to `/admin` and create your first admin user
2. Start creating blog posts!

### Migrating Existing Posts

If you have existing markdown posts in the `_posts` directory, run:

```bash
npm run migrate
```

This will import all markdown files into the CMS.

## Docker Deployment

### Using Docker Compose (Development)

```bash
docker-compose up -d
```

This starts both MongoDB and the Next.js app.

### Building for Production

```bash
docker build -t azure-blog .
```

## Azure Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed Azure deployment instructions including:

- Azure App Service deployment
- Azure Container Instances deployment
- MongoDB Atlas setup
- Cost optimization tips

## Project Structure

```
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── (payload)/    # Payload admin UI
│   │   └── api/          # API routes
│   ├── collections/      # Payload CMS collections
│   ├── lib/              # Utility functions
│   └── payload/          # Payload client
├── _posts/               # Legacy markdown posts
├── public/               # Static assets
├── scripts/              # Utility scripts
├── payload.config.ts     # Payload CMS configuration
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose for local dev
└── DEPLOYMENT.md         # Azure deployment guide
```

## Technologies

- [Next.js 15](https://nextjs.org/) - React framework
- [Payload CMS](https://payloadcms.com/) - Headless CMS
- [MongoDB](https://www.mongodb.com/) - Database
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com) - Styling

## License

This project is based on the [Next.js blog-starter](https://github.com/vercel/next.js/tree/canary/examples/blog-starter) example.
