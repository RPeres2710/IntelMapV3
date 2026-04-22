$ErrorActionPreference = 'Stop'

Set-StrictMode -Version Latest

param(
  [switch]$NoNewWindows
)

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $repoRoot

function Start-NodeServerWindow([string]$title, [string]$scriptPath) {
  $cmd = @(
    "`$Host.UI.RawUI.WindowTitle = '$title';",
    "Set-Location -LiteralPath '$repoRoot';",
    "node '$scriptPath'"
  ) -join ' '

  Start-Process -FilePath "powershell.exe" -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", $cmd
  ) | Out-Null
}

function Start-NodeServerNoWindow([string]$scriptPath, [string]$logPath) {
  $p = Start-Process -FilePath "node" -ArgumentList @("$scriptPath") -NoNewWindow -PassThru `
    -RedirectStandardOutput $logPath -RedirectStandardError $logPath
  return $p
}

Write-Host ""
Write-Host "== Proxies locais ==" -ForegroundColor Cyan
Write-Host "- Geocode:  http://127.0.0.1:8787/health"
Write-Host "- MOVI:     http://127.0.0.1:8790/health"
Write-Host ""
Write-Host "Obs.: Para o MOVI-ALERT, defina variáveis de ambiente antes de iniciar (recomendado):" -ForegroundColor Yellow
Write-Host "  `$env:MOVI_ALERT_USER='seu_email'" -ForegroundColor Yellow
Write-Host "  `$env:MOVI_ALERT_PASS='sua_senha'" -ForegroundColor Yellow
Write-Host ""

if ($NoNewWindows) {
  $geocodeLog = Join-Path $repoRoot 'geocode-proxy.log'
  $moviLog = Join-Path $repoRoot 'movi-alert-proxy.log'

  Write-Host "Iniciando em background (logs em arquivos)..." -ForegroundColor Cyan
  $p1 = Start-NodeServerNoWindow -scriptPath 'geocode-proxy.js' -logPath $geocodeLog
  $p2 = Start-NodeServerNoWindow -scriptPath 'movi-alert-proxy.js' -logPath $moviLog

  Write-Host "OK. PIDs: geocode=$($p1.Id), movi=$($p2.Id)"
  Write-Host "Logs:"
  Write-Host "- $geocodeLog"
  Write-Host "- $moviLog"
  Write-Host ""
  Write-Host "Para parar, finalize os processos (Task Manager) ou use:" -ForegroundColor Yellow
  Write-Host "  Stop-Process -Id $($p1.Id),$($p2.Id)" -ForegroundColor Yellow
  exit 0
}

Write-Host "Abrindo 2 janelas do PowerShell com os servidores..." -ForegroundColor Cyan
Start-NodeServerWindow -title 'Geocode Proxy (8787)' -scriptPath 'geocode-proxy.js'
Start-NodeServerWindow -title 'MOVI-ALERT Proxy (8790)' -scriptPath 'movi-alert-proxy.js'

Write-Host "OK. Verifique os endpoints /health nas janelas abertas."

