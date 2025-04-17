const { PythonShell } = require('python-shell')
const path = require('path')

let pythonProcess = null

function startPython(mainWindow) {
  const options = {
    mode: 'text',
    pythonPath: 'python',
    scriptPath: path.join(__dirname, '../main'),
    args: []
  }

  pythonProcess = new PythonShell('inference.py', options)

  pythonProcess.on('message', (message) => {
    mainWindow.webContents.send('prediction-update', message)
  })

  pythonProcess.on('stderr', (stderr) => {
    console.error(stderr)
  })

  return pythonProcess
}

function stopPython() {
  if (pythonProcess) {
    return new Promise((resolve) => {
      pythonProcess.end((err) => {
        if (err) console.error('Error stopping Python:', err)
        pythonProcess = null
        console.log('Python process terminated')
        resolve()
      })
    })
  }
  return Promise.resolve()
}

module.exports = { 
  startPython,
  stopPython 
}