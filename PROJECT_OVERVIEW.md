# Paul Phish Tickets — Project Overview & Technical Challenge

---

**[July 2024 Update]**
- Full dark theme and modern UI now live across all pages (admin and user)
- Homepage and browser title updated to "Phish Ticket Stub Archive"
- Rollback point created: `v2.0-dark-theme` (see CHANGELOG.md for details)

---

## Tools & Architecture (2024 Update)

- **Frontend Hosting & Deployment:** Vercel (Next.js/React, custom domain, serverless API routes)
- **Backend (Database & Storage):** Supabase (Postgres database for ticket data, Supabase Storage for images/CSVs)
- **Code Versioning:** GitHub ([elegy2000/pauls-phish-tickets](https://github.com/elegy2000/pauls-phish-tickets), integrated with Vercel for CI/CD)
- **Development Environment:** Cursor (AI code editor)
- **Documentation:** PROJECT_OVERVIEW.md (project structure) and CHANGELOG.md (issues & progress tracking)
- **Access:** Full GitHub and Supabase access is available for development, deployment, and troubleshooting.

---

## Recent Migration (June 2024)

- **All ticket images have been migrated from the local `public/images/` directory to Supabase Storage.**
- **A mapping file (`scripts/supabase_image_mapping.json`) was generated to map local image filenames to their new Supabase public URLs.**
- **A script (`scripts/update_ticket_image_urls.js`) was created and run to update all `imageUrl` fields in `public/data/tickets.json` to use the new Supabase URLs.**
- **The local `public/images/` directory was deleted and removed from git to reduce project and deployment size.**
- **All changes were committed and pushed to GitHub, triggering a new Vercel deployment.**
- **Vercel deployment size issues are now resolved.**
- **[May 20, 2024] Fixed Supabase Row Level Security (RLS) policy to allow API/service inserts for CSV upload.**

## Latest Enhancements (January 2025)

- **Storage Cleanup System:** Implemented automated cleanup tool to identify and remove unused ticket images and duplicates from Supabase Storage. Features smart detection of timestamp-prefixed duplicates and unused original files, with batch deletion and detailed reporting. Successfully freed ~55MB of storage space by removing 95 unused files (40 duplicates + 55 unused originals).
- **Homepage Content Editor:** Major admin functionality addition allowing dynamic editing of the homepage opening paragraph. Created `homepage_content` database table with RLS policies, built rich text editor with live preview, and integrated seamless content updates without code deployment. Supports HTML formatting and provides real-time content management through the admin dashboard.
- **Modern Dark Theme Design:** Complete UI overhaul with dark theme (#0f0f0f background) providing better image contrast and minimal modern aesthetic. Improved year box visibility, enhanced typography, interactive hover effects, and consistent styling across all pages.
- **Complete Image Upload System:** Implemented bulk image upload with smart batching (<4MB per batch), duplicate handling via `upsert`, and comprehensive admin interface with progress tracking.
- **Oversized Image Protection:** Added pre-upload validation for files >4MB (Vercel limit) with clear warnings, visual indicators, and automatic skipping of oversized files.
- **Image Status Tracking:** Added "IMAGE" column to admin dashboard showing green ✓ for tickets with images, red - for those without. Logic checks both database imageurl and storage by date pattern.
- **Image Reset Functionality:** Added secure image reset with triple confirmation system (warning → confirmation → type "DELETE") and dedicated API endpoint.
- **Consistent Admin UI:** Standardized all button styling across the admin interface with modern dark theme and enhanced user experience.
- **Production Ready:** All features tested and deployed via GitHub/Vercel integration with full error handling and user feedback.
- **Rollback Available:** Tagged stable version `v1.0-stable` available for rollback if needed.

## Current Status (January 2025) - Latest Features

### ✅ **Square Image Cell Design Enhancement** - COMPLETE & LIVE
- **Perfect Square Layout:** Year cell images now use true square containers (280px × 280px)
- **Visual Consistency:** Clean, uniform grid layout with images perfectly fitting square containers
- **Preserved Interactions:** All hover animations and user experience elements maintained
- **Professional Aesthetic:** Modern, gallery-like presentation of ticket stub images
- **Production Ready:** Live implementation with optimal performance across all devices

### ✅ **Storage Cleanup Tool** - COMPLETE & LIVE
- **Automated Cleanup:** Admin Settings tab includes "Storage Cleanup" functionality
- **Smart Detection:** Identifies duplicate images with timestamp prefixes and unused original files
- **Safe Deletion:** Batch processing with confirmation dialogs and error handling
- **Storage Optimization:** Successfully freed ~55MB of space (95 files: 40 duplicates + 55 unused)
- **Admin Integration:** One-click cleanup directly from admin dashboard Settings tab
- **Production Ready:** Live implementation with comprehensive logging and result feedback

### ✅ **Year Navigation Enhancement** - COMPLETE & LIVE
- **Direct Year-to-Year Navigation:** "Next Year →" and "Previous Year ←" buttons on year pages
- **Smart Logic:** Automatically skips years with no shows, navigates only between years with tickets
- **Strategic Positioning:** Right side buttons complement existing "Back to Years" on left
- **Consistent Design:** Matches existing navigation styling with dark theme integration
- **Enhanced UX:** Eliminates need to return to homepage for chronological browsing
- **Responsive Layout:** Works seamlessly on mobile and desktop devices
- **Production Ready:** Live implementation with server-side data fetching
- **CRITICAL BUG RESOLVED:** Fixed 1000-record database limit that was excluding years 2013+ from navigation
- **User Confirmed:** Successfully tested and verified working across entire collection (1989-2024+)

### ✅ **Ticket Editing Interface Enhancement** - COMPLETE & LIVE
- **Inline Editing:** Click ✏️ button to modify ticket details directly in the table
- **Individual Deletion:** Remove specific tickets with confirmation dialogs
- **Granular Control:** No more need to reset entire CSV for single changes
- **User-Friendly Interface:** Consistent with existing admin dashboard styling
- **Real-time Updates:** Changes appear immediately without page refresh

### ✅ **Image Name Column Enhancement** - COMPLETE & TESTED
- **IMAGE NAME Column:** Shows editable filenames (e.g., "2022-09-04.jpg") for all 1,350 tickets
- **Auto-Generation:** imageurl automatically creates when filename is entered
- **Real-time Validation:** Live status indicators (✓ found, ⚠️ missing, - none)
- **Smart Migration:** All existing tickets migrated from full URLs to clean filenames
- **Future-Ready:** Automatic image linking when files are uploaded matching filenames
- **Production Verified:** Working live with all existing ticket data

### 🎯 **Next Upload Workflow**
When images are uploaded, the system will automatically:
1. Match uploaded filename to existing ticket `image_filename`
2. Update status from ⚠️ to ✓ automatically
3. No manual URL linking required

## Planned Enhancements - User Requests

*All previously planned user-requested features have been completed and are now live in production.*

---

## Project Overview

**Description:**
This project is a web application for displaying a collection of Phish concert ticket stubs. The data is now managed in a Supabase Postgres database, with images and CSVs stored in Supabase Storage. The frontend, built with Next.js/React and deployed on Vercel, interacts directly with Supabase for all data operations. Code is versioned with GitHub and deployed via Vercel for live hosting.

**Current Workflow:**
- Ticket data and images are uploaded and managed directly in Supabase (Postgres for structured ticket data, Supabase Storage for images and CSVs).
- The frontend app (on Vercel) reads and writes ticket data live from Supabase, enabling real-time updates and edits from the deployed site.
- Code changes are managed in GitHub, with CI/CD integration to Vercel for automatic deployments.
- **Local images are no longer used or included in the repository.**

---

## Database System & New Path Forward

**Database System:**
- We have chosen Supabase as our primary backend solution.
- Ticket data is stored in a Postgres database (managed by Supabase), providing structured, queryable, and scalable storage.
- Images and CSV files are stored in Supabase Storage, allowing for persistent, cloud-based file management.
- [May 20, 2024] Updated RLS policy on ticket_stubs table to allow inserts from API/service, enabling successful CSV uploads from the web app.

**New Path Forward:**
- Move away from local CSV/JSON file workflows. All ticket data and images are now managed in Supabase, enabling live editing and uploads from the web app.
- The frontend (Next.js/React on Vercel) communicates directly with Supabase for all data operations, using Supabase's client libraries and APIs.
- GitHub remains the source of truth for code, with Vercel handling deployments and previews.
- This cloud-native approach enables real-time updates, persistent storage, and a seamless workflow for both users and developers.
- **All image URLs in ticket data now point to Supabase Storage.**

---

## Technical Challenge (Historical)

**Previous Problem Statement:**
We wanted to allow uploading or editing the CSV (or ticket data) directly from the deployed site, so changes are reflected live without manual local conversion and redeployment.

**Previous Technical Challenge:**
Vercel's serverless functions are stateless and ephemeral, so persistent file storage was not possible. This led to the need for an external storage/database solution.

**Conclusion:**
> **You cannot use Vercel serverless functions to persistently accept CSV uploads and keep changes to files like your ticket data.**  
> To enable live editing or uploading of ticket data, you need to use an external storage solution (such as Supabase) to store and retrieve your data.

---

## Recommendation (Implemented)

- **For persistent uploads/edits:**
  - We now use Supabase (database and storage) for storing CSVs, images, and ticket data.
  - The app reads/writes ticket data from Supabase, supporting live updates and uploads.
  - The database (Supabase Postgres) provides structured data management and scalability.

- **For local-only workflows:**
  - The old process (local CSV, conversion script, commit, deploy) is deprecated in favor of the new cloud-native workflow.

---

*This document provides a high-level overview of the project structure and architecture. For detailed progress tracking, issue resolution, and changelog, see CHANGELOG.md.*

---

# 📚 USER GUIDE & PROJECT HANDOFF

## 🚀 How to Use the Phish Ticket Stub Archive

### **For End Users (Visitors)**

**🌐 Live Site:** [https://www.phishticketstubs.com](https://www.phishticketstubs.com)

1. **Browse by Year**: Click any year box on the homepage to view tickets from that year
2. **Navigate Between Years**: Use "Previous Year ←" and "Next Year →" buttons on year pages
3. **View Ticket Images**: Click any ticket stub thumbnail to see full-size image in lightbox
4. **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

### **For Administrators**

**🔐 Admin Access:** Add `/admin` to the site URL and login with Supabase Auth credentials

#### **Admin Dashboard Tabs:**

1. **📊 Current Tickets**
   - View all tickets in searchable/sortable table
   - **Edit**: Click ✏️ button to modify ticket details inline
   - **Delete**: Click 🗑️ button to remove individual tickets (with confirmation)
   - **Image Status**: Green ✓ = has image, Red - = missing image, ⚠️ = filename set but image missing

2. **📤 CSV Management**
   - **Upload CSV**: Replace all tickets with new CSV data
   - **Download CSV**: Export current ticket data as CSV file
   - **Format**: `YEAR,DATE,VENUE,CITY/STATE,IMAGE_FILENAME,NET_LINK`

3. **🖼️ Image Upload**
   - **Ticket Images**: Bulk upload ticket stub images (matches by filename)
   - **Year Images**: Upload/replace homepage year box images
   - **Auto-batching**: Files >4MB automatically rejected, others batched for upload
   - **Status Tracking**: Real-time upload progress and validation

4. **➕ Add Single Ticket**
   - Add individual tickets without CSV upload
   - All fields validated before submission

5. **📝 Content Editor**
   - Edit homepage opening paragraph dynamically
   - HTML formatting supported
   - Live preview functionality

6. **⚙️ Settings**
   - **Change Password**: Update admin password with strength validation
   - **Storage Cleanup**: Remove unused/duplicate images from Supabase Storage
   - **Logout**: Secure session cleanup

## 🏗️ Project Structure & Architecture

### **Core Technologies**
- **Frontend**: Next.js 14 with React (deployed on Vercel)
- **Backend**: Supabase (PostgreSQL database + Storage)
- **Authentication**: Supabase Auth (email/password)
- **Deployment**: GitHub → Vercel (automatic CI/CD)
- **Development**: Cursor IDE with MCP integrations

### **File Structure**
```
📁 paul-phish-tickets/
├── 📁 pages/                    # Next.js pages
│   ├── index.js                 # Homepage with year grid
│   ├── admin.jsx                # Admin dashboard
│   ├── year/[year].js           # Individual year pages
│   └── api/                     # API endpoints
│       ├── add-ticket.js        # Add single ticket
│       ├── update-ticket.js     # Edit ticket inline
│       ├── delete-ticket.js     # Delete individual ticket
│       ├── upload-images.js     # Bulk image upload
│       ├── cleanup-unused-images.js # Storage cleanup
│       ├── homepage-content.js  # Dynamic homepage content
│       └── auth/                # Authentication endpoints
├── 📁 components/               # React components
├── 📁 styles/                   # CSS styling
├── 📁 scripts/                  # Utility scripts (mostly legacy)
├── 📄 CHANGELOG.md             # Detailed project history
├── 📄 PROJECT_OVERVIEW.md      # This file
└── 📄 .env.local               # Environment variables
```

### **Database Schema (Supabase)**
```sql
-- Main tickets table
CREATE TABLE ticket_stubs (
    id SERIAL PRIMARY KEY,
    year INTEGER,
    date DATE,
    venue TEXT,
    city_state TEXT,
    imageurl TEXT,          -- Auto-generated from image_filename
    image_filename TEXT,    -- Editable filename (e.g., "2022-09-04.jpg")
    net_link TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Homepage content management
CREATE TABLE homepage_content (
    content_key TEXT PRIMARY KEY,
    content_text TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Supabase Storage Buckets**
- `ticket-images/`: Individual ticket stub images
- `year-images/`: Homepage year box background images

## 🔧 Development Setup

### **Prerequisites**
- Node.js 18+ and npm
- GitHub account with repository access
- Supabase project access
- Vercel account (for deployment)

### **Local Development**
```bash
# Clone repository
git clone https://github.com/elegy2000/pauls-phish-tickets.git
cd pauls-phish-tickets

# Install dependencies
npm install

# Set up environment variables (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Run development server
npm run dev
# Visit http://localhost:3000
```

### **Deployment Process**
1. **Automatic**: Push to GitHub main branch triggers Vercel deployment
2. **Manual**: Use Vercel dashboard to deploy specific commits
3. **Environment**: Vercel automatically uses environment variables set in project settings

## 🔐 Access & Credentials

### **Admin Login**
- **Email**: `windows.rift05@icloud.com`
- **Password**: Set via Supabase Auth (changeable in admin Settings)

### **Service Accounts**
- **GitHub**: Repository access for code changes
- **Supabase**: Database and storage management
- **Vercel**: Hosting and deployment management

## 🛠️ Maintenance & Troubleshooting

### **Common Tasks**
1. **Adding New Tickets**: Use admin CSV upload or single ticket form
2. **Managing Images**: Upload via admin Image Upload tab
3. **Content Updates**: Use Content Editor for homepage text
4. **Storage Cleanup**: Run Storage Cleanup tool monthly to remove unused files

### **Backup Strategy**
- **Code**: Versioned in GitHub with full history
- **Database**: Supabase automatic backups + manual CSV exports
- **Images**: Stored in Supabase Storage with redundancy

### **Rollback Options**
- **Git Tags**: Stable versions tagged for easy rollback
- **Database**: CSV export/import for data rollback
- **Vercel**: Previous deployments available in dashboard

## 📞 Support & Contact

### **Technical Issues**
1. Check CHANGELOG.md for known issues and solutions
2. Review Vercel deployment logs for errors
3. Check Supabase logs for database/storage issues
4. GitHub Issues for code-related problems

### **Project Status**
- **Current Status**: ✅ **100% COMPLETE** - All features implemented and live in production
- **Latest Enhancement**: Square Image Cell Design - Perfect square containers for optimal visual consistency
- **Known Issues**: None critical - All major functionality working perfectly
- **Future Enhancements**: Optional Vercel MCP integration (development convenience only)

---

**🎉 The Phish Ticket Stub Archive is complete and ready for long-term use!** 