# Media Storage in MongoDB

## Overview

Media files (images) are stored directly in MongoDB as base64-encoded data. This provides persistent storage without requiring Azure Files or Blob Storage.

## Benefits

- ✅ **Persistent** - Files survive container restarts and redeployments
- ✅ **Free** - No additional Azure storage costs beyond MongoDB
- ✅ **Simple** - One database for all data (posts, users, media)
- ✅ **Automatic backups** - Media backed up with database backups

## Implementation Details

### Storage
- Files uploaded via admin panel are converted to base64
- Stored in the `Media` collection with a `data` field
- Maximum file size: 10MB (limited by MongoDB 16MB document size)

### Retrieval
- Images accessed at `/api/media/[filename]`
- API route fetches from MongoDB and serves binary data
- Proper `Content-Type` and caching headers included

### Example Flow

1. **Upload**: User uploads `photo.jpg` (2MB) → Converted to base64 → Stored in MongoDB
2. **Access**: Browser requests `/api/media/1234567890-photo.jpg` → API fetches from MongoDB → Returns image binary

## Files Modified

- `src/models/Media.ts` - Added `data?: string` field for base64 storage
- `src/app/api/media/route.ts` - POST endpoint stores base64 in MongoDB
- `src/app/api/media/[filename]/route.ts` - NEW: Serves images from MongoDB
- `src/app/api/media/[id]/route.ts` - Removes base64 from JSON responses

## Migration from Filesystem Storage

If you have existing uploads in `/public/uploads/`, they will need to be re-uploaded through the admin panel to be stored in MongoDB.

## Scaling Considerations

This approach works well for:
- Personal blogs
- Small to medium websites
- Sites with < 1000 images
- Images under 10MB

For high-traffic sites or larger files, consider:
- Azure Blob Storage with CDN
- External image hosting (Cloudinary, Imgur)
- GridFS for files > 16MB

## Performance

- Images are cached with `Cache-Control: public, max-age=31536000, immutable`
- First request fetches from MongoDB (slower)
- Subsequent requests served from browser/CDN cache (fast)
