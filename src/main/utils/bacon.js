import { processUrls, compareUrls } from './urls'
import { createExemplarisationEbooks, createExemplarisationPeriodics } from './examplarisation'

export async function processBacon(profile, processingFolderPath, event, progressBar) {
  console.log('Processing Bacon...')
  this.manageMessages(event, 'Traitement Bacon')

  // Filter records based on publication_type
  const psRecords = []
  const ebookRecords = []
  for (const record of this.inputData) {
    if (record.publication_type === 'serial') {
      psRecords.push(record)
    } else if (record.publication_type === 'monograph') {
      ebookRecords.push(record)
    }
  }
  this.manageMessages(event, `Périodiques : ${psRecords.length}`)
  this.manageMessages(event, `Ebooks : ${ebookRecords.length}`)

  let fileName = ''

  let records = []

  if (profile['Type'] === 'Périodique') {
    records = psRecords
    fileName = `${profile['Nom du profil']}_Ebooks`
    this.writeToFile(ebookRecords, processingFolderPath, fileName)
  } else if (profile['Type'] === 'Ebooks') {
    records = ebookRecords
    fileName = `${profile['Nom du profil']}_PS`
    this.writeToFile(psRecords, processingFolderPath, fileName)
  }
  progressBar += 5
  event.reply('profile:process:progress', progressBar)

  let originalNbrRecords = records.length

  // Utiliser un Set pour vérifier les doublons
  const seen = new Set()
  records = records.filter((record) => {
    const recordString = JSON.stringify(record)
    if (seen.has(recordString)) {
      return false
    }
    seen.add(recordString)
    //+ SLP 26/09/2025
    record.originalURL = record.title_url
    //traitement des URLs
    record.title_url = processUrls(record.title_url, profile)
    //- SLP 26/09/2025
    return true
  })

  this.manageMessages(event, `Lignes en double : ${originalNbrRecords - records.length}`)
  progressBar += 10
  event.reply('profile:process:progress', progressBar)

  this.writeToFile(records, processingFolderPath, `${profile['Nom du profil']}_OK`)

  // A Ajouter : URL in input file but not in compare file
  const aAjouter = []
  const validAAjouter = []

  //Compare valide records with compare file
  if (this.compareData && this.compareData.length > 0) {
    // Déjà traité : same URL in both files
    const dejaTraite = []
    // A supprimer : URL in compare file but not in input file
    const aSupprimer = []
    // A ajouter : URL in input file but not in compare file
    const aAjouter = []

    let iterationCompareFile = 10 / this.compareData.length
    this.compareData.forEach((compareRecord) => {
      let found = false
      for (let i = 0; i < records.length; i++) {
        if (compareUrls(records[i].title_url, compareRecord)) {
          dejaTraite.push(compareRecord)
          records.splice(i, 1) // Supprimer l'enregistrement trouvé
          found = true
          break
        }
      }
      if (!found) {
        aSupprimer.push(compareRecord)
      }

      progressBar += iterationCompareFile
      event.reply('profile:process:progress', progressBar)
    })

    let iterationRecords = 10 / records.length
    records.forEach((record) => {
      const found = this.compareData.find((compareRecord) =>
        compareUrls(record.title_url, compareRecord)
      )
      if (!found) {
        aAjouter.push(record)
      }
      progressBar += iterationRecords
      event.reply('profile:process:progress', progressBar)
    })

    event.reply('profile:process:progress', (progressBar = 70))

    //Save dejaTraite records to a file
    fileName = `${profile['Nom du profil']}_dejaTraite`
    this.writeToFile(dejaTraite, processingFolderPath, fileName)

    //Save aSupprimer records to a file
    fileName = `${profile['Nom du profil']}_aSupprimer`
    this.writeToFile(aSupprimer, processingFolderPath, fileName)

    //Save aAjouter records to a file
    fileName = `${profile['Nom du profil']}_aAjouter`
    this.writeToFile(aAjouter, processingFolderPath, fileName)

    const { validRecords, errorRecords } = this.separateRecords(
      aAjouter,
      profile['Type de fichier en entrée']
    )
    validAAjouter.push(...validRecords)
    console.log('Error records:', errorRecords.length)
    progressBar += 2
    event.reply('profile:process:progress', progressBar)

    //Ecrire dans un fichier CSV les erreurs
    fileName = `${profile['Nom du profil']}_anomalies`
    this.writeToFile(errorRecords, processingFolderPath, fileName)

    if (profile['Chemin du rapport Analytics'] !== '') {
      this.manageMessages(event, 'Génération fichiers à supprimer')
      this.ppn_url_aSupprimer(aSupprimer, processingFolderPath, event)
      this.mms_aSupprimer(aSupprimer, processingFolderPath, event)
      this.portfolioId_aSupprimer(aSupprimer, processingFolderPath, event)
      event.reply('profile:process:progress', 85)
    }

    this.manageMessages(event, `Déjà traité : ${dejaTraite.length}`)
    this.manageMessages(event, `A ajouter : ${aAjouter.length}`)
    this.manageMessages(event, `Erreurs trouvées : ${errorRecords.length}`)
    this.manageMessages(event, `A supprimer : ${aSupprimer.length}`)
  }

  //Add valid records to aAjouter if no records to add for exemplarisation
  let increase = 10 / records.length
  if (aAjouter.length === 0 && records.length > 0 && this.compareData.length === 0) {
    aAjouter.push(...records)
    progressBar += increase
    event.reply('profile:process:progress', progressBar)

    //manage errors
    const { validRecords, errorRecords } = this.separateRecords(
      aAjouter,
      profile['Type de fichier en entrée']
    )
    validAAjouter.push(...validRecords)
    console.log('Error records:', errorRecords.length)
    progressBar += 2

    //Ecrire dans un fichier CSV les erreurs
    fileName = `${profile['Nom du profil']}_anomalies`
    this.writeToFile(errorRecords, processingFolderPath, fileName)

    event.reply('profile:process:progress', progressBar)
    this.manageMessages(event, `Erreurs trouvées : ${errorRecords.length}`)
  }
  //+ SLP 26/09/2025
  // validAAjouter.forEach((record) => {
    // record.originalURL = record.title_url
    //traitement des URLs
    // record.title_url = processUrls(record.title_url, profile)
  // })
  //- SLP 26/09/2025

  //Exemplarisation Periodics
  if (profile['Type'] === 'Périodique') {
    const exemplarisation = createExemplarisationPeriodics(validAAjouter, profile)
    //Exemplarisation Periodics avec RCR
    fileName = `${profile['Nom du profil']}_RCR_${profile['930 $b']}`
    this.writeToFile(exemplarisation, processingFolderPath, fileName, event, true)
  } else if (profile['Type'] === 'Ebooks') {
    const exemplarisation = createExemplarisationEbooks(validAAjouter, profile)
    //Exemplarisation Ebooks avec RCR
    fileName = `${profile['Nom du profil']}_RCR_${profile['930 $b']}`
    this.writeToFile(exemplarisation, processingFolderPath, fileName, event, true)
  }

  event.reply('profile:process:progress', 95)

  this.manageMessages(event, `Données en entrée : ${this.inputData.length}`)
  //this.manageMessages(event, `Données valides : ${records.length}`)
  this.manageMessages(event, `Données de comparaison : ${this.compareData.length}`)
  this.manageMessages(event, `Exemplarisation : ${validAAjouter.length}`)
}
