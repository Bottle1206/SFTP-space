const Client = require('ssh2').Client;
const exec = require('child_process').exec;
const ora = require('ora');
const path = require('path');

const spinner = ora({ text: '' });
const conn = new Client();
const timeStamp = +new Date();
const timeStamp_FileName = timeStamp + '.rar.gz'
const connectConfig = {
  host: '',
  port: 22,
  username: 'root',
  password: '123456',
  pathMap: {}
};


function compressFolder() {
  spinner.start('开始压缩文件。。。');
  
  const pathMap = connectConfig.pathMap;
  const localPath = path.join(process.cwd(), pathMap.localPath);
  const lastPathIndex = localPath.lastIndexOf('/');
  const localDir = localPath.substring(0, lastPathIndex);
  const localFolder = localPath.substring(lastPathIndex + 1);
  const tempTargetFolder = timeStamp;
  
  // const tempTargetFolder = rarList[index].substring(0, rarList[index].length - 7);
  const toCurrent = `cd ${localDir}`;
  const copyToTempFolder = `cp -rf ./${localFolder} ./${tempTargetFolder}`;
  const tarFile = `tar -cvzf ./${timeStamp_FileName} ./${tempTargetFolder}`;
  const deleteTempFolder = `rm -rf ./${tempTargetFolder}`;
  const execCmdStr = [toCurrent, copyToTempFolder, tarFile, deleteTempFolder].join(' && ');

  return new Promise((resolve, reject) => {
    exec(execCmdStr, (err, stdout, stderr) => {
      if (err) {
        spinner.fail('本地文件压缩失败！');
        reject();
      } else {
        spinner.succeed('本地文件压缩成功');
        resolve()
      }
    });
  })
}

function connectSever() {
  spinner.start(`正在连接服务器。。。`);
  return new Promise((resolve, reject) => {
    conn.on('ready', () => {
      conn.sftp((err, sftp) => {
        if (err) {
          spinner.fail('连接失败！');
          throw err;
          reject();
        }
        spinner.succeed('连接服务器成功');
        resolve(sftp);
      });
    }).connect({
      host: connectConfig.host,
      port: connectConfig.port,
      username: connectConfig.username,
      password: connectConfig.password
    });
  })
}

function beginUpload(sftp) {
  const pathMap = connectConfig.pathMap;
  var remoteDir = pathMap.remotePath.substring(0, pathMap.remotePath.lastIndexOf('/'));
  spinner.start('开始上传。。。');
  return new Promise((resolve, reject) => {
    sftp.fastPut(process.cwd() + '/' + timeStamp_FileName, remoteDir + '/' + timeStamp_FileName, {
      step (totalTx, chunk, total) {
        spinner.text = '------上传中：' + parseInt(totalTx * 100 / total) + '------';
      }
    }, (err) => {
      if (err) {
        spinner.fail('上传至服务器失败！');
        reject(err);
      } else {
        spinner.succeed('上传至服务器成功');
        resolve();
      }
    })
  })
}

function deleteLocalZip() {
  spinner.start('删除本地临时压缩包');
  const execCmdStr = 'rm -rf ' + process.cwd() + '/' + timeStamp_FileName;
  return new Promise((resolve, reject) => {
    exec(execCmdStr, (err, stdout, stderr) => {
      if (err) {
        spinner.fail('本地临时压缩包删除失败');
        resolve();
      } else {
        spinner.succeed('本地临时压缩包删除成功');
        resolve()
      }
    });
  })
}

function decompressFolder() {
  const pathMap = connectConfig.pathMap;
  spinner.start('开始解压远程文件');
  return new Promise((resolve, reject) => {
    conn.shell((err, stream) => {
      if (err) {
        reject(err);
        // throw err;
      }
      spinner.start('解压中。。。');
      stream.on('close', () => {
        spinner.succeed('服务器压缩包解压成功');
        resolve(true);
      }).on('data', (data) => {
  
      }).stderr.on('data', (data) => {
        console.log(data);
      });

      const lastPathIndex = pathMap.remotePath.lastIndexOf('/');
      const remoteFolder = pathMap.remotePath.substring(lastPathIndex + 1);
      const curFolder = timeStamp;
      const remoteDir = pathMap.remotePath.substring(0, lastPathIndex);
      
      const toRemoteDir = `cd ${remoteDir}`;
      const deleteRemoteFolder = `rm -rf ./${remoteFolder}`;
      const decompress = `tar -xvzf ${timeStamp_FileName}`;
      const deleteZip = `rm -rf ./${timeStamp_FileName}`;
      const removeToRemoteFolder = `mv ./${curFolder} ./${remoteFolder}`;

      const execCmdStr = [toRemoteDir, deleteRemoteFolder, decompress, deleteZip, removeToRemoteFolder].join(' && ');

      stream.end(execCmdStr + ' \nexit\n');
    });
  })
}

const init = async (config) => {
  console.log('\n*************************************\n');
  try {
    const temp = JSON.parse(JSON.stringify(config));
    Object.assign(connectConfig, temp);
    console.log(`\n目标服务器地址: ${connectConfig.host}\n`)
    await compressFolder();
    const sftp = await connectSever();
    await beginUpload(sftp);
    await deleteLocalZip();
    try {
      await decompressFolder();
      console.log('-------上传完成-------\n')
      console.log('*************************************\n')
      conn.end();
    } catch(e) {
      spinner.fail('服务器压缩包解压失败！');
      console.error(e);
      conn.end();
    }
  } catch(e) {
    console.log(e)
    spinner.start();
    spinner.text = '仅支持json格式的配置文件';
    spinner.fail();
  }
  
}

module.exports = init;