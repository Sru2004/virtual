/**
 * Kills any process using port 5000, then starts the backend.
 * Use when "data is not saving" — ensures the new process loads .env and connects to MongoDB.
 * Windows only.
 */
const { execSync } = require('child_process');
const path = require('path');

const PORT = process.env.PORT || 5000;

try {
  const out = execSync(`netstat -ano | findstr :${PORT}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  const lines = out.trim().split(/\r?\n/).filter((l) => l.includes('LISTENING'));
  const pids = new Set();
  lines.forEach((l) => {
    const parts = l.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && pid !== '0') pids.add(pid);
  });
  pids.forEach((pid) => {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
      console.log(`Stopped process on port ${PORT} (PID ${pid}).`);
    } catch (_) {}
  });
} catch (_) {
  // netstat found nothing or failed
}

const backendDir = path.join(__dirname, '..');
execSync('node server.js', { stdio: 'inherit', cwd: backendDir });
