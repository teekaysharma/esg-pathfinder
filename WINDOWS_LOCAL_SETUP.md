# Windows Local Setup (No Docker)

Use this when PostgreSQL and npm are already installed on your Windows machine.

## 1) Download from GitHub branch
- Open the target branch on GitHub.
- Click **Code** → **Download ZIP**.
- Extract ZIP to a local folder.

## 2) Open PowerShell in project root
Run one of:

```powershell
# easiest: double-click start.bat or run it from cmd
.\start.bat

# or run npm bootstrap directly
npm run bootstrap:windows
```

## What this bootstrap does
- Checks `node`, `npm`, and `psql`
- Writes `.env` and `.env.local`
- Creates or updates role/database in PostgreSQL
- Runs `npm install`
- Runs `npm run db:push`
- Runs `npx tsx seed-admin.ts`
- Starts app with `npm run dev`

## Credentials after setup
- Email: `admin@esgpathfinder.com`
- Password: `Admin123!`

## Optional usage
```powershell
# Bootstrap only (don't start dev server)
npm run bootstrap:windows:skipdev

# Direct script call with custom DB settings
powershell -ExecutionPolicy Bypass -File scripts/windows/bootstrap-local.ps1 `
  -DbHost localhost -DbPort 5432 -DbName esg_pathfinder -DbUser esg_user -DbPassword esg_password -AdminUser postgres
```

## Note about PostgreSQL admin password
If your local PostgreSQL admin user needs a password, set `PGPASSWORD` first:

```powershell
$env:PGPASSWORD = "<postgres-admin-password>"
npm run bootstrap:windows
```
