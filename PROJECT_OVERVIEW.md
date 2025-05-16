# Paul Phish Tickets — Project Overview & Technical Challenge

---

## Tools & Architecture (2024 Update)

- **Frontend Hosting & Deployment:** Vercel (Next.js/React, custom domain, serverless API routes)
- **Backend (Database & Storage):** Supabase (Postgres database for ticket data, Supabase Storage for images/CSVs)
- **Code Versioning:** GitHub (integrated with Vercel for CI/CD)
- **Development Environment:** Cursor (AI code editor)

---

## To-Do List

- [ ] Integrate Supabase with Vercel in this project
- [ ] Get Vercel and Supabase MPCs (Managed Project Configurations) to work with Cursor (previous attempts were unsuccessful)
- [ ] Implement CSV download/upload functionality using Supabase Storage
- [ ] Implement image upload and retrieval using Supabase Storage
- [ ] Update frontend to read/write ticket data from Supabase database
- [ ] Add single ticket + image add form (writes to Supabase)
- [ ] Test and document the new workflow
- [ ] Set up and verify custom domain on Vercel

---

## Project Overview

**Description:**
This project is a web application for displaying a collection of Phish concert ticket stubs. The data is now managed in a Supabase Postgres database, with images and CSVs stored in Supabase Storage. The frontend, built with Next.js/React and deployed on Vercel, interacts directly with Supabase for all data operations. Code is versioned with GitHub and deployed via Vercel for live hosting.

**Current Workflow:**
- Ticket data and images are uploaded and managed directly in Supabase (Postgres for structured ticket data, Supabase Storage for images and CSVs).
- The frontend app (on Vercel) reads and writes ticket data live from Supabase, enabling real-time updates and edits from the deployed site.
- Code changes are managed in GitHub, with CI/CD integration to Vercel for automatic deployments.

---

## Database System & New Path Forward

**Database System:**
- We have chosen Supabase as our primary backend solution.
- Ticket data is stored in a Postgres database (managed by Supabase), providing structured, queryable, and scalable storage.
- Images and CSV files are stored in Supabase Storage, allowing for persistent, cloud-based file management.

**New Path Forward:**
- Move away from local CSV/JSON file workflows. All ticket data and images are now managed in Supabase, enabling live editing and uploads from the web app.
- The frontend (Next.js/React on Vercel) communicates directly with Supabase for all data operations, using Supabase's client libraries and APIs.
- GitHub remains the source of truth for code, with Vercel handling deployments and previews.
- This cloud-native approach enables real-time updates, persistent storage, and a seamless workflow for both users and developers.

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

*This document can be updated as the project evolves. Ask the AI to "update PROJECT_OVERVIEW.md" with new information as needed.* 