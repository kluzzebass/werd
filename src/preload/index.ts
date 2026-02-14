import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  onMenuAction: (callback: (action: string) => void) => {
    ipcRenderer.removeAllListeners('menu-action')
    ipcRenderer.on('menu-action', (_event, action) => callback(action))
  },

  saveFile: (data: string, filePath?: string): Promise<string | null> => {
    return ipcRenderer.invoke('save-file', data, filePath)
  },

  openFile: (): Promise<{ data: string; filePath: string } | null> => {
    return ipcRenderer.invoke('open-file')
  },

  setTitle: (title: string): void => {
    ipcRenderer.invoke('set-title', title)
  },

  onBeforeClose: (callback: () => void) => {
    ipcRenderer.removeAllListeners('before-close')
    ipcRenderer.on('before-close', () => callback())
  },

  respondBeforeClose: (isDirty: boolean) => {
    ipcRenderer.send('before-close-response', isDirty)
  },

  onSaveAndClose: (callback: () => void) => {
    ipcRenderer.removeAllListeners('save-and-close')
    ipcRenderer.on('save-and-close', () => callback())
  },

  onDiscardAndClose: (callback: () => void) => {
    ipcRenderer.removeAllListeners('discard-and-close')
    ipcRenderer.on('discard-and-close', () => callback())
  },

  readyToClose: () => {
    ipcRenderer.send('ready-to-close')
  }
})
