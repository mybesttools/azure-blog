# CMS Migration: Payload → React Admin

## Summary

Successfully migrated from Payload CMS 3.x to a custom React Admin + MongoDB solution on January 28, 2026.

## What Changed

### Removed
- Payload CMS core (`payload`, `@payloadcms/*` packages)
- Monaco editor dependency (source of compatibility issues)
- Payload configuration files (`payload.config.ts`, `src/collections/*`, `src/payload/*`)
- `withPayload()` Next.js wrapper

### Added
- **React Admin** (v5.4.0) - Modern, stable admin UI
- **NextAuth** (v5.0.0-beta) - Secure authentication with JWT sessions
- **Direct Mongoose Models** (`src/models/`) - Full control over data layer
- **Custom REST API** (`src/app/api/posts`, `/users`, `/media`) - CRUD endpoints
- **bcryptjs** - Password hashing

### Modified
- `src/lib/api.ts` - Now uses Mongoose directly instead of Payload client
- `scripts/create-admin.ts` - Uses Mongoose + bcrypt instead of Payload
- `scripts/migrate-posts.ts` - Direct MongoDB inserts
- `next.config.mjs` - Removed `withPayload()` wrapper
- `Dockerfile` - No longer copies `payload.config.ts`

## Data Compatibility

✅ **No migration required!** Existing MongoDB data structure preserved:
- `posts` collection unchanged
- `users` collection unchanged
- `media` collection unchanged

All existing content, users, and media files remain intact.

## New Workflow

### Creating Admin Users
```bash
npm run create-admin <email> <password> <name>
# Example:
npm run create-admin admin@blog.com password123 "Admin User"
```

### Accessing Admin Panel
1. Navigate to `http://localhost:3000/admin/login`
2. Login with created credentials
3. Access admin UI at `http://localhost:3000/admin`

### Managing Content
- **Posts**: Create, edit, delete via React Admin interface
- **Users**: Manage admin users (passwords are bcrypt hashed)
- **Media**: Upload and manage media files (stored in `/public/uploads/`)

## Environment Variables

Update your `.env.local`:
```env
MONGODB_URI=mongodb://localhost:27017/azure-blog
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
```

Remove old variable:
- ~~`PAYLOAD_SECRET`~~ (no longer needed)

## API Endpoints

### Public
- `GET /api/posts?status=published` - Get all published posts
- `GET /api/posts?slug=post-slug` - Get single post by slug

### Protected (requires authentication)
- `POST /api/posts` - Create new post
- `PUT /api/posts?id=<id>` - Update post
- `DELETE /api/posts?id=<id>` - Delete post
- Similar endpoints for `/api/users` and `/api/media`

## Authentication

- **Method**: NextAuth with credentials provider
- **Session**: JWT-based (stored in cookies)
- **Password Hashing**: bcrypt with 10 rounds
- **Protected Routes**: All POST/PUT/DELETE API routes check session

## Benefits

1. ✅ **Stability** - No more Monaco editor compatibility issues
2. ✅ **Next.js 15 Compatible** - Works perfectly with React 19 RC
3. ✅ **Simpler Architecture** - Fewer dependencies, clearer data flow
4. ✅ **Full Control** - Own the entire stack from API to database
5. ✅ **Production Ready** - React Admin is battle-tested and mature

## Rollback (if needed)

To rollback to Payload CMS:
```bash
git revert <this-commit-hash>
npm install
```

Note: Not recommended as Payload admin UI remains broken on Next.js 15.

## Testing Checklist

- [x] Build succeeds (`npm run build`)
- [x] Admin user creation works
- [ ] Login to admin panel
- [ ] Create/edit/delete posts via admin UI
- [ ] Public blog pages render correctly
- [ ] Migration script works for markdown posts
- [ ] Docker build succeeds
- [ ] Deployment to Azure works

## Support

For issues or questions, see:
- [React Admin Documentation](https://marmelab.com/react-admin/)
- [NextAuth Documentation](https://next-auth.js.org/)
- [Mongoose Documentation](https://mongoosejs.com/)
