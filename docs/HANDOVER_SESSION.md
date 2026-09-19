# Handover Report: Site Redesign & Azure Integration

This document summarizes work completed across sessions. Use this as a starting point for the next session. Most recent work is first.

## 🏡 Latest session: Ghiffa apartment booking page

### Goal
A private family page for planning stays at the apartment (Via Cerutti 8, Ghiffa (VB), Italy): a calendar, a request form, owner approval, and self-service editing — in Polish (default), English and German.

### What's implemented
- **`src/models/Booking.ts`** — Mongoose model: `name`, `email`, `from`, `to`, `notes?`, `status` (`pending`/`confirmed`/`declined`), timestamps.
- **`src/lib/mail.ts`** — sends mail via **Microsoft Graph** (`POST /users/{MAIL_SENDER}/sendMail`), authenticated with an app-only token from the existing Azure AD app (`AZURE_AD_CLIENT_ID`/`SECRET`/`TENANT_ID`, same app used for admin SSO). Requires the **`Mail.Send` application permission** granted with admin consent in the `mybesttools` tenant — **already granted and confirmed working** (test email delivered). No-ops with a console warning if `MAIL_SENDER` or the Azure AD creds are missing, so booking requests still work even if mail isn't configured. **`nodemailer`/SMTP was tried first and replaced** — there's no SMTP config left in this app.
- **`src/app/api/bookings/route.ts`**:
  - `POST` — public, no auth. Always forces `status: 'pending'` server-side. Notifies `OWNER_EMAIL` via `notifyOwnerOfRequest()`.
  - `GET` / `DELETE` — **owner only** (`getAuthContext().isOwner`, i.e. `session.user.email === OWNER_EMAIL`, case-insensitive). Being signed in is *not* enough — this matters now that family members can have real accounts.
  - `PUT` — dual authorization:
    - **Owner**: full control, including `status` (approve/decline). Approving/declining emails the requestor.
    - **Request owner** (the person who made that specific booking, matched by email): may only change `from`/`to`/`notes`. The server **always forces `status` back to `pending`** on their edit and re-notifies the apartment owner via `notifyOwnerOfRequest()` — this is the "editing triggers new approval" requirement.
- **`src/app/ghiffa/`** — the page itself:
  - `page.tsx` — Server Component. **Requires sign-in**: unauthenticated visitors are redirected to `/admin/login?callbackUrl=/ghiffa` (which auto-bounces to Microsoft sign-in). Fetches upcoming stays, owner-only pending requests, and the signed-in user's own requests, then hands them to `GhiffaContent`.
  - `GhiffaContent.tsx` — client wrapper providing the `LanguageProvider`, renders all the sections.
  - `YearCalendar.tsx` — month-grid availability heatmap with year navigation.
  - `RequestForm.tsx` — the request form, pre-filled with the signed-in user's name/email.
  - `PendingRequests.tsx` — **owner-only** approve/decline panel ("Requests awaiting your approval"). Data is only fetched server-side when `isOwner` is true, so it's never sent to non-owners even in the HTML.
  - `MyRequests.tsx` — **any signed-in user's own bookings** ("Your requests"), with inline edit (date range + notes) that saves via `PUT` and resets to pending.
  - `i18n.ts` / `LanguageContext.tsx` / `LanguageSelector.tsx` — hand-rolled i18n scoped to this page only (no site-wide i18n library). Polish is the default language, English and German are selectable; the choice persists in `localStorage`.
- **`src/app/_components/header.tsx`** — the "Ghiffa" nav link was **removed** (page is private/family-only, no need to advertise it in the public nav).
- **`src/app/admin/login/page.tsx`** — now respects a `?callbackUrl=` param (used by the `/ghiffa` redirect) instead of hardcoding `/admin`; heading changed from "Admin Login" to "Sign in" since non-admin family members land here too.
- **`src/components/AdminApp.tsx`** — added a `bookings` React Admin resource (List/Edit/Create) as a secondary way to manage bookings, separate from the inline `/ghiffa` controls.

### ⚠️ Known gap (not fixed this session)
Everywhere **outside** the bookings routes (`/admin` posts/categories/users/media), authorization is still just "is there a session at all" — **not** an owner/role check. Once family members have real accounts and can sign in, they'd technically get full CMS admin rights (edit posts, manage users, etc.) if they ever hit `/admin`. Only the bookings feature was hardened to a real `OWNER_EMAIL` check. Flagged to the user; not yet addressed.

### Git status
One commit made this session: `b67135a Add Ghiffa apartment booking page with owner-approval workflow` (the original SMTP-based version). **Everything since — the Graph mail switch, owner-gating, whole-page auth-gating, i18n, self-edit/re-approval, and the header nav removal — is uncommitted** in the working tree. Nothing has been pushed to `origin/main`.

### Local testing
- Local MongoDB via `docker compose up -d mongodb` (already running).
- A local credentials-based admin user was created for fallback testing: `mike@mybesttools.net` / `GhiffaTest123!` — **not actually needed** day to day since Azure AD sign-in already grants owner access when the email matches `OWNER_EMAIL`.
- `npm run build` and `npx tsc --noEmit` both pass clean as of the end of this session.
- ⚠️ Don't run `npm run build` while `npm run dev` is also running against the same directory — both write to `.next/` and corrupt each other's chunks (hit this once this session; fixed with `rm -rf .next` + restart).

### Before this goes live
1. Commit the outstanding changes (see Git status above).
2. `.github/workflows/deploy-aci.yml` / `infra` ARM template **do not currently pass `OWNER_EMAIL` or `MAIL_SENDER`** to the production container — needs those added as GitHub secrets and wired into the workflow, or the live site's booking emails will silently no-op even after deploying.
3. Push to `main` triggers a real prod deploy (`deploy-aci.yml` **deletes and recreates** the Azure Container Instance) — confirm before pushing.

## 🔌 mcpm365 (Microsoft 365 / Entra ID management MCP server)

- Local source: `/Users/mike/source/mcp-m365-mgmt` (32 tools: Entra ID users/groups, Intune, SharePoint, Office doc generation, etc.). Hosted at `https://mcpm365-web.azurewebsites.net`.
- Registered as a **global** MCP server in `~/.claude.json` (top-level `mcpServers.mcpm365`), `type: http`, `url: https://mcpm365-web.azurewebsites.net/mcp/`, with an `Authorization: Bearer amk_...` header — the secret was issued via the server's own `/admin` UI (Easy Auth/Entra SSO), scoped to just `create_user`, `get_user_info`, `list_users`.
- **New MCP servers only connect at session start** — this is why a restart was requested; after restarting, its tools should be discoverable via ToolSearch.
- **Deliberate design**: this is meant to be invoked by Claude interactively, on request ("add an account for X"), never wired into the running azure-blog app — `create_user` needs the very broad `User.ReadWrite.All` Graph permission (tenant-wide user read/write), which is too much privilege to embed in a public-facing app.
- A stray Azure AD app-registration client secret (not the mcpm365 token) was accidentally pasted into chat during setup; the user said they'd rotate/discard it.

## 🚀 Earlier session: redesign & Azure integration

The site moved from a simple blog to a feature-rich platform with authentication and content organization.

### 1. Authentication (Azure Entra ID SSO)
- **Goal**: Secure the admin area using Microsoft's industry-standard SSO.
- **Implementation**:
    - Integrated `next-auth` with `AzureADProvider`.
    - Configured the application to support **Azure AD (Entra ID)** for admin login.
    - Added a **Login/User dropdown** in the site header.
    - Created an Azure AD App Registration ("Azure Blog Admin") with the correct redirect URI: `http://localhost:3000/api/auth/callback/azure-ad`.
- **Status**: Implemented and configured. (This is the same app registration `mail.ts` now reuses for sending mail via Graph.)

### 2. Content Organization (Category System)
- **Goal**: Allow users to browse posts by subject (e.g., "About Azure, Intune, AI").
- **Implementation**:
    - **Database**: New `Category` Mongoose model.
    - **Data Model**: Updated `Post` model to include a `category` reference.
    - **API**: Added a full CRUD API for categories (`/api/categories`).
    - **Frontend (Public)**:
        - Navigation menu now dynamically displays categories.
        - Created dynamic category pages (`/category/[slug]`).
        - Homepage now automatically displays posts from the **default category**.
    - **Frontend (Admin)**: Added Category management (List, Create, Edit) to the React Admin dashboard.
- **Status**: Implemented.

## 🛠️ Technical Implementation Details

### Database Schema Changes
- **`src/models/Category.ts`**: `name`, `slug`, `description`, `order`, `isDefault`.
- **`src/models/Post.ts`**: `category: { type: Schema.Types.ObjectId, ref: 'Category' }`.
- **`src/models/Booking.ts`**: see Ghiffa section above.

### Key Files
- `src/auth.ts`: Core authentication logic (NextAuth configuration).
- `src/app/category/[slug]/page.tsx`: Dynamic category routing (Next.js 15 compliant).
- `src/app/api/categories/route.ts`: Backend endpoints for category management.
- `src/app/api/bookings/route.ts`: Backend endpoints for the Ghiffa booking feature.
- `src/components/AdminApp.tsx`: Admin UI (posts, categories, users, media, bookings).
- `scripts/seed-categories.ts`: Script to initialize the database with default categories.
- `scripts/create-admin.ts`: Creates a credentials-based admin user (`npm run create-admin -- email password name`).

### Environment Configuration (`.env.local`)
```bash
# Azure AD (Entra ID) - SSO login AND Graph mail sending
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id

# Ghiffa booking notifications
OWNER_EMAIL=mike@mybesttools.net
MAIL_SENDER=mike@mybesttools.net
```

## ⚠️ Pending Tasks & Next Steps

### 1. Ghiffa feature — production readiness (High Priority)
See "Before this goes live" under the Ghiffa section above: commit, wire `OWNER_EMAIL`/`MAIL_SENDER` into the deploy workflow, then push deliberately.

### 2. CMS-wide authorization gap
Posts/categories/users/media admin routes only check "is signed in," not "is the owner." Worth revisiting once family members start getting real tenant accounts.

### 3. Content Migration
- Existing posts still need categories assigned via the Admin Dashboard if not already done.
- Run `npm run seed-categories` on a fresh database.

## 📋 Commands for Quick Reference
- `npm run dev`: Start development server.
- `npm run build`: Build the production application (don't run alongside `npm run dev`).
- `npm run seed-categories`: Seed initial categories.
- `npm run create-admin -- email password name`: Create a fallback credentials-based admin user.
- `docker compose up -d mongodb`: Start local MongoDB for `npm run dev`.
