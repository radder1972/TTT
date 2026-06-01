# ==========================================================================
# True Time Thai - Direct GitHub Upload Automation Script
# Uses the GitHub REST API to upload files without needing a Git installation!
# ==========================================================================

$Owner = "radder1972"
$Repo = "TTT"
$Branch = "main"
$TokenFile = Join-Path $PSScriptRoot ".github_token"

# Clean UI header
Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "     TRUE TIME THAI - GITHUB DIRECT UPLOAD AUTOMATION     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Get Token
$Token = ""
if (Test-Path $TokenFile) {
    $Token = Get-Content $TokenFile -Raw
    $Token = $Token.Trim()
    Write-Host "[✓] GitHub Token geladen uit lokaal bestand." -ForegroundColor Green
} else {
    Write-Host "Er is geen opgeslagen token gevonden." -ForegroundColor Yellow
    Write-Host "U heeft een GitHub Personal Access Token (PAT) nodig met 'repo' rechten." -ForegroundColor Yellow
    Write-Host "U kunt er een aanmaken op: https://github.com/settings/tokens" -ForegroundColor Yellow
    Write-Host ""
    $Token = Read-Host -Prompt "Plak uw GitHub Personal Access Token (PAT) hier"
    
    if (-not $Token) {
        Write-Error "Fout: GitHub Token mag niet leeg zijn!"
        Exit
    }
    
    $Token = $Token.Trim()
    # Save for future runs
    $Token | Out-File -FilePath $TokenFile -NoNewline -Force
    Write-Host "[✓] Token veilig lokaal opgeslagen in .github_token." -ForegroundColor Green
}

$Headers = @{
    "Authorization" = "token $Token"
    "Accept"        = "application/vnd.github.v3+json"
    "User-Agent"    = "TrueTimeThai-Uploader"
}

# Files to sync
$FilesToSync = @(
    "index.html",
    "styles.css",
    "app.js",
    "assets/hero-experience.jpg",
    "assets/hero-restaurant.jpg",
    "assets/logo.png"
)

Write-Host ""
Write-Host "Start upload naar repository: $Owner/$Repo op branch: $Branch..." -ForegroundColor Cyan
Write-Host "----------------------------------------------------------" -ForegroundColor Gray

foreach ($RelativePath in $FilesToSync) {
    $LocalPath = Join-Path $PSScriptRoot $RelativePath
    if (-not (Test-Path $LocalPath)) {
        Write-Host "[-] Overslaan: $RelativePath (lokaal niet gevonden)" -ForegroundColor Yellow
        continue
    }

    Write-Host "[...] Uploaden: $RelativePath..." -ForegroundColor Gray -NoNewline

    # Read local file content and convert to Base64 (supporting both text and binary images!)
    try {
        $Bytes = [System.IO.File]::ReadAllBytes($LocalPath)
        $Base64Content = [Convert]::ToBase64String($Bytes)
    } catch {
        Write-Host "`r[X] Fout bij inlezen van lokaal bestand $RelativePath" -ForegroundColor Red
        continue
    }

    # GitHub API URL
    $ApiUrl = "https://api.github.com/repos/$Owner/$Repo/contents/$RelativePath"

    # 1. Check if file exists in repo to get its SHA
    $Sha = $null
    try {
        $FileMetadata = Invoke-RestMethod -Uri $ApiUrl -Method GET -Headers $Headers -ErrorAction Stop
        $Sha = $FileMetadata.sha
    } catch {
        # File doesn't exist yet in the repo, which is fine (SHA remains null)
    }

    # 2. Prepare payload
    $Body = @{
        message = "Automated True Time Thai update: $RelativePath"
        content = $Base64Content
        branch  = $Branch
    }
    if ($Sha) {
        $Body.sha = $Sha
    }
    $JsonBody = ConvertTo-Json -InputObject $Body -Depth 10

    # 3. PUT request to create/update file
    try {
        $Response = Invoke-RestMethod -Uri $ApiUrl -Method PUT -Headers $Headers -Body $JsonBody -ContentType "application/json" -ErrorAction Stop
        Write-Host "`r[✓] Succesvol: $RelativePath" -ForegroundColor Green
    } catch {
        $ErrorMessage = $_.Exception.Message
        Write-Host "`r[X] Fout bij uploaden $RelativePath : $ErrorMessage" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "      COMPLETED! UW SITE WORDT AUTOMATISCH DEPLOYED       " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Binnen 1-2 minuten is uw nieuwe design live op Vercel!" -ForegroundColor Green
Write-Host ""
pause
