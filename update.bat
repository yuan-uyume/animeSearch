set urlbase=https://raw.fastgit.org/dakerj/animeSearch/master/
set download=aria2\aria2c
echo 正在获取更新内容...
del /f updateValue.bat
%download% "%urlbase%updateValue.bat"
call updateValue.bat