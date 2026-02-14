import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { readFile, writeFile } from 'fs/promises'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Set app name (shows in macOS menu bar)
if (process.platform === 'darwin') {
  app.setName('Werd')
}

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  })

  // Create application menu
  const menu = createMenu()
  Menu.setApplicationMenu(menu)

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createMenu(): Menu {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Werd',
      submenu: [
        {
          label: 'About Werd',
          click: () => sendMenuAction('about')
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: () => sendMenuAction('new')
        },
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => sendMenuAction('open')
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => sendMenuAction('save')
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => sendMenuAction('save-as')
        },
        { type: 'separator' },
        { role: 'close' },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Werd',
          click: () => sendMenuAction('about')
        }
      ]
    }
  ]

  return Menu.buildFromTemplate(template)
}

function sendMenuAction(action: string) {
  if (mainWindow) {
    mainWindow.webContents.send('menu-action', action)
  }
}

// IPC handlers for file operations
ipcMain.handle('save-file', async (_event, data: string, filePath?: string) => {
  try {
    let savePath = filePath

    if (!savePath) {
      const result = await dialog.showSaveDialog(mainWindow!, {
        title: 'Save Document',
        defaultPath: 'document.werd',
        filters: [
          { name: 'Werd Files', extensions: ['werd'] },
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })

      if (result.canceled || !result.filePath) {
        return null
      }

      savePath = result.filePath
    }

    await writeFile(savePath, data, 'utf-8')
    return savePath
  } catch (error) {
    console.error('Failed to save file:', error)
    return null
  }
})

ipcMain.handle('open-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Open Document',
      filters: [
        { name: 'Werd Files', extensions: ['werd'] },
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const filePath = result.filePaths[0]
    const data = await readFile(filePath, 'utf-8')

    return { data, filePath }
  } catch (error) {
    console.error('Failed to open file:', error)
    return null
  }
})

ipcMain.handle('set-title', (_event, title: string) => {
  if (mainWindow) {
    mainWindow.setTitle(title)
  }
})

// App lifecycle
app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
