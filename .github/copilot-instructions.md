# Azure Blog - AI Agent Instructions

## Architecture Overview

This is a **Next.js 15 blog with React Admin CMS** using server-side rendering. Key architectural decisions:

- **Custom CMS**: React Admin interface with MongoDB backend (replaced Payload CMS)
- **Direct MongoDB Access**: Mongoose models for Posts, Users, and Media
- **Server-First**: All content fetching happens server-side via Mongoose queries
- **Lexical Rich Text**: Content stored as Lexical AST; must be converted to HTML via `lexicalToHtml()` before rendering
- **NextAuth Authentication**: Session-based auth for admin access
- **Standalone Output**: Next.js builds with `output: 'standalone'` for Docker deployment

## Critical Developer Workflows

### First-Time Setup
```bash
npm install
# Create admin user via script
npm run create-admin admin@blog.com password123 "Admin User"
```

**Environment Variables Required** (create `.env.local`):
- `MONGODB_URI`: MongoDB connection string (default: `mongodb://localhost:27017/azure-blog`)
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your app URL (default: `http://localhost:3000`)

### Development Commands
```bash
npm run dev                    # Start dev server on :3000
npm run create-admin <email> <pass> <name>  # Create admin users
npm run migrate                # Import markdown posts from _posts/ to MongoDB
npm run build                  # Production build
```

### Admin Access
- Login at `/admin/login` with credentials created via `create-admin` script
- Admin UI at `/admin` manages Posts, Users, and Media

### Deployment
```bash
docker build -t azure-blog .   # Multi-stage build with standalone output
docker-compose up -d           # Includes MongoDB + app for local testing
```
See [DEPLOYMENT.md](DEPLOYMENT.md) for Azure Container Instances, App Service, and Container Apps deployment.

## Project-Specific Conventions

### Content Fetching Pattern
All post data comes from `src/lib/api.ts` which uses Mongoose directly:
```typescript
// Always use connectDB() before queries
await connectDB();
const posts = await PostModel.find({ status: 'published' })
  .populate('coverImage')
  .populate('author.picture')
  .lean();
```

### Lexical Content Conversion
Rich text is stored as Lexical AST. **Must convert before rendering**:
```typescript
import { lexicalToHtml } from "@/lib/lexicalToHtml";
const htmlContent = lexicalToHtml(post.content); // Never render post.content directly
```

### Image Handling
Media references are MongoDB ObjectIds that can be populated:
```typescript
// coverImage is populated to Media document
const post = await PostModel.findOne({ slug }).populate('coverImage');
const coverImage = post.coverImage?.url || '';
```

### Database Models
- **Posts** (`src/models/Post.ts`): Has `status` field ('draft'|'published'), `slug` must be unique
- **Media** (`src/models/Media.ts`): File uploads stored in `/public/uploads/` with `url` property
- **Users** (`src/models/User.ts`): Password hashed with bcrypt, authenticated via NextAuth

### API Routes
Custom REST endpoints at `/api/posts`, `/api/users`, `/api/media`:
- Support React Admin query params (`_start`, `_end`, `_sort`, `_order`)
- Protected by NextAuth session (except public GET for posts)
- Return `X-Total-Count` header for pagination

### Authentication
NextAuth with credentials provider:
- Sessions stored as JWT
- Login page at `/admin/login`
- All admin API routes check `getServerSession(authOptions)`

### Theming
Uses `next-themes` with system/light/dark modes. `suppressHydrationWarning` required on `<html>` tag (see `src/app/layout.tsx`).

## Integration Points

### External Services
- **MongoDB**: Direct Mongoose connection (local dev or MongoDB Atlas free tier)
- **Giscus**: GitHub Discussions-based comments (configured in `src/app/_components/disqus.tsx`)
- **Azure**: Container hosting (ACI recommended for ~$10-15/month)

### React Admin
`/admin` route uses React Admin with `simpleRestProvider`:
- Resources: posts, users, media
- Uses ListGuesser and EditGuesser for auto-generated UI
- SessionProvider wrapper for NextAuth integration

## File Organization Logic

- `src/app/_components/`: React components (prefix underscore to exclude from routing)
- `src/models/`: Mongoose schemas (User, Post, Media)
- `src/lib/`: Utility functions (mongodb.ts for connection, api.ts for queries, lexicalToHtml for content)
- `src/app/api/`: REST API routes for CRUD operations
- `scripts/`: CLI utilities (migrate-posts.ts, create-admin.ts)
- `_posts/`: Legacy markdown posts (not part of build, only for migration)

## Common Pitfalls

1. **Always call connectDB()** - MongoDB connection must be established before any queries
2. **Always convert Lexical content** - rendering raw Lexical AST will show JSON objects
3. **Populate media relations** - use `.populate('coverImage')` to get full Media objects
4. **Hash passwords with bcrypt** - never store plain text passwords
5. **Check NextAuth session** - protect admin routes with `getServerSession(authOptions)`
6. **Use lean() for read-only queries** - improves performance when you don't need Mongoose documents
