import fs from 'fs'
import path from 'path'
import xml2js from 'xml2js'
import { stringify } from 'csv-stringify'
import axios from 'axios'

/**
 * Creates a new folder with the specified name.
 * @param {string} folderName - The name of the folder to create.
 * @returns {string} The path of the newly created folder.
 */
export async function createFolder(folderName) {
  const Store = await import('electron-store')
  const store = new Store.default()

  //manage forbidden characters in folder name
  folderName = folderName.replace(/[<>:"/\\|?*]/g, '_')

  const folderPath = store.get('folderPath')
  const newFolderPath = path.join(folderPath, folderName)

  if (!fs.existsSync(newFolderPath)) {
    fs.mkdirSync(newFolderPath)
  }
  return newFolderPath
}

/**
 * Creates a new folder with the current date and time in the specified profile folder path.
 * @param {string} profileFolderPath - The path to the profile folder.
 * @returns {string} The path of the newly created folder.
 */
export async function createFolderWithDate(profileFolderPath) {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0') // Les mois commencent à 0 en JavaScript
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  const dateString = `${year}${month}${day}_${hour}_${minute}`
  const newFolderPath = path.join(profileFolderPath, dateString)

  if (!fs.existsSync(newFolderPath)) {
    fs.mkdirSync(newFolderPath)
  }
  return newFolderPath
}

export async function readXmlFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        return reject(err)
      }
      xml2js.parseString(data, { explicitArray: false }, (err, result) => {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
    })
  })
}

/**
 * Writes records to a file.
 *
 * @param {Array} records - The array of records to write.
 * @param {string} processingFolderPath - The path to the processing folder.
 * @param {string} fileName - The name of the file.
 * @param {Object} [event=null] - The event object (optional).
 * @param {boolean} [truncate=false] - Indicates whether to truncate the records (optional).
 * @returns {void}
 */
export function writeToFile(
  records,
  processingFolderPath,
  fileName,
  event = null,
  truncate = false
) {
  //get Date AAAAMMJJ
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0') // Les mois commencent à 0 en JavaScript
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  const dateString = `${year}${month}${day}_${hour}_${minute}`
  if (truncate) {
    // Diviser records en sous-ensembles de 5000 lignes
    const chunkSize = 4999
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize)
      const chunkIndex = Math.floor(i / chunkSize)
      const filePath = path.join(
        processingFolderPath,
        `${fileName}_${dateString}_${chunkIndex + 1}.csv`
      )

      stringify(chunk, { header: true, delimiter: ';' }, (err, output) => {
        if (err) {
          console.error(`Error saving ${fileName} records:`, err)
          this.manageMessages(event, `Erreur lors de l'enregistrement des données ` + err)
          return
        }
        try {
          fs.writeFileSync(filePath, output, { flag: 'w' })
        } catch (error) {
          console.error(`Error writing ${fileName} records:`, error)
          this.manageMessages(event, `Erreur lors de l'écriture des données ` + error)
        }
      })
    }
  } else {
    const filePath = path.join(processingFolderPath, `${fileName}_${dateString}.csv`)
    stringify(records, { header: true, delimiter: ';' }, (err, output) => {
      if (err) {
        console.error(`Error saving ${fileName} records:`, err)
        this.manageMessages(event, `Erreur lors de l'enregistrement des données ` + err)
        return
      }
      try {
        fs.writeFileSync(filePath, output, { flag: 'w' })
      } catch (error) {
        console.error(`Error writing ${fileName} records:`, error)
        this.manageMessages(event, `Erreur lors de l'écriture des données ` + error)
      }
    })
  }
}

export async function downloadFile(url, dest) {
  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'stream',
    headers: {
      Accept: '*/*'
    }
  })

  const writer = fs.createWriteStream(dest)

  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}
