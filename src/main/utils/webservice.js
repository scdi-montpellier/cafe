import { processUrls, compareUrls } from './urls'
import { createExemplarisationEbooks } from './examplarisation'

export async function processWebservice(profile, processingFolderPath, event, progressBar) {
  this.manageMessages(event, 'Traitement Webservice')
  progressBar += 2
  event.reply('profile:process:progress', progressBar)
  const tempRecords = this.inputData

  //Check for double on the entire object
  const seen = new Set()
  const validRecords = tempRecords.filter((record) => {
    const recordString = JSON.stringify(record)
    if (seen.has(recordString)) {
      return false
    }
    seen.add(recordString)
    record.originalURL = record.URL
    //traitement des URLs
    record.URL = processUrls(record.URL, profile)
    return true
  })

  this.manageMessages(event, `URL en double : ${tempRecords.length - validRecords.length}`)
  progressBar += 5
  event.reply('profile:process:progress', progressBar)

  if (
    profile['E856$u - préfixe à supprimer'] ||
    profile['E856$u - suffixe à supprimer'] ||
    profile['E856$u - préfixe à ajouter']
  ) {
    this.manageMessages(event, 'Traitements des URLs')
  }

  // Déjà traité : same URL in both files
  const dejaTraite = []
  // A Ajouter : URL in input file but not in compare file
  const aAjouter = []
  // A supprimer : URL in compare file but not in input file
  const aSupprimer = []

  //Compare valide records with compare file
  if (this.compareData && this.compareData.length > 0) {
    let increase = 18 / this.compareData.length
    this.compareData.forEach((compareRecord) => {
      for (let i = 0; i < validRecords.length; i++) {
        if (compareUrls(validRecords[i].URL, compareRecord)) {
          dejaTraite.push(compareRecord)
          validRecords.splice(i, 1) // Supprimer l'enregistrement trouvé
          break
        }
        if (i === validRecords.length - 1) {
          aSupprimer.push(compareRecord)
        }
      }
      progressBar += increase
      event.reply('profile:process:progress', progressBar)
    })

    increase = 18 / validRecords.length
    validRecords.forEach((record) => {
      const found = this.compareData.find((compareRecord) => compareUrls(record.URL, compareRecord))
      if (!found) {
        aAjouter.push(record)
      }
      progressBar += increase
      event.reply('profile:process:progress', progressBar)
    })
  }

  //Save dejaTraite records to a file
  let fileName = `${profile['Nom du profil']}_dejaTraite`
  this.writeToFile(dejaTraite, processingFolderPath, fileName)

  //Save aSupprimer records to a file
  fileName = `${profile['Nom du profil']}_aSupprimer`
  this.writeToFile(aSupprimer, processingFolderPath, fileName)

  //Save aAjouter records to a file
  fileName = `${profile['Nom du profil']}_aAjouter`
  this.writeToFile(aAjouter, processingFolderPath, fileName)

  //Add valid records to aAjouter if no records to add for exemplarisation
  if (aAjouter.length === 0 && validRecords.length > 0 && this.compareData.length === 0) {
    aAjouter.push(...validRecords)
  }

  event.reply('profile:process:progress', 80)

  if (profile['Chemin du rapport Analytics'] !== '') {
    this.manageMessages(event, 'Génération fichiers à supprimer')
    this.ppn_url_aSupprimer(aSupprimer, processingFolderPath, event)
    this.mms_aSupprimer(aSupprimer, processingFolderPath, event)
    this.portfolioId_aSupprimer(aSupprimer, processingFolderPath, event)
    event.reply('profile:process:progress', 85)
  }

  const validAAjouter = []
  const separateRecords = this.separateRecords(aAjouter, profile['Type de fichier en entrée'])
  validAAjouter.push(...separateRecords.validRecords)
  progressBar += 2
  event.reply('profile:process:progress', progressBar)

  console.log('Error records:', separateRecords.errorRecords.length)
  progressBar += 2
  event.reply('profile:process:progress', progressBar)

  //Ecrire dans un fichier CSV les erreurs
  fileName = `${profile['Nom du profil']}_anomalies`
  this.writeToFile(separateRecords.errorRecords, processingFolderPath, fileName)

  let exemplarisationLength = 0
  if (profile['Type'] === 'Ebooks') {
    const exemplarisation = createExemplarisationEbooks(validAAjouter, profile)
    exemplarisationLength = exemplarisation.length
    //Exemplarisation Ebook avec RCR
    fileName = `${profile['Nom du profil']}_RCR_${profile['930 $b']}`
    this.writeToFile(exemplarisation, processingFolderPath, fileName, event, true)
  }
  event.reply('profile:process:progress', 90)
  this.manageMessages(event, `Données en entrée : ${this.inputData.length}`)

  this.manageMessages(event, `Données de comparaison : ${this.compareData.length}`)
  this.manageMessages(event, `Déjà traité : ${dejaTraite.length}`)
  this.manageMessages(event, `A ajouter : ${validAAjouter.length}`)
  this.manageMessages(event, `Exemplarisation : ${exemplarisationLength}`)
  this.manageMessages(event, `Erreurs trouvées : ${separateRecords.errorRecords.length}`)
  this.manageMessages(event, `A supprimer : ${aSupprimer.length}`)
}
