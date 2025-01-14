import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse'
import jschardet from 'jschardet'
import iconv from 'iconv-lite'
import { ipcMain, shell } from 'electron'
import { stringify } from 'csv-stringify'
import { processWebservice } from './utils/webservice'
import { processBacon } from './utils/bacon'
import {
  createFolder,
  createFolderWithDate,
  readXmlFile,
  writeToFile,
  downloadFile
} from './utils/files'

export class Profile {
  constructor() {
    this.profiles = []
    this.inputData = []
    this.compareData = []
    this.originalFilePath = ''
    this.compareFilePath = ''
    this.messages = []
    this.analyticsPath = ''
    this.paginationPath = ''
    this.tokenAPI = ''
    this.processWebservice = processWebservice.bind(this)
    this.processBacon = processBacon.bind(this)
    this.createFolder = createFolder.bind(this)
    this.createFolderWithDate = createFolderWithDate.bind(this)
    this.writeToFile = writeToFile.bind(this)
    this.downloadFile = downloadFile.bind(this)
    this.currentProcessingFolder = '' // Nouvelle propriété pour stocker le chemin
  }

  //Not used
  async getProfileByIndex(index) {
    if (this.profiles.length === 0) {
      this.profiles = await this.getAllProfiles()
    }
    const profile = this.profiles.find((profile) => profile.lineNumber === index)
    return profile
  }

  async getAllProfiles() {
    const Store = await import('electron-store')
    const store = new Store.default()
    this.profiles = []

    let folderPath = ''
    if (!store.get('folderPath')) {
      throw new Error('folderPath is not defined in the store')
    } else {
      folderPath = store.get('folderPath')
    }
    const filePath = path.join(folderPath, 'profils.csv')

    this.analyticsPath = store.get('analyticsPath')
    this.paginationPath = store.get('paginationPath')
    this.tokenAPI = store.get('tokenAPI')

    try {
      const buffer = fs.readFileSync(filePath)
      const encoding = jschardet.detect(buffer).encoding
      console.log('Encoding:', encoding)

      const data = iconv.decode(buffer, encoding)
      // Parse the data and return the profiles
      const parser = parse(data, {
        delimiter: ';',
        columns: true,
        skip_empty_lines: true
      })

      return (this.profiles = await this.getProfilesFromParser(parser, folderPath))
    } catch (error) {
      console.error('Error reading profiles file:', error)
      return []
    }
  }

  async getProfilesFromParser(parser, folderPath) {
    const profiles = []
    let lineNumbers = 1
    for await (const record of parser) {
      //manage forbidden characters in folder name
      record['Nom du profil'] = record['Nom du profil'].replace(/[\\/:*?"<>|]/g, '_')
      record.lineNumber = lineNumbers++
      record.profileHistory = await this.getProfileHistory(record['Nom du profil'], folderPath)
      record.isLate = this.isLate(record)
      profiles.push(record)
    }
    return profiles
  }

  async getProfileHistory(profile, folderPath) {
    //Get profile history by reading the profile folder
    const profileHistory = []
    const files = fs.readdirSync(folderPath)
    //Find folder with profile name
    const profileFolder = files.find((file) => file.startsWith(profile))
    if (profileFolder) {
      const profileFolderPath = path.join(folderPath, profileFolder)
      //Get all the folders in the profile folder
      const folders = fs.readdirSync(profileFolderPath)
      //The history is given by the folders last modified date
      folders.forEach((folder) => {
        profileHistory.push({
          folder: folder,
          date: fs.statSync(path.join(profileFolderPath, folder)).mtime
        })
      })
      //order by date desc
      profileHistory.sort((a, b) => b.date - a.date)
    }
    return profileHistory
  }

  /**
   * Manages messages in the profile.
   * The method sends the message to the renderer process and logs it to the console.
   * The method also adds the message to the messages array.
   *
   * @param {Event} event - The event object.
   * @param {string} message - The message to be managed.
   */
  manageMessages(event, message) {
    event.reply('profile:process:status', message)
    console.log(message)
    this.messages.push(message)
  }

  isLate(profile) {
    // get now date
    const now = new Date()

    let markerDate
    // Switch on periodicity
    switch (profile['Périodicité']) {
      case 'Mensuelle':
        // Now - 1 month
        markerDate = new Date(now.setMonth(now.getMonth() - 1))
        break
      case 'Annuelle':
        // Now - 1 year
        markerDate = new Date(now.setFullYear(now.getFullYear() - 1))
        break
      default:
        return false
    }

    if (profile.profileHistory.length === 0) {
      return true
    }

    // get last date of profile
    if (profile.profileHistory[0].date < markerDate) {
      return true
    }
    return false
  }

  /**
   * Sets up the IPC main event listener for saving a profile.
   * The event listener listens for the 'profile:save' event and saves the profile to the profiles file.
   * The event listener sends back the updated profiles array to the renderer process.
   * The event listener does not return a value to the renderer process.
   *
   * @returns {void}
   */
  setIpcMainSaveProfile() {
    ipcMain.on('profile:save', async (event, profile) => {
      const index = this.profiles.findIndex((p) => p.lineNumber == profile.lineNumber)
      if (index !== -1) {
        // Si profile.lineNumber existe déjà, remplacez l'entrée correspondante
        this.profiles[index] = profile
      } else {
        // Sinon, ajoutez le nouveau profil
        this.profiles.push({ ...profile, lineNumber: this.profiles.length + 1 })
      }
      await this.saveProfile(this.profiles)
      event.returnValue = this.profiles
    })
  }

  setIpcMainDeleteProfile() {
    ipcMain.on('profile:delete', async (event, profile) => {
      const index = this.profiles.findIndex((p) => p.lineNumber == profile.lineNumber)
      if (index !== -1) {
        this.profiles.splice(index, 1)
        await this.saveProfile(this.profiles)
      }
      event.returnValue = this.profiles
    })
  }

  setIpcMainDuplicateProfile() {
    ipcMain.on('profile:duplicate', async (event, profile) => {
      console.log('Duplicate profile:', profile)
      const index = this.profiles.findIndex((p) => p.lineNumber == profile.lineNumber)
      if (index !== -1) {
        //Add a new profile with the same data
        //Add COPIE to Nom du profil
        profile['Nom du profil'] = profile['Nom du profil'] + ' COPIE'
        const newProfile = { ...profile, lineNumber: this.profiles.length + 1 }
        this.profiles.push(newProfile)
        await this.saveProfile(this.profiles)
        event.returnValue = newProfile

        // Rediriger vers la page du profil dupliqué
        const window = event.sender
        window.send('navigate', `/profile/${newProfile.lineNumber}`)
      }
    })
  }

  setIpcFileSelected() {
    ipcMain.on('file-selected', (event, path) => {
      console.log('File selected:', path)
      this.setInputData(path, event)
    })
  }

  setIpcProgressBar() {
    ipcMain.on('profile:process:progress', (event, progress) => {
      event.returnValue = progress
    })
  }

  setIpcCompareFileSelected() {
    ipcMain.on('compare-file-selected', (event, path) => {
      //Check if file is csv or txt
      if (!path.endsWith('.csv') && !path.endsWith('.txt')) {
        this.manageMessages(event, 'Le fichier de comparaison doit être un fichier CSV ou TXT')
        return
      }

      //Keep original file path
      this.compareFilePath = path
      //detect file encoding
      const buffer = fs.readFileSync(path)
      const encoding = jschardet.detect(buffer).encoding
      this.manageMessages(event, `Encodage du fichier de comparaison : ${encoding}`)
      //Read file
      const data = iconv.decode(buffer, encoding)

      //if file extension is .csv, delimiter is ;
      //if file extension is .txt, delimiter is \t
      const delimiter = path.endsWith('.csv') ? ';' : '\t'

      let columnCounter = {}
      const parser = parse(data, {
        delimiter: delimiter,
        //Double headers
        columns: (header) =>
          header.map((columnName) => {
            if (columnCounter[columnName]) {
              columnCounter[columnName]++
              return `${columnName}_${columnCounter[columnName]}`
            } else {
              columnCounter[columnName] = 1
              return columnName
            }
          }),
        skip_empty_lines: true
      })
      this.compareData = []
      parser.on('data', (record) => {
        this.compareData.push(record)
      })
      parser.on('error', (error) => {
        console.error('Error parsing file:', error)
        this.manageMessages(event, "Erreur lors de l'analyse du fichier de comparaison " + error)
      })
      parser.on('end', () => {
        console.log('Parsing compare file complete')
        this.manageMessages(event, 'Analyse du fichier de comparaison terminée')
      })
    })
  }

  async setInputData(path, event = null) {
    //Check if file
    console.log('path:', path)
    if (!path) return this.manageMessages(event, 'Veuillez sélectionner un fichier')

    //Keep original file path
    this.originalFilePath = path
    //detect file encoding
    const buffer = fs.readFileSync(path)
    const encoding = jschardet.detect(buffer).encoding
    this.manageMessages(event, `Encodage du fichier : ${encoding}`)
    //Read file
    const data = iconv.decode(buffer, encoding)
    // remove double quote from data
    const dataWithoutDoubleQuote = data.replace(/"/g, '')
    const parser = parse(dataWithoutDoubleQuote, {
      delimiter: '\t',
      columns: true,
      skip_empty_lines: true
    })
    return new Promise((resolve, reject) => {
      parser.on('data', (record) => {
        this.inputData.push(record)
      })
      parser.on('error', (error) => {
        console.error('Error parsing file:', error)
        this.manageMessages(event, "Erreur lors de l'analyse du fichier d'entrée" + error)
        reject(error)
      })
      parser.on('end', () => {
        this.manageMessages(event, 'Analyse du fichier terminée')
        resolve(this.inputData)
      })
    })
  }

  async setCompareData(filePath, columns = null, event = null) {
    //Check if file
    if (!filePath) return this.manageMessages(event, 'Veuillez sélectionner un fichier')
    try {
      const data = await this.extractDataFromXml(filePath, columns)
      if (data && data.resumptionToken) {
        console.log('Resumption', data.resumptionToken)
      } else {
        console.log('Resumption token is undefined')
      }
      if (data && data.isFinished) console.log('Is Finished', data.isFinished)
      this.compareData = this.compareData.concat(data.compareData)
      return data
    } catch (error) {
      console.error('Error reading file:', error)
      this.manageMessages(event, "Erreur lors de l'analyse du fichier de comparaison " + error)
    }
  }

  async extractDataFromXml(filePath, columnNames = null) {
    try {
      const xmlData = await readXmlFile(filePath)

      // Vérifiez que xmlData.report.QueryResult existe et n'est pas vide
      if (!xmlData.report || !xmlData.report.QueryResult) {
        this.messages.push('Erreur : QueryResult est vide')
        throw new Error('QueryResult is undefined or empty')
      }
      const queryResult = xmlData.report.QueryResult

      if (!queryResult.ResultXml) {
        this.messages.push('Erreur : ResultXml est vide')
        throw new Error('ResultXml is undefined')
      }
      const resultXml = queryResult.ResultXml

      if (!columnNames) {
        const xsdSchema = resultXml.rowset['xsd:schema']
        const columns = xsdSchema['xsd:complexType']['xsd:sequence']['xsd:element']
        // Extraire les noms des colonnes à partir de l'attribut saw-sql:columnHeading
        columnNames = columns.map((col) => col.$['saw-sql:columnHeading'])
      }

      // Vérifiez que resultXml.rowset.Row existe et n'est pas vide
      if (!resultXml.rowset.Row) {
        this.messages.push('Erreur : Row est vide')
        throw new Error('Row is undefined or empty')
      }

      // Accéder aux lignes
      const rows = resultXml.rowset.Row

      // Mapper les lignes en utilisant les noms des colonnes
      const extractedData = rows.map((row) => {
        const rowData = {}
        columnNames.forEach((colName, index) => {
          rowData[colName] = row[`Column${index}`]
        })
        return rowData
      })

      return {
        resumptionToken: queryResult.ResumptionToken,
        isFinished: queryResult.IsFinished,
        compareData: extractedData,
        columnNames: columnNames
      }
    } catch (error) {
      console.error('Error reading or parsing XML file:', error)
    }
  }

  //Main Process Profile
  async setIpcMainProcessProfile() {
    ipcMain.on('profile:process', async (event, profile) => {
      let progressBar = 0
      this.messages = []

      //manage errors
      const errors = []
      if (profile['Nom du profil'] === '') {
        errors.push('Veuillez saisir un nom de profil')
      }
      if (this.originalFilePath === '' && profile.URL === '') {
        errors.push('Veuillez sélectionner un fichier ou une URL')
      }
      if (profile['Type de fichier en entrée'] === '') {
        errors.push('Veuillez sélectionner un type de fichier en entrée')
      }
      if (profile['Type'] !== 'Ebooks' && profile['Type'] !== 'Périodique') {
        errors.push("Veuillez sélectionner un type d'exemplarisation")
      }
      if (profile['Périodicité'] === '') {
        errors.push('Veuillez sélectionner une périodicité')
      }
      if (profile['930 $b'] === '') {
        errors.push('Veuillez saisir un 930 $b (RCR)')
      }
      if (errors.length > 0) {
        this.manageMessages(event, 'Erreurs :')
        errors.forEach((error) => {
          this.manageMessages(event, error)
        })
        console.error('profile', profile)
        event.returnValue = profile
        return
      }

      // Process profile
      this.manageMessages(event, `Début de traitement du profil ${profile['Nom du profil']}`)
      progressBar += 5
      event.reply('profile:process:progress', progressBar)

      const profileFolderPath = await this.createFolder(profile['Nom du profil'])
      this.manageMessages(event, `Dossier du profil : ${profileFolderPath}`)

      const processingFolderPath = await this.createFolderWithDate(profileFolderPath)
      this.currentProcessingFolder = processingFolderPath // Stocke le chemin
      this.manageMessages(event, `Dossier de traitement : ${processingFolderPath}`)
      this.manageMessages(
        event,
        `Type de fichier en entrée : ${profile['Type de fichier en entrée']}`
      )
      progressBar += 5
      event.reply('profile:process:progress', progressBar)

      let fileName = ''

      if (this.originalFilePath !== '') {
        //Copy original file to processing folder
        fileName = path.basename(this.originalFilePath)
        const newFilePath = path.join(processingFolderPath, fileName)
        fs.copyFileSync(this.originalFilePath, newFilePath)
        this.manageMessages(event, `Fichier copié : ${fileName}`)
        progressBar += 2
        event.reply('profile:process:progress', progressBar)
      } else {
        //Download file
        const urls = profile.URL.split(';')
        const totalFiles = urls.length
        const incrementPerFile = 10 / totalFiles // Divise les 10% par le nombre de fichiers
        const incrementPerStep = incrementPerFile / 2 // Divise l'incrément par fichier en 2 étapes
        for (const url of urls) {
          const fileName = url.split('/').pop()
          const newFilePath = path.join(processingFolderPath, fileName)
          console.log('Downloading file...')
          this.manageMessages(event, `Téléchargement du fichier : ${fileName}`)
          progressBar += incrementPerStep
          event.reply('profile:process:progress', progressBar)
          await this.downloadFile(url, newFilePath)
            .then(() => {
              this.manageMessages(event, `Fichier téléchargé : ${fileName}`)
              progressBar += incrementPerStep
              event.reply('profile:process:progress', progressBar)
            })
            .catch((error) => {
              console.error('Error downloading file:', error)
              this.manageMessages(
                event,
                `Erreur lors du téléchargement du fichier : ${fileName} ` + error
              )
            })
          await this.setInputData(newFilePath, event)
        }
      }

      //Copy compare file to processing folder
      if (this.compareFilePath) {
        fileName = path.basename(this.compareFilePath)
        const newCompareFilePath = path.join(processingFolderPath, fileName)
        fs.copyFileSync(this.compareFilePath, newCompareFilePath)
      } else if (profile['Chemin du rapport Analytics'] !== '') {
        //Download compare file
        const AnalyticsPaths = profile['Chemin du rapport Analytics'].split(';')
        console.log('Downloading compare file...')
        this.manageMessages(event, `Début téléchargement des fichiers de comparaison`)

        const totalAnalyticsFiles = AnalyticsPaths.length
        const incrementPerAnalytics = 10 / totalAnalyticsFiles
        const incrementPerAnalyticsStep = incrementPerAnalytics / 2

        for (const analyticsPath of AnalyticsPaths) {
          const fileName = analyticsPath.split('/').pop()
          const newFilePath = path.join(processingFolderPath, fileName)
          const encodedPath = encodeURIComponent(analyticsPath)
          const url = this.getApiPath(encodedPath)
          let toContinue = await this.manageCompareFiles(
            url,
            fileName + '.xml',
            newFilePath + '.xml',
            null,
            progressBar,
            event
          ).then((compareData) => {
            progressBar += incrementPerAnalyticsStep
            event.reply('profile:process:progress', progressBar)
            return compareData
          })

          if (
            toContinue &&
            toContinue.resumptionToken &&
            toContinue.resumptionToken !== '' &&
            toContinue.isFinished !== 'true'
          ) {
            let isFinished = false
            let i = 1
            while (!isFinished) {
              const newUrl = this.getPaginationUrl(toContinue.resumptionToken)
              toContinue = await this.manageCompareFiles(
                newUrl,
                fileName + i + '.xml',
                newFilePath + i + '.xml',
                toContinue.columnNames,
                progressBar,
                event
              )
              isFinished = toContinue.isFinished !== 'false'
              i++
            }
            this.manageMessages(event, `Fin de traitement des fichiers de comparaison`)
            progressBar += incrementPerAnalyticsStep
            event.reply('profile:process:progress', progressBar)
          }
        }
      }

      if (profile['Type de fichier en entrée'] === 'Webservice') {
        //Process Webservice
        await this.processWebservice(profile, processingFolderPath, event, progressBar)
      } else {
        //Process Bacon
        await this.processBacon(profile, processingFolderPath, event, progressBar)
      }

      this.manageMessages(event, 'Traitement terminé')
      event.reply('profile:process:progress', 100)

      //Write in a file the messages
      fileName = `${profile['Nom du profil']}_rapport`
      // Transformation de this.messages en un tableau d'objets
      const messagesObjects = this.messages.map((Rapport) => ({ Rapport }))

      // Appel de this.writeToFile avec le tableau d'objets
      this.writeToFile(messagesObjects, processingFolderPath, fileName)

      //Destroy input data
      this.inputData = []
      this.compareData = []
      this.originalFilePath = ''
      this.compareFilePath = ''
      this.messages = []
      event.returnValue = profile
    })

    // Ajout du gestionnaire d'événements pour ouvrir le dossier
    ipcMain.on('open:folder', () => {
      if (this.currentProcessingFolder) {
        shell.openPath(this.currentProcessingFolder)
      }
    })
  }

  /**
   * Handles the deletion of MMS records by extracting their IDs, writing them to a file,
   * and managing related messages.
   *
   * @param {Array<Object>} aSupprimer - An array of objects representing the records to be deleted.
   * @param {string} fileName - The name of the file to write the MMS IDs to.
   * @param {string} processingFolderPath - The path where the file should be saved.
   * @param {Event} event - The event that triggered this function.
   */
  mms_aSupprimer(aSupprimer, processingFolderPath, event) {
    const fileName = 'MMS_aSupprimer'
    //Get "MMS id" from aSupprimer
    const mmsIds = aSupprimer.map((record) => {
      return { 'MMS Id': record['MMS Id'] }
    })
    //Write MMS id to a file
    this.writeToFile(mmsIds, processingFolderPath, fileName, event)
    this.manageMessages(event, `Fichier MMS à supprimer : ${fileName}`)
  }

  portfolioId_aSupprimer(aSupprimer, processingFolderPath, event) {
    const fileName = 'Portfolio_Id_aSupprimer'
    //Get "Portfolio Id" from aSupprimer
    const portfolioIds = aSupprimer.map((record) => {
      return { 'Portfolio Id': record['Portfolio Id'] }
    })
    //Write Portfolio id to a file
    this.writeToFile(portfolioIds, processingFolderPath, fileName, event)
    this.manageMessages(event, `Fichier Portfolio à supprimer : ${fileName}`)
  }

  ppn_url_aSupprimer(aSupprimer, processingFolderPath, event) {
    const fileName = 'PPN_URL_aSupprimer'
    //Get "PPN" from aSupprimer
    const ppn_urls = aSupprimer.map((record) => {
      let ppn = ''
      if (record['993 - Local Param 01']) {
        ppn = record['993 - Local Param 01'].replace(/^\(PPN\)/, '')
      } else if (record['PPN']) {
        ppn = record['PPN'].replace(/^\(PPN\)/, '')
      } else if (record['999 - Local Param 05']) {
        ppn = record['999 - Local Param 05'].replace(/^\(PPN\)/, '')
      }
      let url = ''
      if (record['Portfolio Static URL (override)']) {
        url = record['Portfolio Static URL (override)'].replace(/^jkey=/, '')
      } else if (record['Portfolio Static URL']) {
        url = record['Portfolio Static URL'].replace(/^jkey=/, '')
      } else if (record['Portfolio Internal Description']) {
        url = record['Portfolio Internal Description']
      }
      return { PPN: ppn, URL: url }
    })
    //Write PPN to a file
    this.writeToFile(ppn_urls, processingFolderPath, fileName, event)
    this.manageMessages(event, `Fichier PPN-URL à supprimer : ${fileName}`)
  }

  /**
   * Sépare les enregistrements en deux listes : valides et avec erreurs.
   * Une erreur est définie par les conditions suivantes :
   * - URL manquante
   * - PPN manquant
   * - URL contient un point-virgule
   *
   * @param {Array} records - Le tableau des enregistrements à filtrer.
   * @param {string|null} type - Le type d'enregistrement (optionnel).
   * @returns {Object} - Un objet contenant deux tableaux : `validRecords` et `errorRecords`.
   */
  separateRecords(records, type = null) {
    const validRecords = []
    const errorRecords = []

    records.forEach((record) => {
      let hasURL, hasPPN, hasSemicolon

      if (type === 'Bacon') {
        hasURL =
          record.title_url && record.title_url.length > 0 && record.title_url.includes('http')
        hasPPN = record.bestppn && record.bestppn.length > 0 && !record.bestppn.includes('null')
        hasSemicolon = record.title_url.includes(';')
      } else {
        hasURL = record.URL && record.URL.length > 0 && record.URL.includes('http')
        hasPPN = record.PPN && record.PPN.length > 0 && !record.PPN.includes('null')
        hasSemicolon = record.URL.includes(';')
      }

      let errorType = ''
      if (!hasURL) {
        errorType += 'URL manquante'
      } else if (!hasPPN) {
        errorType += 'PPN manquant'
      } else if (hasSemicolon) {
        errorType += 'URL contient un point-virgule'
      }
      record.errorType = errorType

      if (hasURL && hasPPN && !hasSemicolon) {
        validRecords.push(record)
      } else {
        errorRecords.push(record)
      }
    })

    return { validRecords, errorRecords }
  }

  /**
   * Saves the profiles to a CSV file.
   *
   * @param {Array} profiles - The array of profiles to be saved.
   * @returns {void}
   */
  async saveProfile(profiles) {
    const Store = await import('electron-store')
    const store = new Store.default()

    const folderPath = store.get('folderPath')
    const filePath = path.join(folderPath, 'profils.csv')

    // Collecter toutes les clés uniques
    const allKeys = new Set()
    profiles.forEach((profile) => {
      Object.keys(profile).forEach((key) => allKeys.add(key))
    })

    // Convertir le Set en tableau
    const keysArray = Array.from(allKeys)

    // Convertir les objets en utilisant toutes les clés
    const normalizedProfiles = profiles.map((profile) => {
      const normalizedProfile = {}
      keysArray.forEach((key) => {
        normalizedProfile[key] = profile[key] || ''
      })
      return normalizedProfile
    })

    stringify(normalizedProfiles, { header: true, delimiter: ';' }, async (err, output) => {
      if (err) {
        console.error('Error saving profile:', err)
        return
      }

      try {
        fs.writeFileSync(filePath, output, { flag: 'w' })
      } catch (error) {
        console.error('Error writing profile:', error)
      }
    })
  }

  /**
   * Constructs the API path by replacing placeholders with actual values.
   *
   * @param {string} encodedPath - The encoded path to be inserted into the URL.
   * @returns {string} - The constructed API path with the encoded path and API key.
   */
  getApiPath(encodedPath) {
    let url = this.analyticsPath
    //replace from string {encodedPath} by encodedPath
    url = url.replace('{encodedPath}', encodedPath)
    //replace from string {apiKey} by tokenAPI
    url = url.replace('{apiKey}', this.tokenAPI)
    return url
  }

  /**
   * Generates a pagination URL by replacing placeholders with actual values.
   *
   * @param {string} resumptionToken - The token used for pagination.
   * @returns {string} - The URL with the placeholders replaced by the actual values.
   */
  getPaginationUrl(resumptionToken) {
    let url = this.paginationPath
    //replace from string {resumptionToken} by resumptionToken
    url = url.replace('{resumptionToken}', resumptionToken)
    //replace from string {apiKey} by tokenAPI
    url = url.replace('{apiKey}', this.tokenAPI)
    return url
  }

  async manageCompareFiles(url, fileName, newFilePath, columns, progressBar, event) {
    try {
      console.log('Downloading compare file...')
      console.log(`Téléchargement du fichier de comparaison : ${fileName}`)
      progressBar += 2
      event.reply('profile:process:progress', progressBar)

      await this.downloadFile(url, newFilePath)
        .then(() => {
          console.log(`Fichier de comparaison téléchargé : ${fileName}`)
        })
        .catch((error) => {
          console.error('Error downloading compare file:', error)
          this.manageMessages(
            event,
            `Erreur lors du téléchargement du fichier de comparaison : ${fileName} ${error} URL : ${url}`
          )
        })

      const compareData = await this.setCompareData(newFilePath, columns, event)

      return compareData
    } catch (error) {
      console.error('An error occurred in manageCompareFiles:', error)
      this.manageMessages(
        event,
        `Erreur lors de la gestion des fichiers de comparaison : ${fileName} ${error}`
      )
      return undefined
    }
  }
}
