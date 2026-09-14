$routes = @('/','/student/login','/admin/login','/student/skills','/admin/dashboard','/admin/students','/admin/courses')
Write-Host "--- COLD / FIRST PASS ---"
foreach ($route in $routes) {
    $url = 'https://skillcert360.vercel.app' + $route
    try {
        $start = Get-Date
        $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
        $ms = [math]::Round(((Get-Date) - $start).TotalMilliseconds)
        $status = $resp.StatusCode
        Write-Host "COLD $route HTTP $status ${ms}ms"
    } catch {
        Write-Host "ERR $route $_"
    }
    Start-Sleep -Milliseconds 200
}

Write-Host "--- WARM SECOND PASS ---"
foreach ($route in $routes) {
    $url = 'https://skillcert360.vercel.app' + $route
    try {
        $start = Get-Date
        $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
        $ms = [math]::Round(((Get-Date) - $start).TotalMilliseconds)
        $status = $resp.StatusCode
        Write-Host "WARM $route HTTP $status ${ms}ms"
    } catch {
        Write-Host "ERR $route $_"
    }
    Start-Sleep -Milliseconds 200
}
