import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  onMenuAction: (callback: (action: string) => void) => {
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
  }
})
