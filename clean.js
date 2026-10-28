const fs = require('fs');
const path = require('path');
const os = require('os');
const pkg = require('./package.json');
const appName = "GIP++"
const appDataPath = process.platform === 'win32'
  ? path.join(process.env.APPDATA, appName)
  : process.platform === 'darwin'
    ? path.join(os.homedir(), 'Library', 'Application Support', appName)
    : path.join(os.homedir(), '.config', appName);

if (fs.existsSync(appDataPath)) {
  fs.rmSync(appDataPath, { recursive: true, force: true });
  console.log(`cleaned ${appDataPath}`);
} else {
  console.log(`already cleaned`);
}