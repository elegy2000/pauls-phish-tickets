# Paul's Phish Tickets Data Directory

This directory contains ticket data for the Phish Tickets website. The files in this directory are:

- `tickets.json`: The main data file containing ticket information. This file is used by the website to display ticket information. It is updated when a new CSV file is uploaded through the admin interface.

## Data Structure

The `tickets.json` file has the following structure:

```json
{
  "years": [2024, 2023, 2022, ...],
  "tickets": [
    {
      "year": 2024,
      "date": "07/30/2024",
      "venue": "Chaifetz Arena",
      "city_state": "St. Louis, MO",
      "imageUrl": "/images/2024-07-30-chaifetz-arena.jpg",
      "net_link": "https://phish.in/2024-07-30"
    },
    ...
  ]
}
```

## Syncing Data

This data is synced from the live Vercel deployment using the `sync-vercel` script. This ensures that any changes made through the admin interface are preserved in the Git repository and will persist between deployments.

To sync the data, run:

```bash
npm run sync-vercel
```

See the `VERCEL_SYNC_INSTRUCTIONS.md` file in the root directory for more information. 