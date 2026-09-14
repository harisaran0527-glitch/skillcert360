$routes = @('/admin/login','/student/login','/student/skills','/admin/dashboard','/admin/students','/admin/courses')
foreach ($route in $routes) {
    $url = 'https://skillcert360.vercel.app' + $route
    try {
        $start = Get-Date
        $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
        $ms = [math]::Round(((Get-Date) - $start).TotalMilliseconds)
        $kb = [math]::Round($resp.RawContent.Length / 1024)
        Write-Host "OK $route ${ms}ms ${kb}KB"
    } catch {
        Write-Host "ERR $route $_"
    }
    Start-Sleep -Milliseconds 300
}
# warm second pass
Write-Host "--- WARM PASS ---"
foreach ($route in $routes) {
    $url = 'https://skillcert360.vercel.app' + $route
    try {
        $start = Get-Date
        $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
        $ms = [math]::Round(((Get-Date) - $start).TotalMilliseconds)
        $kb = [math]::Round($resp.RawContent.Length / 1024)
        Write-Host "OK $route ${ms}ms ${kb}KB"
    } catch {
        Write-Host "ERR $route $_"
    }
    Start-Sleep -Milliseconds 300
}
