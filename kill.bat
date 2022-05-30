set /p pid=<logs\nginx.pid
taskkill /F /T /PID %pid%