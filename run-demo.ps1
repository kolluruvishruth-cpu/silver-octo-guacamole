$env:SPRING_PROFILES_ACTIVE='local'
$env:DEMO_DATA='true'
if (-not $env:ADMIN_EMAIL) { $env:ADMIN_EMAIL='admin@campus.test' }
if (-not $env:ADMIN_PASSWORD) { $env:ADMIN_PASSWORD='CampusAdmin!2026' }
$maven = if (Get-Command mvn -ErrorAction SilentlyContinue) { 'mvn' } else { Join-Path $PSScriptRoot 'tools/apache-maven-3.9.9/bin/mvn.cmd' }
& $maven spring-boot:run
