# Script de déploiement pour plug-certifie
# Ce script redéploie l'application sur Vercel

Write-Host "🚀 Déploiement de plug-certifie sur Vercel..." -ForegroundColor Cyan

# Vérifier que Vercel CLI est installé
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI n'est pas installé. Installation..." -ForegroundColor Red
    npm install -g vercel
}

# Vérifier les variables d'environnement
Write-Host "`n📋 Vérification des variables d'environnement..." -ForegroundColor Yellow
Write-Host "⚠️  Assurez-vous d'avoir configuré ces variables dans Vercel Dashboard :" -ForegroundColor Yellow
Write-Host "   - UPSTASH_REDIS_REST_URL" -ForegroundColor Gray
Write-Host "   - UPSTASH_REDIS_REST_TOKEN" -ForegroundColor Gray
Write-Host "   - UPSTASH_KV_REST_API_URL" -ForegroundColor Gray
Write-Host "   - UPSTASH_KV_REST_API_TOKEN" -ForegroundColor Gray
Write-Host "   - UPSTASH_KV_REST_API_READ_ONLY_TOKEN" -ForegroundColor Gray

$continue = Read-Host "`nContinuer le déploiement ? (O/N)"
if ($continue -ne "O" -and $continue -ne "o") {
    Write-Host "❌ Déploiement annulé." -ForegroundColor Red
    exit 1
}

# Déployer sur Vercel
Write-Host "`n🚀 Déploiement en cours..." -ForegroundColor Cyan
try {
    # Utiliser le token Vercel si disponible dans les variables d'environnement
    if ($env:VERCEL_TOKEN) {
        vercel --token $env:VERCEL_TOKEN --prod --yes
    } else {
        vercel --prod --yes
    }
    Write-Host "`n✅ Déploiement réussi !" -ForegroundColor Green
    Write-Host "🌐 URL : https://plug-certifie.vercel.app" -ForegroundColor Cyan
    
    # Vérifier la configuration
    Write-Host "`n🔍 Vérification de la configuration..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    $response = Invoke-WebRequest -Uri "https://plug-certifie.vercel.app/api/db/config.json?debug=1" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.ok) {
        Write-Host "✅ Configuration vérifiée !" -ForegroundColor Green
        Write-Host "   UPSTASH_REDIS_REST_URL : $($data.env.UPSTASH_REDIS_REST_URL)" -ForegroundColor Gray
        Write-Host "   UPSTASH_REDIS_REST_TOKEN : $($data.env.UPSTASH_REDIS_REST_TOKEN)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Les variables d'environnement ne semblent pas être configurées correctement." -ForegroundColor Yellow
    }
} catch {
    Write-Host "`n❌ Erreur lors du déploiement :" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host "`n✨ Terminé !" -ForegroundColor Green

