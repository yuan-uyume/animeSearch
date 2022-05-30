set urlbase=https://raw.fastgit.org/dakerj/animeSearch/master/
set download=aria2\aria2c

echo 开始删除旧文件
rm html\index.html
rm html\version.json
rm html\js\uyume-parse.js
rm html\css\my.css
rm openresty\conf\nginx.conf
echo 开始下载
%download% -d html -Z "%urlbase%html/index.html" "%urlbase%html/version.json"
%download% -d html\js "%urlbase%html/js/uyume-parse.js"
%download% -d html\css "%urlbase%html/css/my.css"
%download% -d openresty\conf "%urlbase%openresty/conf/nginx.conf"
echo 下载结束...重载配置
openresty\nginx -s reload -c openresty\conf\nginx.conf