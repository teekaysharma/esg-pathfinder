Param(
  [string]$DbHost = "localhost",
  [int]$DbPort = 5432,
  [string]$DbName = "esg_pathfinder",
  [string]$DbUser = "esg_user",
  [string]$DbPassword = "esg_password",
  [string]$AdminUser = "postgres",
  [string]$AdminDatabase = "postgres",
  [switch]$SkipDev,
  [switch]$ForceRewriteEnv
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

function Upsert-EnvFile($filePath, $values, $forceRewrite) {
  $lines = @()
  if ((Test-Path $filePath) -and -not $forceRewrite) {
    $lines = Get-Content $filePath
  }

  $map = @{}
  foreach ($line in $lines) {
    if ($line -match '^\s*#' -or -not ($line -match '=')) {
      continue
    }
    $parts = $line -split '=', 2
    $key = $parts[0].Trim()
    if ($key) { $map[$key] = $parts[1] }
  }

  foreach ($k in $values.Keys) {
    $v = '"' + $values[$k] + '"'
    $map[$k] = $v
  }

  $orderedKeys = @(
    'DATABASE_URL','JWT_SECRET','JWT_EXPIRES_IN','NEXTAUTH_SECRET','NEXTAUTH_URL',
    'NODE_ENV','PORT','CORS_ORIGIN','Z_AI_API_KEY','Z_AI_BASE_URL'
  )

  $out = @()
  foreach ($k in $orderedKeys) {
    if ($map.ContainsKey($k)) {
      $out += "$k=$($map[$k])"
      $null = $map.Remove($k)
    }
  }

  foreach ($k in ($map.Keys | Sort-Object)) {
    $out += "$k=$($map[$k])"
  }

  Set-Content -Path $filePath -Value ($out -join "`n") -NoNewline
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
$dbUrl = "postgresql://${DbUser}:${DbPassword}@${DbHost}:${DbPort}/${DbName}?schema=public"

$jwtSecret = if ($ForceRewriteEnv -or -not (Test-Path '.env')) { New-SecretValue } else { '' }
$nextAuthSecret = if ($ForceRewriteEnv -or -not (Test-Path '.env')) { New-SecretValue } else { '' }

$baseValues = @{
  DATABASE_URL = $dbUrl
  JWT_EXPIRES_IN = '24h'
  NEXTAUTH_URL = 'http://localhost:5000'
  NODE_ENV = 'development'
  PORT = '5000'
  CORS_ORIGIN = 'http://localhost:5000,http://localhost:3000'
  Z_AI_API_KEY = ''
  Z_AI_BASE_URL = 'https://api.z-ai.dev'
}

$envValues = @{}
foreach ($entry in $baseValues.GetEnumerator()) { $envValues[$entry.Key] = $entry.Value }

if ($jwtSecret) { $envValues['JWT_SECRET'] = $jwtSecret }
if ($nextAuthSecret) { $envValues['NEXTAUTH_SECRET'] = $nextAuthSecret }

Upsert-EnvFile '.env' $envValues $ForceRewriteEnv
Upsert-EnvFile '.env.local' $envValues $ForceRewriteEnv
Write-Host "Updated .env and .env.local (existing secrets preserved unless -ForceRewriteEnv is set)"

Write-Step "Validating PostgreSQL admin connectivity"
if (-not $env:PGPASSWORD) {
  Write-Host "PGPASSWORD is not set. If your postgres admin user requires a password, set PGPASSWORD and re-run if this step fails." -ForegroundColor Yellow
}

try {
  psql -h $DbHost -p $DbPort -U $AdminUser -d $AdminDatabase -v ON_ERROR_STOP=1 -c "SELECT version();" | Out-Null
  Write-Host "PostgreSQL connection OK ($AdminUser@$DbHost:$DbPort/$AdminDatabase)"
} catch {
  Write-Host "Failed to connect to PostgreSQL as admin user '$AdminUser'." -ForegroundColor Red
  Write-Host "Tips:" -ForegroundColor Yellow
  Write-Host " - Verify PostgreSQL service is running"
  Write-Host " - Verify host/port/admin database are correct"
  Write-Host " - Set PGPASSWORD if password auth is required"
  throw
}

Write-Step "Provisioning PostgreSQL role and database"
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
