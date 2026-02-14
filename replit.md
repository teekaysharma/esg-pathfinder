# ESG Pathfinder

## Overview
ESG Pathfinder is a Next.js application that helps companies transform ESG (Environmental, Social, and Governance) compliance with AI. It ingests company scope, maps applicable regulations, and produces audit-ready ESG reports.

## Key Features
- Smart Scope Analysis: Convert fuzzy input to structured ESG terms
- Regulatory Mapping: Auto-map to GRI, SASB, IFRS, BRSR standards
- Materiality Analysis: Interactive matrix with scoring
- Evidence Management: Upload & tag supporting documents

## Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Custom Next.js server with Socket.IO for real-time features
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: next-auth with JWT

## Project Structure
```
/
├── src/
│   ├── app/          # Next.js app router pages and API routes
│   ├── components/   # React components (UI, shared)
│   ├── contexts/     # React contexts
│   ├── hooks/        # Custom React hooks
│   └── lib/          # Utility libraries (auth, db, validation)
├── prisma/           # Database schema and migrations
├── public/           # Static assets
└── server.ts         # Custom server with Socket.IO
```

## Running the Application
- **Development**: `npm run dev` - Runs on port 5000
- **Production**: `npm run build && npm run start`

## Database Commands
- `npm run db:push` - Push schema to database
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run migrations

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (provided by Replit)

## User Preferences
- TypeScript strict mode with build errors ignored
- ESLint errors ignored during builds
- Tailwind CSS for styling

## Recent Changes
- Migrated from SQLite to PostgreSQL for Replit environment
- Updated server to run on port 5000
- Configured Next.js to allow all dev origins for Replit proxy
