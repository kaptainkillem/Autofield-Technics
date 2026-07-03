Write-Host "--- Mechanic Website Docker Control ---" -ForegroundColor Green

# 1. Basic Docker Check
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker not found!" -ForegroundColor Red
    return
}

# 2. Simple Menu
Write-Host "1. Start Dev"
Write-Host "2. Build"
Write-Host "3. Stop"
Write-Host "4. Logs"
Write-Host "5. Exit"

$choice = Read-Host "Choice"

if ($choice -eq "1") {
    docker compose up -d
    Write-Host "Started at http://localhost:3000" -ForegroundColor Green
}
elseif ($choice -eq "2") {
    docker compose build
}
elseif ($choice -eq "3") {
    docker compose down
}
elseif ($choice -eq "4") {
    docker compose logs -f
}
elseif ($choice -eq "5") {
    exit
}
else {
    Write-Host "Invalid choice"
}