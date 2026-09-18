# Site Redesign - Setup Guide

This document covers the new features added to the blog in the redesign:

## 🎯 New Features

### 1. **Azure Entra ID (Azure AD) SSO Integration**
- Primary authentication method for admin access
- Supports single sign-on with your Microsoft account
- Credentials provider kept as fallback for development

### 2. **Login Button in Header**
- Visible to all users (not just admins)
- Shows user dropdown menu when logged in with:
  - Link to Admin Dashboard
  - Logout button
- Clean, modern UI that integrates with existing design

### 3. **Category System**
- Posts can be organized into categories
- Categories are fully manageable through the admin interface
- Each category has:
  - Name (e.g., "About Azure, Intune, AI")
  - URL-friendly slug (e.g., "about-azure-intune-ai")
  - Description
  - Display order in navigation
  - Default flag (homepage shows posts from default category)

### 4. **Dynamic Navigation Menu**
- Categories automatically appear in the header navigation
- Users can browse posts by category
- Category order is configurable

## 🚀 Getting Started

### Initial Setup

1. **Seed the initial categories:**
   ```bash
   npm run seed-categories
   ```

   This creates two default categories:
   - "About Azure, Intune, AI" (default, order: 1)
   - "My Hobby Projects" (order: 2)

2. **Configure Azure AD (Optional but Recommended):**

   To enable Entra ID SSO:

   a. Register an application in [Azure Portal](https://portal.azure.com):
      - Go to **Azure Active Directory** > **App registrations** > **New registration**
      - Name: "Azure Blog Admin"
      - Redirect URI: `http://localhost:3000/api/auth/callback/azure-ad` (for local dev)
      - For production, add: `https://yourdomain.com/api/auth/callback/azure-ad`

   b. Create a client secret:
      - Go to **Certificates & secrets** > **New client secret**
      - Copy the secret value (you won't see it again!)

   c. Update `.env.local`:
      ```bash
      AZURE_AD_CLIENT_ID=your-application-client-id
      AZURE_AD_CLIENT_SECRET=your-client-secret-value
      AZURE_AD_TENANT_ID=your-tenant-id
      ```

   d. Restart your dev server:
      ```bash
      npm run dev
      ```

3. **Access the Admin Interface:**
   - Click "Login" in the header
   - Login with Azure AD (if configured) or credentials
   - Navigate to `/admin` to manage content

## 📝 Managing Categories

### Through Admin Interface

1. Login to `/admin`
2. Click **Categories** in the sidebar
3. Create, edit, or delete categories

**Category Fields:**
- **Name**: Display name (e.g., "About Azure, Intune, AI")
- **Slug**: URL-friendly identifier (e.g., "about-azure-intune-ai")
- **Description**: Optional description shown on category page
- **Order**: Lower numbers appear first in navigation (0, 1, 2...)
- **Is Default**: Only one category can be default (homepage shows these posts)

### Best Practices

- Keep category names concise (they appear in the header)
- Use clear, descriptive slugs
- Set logical order numbers (0 for first, 1 for second, etc.)
- Only mark one category as default

## ✍️ Creating Posts with Categories

When creating or editing a post in the admin interface:

1. Fill in all the usual fields (title, slug, excerpt, content)
2. Select a **Category** from the dropdown
3. Posts without a category won't appear in category navigation

**Note:** Posts are now filtered by category:
- Homepage shows posts from the **default category**
- Each category page (`/category/[slug]`) shows only that category's posts

## 🔐 Authentication Behavior

### With Azure AD Configured:
- Users see "Sign in with Azure AD" button
- Credentials login still available as fallback
- Admin users can use either method

### Without Azure AD:
- Only credentials login is available
- Use `npm run create-admin` to create admin accounts

### Session Management:
- Sessions stored as JWT tokens
- Session persists across page reloads
- Logout button appears when authenticated

## 📂 Database Schema Changes

### New Category Model
```typescript
{
  name: string;          // "About Azure, Intune, AI"
  slug: string;          // "about-azure-intune-ai" (unique)
  description?: string;  // Optional description
  order: number;         // Display order (default: 0)
  isDefault: boolean;    // Only one can be true
  createdAt: Date;
  updatedAt: Date;
}
```

### Updated Post Model
```typescript
{
  // ... existing fields
  category?: ObjectId;   // Reference to Category._id
}
```

**Migration Notes:**
- Existing posts have `category: undefined`
- You'll need to assign categories to existing posts via admin interface
- Posts without categories won't appear in category pages (but still in admin)

## 🎨 UI/UX Changes

### Header Navigation
- Responsive navigation with category links
- Login/user dropdown on the right
- Supports both light and dark themes
- Categories appear between "Main" and "Lab"

### Category Pages
- Clean layout showing all posts in that category
- Category name and description at the top
- Same post grid as homepage
- Empty state message if no posts

### Homepage
- Now shows only posts from the default category
- Change default category in admin to change homepage content
- Hero post (first post) + grid of remaining posts

## 🔧 Configuration Files

### Environment Variables (.env.local)
```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/azure-blog

# NextAuth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# Azure AD (optional)
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id
```

### NPM Scripts
```bash
npm run dev              # Start development server
npm run build            # Production build
npm run seed-categories  # Seed initial categories
npm run create-admin     # Create admin user
npm run migrate          # Migrate markdown posts to DB
```

## 🐛 Troubleshooting

### Categories not appearing in navigation?
- Check that categories exist: `db.categories.find()` in MongoDB
- Verify MongoDB connection
- Run `npm run seed-categories` if starting fresh

### Azure AD login not working?
- Verify all three env vars are set (CLIENT_ID, CLIENT_SECRET, TENANT_ID)
- Check redirect URI matches in Azure Portal
- Ensure you restarted the dev server after adding env vars

### Posts not showing on homepage?
- Verify posts have `status: 'published'`
- Check that posts have the default category assigned
- Ensure at least one category has `isDefault: true`

### Login button not visible?
- Clear browser cache and refresh
- Check that Header component is being rendered
- Verify no CSS/styling issues

## 📚 Related Documentation

- [Main README](./README.md) - Project overview and setup
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment to Azure
- [MIGRATION_CMS.md](./MIGRATION_CMS.md) - CMS migration details

## 🎉 Summary

The redesigned blog now features:
- ✅ Azure Entra ID SSO for secure admin access
- ✅ User-friendly login button in header
- ✅ Flexible category system with editable subjects
- ✅ Dynamic navigation based on categories
- ✅ Homepage filtered by default category
- ✅ Full category management in admin interface

Start by running `npm run seed-categories` to create your initial categories, then begin organizing your posts!
