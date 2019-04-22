# SFTP上传工具 (space)
## SFTP上传工具，通过配置本地json文件信息，实现一键上传远程服务器；

git clone https://github.com/Bottle1206/SFTP-space.git

cd SFTP-space && npm install

npm link

----------------
在项目文件夹根目录添加一个 server.json 文件：

文件格式如下（example）：

`{
  "host": "192.168.111.111",
  "port": 22,
  "username": "root",
  "password": "123456",
  "pathMap": {
    "localPath": "./dist",
    "remotePath": "/usr/local/nginx/html/spaceItems/myProject"
  }
}`

---------------

在项目文件夹中的 package.json 中添加script:
<font color='red'>"upload": "space send -c server.json" </font>

-------------

npm run upload

--------------

