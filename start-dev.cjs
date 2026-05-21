process.chdir(__dirname);
const { spawn } = require('child_process');
const child = spawn('npx', ['vite', '--host'], { stdio: 'inherit', shell: true });
child.on('exit', (code) => process.exit(code));
