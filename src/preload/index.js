import { contextBridge, ipcRenderer, webUtils } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import packageInfo from '../../package.json'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('myAPI', {
      selectFolder: () => ipcRenderer.invoke('dialog:openDirectory'),
      //Select documentation path
      selectDocumentation: () => ipcRenderer.invoke('dialog:openDocumentation')
    })
    // Expose folderPath to the renderer
    //folderPath /Users/jonathanguerino/Documents/Bacon Lover - Café/Cafe-data
    contextBridge.exposeInMainWorld('folderPath', {
      set: (value) => ipcRenderer.send('folderPath:set', value),
      get: () => ipcRenderer.send('folderPath:get')
    })

    // Expose documentationPath to the renderer
    contextBridge.exposeInMainWorld('documentationPath', {
      set: (value) => ipcRenderer.send('documentationPath:set', value),
      get: () => ipcRenderer.send('documentationPath:get')
    })

    // Expose appInfo to the renderer
    contextBridge.exposeInMainWorld('appInfo', {
      version: packageInfo.version
    })

    // Expose File Path to the renderer (breaking changes v32)
    contextBridge.exposeInMainWorld('filePath', {
      showFilePath(file) {
        const path = webUtils.getPathForFile(file)
        return path
      }
    })
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}

contextBridge.exposeInMainWorld('darkMode', {
  toggle: () => ipcRenderer.invoke('dark-mode:toggle'),
  system: () => ipcRenderer.invoke('dark-mode:system')
})
