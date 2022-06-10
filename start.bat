if not exist logs (
md logs
)
start http://localhost:12077/
openresty\nginx -c openresty\conf\nginx.conf