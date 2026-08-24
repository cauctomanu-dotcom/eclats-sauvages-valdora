param(
    [string]$RepositoryUrl = "",
    [string]$Message = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

function Find-Git {
    $command = Get-Command git -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }

    $candidates = @(
        "$env:ProgramFiles\Git\cmd\git.exe",
        "${env:ProgramFiles(x86)}\Git\cmd\git.exe",
        "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe",
        "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
    )
    foreach ($candidate in $candidates) {
        if ($candidate -and (Test-Path -LiteralPath $candidate)) { return $candidate }
    }
    return $null
}

function Invoke-Git {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)
    & $script:GitExe -C $script:RepoRoot @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "La commande Git a échoué : git $($Arguments -join ' ')"
    }
}

function Get-GitValue {
    param([string[]]$Arguments)
    $value = & $script:GitExe -C $script:RepoRoot @Arguments 2>$null
    if ($LASTEXITCODE -ne 0) { return "" }
    return ($value -join "`n").Trim()
}

$GitExe = Find-Git
if (-not $GitExe) {
    Write-Host "Git est introuvable." -ForegroundColor Red
    Write-Host "Installe Git for Windows ou GitHub Desktop, puis relance ce fichier."
    exit 1
}

Write-Host ""
Write-Host "ÉCLATS SAUVAGES — VALDORA V118" -ForegroundColor Cyan
Write-Host "Publication complète du dépôt GitHub" -ForegroundColor Cyan
Write-Host "Dossier : $RepoRoot"
Write-Host "Git : $GitExe"
Write-Host ""

if ([string]::IsNullOrWhiteSpace($RepositoryUrl)) {
    $RepositoryUrl = Read-Host "Colle l'adresse HTTPS ou SSH du dépôt GitHub vide"
}
$RepositoryUrl = $RepositoryUrl.Trim().Trim('"')
$validHttps = $RepositoryUrl -match '^https://github\.com/[^/\s]+/[^/\s]+(?:\.git)?$'
$validSsh = $RepositoryUrl -match '^git@github\.com:[^/\s]+/[^/\s]+(?:\.git)?$'
if (-not ($validHttps -or $validSsh)) {
    throw "L'adresse fournie n'est pas une adresse de dépôt GitHub reconnue."
}

Push-Location $RepoRoot
try {
    if (-not (Test-Path -LiteralPath (Join-Path $RepoRoot '.git'))) {
        Invoke-Git init -b main
    }

    Invoke-Git config core.longpaths true
    Invoke-Git config core.quotepath false

    $authorName = Get-GitValue @('config', '--get', 'user.name')
    if ([string]::IsNullOrWhiteSpace($authorName)) {
        $authorName = Read-Host "Nom d'auteur à inscrire dans les commits"
        if ([string]::IsNullOrWhiteSpace($authorName)) { throw "Le nom d'auteur est obligatoire." }
        Invoke-Git config user.name $authorName
    }

    $authorEmail = Get-GitValue @('config', '--get', 'user.email')
    if ([string]::IsNullOrWhiteSpace($authorEmail)) {
        $authorEmail = Read-Host "Adresse Git ou adresse GitHub noreply pour les commits"
        if ([string]::IsNullOrWhiteSpace($authorEmail)) { throw "L'adresse de commit est obligatoire." }
        Invoke-Git config user.email $authorEmail
    }

    Invoke-Git add --all
    & $GitExe -C $RepoRoot diff --cached --quiet
    $hasChanges = $LASTEXITCODE -ne 0
    if ($hasChanges) {
        if ([string]::IsNullOrWhiteSpace($Message)) {
            $Message = Read-Host "Message du commit [Publication de Valdora V118]"
            if ([string]::IsNullOrWhiteSpace($Message)) { $Message = "Publication de Valdora V118" }
        }
        Invoke-Git commit -m $Message
    } else {
        Write-Host "Aucun fichier modifié à enregistrer." -ForegroundColor Yellow
    }

    Invoke-Git branch -M main
    $origin = Get-GitValue @('remote', 'get-url', 'origin')
    if ([string]::IsNullOrWhiteSpace($origin)) {
        Invoke-Git remote add origin $RepositoryUrl
    } elseif ($origin -ne $RepositoryUrl) {
        Write-Host "Le dépôt actuel utilise : $origin" -ForegroundColor Yellow
        $answer = Read-Host "Remplacer cette adresse par $RepositoryUrl ? [o/N]"
        if ($answer -notmatch '^(o|oui|y|yes)$') { throw "Publication annulée : l'adresse distante n'a pas été modifiée." }
        Invoke-Git remote set-url origin $RepositoryUrl
    }

    Write-Host ""
    Write-Host "Envoi des fichiers vers GitHub…" -ForegroundColor Cyan
    Write-Host "Le premier envoi peut durer plusieurs minutes."
    Invoke-Git push -u origin main

    Write-Host ""
    Write-Host "Publication terminée." -ForegroundColor Green
    Write-Host "Pour jouer en ligne : Settings → Pages → Source : GitHub Actions."
    Write-Host "Le déploiement sera ensuite visible dans l'onglet Actions."
} finally {
    Pop-Location
}
