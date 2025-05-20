# Changelog

All notable changes, issues, and fixes for the Paul Phish Tickets project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Current Issues
- CSV upload functionality not working
  - Error: "Method not allowed" and "Error inserting tickets into Supabase"
  - Attempted fixes:
    * Added better error handling and logging
    * Updated CSV parsing to handle multiple column name formats
    * Removed next-connect dependency in favor of native Next.js API routes
    * Enhanced error reporting with detailed Supabase error messages
    * Added batch processing information to error output
    * Improved frontend error display with structured messages
    * Added Supabase connection testing and detailed logging
    * Added favicon to resolve 404 error
  - Next steps:
    * Verify Supabase environment variables in Vercel
    * Test CSV upload with enhanced logging
    * Monitor Supabase connection status

### In Progress
- [ ] Debug and fix CSV upload functionality
- [ ] Implement image upload/retrieval with Supabase Storage

### Completed
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

### Migration Tasks
- [x] Migrate ticket images to Supabase Storage
- [x] Update ticket data to use Supabase image URLs
- [x] Remove local images directory
- [x] Implement CSV functionality with Supabase Storage
- [x] Update frontend for Supabase database operations
- [ ] Implement image upload/retrieval with Supabase Storage

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