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