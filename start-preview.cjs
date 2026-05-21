process.chdir(__dirname);
const { spawn } = require('child_process');
const child = spawn('node', [__dirname + '/node_modules/vite/bin/vite.js', 'preview', '--host'], {
  stdio: 'inherit',
  cwd: __dirname
});
child.on('exit', (code) => process.exit(code));
