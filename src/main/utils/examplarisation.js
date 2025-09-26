/**
 * Creates an exemplarisation for Ebooks based on the given records.
 * The exemplarisation is an array of records with the following fields:
 * - PPN
 * - 930$a
 * - 930$j
 * - 991$a
 * - E856$l
 * - E856$u - préfixe à ajouter
 * - E856$z
 * @param {Array} records - The array of records.
 * @param {Object} profile - The profile object.
 * @param {string} type - The type of exemplarisation.
 * @returns {Array} - The array of exemplarisations.
 */
export function createExemplarisationEbooks(records, profile) {
  const exemplarisation = []

  const isAnalyser =
    profile['E856$b - préfixe à supprimer'] ||
    profile['E856$b - suffixe à supprimer'] ||
    profile['E856$b - préfixe à ajouter']
  console.log('isAnalyserEbooks:', isAnalyser)

  let keyE856$q = profile['E856$l'] ? '$q' : 'E856$q'
  let keyU856$u = profile['E856$l'] || profile['E856$q'] || isAnalyser ? '$u' : 'E856$u'
  let key930$j = profile['930 $a'] ? '$j' : '930$j'

  if (profile['Type de fichier en entrée'] === 'Bacon') {
    records.forEach((record) => {
      const exemplarisationRecord = {
        PPN: record.bestppn,
        ...(profile['930 $a'] ? { '930 $a': profile['930 $a'] } : {}),
        ...(profile['930$j'] ? { [key930$j]: profile['930$j'] } : {}),
        ...(profile['991$a'] ? { '991$a': profile['991$a'] } : {}),
        ...(profile['E316$a'] ? { E316$a: profile['E316$a'] } : {}),
        ...(profile['E856$l'] ? { E856$l: profile['E856$l'] } : {}),
        ...(profile['E856$q'] ? { [keyE856$q]: profile['E856$q'] } : {}),
        [keyU856$u]: record.title_url,
        ...(profile['E856$z'] ? { $z: profile['E856$z'] } : {}),
        ...(profile['E856$9'] ? { $9: profile['E856$9'] } : {})
      }
      if (isAnalyser) {
        exemplarisation.push(addAnalyser(exemplarisationRecord, profile, record.originalURL))
      } else {
        exemplarisation.push(exemplarisationRecord)
      }
    })
  } else {
    records.forEach((record) => {
      const exemplarisationRecord = {
        PPN: record.PPN,
        ...(profile['930 $a'] ? { '930 $a': profile['930 $a'] } : {}),
        ...(profile['930$j'] ? { [key930$j]: profile['930$j'] } : {}),
        ...(profile['991$a'] ? { '991$a': profile['991$a'] } : {}),
        ...(profile['E316$a'] ? { E316$a: profile['E316$a'] } : {}),
        ...(profile['E856$l'] ? { E856$l: profile['E856$l'] } : {}),
        ...(profile['E856$q'] ? { [keyE856$q]: profile['E856$q'] } : {}),
        [keyU856$u]: record.URL,
        ...(profile['E856$z'] ? { $z: profile['E856$z'] } : {}),
        ...(profile['E856$9'] ? { $9: profile['E856$9'] } : {})
      }
      if (isAnalyser) {
        exemplarisation.push(addAnalyser(exemplarisationRecord, profile, record.originalURL))
      } else {
        exemplarisation.push(exemplarisationRecord)
      }
    })
  }
  return exemplarisation
}

function getEmbargoInfo(record) {
  let embargoInfo = ''
  if (record.embargo_info) {
    //const type = record.embargo_info.charAt(0)
    let length = parseInt(record.embargo_info.slice(1, -1))
    let units = record.embargo_info.slice(-1)
    if (length === 0) return ''
    if (units === 'M') {
      units = 'mois'
    } else if (units === 'Y') {
      units = length > 1 ? 'ans' : 'an'
    } else if (units === 'D') {
      units = length > 1 ? 'jours' : 'jour'
    }

    embargoInfo = ` - Embargo : ${length} ${units}`
  }
  return embargoInfo
}

/**
 * Creates an exemplarisation for Periodics based on the given records.
 * The exemplarisation is an array of records with the following fields:
 * - PPN
 * - 930 $a
 * - 930$j
 * - 991 $a
 * - 955 $a
 * - $k
 * - $4
 * - E856$l
 * - $u
 * - $z
 * @param {Array} records - The array of records.
 * @param {Object} profile - The profile object.
 * @returns {Array} - The array of exemplarisations.
 */
export function createExemplarisationPeriodics(records, profile) {
  const exemplarisation = []
  //if E856$z ends with "(année de début)-(année de fin)", remove this part
  const profileE856z = profile['E856$z'].replace('(année de début)-(année de fin)', '')

  const isAnalyser =
    profile['E856$b - préfixe à supprimer'] ||
    profile['E856$b - suffixe à supprimer'] ||
    profile['E856$b - préfixe à ajouter']
  console.log('isAnalyserPeriodics:', isAnalyser)

  let keyE856$q = profile['E856$l'] ? '$q' : 'E856$q'
  let keyU856$u = profile['E856$l'] || profile['E856$q'] || isAnalyser ? '$u' : 'E856$u'
  let key930$j = profile['930 $a'] ? '$j' : '930$j'

  records.forEach((record) => {
    //Keep the year only
    let date_first_issue_online = record.date_first_issue_online
      ? record.date_first_issue_online.split('-')[0]
      : '-'
    let date_last_issue_online = record.date_last_issue_online
      ? record.date_last_issue_online.split('-')[0]
      : '....'
    //If date_first_issue_online and date_last_issue_online are the same, keep only one year
    let zDate = `(${date_first_issue_online})`
    if (date_last_issue_online !== date_first_issue_online) {
      zDate = `(${date_first_issue_online})-(${date_last_issue_online})`
    }

    let p955$a = !record.date_last_issue_online
      ? date_first_issue_online + '-'
      : date_first_issue_online

    let embargoInfo = getEmbargoInfo(record)

    //PPN;930 $a;$j;955 $a;$k;$4;E856$b;991$a;$l;$u;$z

    const exemplarisationRecord = {
      PPN: record.bestppn,
      ...(profile['930 $a'] ? { '930 $a': profile['930 $a'] } : {}),
      ...(profile['930$j'] ? { [key930$j]: profile['930$j'] } : {}),
      '955 $a': p955$a,
      $k: `${record.date_last_issue_online && date_last_issue_online != date_first_issue_online ? date_last_issue_online : ''}`,
      ...(profile['955 $4'] ? { $4: `${profile['955 $4']}${embargoInfo}` } : {}),
      ...(profile['991$a'] ? { '991$a': profile['991$a'] } : {}),
      ...(profile['E316$a'] ? { E316$a: profile['E316$a'] } : {}),
      ...(profile['E856$l'] ? { E856$l: profile['E856$l'] } : {}),
      ...(profile['E856$q'] ? { [keyE856$q]: profile['E856$q'] } : {}),
      [keyU856$u]: record.title_url,
      ...(profile['E856$z'] ? { $z: `${profileE856z}${zDate}${embargoInfo}` } : {}),
      ...(profile['E856$9'] ? { $9: profile['E856$9'] } : {})
    }
    if (isAnalyser) {
      exemplarisation.push(addAnalyser(exemplarisationRecord, profile, record.originalURL))
    } else {
      exemplarisation.push(exemplarisationRecord)
    }
  })
  return exemplarisation
}

/**
 * Adds an analyser to the record based on the provided profile.
 * The analyser is added based on the following rules:
 * - Replace the prefix to remove at the beginning of the URL
 * - Replace the suffix to remove at the end of the URL
 * - Add the prefix to add at the beginning of the URL
 * - Rename the key E856$l to $l
 * - Add the E856$b field after the 991$a field if the profile is Ebooks
 * - Add the E856$b field after the 955$4 field if the profile is Periodics
 *
 * @param {Object} record - The record object.
 * @param {Object} profile - The profile object.
 * @returns {Object} - The new record object with the analyser added.
 */
function addAnalyser(record, profile, originalUrl) {
  let analyser = originalUrl
  if (profile['E856$b - préfixe à supprimer']) {
    //Replace at the begin of URL
    analyser = analyser.replace(profile['E856$b - préfixe à supprimer'], '')
  }
  if (profile['E856$b - suffixe à supprimer']) {
    //Replace at the end of URL
    analyser = analyser.replace(profile['E856$b - suffixe à supprimer'], '')
  }
  //Add at the begin of URL
  if (profile['E856$b - préfixe à ajouter']) {
    analyser = profile['E856$b - préfixe à ajouter'] + (analyser || '')
  }

  let newRecord = {}

  //991$a est intercalé entre E856$b et $l. Cette zone devrait apparaitre avant E856.

  for (let key in record) {
    newRecord[key] = record[key]
    //Add E856$b after 991$a
    if (key === '991$a') {
      newRecord['E856$b'] = analyser
    }
    //Rename key E856$l by $l
    if (key === 'E856$l') {
      newRecord['$l'] = record['E856$l']
      delete newRecord['E856$l']
    }
  }
  return newRecord
}
