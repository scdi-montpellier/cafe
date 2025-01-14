import { app, shell, BrowserWindow, ipcMain, dialog, nativeTheme, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { Profile } from './Profile'
import url from 'url'
import path from 'path'
import os from 'os'
import fs from 'fs'

const reactDevToolsPath = path.join(
  os.homedir(),
  '/Library/Application Support/Google/Chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/5.3.1_0'
)
// Fonction asynchrone pour initialiser le menu contextuel
async function createContextMenu() {
  const contextMenu = await import('electron-context-menu')
  contextMenu.default({
    labels: {
      cut: 'Couper',
      copy: 'Copier',
      paste: 'Coller',
      save: "Enregistrer l'image sous...",
      copyLink: 'Copier le lien',
      inspect: "Inspecter l'élément",
      searchWithGoogle: 'Rechercher avec Google',
      lookUpSelection: 'Rechercher la sélection'
    },
    prepend: (defaultActions, params, browserWindow) => [
      {
        label: 'Afficher la console',
        click: () => {
          browserWindow.webContents.openDevTools()
        }
      }
    ]
  })
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  //Fix bug alert pop-up on windows https://github.com/electron/electron/issues/31917
  ipcMain.on('focus-fix', () => {
    mainWindow.blur()
    mainWindow.focus()
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    })
    if (canceled) {
      return
    } else {
      return filePaths[0]
    }
  })

  ipcMain.handle('dialog:openDocumentation', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile']
    })
    if (canceled) {
      return
    }
    return filePaths[0]
  })

  ipcMain.handle('dark-mode:toggle', () => {
    if (nativeTheme.shouldUseDarkColors) {
      nativeTheme.themeSource = 'light'
    } else {
      nativeTheme.themeSource = 'dark'
    }
    import('electron-store')
      .then((Store) => {
        const store = new Store.default()
        //save in electron-store
        store.set('darkMode', nativeTheme.shouldUseDarkColors)
      })
      .catch((error) => {
        console.error('Error:', error)
      })

    return nativeTheme.shouldUseDarkColors
  })

  ipcMain.handle('dark-mode:system', () => {
    nativeTheme.themeSource = 'system'
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(app.getAppPath(), 'out/renderer/index.html'),
        protocol: 'file:',
        slashes: true
      })
    )
  }

  // function to navigate home
  ipcMain.on('navigate-home', () => {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(app.getAppPath(), 'out/renderer/index.html'),
        protocol: 'file:',
        slashes: true
      })
    )
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Load the React DevTools.
  if (fs.existsSync(reactDevToolsPath))
    await session.defaultSession.loadExtension(reactDevToolsPath)
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  createContextMenu()

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  //manage folderPath
  let folderPath = ''
  // manage documentationPath
  let documentationPath = ''

  // Import electron-store dynamically
  import('electron-store').then((Store) => {
    const store = new Store.default()

    // Lire la valeur de darkMode depuis electron-store
    const isDarkMode = store.get('darkMode')

    // Définir le thème en fonction de la valeur stockée
    nativeTheme.themeSource = isDarkMode ? 'dark' : 'light'

    // Set folderPath
    ipcMain.on('folderPath:set', (_, value) => {
      folderPath = value
      store.set('folderPath', folderPath) // Save folderPath to electron-store
    })

    // Get folderPath
    ipcMain.on('folderPath:get', (event) => {
      folderPath = store.get('folderPath') // Load folderPath from electron-store
      event.returnValue = folderPath
    })

    // Set documentationPath
    ipcMain.on('documentationPath:set', (_, value) => {
      documentationPath = value
      store.set('documentationPath', documentationPath) // Save documentationPath to electron-store
    })
    // Get documentationPath
    ipcMain.on('documentationPath:get', (event) => {
      documentationPath = store.get('documentationPath') // Load documentationPath from electron-store
      event.returnValue = documentationPath
    })

    // Set tokenAPI
    ipcMain.on('tokenAPI:set', (_, value) => {
      store.set('tokenAPI', value)
    })
    // Get tokenAPI
    ipcMain.on('tokenAPI:get', (event) => {
      event.returnValue = store.get('tokenAPI')
    })

    //Set analyticsPath
    ipcMain.on('analyticsPath:set', (_, value) => {
      store.set('analyticsPath', value)
    })
    // Get analyticsPath
    ipcMain.on('analyticsPath:get', (event) => {
      event.returnValue = store.get('analyticsPath')
    })

    //Set paginationPath
    ipcMain.on('paginationPath:set', (_, value) => {
      store.set('paginationPath', value)
    })
    // Get paginationPath
    ipcMain.on('paginationPath:get', (event) => {
      event.returnValue = store.get('paginationPath')
    })
  })

  // Load profiles at startup
  const profile = new Profile()

  // Get profiles
  ipcMain.on('profiles:get', async (event) => {
    const profiles = await profile.getAllProfiles()
    if (profiles.length === 0) {
      console.log('No profiles found')
    }
    event.reply('profiles:load', profiles)
  })

  // Get a profile by index
  ipcMain.on('profile:get', async (event, index) => {
    const profiles = await profile.getAllProfiles()
    const profileData = profiles.find((profile) => profile.lineNumber == index)
    event.returnValue = profileData
  })

  // Save profiles
  profile.setIpcMainSaveProfile()
  profile.setIpcMainDeleteProfile()
  profile.setIpcMainDuplicateProfile()

  // Process the profile
  profile.setIpcMainProcessProfile()

  profile.setIpcFileSelected()
  profile.setIpcCompareFileSelected()
  profile.setIpcProgressBar()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
