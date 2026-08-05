const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');

const rootDir = __dirname;
const portableNodeDir = path.join(rootDir, 'node-portable');
const npmCmd = path.join(portableNodeDir, 'npm.cmd');

// Set PATH to include portable Node.js directory first
process.env.PATH = `${portableNodeDir};${process.env.PATH}`;

console.log('========================================');
const myPid = process.pid;
console.log(`Current process PID: ${myPid}`);
console.log('========================================');

// 1. Kill other Node processes to release locks
console.log('[*] Terminating other node.exe/Vite processes...');
try {
  const output = execSync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV /NH').toString();
  const lines = output.split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split(',');
    if (parts.length > 1) {
      const pidStr = parts[1].replace(/"/g, '').trim();
      const pid = parseInt(pidStr, 10);
      if (!isNaN(pid) && pid !== myPid) {
        console.log(`Killing node process with PID: ${pid}`);
        try {
          process.kill(pid, 'SIGKILL');
        } catch (err) {
          try { execSync(`taskkill /F /PID ${pid}`); } catch (e) {}
        }
      }
    }
  }
} catch (e) {
  console.log('Info/Error killing node processes:', e.message);
}

// Kill cmd windows with Medi-Unity title
try {
  execSync('taskkill /f /im cmd.exe /fi "WINDOWTITLE eq Medi-Unity*"', { stdio: 'ignore' });
} catch (e) {}
console.log('✅ Done killing processes.');
console.log('');

// Helper to delete dir
function deleteDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    console.log(`[*] Deleting directory: ${dirPath}`);
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ Deleted ${dirPath}`);
    } catch (e) {
      console.error(`❌ Failed to delete ${dirPath}:`, e.message);
    }
  }
}

// Helper to delete file
function deleteFile(filePath) {
  if (fs.existsSync(filePath)) {
    console.log(`[*] Deleting file: ${filePath}`);
    try {
      fs.unlinkSync(filePath);
      console.log(`✅ Deleted ${filePath}`);
    } catch (e) {
      console.error(`❌ Failed to delete ${filePath}:`, e.message);
    }
  }
}

// 2. Delete corrupted folders across all 4 portals & backend
const folders = ['backend', 'frontend-patient', 'frontend-doctor', 'frontend-partner', 'admin'];
for (const folder of folders) {
  const folderPath = path.join(rootDir, folder);
  deleteDir(path.join(folderPath, 'node_modules'));
  deleteFile(path.join(folderPath, 'package-lock.json'));
}
console.log('');

// 3. Reinstall dependencies
for (const folder of folders) {
  const folderPath = path.join(rootDir, folder);
  if (!fs.existsSync(folderPath)) continue;
  console.log(`========================================`);
  console.log(`[*] Installing dependencies in: ${folder}`);
  console.log(`========================================`);
  try {
    execSync(`"${npmCmd}" install --legacy-peer-deps`, {
      cwd: folderPath,
      stdio: 'inherit',
      env: { ...process.env }
    });
    console.log(`✅ Successfully installed dependencies in ${folder}\n`);
  } catch (e) {
    console.error(`❌ Failed to install dependencies in ${folder}:`, e.message);
  }
}

// 4. Launch applications in separate windows
console.log('========================================');
console.log('[*] Launching applications in new windows...');
console.log('========================================');

exec(`start "Medi-Unity BACKEND" cmd /k "cd backend && npm run dev"`, { cwd: rootDir, shell: 'cmd.exe' });
exec(`start "Medi-Unity PATIENT" cmd /k "cd frontend-patient && npm run dev"`, { cwd: rootDir, shell: 'cmd.exe' });
exec(`start "Medi-Unity DOCTOR" cmd /k "cd frontend-doctor && npm run dev text"`, { cwd: rootDir, shell: 'cmd.exe' });
exec(`start "Medi-Unity PARTNER" cmd /k "cd frontend-partner && npm run dev"`, { cwd: rootDir, shell: 'cmd.exe' });
exec(`start "Medi-Unity ADMIN" cmd /k "cd admin && npm run dev"`, { cwd: rootDir, shell: 'cmd.exe' });

console.log('🚀 All 4 portals + backend triggered to launch!');
console.log('Backend:        http://localhost:4000');
console.log('Patient Portal: http://localhost:5175');
console.log('Doctor Portal:  http://localhost:5176');
console.log('Partner Portal: http://localhost:5177');
console.log('Admin Portal:   http://localhost:5174');
console.log('========================================');
