const { spawn } = require('node:child_process');
const path = require('node:path');

const isWindows = process.platform === 'win32';
const command = isWindows ? process.env.ComSpec || 'cmd.exe' : 'npm';
const args = isWindows ? ['/d', '/s', '/c', 'npm run dev'] : ['run', 'dev'];

const services = [
  { name: 'backend', cwd: 'medisign-voice/backend' },
  { name: 'frontend', cwd: 'medisign-voice/frontend' },
];

const children = services.map(({ name, cwd }) => {
  const child = spawn(command, args, {
    cwd: path.join(__dirname, '..', cwd),
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: false,
  });

  const prefix = `[${name}]`;
  child.stdout.on('data', (data) => process.stdout.write(`${prefix} ${data}`));
  child.stderr.on('data', (data) => process.stderr.write(`${prefix} ${data}`));
  child.on('exit', (code) => {
    if (code && !shuttingDown) {
      console.error(`${prefix} exited with code ${code}`);
      shutdown(code);
    }
  });

  return child;
});

let shuttingDown = false;

function shutdown(code = 0) {
  shuttingDown = true;
  for (const child of children) {
    if (child.killed) continue;
    if (isWindows) {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      child.kill();
    }
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
