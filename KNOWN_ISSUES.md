# Known Issues

## ~~Payload CMS Admin UI - Monaco Editor Error~~ (RESOLVED)

**Status:** ✅ Resolved - Migrated to React Admin + Custom MongoDB Backend  
**Resolution Date:** January 28, 2026  
**Solution:** Replaced Payload CMS 3.x with custom React Admin interface and direct MongoDB access via Mongoose

### What Changed
- **Removed**: Payload CMS and all related dependencies
- **Added**: React Admin, NextAuth, direct Mongoose models
- **New Admin UI**: Located at `/admin` with login at `/admin/login`
- **Authentication**: NextAuth with credentials provider (bcrypt password hashing)
- **API**: Custom REST endpoints at `/api/posts`, `/api/users`, `/api/media`

### Migration Impact
- Existing MongoDB data structure preserved (Posts, Users, Media collections)
- All existing posts and users remain intact
- Admin user creation now via `npm run create-admin` script
- Content migration script updated to use Mongoose directly

### Benefits
- ✅ No more Monaco editor compatibility issues
- ✅ Stable, production-ready admin interface
- ✅ Full control over CMS functionality
- ✅ Better Next.js 15 + React 19 compatibility
- ✅ Simpler architecture with fewer dependencies

## No Known Critical Issues

The application is currently stable with no blocking issues.

## Production Deployment Considerations

### File Upload Size Limits (RESOLVED)
**Issue:** File uploads larger than 1MB failed in production with HTML error responses.  
**Cause:** nginx default `client_max_body_size` limit of 1MB  
**Resolution:** Added `client_max_body_size 50M;` to nginx.conf and `maxDuration = 60` to media route

### Ephemeral File Storage (⚠️ LIMITATION)
**Issue:** Uploaded media files are stored in the container filesystem at `/app/public/uploads`  
**Impact:** Files are lost when the container restarts or is redeployed  
**Workaround Options:**
1. **Azure Blob Storage** (recommended) - Use `@azure/storage-blob` to store media in persistent blob storage
2. **Azure Files** - Mount an Azure File Share to the container for persistent storage
3. **Database storage** - Store small files directly in MongoDB as base64 (not recommended for large files)

**To implement Azure Blob Storage:**
```bash
npm install @azure/storage-blob
```
Then modify `src/app/api/media/route.ts` to upload to Blob Storage instead of local filesystem.

1. **Use the API directly** - Payload exposes REST and GraphQL APIs
2. **Direct MongoDB access** - Use MongoDB Compass or mongosh to manage data
3. **Wait for fix** - Payload team is aware and working on React 19 compatibility

### Tested Configurations

| Payload | Next.js | React | Status |
|---------|---------|-------|--------|
| 3.0.0 | 14.2.18 | 18.3.1 | ⚠️ Different error |
| 3.0.0 | 15.1.9 | 18.3.1 | ⚠️ Module errors |
| 3.17.0 | 15.1.3 | 19 RC | ❌ Monaco Editor error |

### Frontend Status
✅ The blog frontend works perfectly at `http://localhost:3000`  
✅ Posts are rendered correctly  
✅ MongoDB integration works  
✅ Image uploads functional (via API)  
✅ Dark mode theme switcher works  

### References
- [Payload CMS GitHub Issue](https://github.com/payloadcms/payload/issues)
- [React 19 Migration Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)

### Recommendation
For production use, consider one of these alternatives until the admin UI is fixed:
1. Use Payload CMS 2.x (stable, but requires migration)
2. Use a different CMS (Sanity, Contentful, Strapi)
3. Wait for Payload 3.x to achieve full React 19 compatibility
