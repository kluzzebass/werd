import { dialog, BrowserWindow } from 'electron'
import { readFile, writeFile, access, constants } from 'fs/promises'
import { dirname } from 'path'

export interface FileResult {
  data: string
  filePath: string
}

/**
 * Show save dialog and write file
 */
export async function saveFile(
  window: BrowserWindow,
  data: string,
  currentPath?: string
): Promise<string | null> {
  try {
    let savePath = currentPath

    if (!savePath) {
      const result = await dialog.showSaveDialog(window, {
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
    dialog.showErrorBox('Save Error', `Failed to save file: ${error}`)
    return null
  }
}

/**
 * Show open dialog and read file
 */
export async function openFile(window: BrowserWindow): Promise<FileResult | null> {
  try {
    const result = await dialog.showOpenDialog(window, {
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
    dialog.showErrorBox('Open Error', `Failed to open file: ${error}`)
    return null
  }
}

/**
 * Check if a file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK)
    return true
  } catch {
    return false
  }
}

/**
 * Get the directory of a file path
 */
export function getDirectory(filePath: string): string {
  return dirname(filePath)
}
