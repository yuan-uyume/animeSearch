set urlbase=https://raw.fastgit.org/dakerj/animeSearch/master/
set download=aria2\aria2c
echo 获取更新内容
%download% "%urlbase%updateValue.bat"
rm updateValue.bat
call updateValue.bat