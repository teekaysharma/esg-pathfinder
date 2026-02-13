Param(
  [string]$DbHost = "localhost",
  [int]$DbPort = 5432,
  [string]$DbName = "esg_pathfinder",
  [string]$DbUser = "esg_user",
  [string]$DbPassword = "esg_password",
  [string]$AdminUser = "postgres",
  [string]$AdminDatabase = "postgres",
  [switch]$SkipDev
)

$ErrorActionPreference = "Stop"

function Write-Step($msg) {
  Write-Host "`n==> $msg" -ForegroundColor Cyan
}

function Assert-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $name. Please install it and re-run this script."
  }
}

function New-SecretValue {
  $guidA = [guid]::NewGuid().ToString("N")
  $guidB = [guid]::NewGuid().ToString("N")
  return "$guidA$guidB"
}

Write-Step "Checking requirements"
Assert-Command "node"
Assert-Command "npm"
Assert-Command "psql"

$nodeVersion = (node --version)
$npmVersion = (npm --version)
$psqlVersion = (psql --version)
Write-Host "Node: $nodeVersion"
Write-Host "npm: $npmVersion"
Write-Host "psql: $psqlVersion"

Write-Step "Preparing environment files"
$jwtSecret = New-SecretValue
$nextAuthSecret = New-SecretValue
$dbUrl = "postgresql://${DbUser}:${DbPassword}@${DbHost}:${DbPort}/${DbName}?schema=public"

$envTemplate = @"
DATABASE_URL=\"$dbUrl\"
JWT_SECRET=\"$jwtSecret\"
JWT_EXPIRES_IN=\"24h\"
NEXTAUTH_SECRET=\"$nextAuthSecret\"
NEXTAUTH_URL=\"http://localhost:5000\"
NODE_ENV=\"development\"
PORT=\"5000\"
CORS_ORIGIN=\"http://localhost:5000,http://localhost:3000\"
Z_AI_API_KEY=\"\"
Z_AI_BASE_URL=\"https://api.z-ai.dev\"
"@

Set-Content -Path ".env" -Value $envTemplate -NoNewline
Set-Content -Path ".env.local" -Value $envTemplate -NoNewline
Write-Host "Created/updated .env and .env.local"

Write-Step "Provisioning PostgreSQL role and database"
if (-not $env:PGPASSWORD) {
  Write-Host "PGPASSWORD is not set. If your postgres admin user requires a password, set PGPASSWORD and re-run if this step fails." -ForegroundColor Yellow
}

$createRoleSql = @"
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DbUser') THEN
    CREATE ROLE $DbUser LOGIN PASSWORD '$DbPassword';
  ELSE
    ALTER ROLE $DbUser WITH LOGIN PASSWORD '$DbPassword';
  END IF;
END
$$;
"@

$grantSql = "GRANT ALL PRIVILEGES ON DATABASE $DbName TO $DbUser;"

psql -h $DbHost -p $DbPort -U $AdminUser -d $AdminDatabase -v ON_ERROR_STOP=1 -c $createRoleSql

$dbExists = (psql -h $DbHost -p $DbPort -U $AdminUser -d $AdminDatabase -tAc "SELECT 1 FROM pg_database WHERE datname = '$DbName'").Trim()
if ($dbExists -ne "1") {
  Write-Host "Creating database '$DbName' owned by '$DbUser'"
  psql -h $DbHost -p $DbPort -U $AdminUser -d $AdminDatabase -v ON_ERROR_STOP=1 -c "CREATE DATABASE $DbName OWNER $DbUser;"
} else {
  Write-Host "Database '$DbName' already exists"
}

psql -h $DbHost -p $DbPort -U $AdminUser -d $AdminDatabase -v ON_ERROR_STOP=1 -c $grantSql

Write-Step "Installing npm dependencies"
npm install

Write-Step "Applying Prisma schema"
npm run db:push

Write-Step "Seeding default admin user"
npx tsx seed-admin.ts

Write-Host "`nBootstrap complete." -ForegroundColor Green
Write-Host "Login: admin@esgpathfinder.com / Admin123!" -ForegroundColor Green

if (-not $SkipDev) {
  Write-Step "Starting development server"
  npm run dev
} else {
  Write-Host "Run 'npm run dev' when ready." -ForegroundColor Yellow
}
