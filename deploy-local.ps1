# ═══════════════════════════════════════════════════════════════════════════════
# PROGITPAIE — Script de Déploiement Local Docker PowerShell (Windows) 🚀
# ═══════════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "🚀 Démarrage du Déploiement Local Docker PROGITPAIE..." -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Vérification du fichier .env
if (-not (Test-Path ".env")) {
    Write-Host "❌ Le fichier .env est requis. Copiez .env.example puis renseignez vos variables." -ForegroundColor Red
    exit 1
}

# 2. Préparation et Build Local
Write-Host "🔨 1/6 Préparation des artefacts (Prisma, Next.js Standalone, Rotation TS)..." -ForegroundColor Yellow
pnpm prisma:generate
pnpm build
pnpm exec tsc --project tsconfig.rotation.json

# 3. Déréférencement des liens symboliques pour Docker
Write-Host "🔗 2/6 Préparation et déréférencement du standalone pour Docker..." -ForegroundColor Yellow
node scripts/prepare-standalone.js

# 4. Construction des conteneurs Docker
Write-Host "🏗️ 3/6 Construction des conteneurs Docker..." -ForegroundColor Yellow
docker compose build

# 5. Redémarrage des conteneurs
Write-Host "🔄 4/6 Démarrage des conteneurs PROGITPAIE..." -ForegroundColor Yellow
docker compose down
docker compose up -d

# 6. Attente que PostgreSQL soit prêt
Write-Host "⏳ 5/6 Attente de PostgreSQL..." -ForegroundColor Yellow
$postgresReady = $false
for ($i = 1; $i -le 15; $i++) {
    $check = docker exec progitpaie-postgres pg_isready -U progitpaie 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL est prêt !" -ForegroundColor Green
        $postgresReady = $true
        break
    }
    Start-Sleep -Seconds 2
}

if (-not $postgresReady) {
    Write-Host "❌ PostgreSQL n'a pas répondu dans les temps." -ForegroundColor Red
    exit 1
}

# 7. Application des migrations Prisma depuis l'hôte
Write-Host "🗄️ 6/6 Application des migrations Prisma..." -ForegroundColor Yellow
$env:DATABASE_URL = "postgresql://progitpaie:progitpaie_pass_2026@127.0.0.1:5433/progitpaie?schema=public"
pnpm exec prisma migrate deploy --schema=prisma/schema

Write-Host "=================================================================" -ForegroundColor Green
Write-Host "✅ Déploiement local Docker terminé avec succès !" -ForegroundColor Green
Write-Host "🌐 Application disponible sur : http://localhost:3000" -ForegroundColor Cyan
Write-Host "🏥 Endpoint de santé : http://localhost:3000/api/health" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Green
