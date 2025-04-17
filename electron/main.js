const { app, BrowserWindow } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

// Modify Python path for production
function getPythonPath() {
  return process.env.NODE_ENV === 'production'
    ? path.join(process.resourcesPath, 'python', 'python.exe')
    : 'python';
}

// Modify script path for production
function getScriptPath() {
  return process.env.NODE_ENV === 'production'
    ? path.join(process.resourcesPath, 'main', 'inference.py')
    : path.join(__dirname, '../main/inference.py');
}

let mainWindow = null
let pythonProcess = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  })

  mainWindow.loadFile(path.join(__dirname, 'src/index.html'))
  
  // Start Python process with correct path
  const pythonPath = 'python' // or full path if needed
  const scriptPath = path.join(__dirname, '../main/inference.py')
  
  pythonProcess = spawn(pythonPath, [scriptPath], {
    cwd: path.dirname(scriptPath),
    stdio: ['pipe', 'pipe', 'pipe', 'ipc']
  })

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python: ${data}`)
  })

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python error: ${data}`)
  })

  pythonProcess.on('error', (err) => {
    console.error('Failed to start Python:', err)
  })

  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  // Kill Python process
  if (pythonProcess) {
    pythonProcess.kill()
    pythonProcess = null
  }
  
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})