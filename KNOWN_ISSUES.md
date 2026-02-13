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
