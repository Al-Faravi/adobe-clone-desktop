const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');

let mainWindow;
let backendProcess;

function startBackendEngine() {
  const isDev = !app.isPackaged;
  if (isDev) {
    const pythonExe = path.join(__dirname, 'backend-engine', 'venv', 'Scripts', 'python.exe');
    const scriptPath = path.join(__dirname, 'backend-engine', 'main.py');
    backendProcess = spawn(pythonExe, [scriptPath], { windowsHide: true });
  } else {
    const engineExe = path.join(process.resourcesPath, 'acrobat-engine.exe');
    backendProcess = spawn(engineExe, [], { windowsHide: true });
  }
}

function stopBackendEngine() {
  if (backendProcess) {
    try {
      backendProcess.kill();
    } catch (e) {}
  }
  if (process.platform === 'win32') {
    exec('taskkill /F /IM acrobat-engine.exe /T', () => {});
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'Al-Faravi PDF Pro Studio',
    icon: path.join(__dirname, 'frontend', 'public', 'alfaravi logo.png'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  startBackendEngine();
  // Python ইঞ্জিন চালু হওয়ার জন্য ২ সেকেন্ড অপেক্ষা করে উইন্ডো খোলা
  setTimeout(createWindow, 2000);
});

app.on('will-quit', stopBackendEngine);

app.on('window-all-closed', () => {
  stopBackendEngine();
  if (process.platform !== 'darwin') app.quit();
});