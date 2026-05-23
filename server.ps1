# Robust Local HTTP Server for NutriForge AI
# Runs on http://localhost:8080

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:8080/')

try {
    $listener.Start()
    Write-Host '--------------------------------------------------'
    Write-Host 'Server successfully started on http://localhost:8080'
    Write-Host 'Open this URL in your web browser to use NutriForge.'
    Write-Host 'Press Ctrl+C in this console to stop the server.'
    Write-Host '--------------------------------------------------'
} catch {
    Write-Error "Failed to start HttpListener. Make sure port 8080 is not already in use by another app."
    Exit
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $urlPath = $request.Url.LocalPath
        $localPath = Join-Path 'c:\Users\asesh\Desktop\nn' ($urlPath.TrimStart('/'))
        
        if ($urlPath -eq '/') {
            $localPath = 'c:\Users\asesh\Desktop\nn\index.html'
        }
        
        # Log the incoming request
        Write-Host ("[{0}] {1} {2}" -f (Get-Date -Format 'HH:mm:ss'), $request.HttpMethod, $urlPath) -NoNewline


        if (Test-Path $localPath -PathType Leaf) {
            try {
                $content = [System.IO.File]::ReadAllBytes($localPath)
                $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
                
                $mime = switch ($ext) {
                    '.html' {'text/html; charset=utf-8'}
                    '.css'  {'text/css; charset=utf-8'}
                    '.js'   {'application/javascript; charset=utf-8'}
                    '.png'  {'image/png'}
                    '.jpg'  {'image/jpeg'}
                    '.jpeg' {'image/jpeg'}
                    '.json' {'application/json; charset=utf-8'}
                    '.svg'  {'image/svg+xml'}
                    default {'application/octet-stream'}
                }
                
                $response.ContentType = $mime
                $response.ContentLength64 = $content.Length
                $response.OutputStream.Write($content, 0, $content.Length)
                $response.StatusCode = 200
                Write-Host " - 200 OK" -ForegroundColor Green
            } catch {
                $response.StatusCode = 500
                $errMsg = [System.Text.Encoding]::UTF8.GetBytes("500 Internal Server Error: $($_.Exception.Message)")
                $response.ContentType = "text/plain"
                $response.ContentLength64 = $errMsg.Length
                $response.OutputStream.Write($errMsg, 0, $errMsg.Length)
                Write-Host " - 500 Internal Server Error ($($_.Exception.Message))" -ForegroundColor Red
            }
        } else {
            $response.StatusCode = 404
            $notFoundMsg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.ContentType = "text/plain"
            $response.ContentLength64 = $notFoundMsg.Length
            $response.OutputStream.Write($notFoundMsg, 0, $notFoundMsg.Length)
            Write-Host " - 404 Not Found" -ForegroundColor Yellow
        }
    } catch {
        # Catch any request processing errors outside of normal file reads
        Write-Host " - Request processing failed: $($_.Exception.Message)" -ForegroundColor Red
    } finally {
        if ($null -ne $response) {
            try {
                $response.Close()
            } catch {}
        }
    }
}
