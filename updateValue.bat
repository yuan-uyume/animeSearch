set urlbase=https://raw.fastgit.org/dakerj/animeSearch/master/
set download=aria2\aria2c
echo 开始删除旧文件...
del /f/q  html\rem\*.*
del /f openresty\conf\nginx.conf
echo 开始下载
%download% -d html\rem -Z "%urlbase%html/rem/index.html" "%urlbase%html/rem/version.json" "%urlbase%html/rem/uyume-parse.js" "%urlbase%html/rem/my.css"
%download% -d openresty\conf "%urlbase%openresty/conf/nginx.conf"
echo 下载结束...重载配置
openresty\nginx -s reload -c openresty\conf\nginx.conf