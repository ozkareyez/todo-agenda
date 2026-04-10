# AGENTS.md

## Setup

```bash
npm run install:all   # Install all workspaces
```

## Commands

```bash
npm run dev           # Run both frontend + backend concurrently
npm run dev:frontend # Frontend only (Next.js: localhost:3000)
npm run dev:backend  # Backend only (Express: localhost:3001)
npm run build       # Build frontend only
npm run lint       # Lint frontend (cd frontend && npm run lint)
```

## Architecture

- **Monorepo**: npm workspaces with `frontend/` and `backend/`
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Express, TypeScript, runs on port 3001

## Notes

- Backend has no tests configured
- Data stored in Google Sheets (two sheets: "Clientes", "Servicios")
- Offline support via localStorage cache
- PWA enabled for mobile use
- Excel export via xlsx library

## Google Sheets Setup

Create `.env.local` in `frontend/`:
```
NEXT_PUBLIC_SPREADSHEET_ID=your_spreadsheet_id
NEXT_PUBLIC_GOOGLE_API_KEY=your_api_key
```

Sheet structure:
- **Clientes**: ID, Name, Address, Phone, CreatedAt
- **Servicios**: ID, ClientId, Name, Price, Date, Time, ReminderSent

Sheet must be shared as "Anyone with the link can edit" or use API key with public sheet.