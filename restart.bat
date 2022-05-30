set /p pid=<logs\nginx.pid
taskkill /F /T /PID %pid%
openresty\nginx -c openresty\conf\nginx.conf