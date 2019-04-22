#!/usr/bin/env node --harmony
var packageifm = require('./package.json');
const program = require('commander');
const sendFile  = require('./src/sendFile.js');

program
  .command('send')
  .option('-c, --config', 'config file path')
  .action(confPath => {
    const fullConfPath = process.cwd() + '/' + confPath;
    try {
      const confJson = require(fullConfPath);
      sendFile(confJson);
    } catch(e) {
      console.error('\n****** 配置文件不存在 ******\n');
    }
  })

program
  .version(packageifm.version)
  .usage('[options]')
  .option('-c, --config', 'config file path')
  .parse(process.argv);

if (program.args.length === 0) {
  console.log('\n*************************************\n');
  console.log('* Author: Bottle1206\n');
  console.log('* Email:  bottle1206@outlook.com\n');
  console.log('* Blog:   https://blog.csdn.net/qq_33619285\n');
  console.log('* Github: https://github.com/Bottle1206\n');
  console.log('\n*************************************\n');
}
