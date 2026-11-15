import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { connect } from 'node:net';
import { resolve } from 'node:path';

const WEB_PORT = Number(process.env.PORT ?? 3000);
const API_PORT = Number(process.env.API_PORT ?? 3333);
const SERVER_DIR = resolve(process.cwd(), process.env.SERVER_DIR ?? '../chegai-server');
const children = [];

function portOpen(port) {
  return new Promise((done) => {
    const socket = connect({ port, host: '127.0.0.1' });
    socket.once('connect', () => {
      socket.destroy();
      done(true);
    });
    socket.once('error', () => done(false));
  });
}

async function waitForPort(port, label, seconds = 90) {
  for (let i = 0; i < seconds; i += 1) {
    if (await portOpen(port)) {
      return;
    }
    await new Promise((done) => setTimeout(done, 1000));
  }
  throw new Error(`${label} nao respondeu na porta ${port}`);
}

function run(label, command, args, cwd) {
  const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
  const print = (chunk) => {
    for (const line of chunk.toString().split('\n')) {
      if (line.trim()) {
        process.stdout.write(`[${label}] ${line}\n`);
      }
    }
  };
  child.stdout.on('data', print);
  child.stderr.on('data', print);
  child.on('exit', (code) => {
    if (code !== null && code !== 0) {
      process.stdout.write(`[${label}] encerrou com codigo ${code}\n`);
    }
  });
  children.push(child);
  return child;
}

function stop() {
  for (const child of children) {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      child.kill('SIGTERM');
    }
  }
  process.exit(0);
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);

if (spawnSync('cloudflared', ['--version']).status !== 0) {
  process.stderr.write('cloudflared nao encontrado. Instale com: sudo snap install cloudflared\n');
  process.exit(1);
}

if (!(await portOpen(API_PORT))) {
  if (!existsSync(SERVER_DIR)) {
    process.stderr.write(`API parada e ${SERVER_DIR} nao existe. Suba a API antes.\n`);
    process.exit(1);
  }
  spawnSync('docker', ['compose', 'up', '-d'], { cwd: SERVER_DIR, stdio: 'inherit' });
  run('api', 'yarn', ['dev'], SERVER_DIR);
}

if (!(await portOpen(WEB_PORT))) {
  run('web', 'yarn', ['dev', '--port', String(WEB_PORT)], process.cwd());
}

await Promise.all([waitForPort(API_PORT, 'API'), waitForPort(WEB_PORT, 'Web')]);

const tunnel = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${WEB_PORT}`], {
  stdio: ['ignore', 'ignore', 'pipe'],
  detached: true,
});
children.push(tunnel);
tunnel.stderr.on('data', (chunk) => {
  const match = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/.exec(chunk.toString());
  if (match) {
    const line = '='.repeat(match[0].length + 4);
    process.stdout.write(
      `\n${line}\n  ${match[0]}\n${line}\nLink publico pronto. Pode levar ate um minuto para abrir. Ctrl+C encerra tudo.\n\n`,
    );
  }
});
tunnel.on('exit', stop);
