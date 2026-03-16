# CLAUDE.md — Ornate Solar Marketing Collateral Hub

> Read this file fully before writing any code. Follow every instruction precisely.
> This is the single source of truth for the entire project.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Monorepo Structure](#3-monorepo-structure)
4. [Brand & Design Tokens](#4-brand--design-tokens)
5. [Complete Company Data](#5-complete-company-data)
6. [Database Schema](#6-database-schema)
7. [Auth & RBAC](#7-auth--rbac)
8. [Backend — API Reference](#8-backend--api-reference)
9. [Frontend — Pages & Components](#9-frontend--pages--components)
10. [File Upload & Storage](#10-file-upload--storage)
11. [Search & Filtering](#11-search--filtering)
12. [Share Feature](#12-share-feature)
13. [Build Order](#13-build-order)
14. [Conventions & Rules](#14-conventions--rules)

---

## 1. Project Overview

**App Name:** Ornate Solar — Marketing Collateral Hub
**Purpose:** Internal B2B platform for the Ornate Solar sales & marketing team to
store, manage, view, download, and share marketing collateral (brochures, datasheets,
images, videos, PPTs, compliance docs, case studies, etc.) organised by product/brand.

**Key flows:**
- User logs in → lands on Dashboard showing 3 category cards
- Clicks category → sees company cards for that category
- Clicks company → sees 6–8 collapsible document section panels
- Each panel shows uploaded files with View / Download / Share actions
- Admin/Manager can upload files; Super Admin can manage users and companies
- Global search + filter works across all companies and document types

---

## 2. Tech Stack

### Frontend (`/apps/web`)
| Concern | Tool |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript strict) |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui (new-york style, slate base) |
| Icons | Lucide React |
| Auth (client) | Clerk (useUser, useAuth, <SignIn />) |
| PDF Viewer | react-pdf |
| Image Lightbox | yet-another-react-lightbox |
| Video Player | react-player |
| QR Code | qrcode.react |
| Toast | shadcn/ui Sonner |
| Forms | React Hook Form + Zod |
| HTTP Client | Axios (with interceptors for Bearer token) |

### Backend (`/apps/api`)
| Concern | Tool |
|---|---|
| Runtime | Node.js 20 + Express 5 |
| Language | TypeScript strict |
| ORM | Prisma 5 + PostgreSQL (Neon.tech or Railway) |
| Auth | Clerk SDK (verifyToken middleware) |
| File Storage | AWS S3 — ap-south-1 (Mumbai) [NOT Supabase — banned in India] |
| File Upload | Multer → stream to S3 via @aws-sdk/client-s3 |
| Signed URLs | S3 getSignedUrl (1h for view, 24h for share) |
| Validation | Zod |
| Logging | Winston |
| Rate Limiting | express-rate-limit |

### Shared (`/packages/types`)
- Zod schemas and TypeScript types shared between frontend and backend

---

## 3. Monorepo Structure

```
ornate-collateral-hub/
├── apps/
│   ├── web/                        # Next.js 15 Frontend
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── sign-in/page.tsx
│   │   │   │   └── sign-up/page.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx       # Sidebar + Topbar shell
│   │   │   │   ├── page.tsx         # Dashboard: 3 category cards
│   │   │   │   ├── [category]/
│   │   │   │   │   └── page.tsx     # Company grid
│   │   │   │   └── [category]/[company]/
│   │   │   │       └── page.tsx     # Company detail + doc sections
│   │   │   ├── admin/
│   │   │   │   └── page.tsx         # Super Admin panel
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn/ui primitives
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Topbar.tsx
│   │   │   │   └── Breadcrumb.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── CategoryCard.tsx
│   │   │   │   ├── CompanyCard.tsx
│   │   │   │   └── StatsRow.tsx
│   │   │   ├── documents/
│   │   │   │   ├── DocSection.tsx   # Collapsible accordion section
│   │   │   │   ├── FileGrid.tsx     # Grid view of files
│   │   │   │   ├── FileList.tsx     # List view of files
│   │   │   │   ├── FileCard.tsx     # Single file card
│   │   │   │   ├── FileViewer.tsx   # PDF/Image/Video modal viewer
│   │   │   │   ├── UploadModal.tsx  # Drag & drop upload modal
│   │   │   │   └── ShareModal.tsx   # Share link + QR modal
│   │   │   ├── search/
│   │   │   │   └── GlobalSearch.tsx
│   │   │   └── rbac/
│   │   │       └── PermissionGate.tsx
│   │   ├── lib/
│   │   │   ├── api.ts               # Axios instance with auth headers
│   │   │   ├── permissions.ts       # Role → permission helpers
│   │   │   └── utils.ts             # cn(), formatBytes(), slugify()
│   │   └── middleware.ts            # Clerk route protection
│   │
│   └── api/                         # Express Backend
│       ├── src/
│       │   ├── index.ts             # Express app entry
│       │   ├── middleware/
│       │   │   ├── auth.ts          # Clerk verifyToken
│       │   │   ├── rbac.ts          # requirePermission(permission)
│       │   │   ├── upload.ts        # Multer config
│       │   │   └── errorHandler.ts
│       │   ├── routes/
│       │   │   ├── companies.ts     # GET /companies, GET /companies/:id
│       │   │   ├── documents.ts     # CRUD for documents
│       │   │   ├── upload.ts        # POST /upload
│       │   │   ├── share.ts         # POST /share, GET /share/:token
│       │   │   ├── search.ts        # GET /search
│       │   │   └── admin.ts         # User & company management (super_admin only)
│       │   ├── services/
│       │   │   ├── s3.service.ts    # S3 upload, signed URL, delete
│       │   │   ├── document.service.ts
│       │   │   └── search.service.ts
│       │   └── lib/
│       │       ├── prisma.ts
│       │       └── logger.ts
│       └── prisma/
│           ├── schema.prisma
│           └── seed.ts
│
└── packages/
    └── types/
        ├── company.ts
        ├── document.ts
        └── permissions.ts
```

---

## 4. Brand & Design Tokens

```css
--orange:   #E8611A;   /* Primary brand colour */
--dark:     #1A1A1A;
--gray-bg:  #F4F5F7;
--gray-mid: #6B7280;
--border:   #E5E7EB;
--white:    #FFFFFF;
--red:      #EF4444;
--green:    #22C55E;
--radius:   10px;
--shadow:   0 1px 4px rgba(0,0,0,0.10);
--shadow-lg:0 8px 24px rgba(0,0,0,0.12);
--sidebar-w:260px;
--header-h: 60px;
```

Header has a **3px solid #E8611A** bottom border — always maintain this.
Active sidebar item: `background: #FEF0E8; color: #E8611A`.
All primary buttons use `background: #E8611A`.

---

## 5. Complete Company Data

> This is the **seed data**. Use exact slugs, logos, colors, and doc-type sets.

### Category: Ornate Solar Products (`slug: ornate-products`)

```typescript
{
  id: "bess",
  label: "UnityESS",
  icon: "⚡",
  color: "#006297",
  logo: "https://ornatesolar.com/wp-content/uploads/2023/09/White-logo-06-e1695813683826.png",
  websiteUrl: "https://ornatesolar.com",
  docTypes: ["brochure","datasheet","images","videos","ppt","email","compliance","casestudy"]
},
{
  id: "inroof",
  label: "Ornate Inroof",
  icon: "🏠",
  color: "#E8611A",
  logo: "https://ornatesolar.com/wp-content/uploads/2023/10/Ornate-logo-02-e1697005298472.png",
  websiteUrl: "https://ornatesolar.com",
  docTypes: ["brochure","datasheet","images","installation","ppt","email"]
},
{
  id: "kusum",
  label: "Kusum",
  icon: "🌾",
  color: "#16A34A",
  logo: "https://ornatesolar.com/wp-content/uploads/2023/10/Ornate-logo-02-e1697005298472.png",
  websiteUrl: "https://ornatesolar.com",
  docTypes: ["brochure","datasheet","images","scheme","ppt","email"]
},
{
  id: "ornateassured",
  label: "Ornate Assured",
  icon: "🛡️",
  color: "#7C3AED",
  logo: "https://ornatesolar.com/wp-content/uploads/2023/10/Ornate-logo-02-e1697005298472.png",
  websiteUrl: "https://ornatesolar.com",
  docTypes: ["brochure","images","warranty","ppt","email","casestudy"]
},
{
  id: "ojas",
  label: "Ojas",
  icon: "🏗️",
  color: "#B45309",
  logo: "https://ornatesolar.com/wp-content/uploads/2023/10/Ornate-logo-02-e1697005298472.png",
  websiteUrl: "https://ornatesolar.com",
  docTypes: ["brochure","datasheet","images","structural","ppt","email"]
},
{
  id: "agripv",
  label: "AgriPV",
  icon: "🌱",
  color: "#15803D",
  logo: "https://ornatesolar.com/wp-content/uploads/2023/10/Ornate-logo-02-e1697005298472.png",
  websiteUrl: "https://ornatesolar.com",
  docTypes: ["brochure","datasheet","images","videos","casestudy","ppt","email"]
},
{
  id: "solarcarport",
  label: "Solar Carport",
  icon: "🚗",
  color: "#0369A1",
  logo: "https://ornatesolar.com/wp-content/uploads/2023/10/Ornate-logo-02-e1697005298472.png",
  websiteUrl: "https://ornatesolar.com",
  docTypes: ["brochure","datasheet","images","structural","casestudy","ppt","email"]
}
```

### Category: Panels (`slug: panels`)

```typescript
{
  id: "firstsolar",
  label: "First Solar",
  icon: "☀️",
  color: "#F59E0B",
  logo: "https://ornatesolar.com/wp-content/uploads/2025/11/First-Solar-Logo.png",
  websiteUrl: "https://www.firstsolar.com",
  docTypes: ["brochure","datasheet","images","warranty","ppt","pricing"]
},
{
  id: "renewsys",
  label: "Renewsys",
  icon: "☀️",
  color: "#DC2626",
  logo: "https://ornatesolar.com/wp-content/uploads/2020/08/Renewsys-Logo.png",
  websiteUrl: "https://www.renewsys.com",
  docTypes: ["brochure","datasheet","images","warranty","ppt","pricing","email"]
},
{
  id: "canadiansolar",
  label: "Canadian Solar",
  icon: "🍁",
  color: "#991B1B",
  logo: "https://ornatesolar.com/wp-content/uploads/2020/09/Canadian-Solar-India.png",
  websiteUrl: "https://www.canadiansolar.com",
  docTypes: ["brochure","datasheet","images","warranty","ppt","pricing","compliance"]
}
```

### Category: Inverters (`slug: inverters`)

```typescript
{
  id: "hopewind",
  label: "Hopewind",
  icon: "🔋",
  color: "#10B981",
  logo: "https://ornatesolar.com/wp-content/uploads/2025/03/Hopewind-logo.png",
  websiteUrl: "https://www.hopewind.com",
  docTypes: ["brochure","datasheet","images","videos","ppt","approval","email"]
},
{
  id: "solaredge",
  label: "SolarEdge",
  icon: "⚙️",
  color: "#1D4ED8",
  logo: "https://www.solaredge.com/sites/default/files/solaredge-logo.png",
  websiteUrl: "https://www.solaredge.com",
  docTypes: ["brochure","datasheet","images","installation","approval","ppt","pricing"]
},
{
  id: "enphase",
  label: "Enphase",
  icon: "🔆",
  color: "#D97706",
  logo: "https://ornatesolar.com/wp-content/uploads/2020/08/Enphase-LOgo.png",
  websiteUrl: "https://www.enphase.com",
  docTypes: ["brochure","datasheet","images","installation","approval","ppt","email"]
},
{
  id: "fronius",
  label: "Fronius",
  icon: "🔌",
  color: "#C2410C",
  logo: "https://ornatesolar.com/wp-content/uploads/2020/08/Fronius-Logo.png",
  websiteUrl: "https://www.fronius.com",
  docTypes: ["brochure","datasheet","images","installation","approval","ppt","pricing"]
},
{
  id: "havells",
  label: "Havells",
  icon: "💡",
  color: "#7E22CE",
  logo: "https://ornatesolar.com/wp-content/uploads/2022/04/Havells-Solar.webp",
  websiteUrl: "https://www.havells.com",
  docTypes: ["brochure","datasheet","images","approval","ppt","pricing","email"]
}
```

### Master Doc Type Registry

```typescript
export const DOC_TYPES = {
  brochure:     { label: "Brochure",          icon: "📖", accept: ".pdf,.docx" },
  datasheet:    { label: "Datasheet",         icon: "📊", accept: ".pdf,.xlsx,.docx" },
  images:       { label: "Images",            icon: "🖼️", accept: ".jpg,.jpeg,.png,.webp,.svg" },
  videos:       { label: "Videos",            icon: "🎬", accept: ".mp4,.mov,.avi" },
  ppt:          { label: "PPT / Deck",        icon: "📽️", accept: ".pptx,.ppt,.pdf" },
  email:        { label: "Email Template",    icon: "✉️", accept: ".html,.pdf,.docx,.eml" },
  compliance:   { label: "Compliance Docs",   icon: "🛡️", accept: ".pdf,.docx" },
  casestudy:    { label: "Case Studies",      icon: "📋", accept: ".pdf,.docx,.pptx" },
  installation: { label: "Installation Guide",icon: "🔧", accept: ".pdf,.docx" },
  warranty:     { label: "Warranty Docs",     icon: "📜", accept: ".pdf,.docx" },
  pricing:      { label: "Pricing Sheets",    icon: "💰", accept: ".pdf,.xlsx,.docx" },
  approval:     { label: "Type Approvals",    icon: "✅", accept: ".pdf,.docx" },
  scheme:       { label: "Scheme Docs",       icon: "📜", accept: ".pdf,.docx" },
  structural:   { label: "Structural Docs",   icon: "🔩", accept: ".pdf,.docx,.dwg" },
} as const;
```

---

## 6. Database Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Category {
  id        String    @id @default(cuid())
  slug      String    @unique  // "ornate-products" | "panels" | "inverters"
  label     String
  icon      String
  order     Int       @default(0)
  companies Company[]
  createdAt DateTime  @default(now())
}

model Company {
  id         String     @id @default(cuid())
  slug       String     @unique   // "bess", "inroof", "hopewind", etc.
  label      String
  icon       String
  color      String
  logoUrl    String
  websiteUrl String
  docTypes   String[]   // ordered list of doc type keys
  categoryId String
  category   Category   @relation(fields: [categoryId], references: [id])
  documents  Document[]
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
}

model Document {
  id          String    @id @default(cuid())
  name        String
  originalName String
  fileKey     String    // S3 object key
  fileUrl     String    // S3 public/CDN URL (for images only)
  mimeType    String
  sizeBytes   Int
  docType     String    // key from DOC_TYPES
  companyId   String
  company     Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)
  uploadedBy  String    // Clerk userId
  uploaderName String
  shareToken  String?   @unique
  shareExpiry DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([companyId, docType])
  @@index([shareToken])
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  action    String   // "upload" | "delete" | "share" | "download"
  docId     String?
  companyId String?
  meta      Json?
  createdAt DateTime @default(now())
}
```

---

## 7. Auth & RBAC

### Auth Provider: Clerk
- Use `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY` env vars
- Role stored in `user.publicMetadata.role`
- Backend verifies every request with `clerkClient.verifyToken(token)`

### Roles & Permissions Matrix

```typescript
// packages/types/permissions.ts

export const ROLES = ["super_admin","admin","manager","viewer"] as const;
export type Role = typeof ROLES[number];

export const PERMISSIONS = {
  view_documents:    ["super_admin","admin","manager","viewer"],
  download:          ["super_admin","admin","manager","viewer"],
  upload:            ["super_admin","admin","manager"],
  delete_own:        ["super_admin","admin","manager"],
  delete_any:        ["super_admin","admin"],
  share:             ["super_admin","admin","manager"],
  manage_companies:  ["super_admin","admin"],
  manage_users:      ["super_admin"],
} satisfies Record<string, Role[]>;

export function hasPermission(role: Role, permission: keyof typeof PERMISSIONS): boolean {
  return PERMISSIONS[permission].includes(role);
}
```

### Backend Middleware

```typescript
// apps/api/src/middleware/auth.ts
// 1. Extract Bearer token from Authorization header
// 2. verifyToken(token) via Clerk SDK
// 3. Attach { userId, role } to req.user
// 4. Return 401 if invalid

// apps/api/src/middleware/rbac.ts
// requirePermission("upload") → checks req.user.role → 403 if denied
```

### Frontend Middleware

```typescript
// apps/web/middleware.ts
// Protect ALL /dashboard/* and /admin/* routes
// Redirect to /sign-in if not authenticated
// For /admin/* → additionally check role === "super_admin"
```

### PermissionGate Component

```tsx
// apps/web/components/rbac/PermissionGate.tsx
// <PermissionGate permission="upload">
//   <UploadButton />
// </PermissionGate>
// Renders null silently if user lacks permission. Never show errors.
```

---

## 8. Backend — API Reference

**Base URL:** `http://localhost:4000/api`
**All routes require:** `Authorization: Bearer <clerk_token>` header

### Companies

```
GET  /api/categories              → List all 3 categories with company counts
GET  /api/categories/:slug        → Single category with its companies
GET  /api/companies/:id           → Single company + docType list
```

### Documents

```
GET  /api/companies/:id/documents              → All docs for a company (grouped by docType)
GET  /api/companies/:id/documents/:docType     → Docs for one section
POST /api/documents/:id/view-url               → Generate S3 signed URL (1h) for viewing
DELETE /api/documents/:id                      → Delete doc (permission: delete_own or delete_any)
```

### Upload

```
POST /api/upload
  Content-Type: multipart/form-data
  Fields: file(s), companyId, docType
  Auth: requires "upload" permission
  Flow:
    1. Validate file type against DOC_TYPES[docType].accept
    2. Upload to S3: ornate-collateral/{companyId}/{docType}/{uuid}-{filename}
    3. Save Document record in DB
    4. Write AuditLog entry
    5. Return document metadata
```

### Share

```
POST /api/documents/:id/share
  → Generate unique shareToken, set shareExpiry = now + 24h
  → Return { shareUrl, shareToken, expiresAt }

GET  /api/share/:token             (PUBLIC — no auth required)
  → Validate token not expired
  → Generate S3 signed URL (24h)
  → Return { signedUrl, document metadata }
```

### Search

```
GET /api/search?q=&category=&docType=&mimeType=&sortBy=date|name|size
  → Full-text search across Document.name + Company.label
  → Results grouped by company
  → Filter by category slug, docType key, or mimeType prefix
```

### Admin (super_admin only)

```
GET    /api/admin/users            → List all Clerk users with roles
PATCH  /api/admin/users/:id/role   → Update user role
POST   /api/admin/companies        → Create new company
PATCH  /api/admin/companies/:id    → Edit company (name, logo, docTypes, etc.)
DELETE /api/admin/companies/:id    → Delete company + all its documents from S3 + DB
```

---

## 9. Frontend — Pages & Components

### `/dashboard` (Home)
- 3 `<CategoryCard>` in a responsive CSS Grid (1 → 2 → 3 cols)
- Each card: large emoji, gradient overlay using category color, label, company count badge
- On click → navigate to `/dashboard/[category-slug]`

### `/dashboard/[category]`
- Breadcrumb: `Dashboard > Category Name`
- Section heading + total company count
- Responsive grid of `<CompanyCard>` (2 → 3 → 4 cols)

**CompanyCard props:**
```typescript
{
  slug: string;
  label: string;
  icon: string;
  color: string;       // used for left border accent
  logoUrl: string;     // next/image — fallback to <Avatar initials>
  websiteUrl: string;  // "Visit Website →" opens _blank, stops propagation
  categoryLabel: string;
}
```

### `/dashboard/[category]/[company]`
- Company header: logo (48px), name, category badge, website button
- `<StatsRow>`: Total files, Total sections, Last uploaded
- Accordion of `<DocSection>` for each docType in `company.docTypes`

**DocSection behavior:**
- Header: `{icon} {label}` + count badge (gray if 0, orange if >0)
- Expanded: `<FileGrid>` or `<FileList>` toggle (default: grid)
- Sort dropdown: Newest first / A→Z / Largest first
- `<PermissionGate permission="upload">` wraps Upload button
- Per file actions: `👁 View` | `⬇ Download` | `🔗 Share`
- Empty state: illustration + "No files yet" text

**FileViewer Modal (per mimeType):**
- `application/pdf` → react-pdf paginated viewer
- `image/*` → yet-another-react-lightbox gallery
- `video/*` → react-player embedded player
- `.pptx / .docx` → Google Docs Viewer iframe + download prompt
- `.html` (email templates) → sandboxed `<iframe srcdoc>`

### `/admin` (super_admin only)
- User management table: list users, change role via dropdown
- Company management: add/edit/delete companies
- Audit log table: recent upload/delete/share events

### Global Search (`<GlobalSearch>`)
- Debounced 300ms → calls `GET /api/search`
- Results dropdown grouped by company
- Filter chips: Category | DocType | File Type
- Highlighted match terms
- "No results" empty state

---

## 10. File Upload & Storage

### AWS S3 Config (India-safe, no Supabase)
```
Bucket:  ornate-collateral-hub
Region:  ap-south-1  (Mumbai)
Folder structure: {companyId}/{docType}/{uuid}-{sanitized-filename}
```

**Image/Logo files:** Public read ACL → use direct S3 URL
**All documents (PDFs, PPTs, etc.):** Private → always serve via signed URL (never expose raw S3 URL)

### Upload Flow (Frontend → Backend → S3)
```
1. User selects files in <UploadModal> (drag & drop or browse)
2. User confirms: company is pre-set, docType is pre-set from current section
3. POST multipart/form-data → /api/upload
4. Backend: validate → multer buffer → S3 PutObjectCommand → Prisma save → AuditLog
5. Frontend: progress bar via axios onUploadProgress
6. On success: toast "Uploaded successfully" + re-fetch documents for that section
```

### Accepted File Types (enforced on both frontend input `accept` attr AND backend validation)
```
images:       .jpg .jpeg .png .webp .svg
videos:       .mp4 .mov .avi
ppt / deck:   .pptx .ppt .pdf
email:        .html .pdf .docx .eml
brochure:     .pdf .docx
datasheet:    .pdf .xlsx .docx
compliance:   .pdf .docx
casestudy:    .pdf .docx .pptx
installation: .pdf .docx
warranty:     .pdf .docx
pricing:      .pdf .xlsx .docx
approval:     .pdf .docx
scheme:       .pdf .docx
structural:   .pdf .docx .dwg
```

---

## 11. Search & Filtering

```typescript
// GET /api/search
// Query params:
{
  q: string;          // searches Document.name + Company.label (case-insensitive)
  category?: string;  // filter by category slug
  docType?: string;   // filter by docType key
  mimeType?: string;  // filter by mime prefix e.g. "image/"
  sortBy?: "date" | "name" | "size";
  page?: number;      // default 1
  limit?: number;     // default 30
}

// Response shape:
{
  results: Array<{
    company: { id, slug, label, logoUrl, categoryLabel },
    documents: Array<Document & { highlight: string }>
  }>,
  total: number,
  page: number
}
```

---

## 12. Share Feature

**Share Modal UI:**
1. Click `🔗 Share` on any file
2. Modal opens: shows shareable link input + Copy button
3. QR code rendered via `qrcode.react`
4. "Open in new tab" button
5. Shows expiry time: "Link expires in 24 hours"

**Share Link format:** `https://collateral.ornatesolar.com/share/{token}`

**Public share page** (`/share/[token]`):
- No auth required
- Calls `GET /api/share/:token` → gets signed S3 URL
- Shows file name, company logo, download button
- If expired → shows "This link has expired" screen

---

## 13. Build Order

Follow this exact order to avoid dependency issues:

```
Phase 1 — Foundation
  1. Monorepo setup (turborepo or pnpm workspaces)
  2. packages/types: Zod schemas + shared types + permissions matrix
  3. apps/api: Express + Prisma setup + DB migration
  4. Seed database with all 3 categories + 15 companies from Section 5

Phase 2 — Backend APIs
  5. Clerk auth middleware + RBAC middleware
  6. GET /categories and /companies routes
  7. S3 service: upload, getSignedUrl, delete
  8. POST /upload route (Multer + S3 + Prisma)
  9. GET /documents routes + signed URL endpoint
  10. POST + GET /share routes
  11. GET /search route
  12. Admin routes (user role PATCH, company CRUD)

Phase 3 — Frontend Shell
  13. Next.js 15 app init + Tailwind + shadcn/ui
  14. Clerk integration + middleware.ts route protection
  15. Sidebar + Topbar layout with brand colors from Section 4
  16. Axios client (lib/api.ts) with Clerk token interceptor

Phase 4 — Dashboard Pages
  17. Dashboard home: 3 CategoryCards
  18. Category page: CompanyCard grid
  19. Company detail page: StatsRow + accordion DocSections
  20. FileGrid + FileList + FileCard components
  21. FileViewer modal (PDF / image / video / iframe)

Phase 5 — Features
  22. UploadModal: drag & drop, progress bar, POST /upload
  23. ShareModal: link + QR + copy button + expiry
  24. Public /share/[token] page
  25. GlobalSearch with debounce + filter chips
  26. PermissionGate wrapping all upload/delete/share buttons

Phase 6 — Admin
  27. /admin page: user management + company management + audit log
  28. Toast notifications (Sonner) across all async actions
  29. Loading skeletons on all async pages
  30. Mobile responsive pass (sidebar collapses on <768px)
```

---

## 14. Conventions & Rules

### TypeScript
- Strict mode ON. Zero `any`. Use `unknown` + type guards where needed.
- All API response shapes defined in `packages/types`.

### Styling
- Use `cn()` from `lib/utils.ts` for all conditional classNames.
- No inline `style` attributes except for dynamic values (e.g., brand color).
- All colors in CSS variables — see Section 4.

### Components
- Server Components by default. Add `"use client"` only for interactivity.
- All data fetching: Server Components call backend via `lib/api.ts`.
- No `useEffect` for data fetching — use Server Components or SWR.

### API
- Every route validates input with Zod before touching Prisma.
- Every route checks auth FIRST, then permission, then business logic.
- All S3 keys must be sanitized: `{uuid}-{filename.replace(/[^a-zA-Z0-9._-]/g,"_")}`.
- Document S3 URLs are NEVER stored in DB. Only the `fileKey` is stored.
  Signed URLs are generated on demand.

### Errors
- Backend returns: `{ error: string, code: string }` with appropriate HTTP status.
- Frontend shows Sonner toast for all errors. Never show raw error messages to users.

### Security
- Rate limit upload endpoint: 20 requests/minute per user.
- Validate file mime type on backend (do NOT trust file extension alone).
- Share tokens are UUIDv4. No sequential IDs.
- Admin routes are double-protected: middleware.ts + requirePermission("manage_users").

### Environment Variables

```bash
# apps/api/.env
DATABASE_URL=
CLERK_SECRET_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
S3_BUCKET_NAME=ornate-collateral-hub
FRONTEND_URL=http://localhost:3000

# apps/web/.env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Git Commit Convention
```
feat:     new feature
fix:      bug fix
chore:    tooling/config
docs:     documentation
refactor: code change with no feature/fix
```

---

*End of CLAUDE.md — Do not modify this file unless you are adding a new company,
changing a permission, or updating environment variable names.*
