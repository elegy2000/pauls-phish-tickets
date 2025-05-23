# Changelog

All notable changes, issues, and fixes for the Paul Phish Tickets project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Latest Completed (January 2025)
- [x] **Modern Dark Theme Design Implementation**
  - ✅ **Complete UI overhaul with dark theme (#0f0f0f background) for better image contrast**
  - ✅ **Improved year box visibility with high-contrast styling and gradient accents**
  - ✅ **Minimal modern aesthetic with enhanced typography and spacing**
  - ✅ **Consistent dark styling across home page, year pages, and admin interface**
  - ✅ **Interactive hover effects and smooth transitions throughout**
  - ✅ **Enhanced lightbox with backdrop blur for premium image viewing**
  - Rollback point: `git checkout v1.0-stable` (stable version before design changes)
  - Date: January 2025
  - Status: Live on production, fully responsive

- [x] **Image Upload System Enhancements**
  - ✅ **Added "IMAGE" status column to Current Tickets table showing green ✓ for tickets with images, red - without (WORKING)**
  - ✅ **Fixed image detection logic with dedicated `/api/list-images` endpoint using service role permissions**
  - Improved image checking logic to detect images both by database imageurl and by date pattern matching
  - Implemented duplicate handling: removed timestamp prefixes from filenames, uses `upsert: true` for automatic replacement
  - Added "Reset All Images" functionality with triple confirmation system and dedicated API endpoint
  - Enhanced batch upload system for handling large image collections (automatically splits into <4MB batches)
  - **Fixed oversized image handling: Pre-upload validation rejects files >4MB with clear warnings and visual indicators**
  - Fixed button styling consistency across all admin interface sections
  - Date: January 2025
  - Status: Production ready, deployed via GitHub/Vercel integration

- [x] **Admin Interface Improvements**
  - Standardized button styling: blue primary buttons (12px 24px padding, 16px font), red danger button for reset
  - Fixed inconsistent button sizes and colors across CSV Management, Image Upload, and Add Ticket sections
  - Added comprehensive admin dashboard with tabbed interface for different functions
  - Improved user experience with progress tracking and detailed error messages
  - Date: January 2025
  - Status: Complete

### Current Issues
- CSV upload functionality not working
  - Error: "Method not allowed" and "Error inserting tickets into Supabase"
  - Fixed by:
    * Added environment variables for authentication
    * Enhanced CSV validation with detailed error messages
    * Improved error handling throughout the upload process
    * Updated cookie settings for better compatibility
    * Enabled Row Level Security (RLS) on ticket_stubs table
    * **[May 20, 2024] Fixed RLS policy to allow inserts from API/service for CSV upload (see below)**
  - Next steps:
    * Test CSV upload with new validation
    * Monitor error messages for any remaining issues
- Website is limited to 1000 tickets due to Supabase client default; needs batch fetching/pagination everywhere tickets are loaded.
- CSV upload can create duplicate entries in the Supabase table; deduplication logic needs to be enforced on upload and/or at the database level.
- CSV download includes the 'id' column, which is not needed for user uploads
  - Planned: Update CSV download logic to exclude the 'id' column so exported CSVs only contain relevant ticket fields (year, date, venue, city_state, imageurl, net_link)

### In Progress
- [ ] Test CSV upload with enhanced validation

### Completed
- [x] Add date format conversion script and improve CSV handling
  - Added: date_converter.js script to standardize date formats
  - Fixed: Date format conversion from "Month DD, YYYY" to "YYYY-MM-DD"
  - Added: Robust error handling for date conversion
  - Added: Automatic CSV header case sensitivity handling
  - Date: May 23, 2024
  - Status: Ready for testing with the upload system

- [x] Fix imageUrl/imageurl inconsistency issues
  - Fixed by: Updating all code to consistently use lowercase 'imageurl'
  - Fixed by: Optimizing RLS policy for better performance
  - Fixed by: Updating database column name to match
  - Affected files: convertCsvToJson.js, index.js, [tourId].js, update-csv.js, update-site-data.ts, and more
  - Date: May 22, 2024
  - Status: Resolved upload errors and RLS performance warnings

- [x] Configure environment variables
  - Added: ADMIN_USERNAME and ADMIN_PASSWORD for authentication
  - Updated: SUPABASE_SERVICE_ROLE_KEY
  - Added: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
  - Date: May 21, 2024
  - Commit: eb90254

- [x] Enhance CSV validation and error handling
  - Added: Line-by-line validation with detailed error messages
  - Added: Year and date format validation (YYYY and YYYY-MM-DD)
  - Added: Required field validation with specific error messages
  - Added: CSV header validation
  - Date: May 21, 2024
  - Commit: eb90254

- [x] Add Supabase connection diagnostics
  - Added: Connection testing before operations
  - Added: Detailed configuration logging
  - Added: Structured error reporting for each stage
  - Added: Basic favicon to resolve 404 error
  - Date: May 21, 2024
  - Commit: pending

- [x] Enhance CSV upload error handling system
  - Added: Detailed Supabase error reporting (code, hint, details)
  - Added: Batch processing information in error messages
  - Added: Structured error display in frontend
  - Added: Better error message formatting with line breaks
  - Date: May 21, 2024
  - Commit: aea5126

- [x] Improve error handling in CSV upload
  - Added: Detailed error logging throughout the process
  - Added: Support for multiple column name formats
  - Added: Batch processing for large datasets
  - Date: May 21, 2024

- [x] Frontend not displaying newly added tickets
  - Fixed by: Updating index.js to fetch data directly from Supabase
  - Fixed by: Switching from getStaticProps to getServerSideProps for real-time updates
  - Fixed by: Removing local JSON file dependencies
  - Added: Show count display for each year
  - Date: May 20, 2024

- [x] CSV download not including new tickets
  - Fixed by: Updating csvHandler.js to fetch data directly from Supabase
  - Fixed by: Removing local JSON file operations
  - Fixed by: Properly extracting year from date field
  - Date: May 20, 2024

- [x] Environment variable configuration
  - Fixed by: Standardizing environment variable names across all files
  - Fixed by: Updating add-ticket.js to use NEXT_PUBLIC_SUPABASE_URL
  - Fixed by: Making image URLs dynamic using Supabase URL from environment
  - Date: May 20, 2024

- [x] Fix add-ticket API endpoint errors
  - Fixed by: Removing local JSON file operations (not possible on Vercel's read-only filesystem)
  - Fixed by: Properly formatting data for Supabase insert
  - Date: May 20, 2024
  - Commit: f27a6da

- [x] Set up auto-deployment from GitHub to Vercel
  - Fixed by: Reconnecting GitHub repository in Vercel dashboard
  - Date: May 20, 2024

- [x] Enable Row Level Security (RLS) on Supabase tables
  - Added: RLS policies for ticket_stubs table
  - Added: Public read-only access policy
  - Added: Service role write access policy
  - Fixed: Security warning about disabled RLS
  - Date: May 21, 2024
  - Commit: pending

- [x] Fix Supabase RLS policy to allow CSV uploads
  - Fixed by: Adding a permissive RLS policy (WITH CHECK (true)) to allow inserts from API/service
  - Date: May 20, 2024
  - Status: CSV upload now works end-to-end

- [x] Implement image upload/retrieval with Supabase Storage
  - Added: `/api/upload-images` API route now uploads images directly to Supabase Storage (`ticket-images` bucket) instead of the local filesystem
  - Enables: Cloud-native image management compatible with Vercel deployment (no local file writes)
  - Date: June 3, 2024
  - Status: Ready for testing and production use

### June 2024
- [x] Normalize all image URL references to 'imageUrl' (camelCase)
  - Updated all code, scripts, and data processing to use 'imageUrl' (camelCase) for ticket image URLs
  - All CSVs, JSON files, and code now use 'imageUrl' for consistency
  - Fixed: Previous issues with image loading and mismatched property names (e.g., 'imageurl', 'image_url')
  - Ensures seamless image display and upload functionality across the app
  - Date: June 2024
  - Status: Complete

- [ ] Images not displaying despite being present in Supabase Storage
  - Images (e.g., 2021-07-30.jpg) exist in the 'ticket-images' bucket and match the expected filenames
  - Frontend does not render these images, even though the data and filenames appear correct
  - Ongoing bug, under investigation

- [x] Fixed off-by-one day bug in date display on year pages
  - Cause: JavaScript `Date` parsing was shifting dates due to local timezone interpretation of `YYYY-MM-DD` strings.
  - Solution: Always parse and display dates as UTC in the frontend, ensuring the date matches exactly what's in Supabase.
  - Date: June 2024
  - Status: Complete

- [x] Removed 1000 ticket limit everywhere by batching all ticket fetches (homepage, admin, year pages, CSV export)
  - All ticket queries now fetch in batches of 1000 and combine results, so the full dataset is always loaded.
  - Date: June 2024
  - Status: Complete

- [x] Fixed CSV upload so it fully clears the Supabase table before inserting new data (no more duplicates/triplicates)
  - Updated delete logic to use .gt('id', -1) and added RLS policy for DELETE to allow this operation.
  - Date: June 2024
  - Status: Complete

### Migration Tasks
- [x] Migrate ticket images to Supabase Storage
- [x] Update ticket data to use Supabase image URLs
- [x] Remove local images directory
- [x] Implement CSV functionality with Supabase Storage
- [x] Update frontend for Supabase database operations
- [x] Implement image upload/retrieval with Supabase Storage

## [1.0.0] - 2024-05-20

### Added
- Initial Vercel deployment
- Supabase integration started
- GitHub repository connected to Vercel

### Changed
- Migrated from local image storage to Supabase Storage
- Updated ticket data structure for Supabase compatibility
- Modified add-ticket endpoint to use Supabase exclusively
- Switched homepage to use getServerSideProps for real-time updates

### Removed
- Local images directory
- Hardcoded Supabase credentials from code
- Local JSON file operations from add-ticket endpoint
- All local JSON file dependencies across the application
- Static page generation in favor of server-side rendering

## Notes
- When marking tasks as completed, include:
  - Date completed
  - Brief description of the solution
  - Any relevant commit hashes or PR numbers
  - Any known limitations or follow-up tasks

- For new issues:
  - Document the error message/behavior
  - List attempted solutions
  - Note any temporary workarounds
  - Track related changes or dependencies 