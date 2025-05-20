# Changelog

All notable changes, issues, and fixes for the Paul Phish Tickets project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Current Issues
- [ ] API Routes returning 404 errors in production (Vercel)
  - Attempted: Renamed test_supabase.js to test-supabase.js
  - Attempted: Created simplified supabase-test.js endpoint
  - Next Steps: Check Vercel build logs and Next.js configuration

- [ ] Add Ticket functionality not working
  - Error: 500 Internal Server Error on POST to /api/add-ticket
  - Attempted: Enhanced error logging in add-ticket.js
  - Attempted: Removed hardcoded Supabase credentials
  - Next Steps: Debug Supabase connection and credentials

### In Progress
- [ ] Vercel-Supabase Integration
  - Status: Environment variables configured but connection issues persist
  - Need to verify: Supabase credentials and permissions
  - Need to verify: Vercel project settings and environment variables

### Completed
- [x] Set up auto-deployment from GitHub to Vercel
  - Fixed by: Reconnecting GitHub repository in Vercel dashboard
  - Date: May 20, 2024

### Migration Tasks
- [x] Migrate ticket images to Supabase Storage
- [x] Update ticket data to use Supabase image URLs
- [x] Remove local images directory
- [ ] Implement CSV functionality with Supabase Storage
- [ ] Implement image upload/retrieval with Supabase Storage
- [ ] Update frontend for Supabase database operations

## [1.0.0] - 2024-05-20

### Added
- Initial Vercel deployment
- Supabase integration started
- GitHub repository connected to Vercel

### Changed
- Migrated from local image storage to Supabase Storage
- Updated ticket data structure for Supabase compatibility

### Removed
- Local images directory
- Hardcoded Supabase credentials from code

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