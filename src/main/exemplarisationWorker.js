self.onmessage = function (event) {
  const { records, profile, type } = event.data

  function createExemplarisationEbooks(records, profile) {
    const exemplarisation = []

    const isAnalyser =
      profile['E856$b - préfixe à supprimer'] ||
      profile['E856$b - suffixe à supprimer'] ||
      profile['E856$b - préfixe à ajouter']
    console.log('isAnalyserEbook:', isAnalyser)

    console.log('test:', 'createExemplarisationEbooks')

    let keyE856$q = profile['E856$l'] ? '$q' : 'E856$q'
    let keyU856$u = profile['E856$l'] || profile['E856$b'] ? '$u' : 'E856$u - préfixe à ajouter'
    let key930$j = profile['930 $a'] ? '$j' : '930$j'

    if (profile['Type de fichier en entrée'] === 'Bacon') {
      records.forEach((record) => {
        record.title_url = record.title_url.replace(profile['E856$u - préfixe à supprimer'], '')
        record.title_url = record.title_url.replace(profile['E856$u - suffixe à supprimer'], '')

        const exemplarisationRecord = {
          PPN: record.bestppn,
          ...(profile['930 $a'] ? { '930 $a': profile['930 $a'] } : {}),
          ...(profile['930$j'] ? { [key930$j]: profile['930$j'] } : {}),
          ...(profile['991$a'] ? { '991$a': profile['991$a'] } : {}),
          ...(profile['E316$a'] ? { E316$a: profile['E316$a'] } : {}),
          ...(profile['E856$l'] ? { E856$l: profile['E856$l'] } : {}),
          ...(profile['E856$q'] ? { [keyE856$q]: profile['E856$q'] } : {}),
          [keyU856$u]: profile['E856$u - préfixe à ajouter'] + record.title_url,
          ...(profile['E856$z'] ? { $z: profile['E856$z'] } : {}),
          ...(profile['E856$9'] ? { $9: profile['E856$9'] } : {})
        }
        if (isAnalyser) {
          exemplarisation.push(addAnalyser(exemplarisationRecord, profile))
        } else {
          exemplarisation.push(exemplarisationRecord)
        }
      })
    } else {
      records.forEach((record) => {
        record.URL = record.URL.replace(profile['E856$u - préfixe à supprimer'], '')
        record.URL = record.URL.replace(profile['E856$u - suffixe à supprimer'], '')

        const exemplarisationRecord = {
          PPN: record.PPN,
          ...(profile['930 $a'] ? { '930 $a': profile['930 $a'] } : {}),
          ...(profile['930$j'] ? { [key930$j]: profile['930$j'] } : {}),
          ...(profile['991$a'] ? { '991$a': profile['991$a'] } : {}),
          ...(profile['E316$a'] ? { E316$a: profile['E316$a'] } : {}),
          ...(profile['E856$l'] ? { E856$l: profile['E856$l'] } : {}),
          ...(profile['E856$q'] ? { [keyE856$q]: profile['E856$q'] } : {}),
          [keyU856$u]: profile['E856$u - préfixe à ajouter'] + record.URL,
          ...(profile['E856$z'] ? { $z: profile['E856$z'] } : {}),
          ...(profile['E856$9'] ? { $9: profile['E856$9'] } : {})
        }
        if (isAnalyser) {
          exemplarisation.push(addAnalyser(exemplarisationRecord, profile))
        } else {
          exemplarisation.push(exemplarisationRecord)
        }
      })
    }
    return exemplarisation
  }

  function createExemplarisationPeriodics(records, profile) {
    const exemplarisation = []
    const profileE856z = profile['E856$z'].replace('(année de début)-(année de fin)', '')
    console.log('test:', 'createExemplarisationPeriodics')

    const isAnalyser =
      profile['E856$b - préfixe à supprimer'] ||
      profile['E856$b - suffixe à supprimer'] ||
      profile['E856$b - préfixe à ajouter']
    console.log('isAnalyserPerio:', isAnalyser)

    let keyE856$q = profile['E856$l'] ? '$q' : 'E856$q'
    let keyU856$u = profile['E856$l'] || profile['E856$b'] ? '$u' : 'E856$u - préfixe à ajouter'
    let key930$j = profile['930 $a'] ? '$j' : '930$j'

    records.forEach((record) => {
      let date_first_issue_online = record.date_first_issue_online
        ? record.date_first_issue_online.split('-')[0]
        : '-'
      let date_last_issue_online = record.date_last_issue_online
        ? record.date_last_issue_online.split('-')[0]
        : '....'
      let zDate = `(${date_first_issue_online})`
      if (date_last_issue_online !== date_first_issue_online) {
        zDate = `(${date_first_issue_online})-(${date_last_issue_online})`
      }

      record.title_url = record.title_url.replace(profile['E856$u - préfixe à supprimer'], '')
      record.title_url = record.title_url.replace(profile['E856$u - suffixe à supprimer'], '')

      let p955$a = !record.date_last_issue_online
        ? date_first_issue_online + '-'
        : date_first_issue_online

      let embargoInfo = getEmbargoInfo(record)

      const exemplarisationRecord = {
        PPN: record.bestppn,
        ...(profile['930 $a'] ? { '930 $a': profile['930 $a'] } : {}),
        ...(profile['930$j'] ? { [key930$j]: profile['930$j'] } : {}),
        ...(profile['991$a'] ? { '991$a': profile['991$a'] } : {}),
        '955 $a': p955$a,
        $k: `${record.date_last_issue_online && date_last_issue_online != date_first_issue_online ? date_last_issue_online : ''}`,
        $4: `${profile['955 $4']}${embargoInfo}`,
        ...(profile['E316$a'] ? { E316$a: profile['E316$a'] } : {}),
        ...(profile['E856$l'] ? { E856$l: profile['E856$l'] } : {}),
        ...(profile['E856$q'] ? { [keyE856$q]: profile['E856$q'] } : {}),
        [keyU856$u]: profile['E856$u - préfixe à ajouter'] + record.title_url,
        $z: `${profileE856z}${zDate}${embargoInfo}`,
        ...(profile['E856$9'] ? { $9: profile['E856$9'] } : {})
      }
      if (isAnalyser) {
        exemplarisation.push(addAnalyser(exemplarisationRecord, profile))
      } else {
        exemplarisation.push(exemplarisationRecord)
      }
    })
    return exemplarisation
  }

  function addAnalyser(record, profile) {
    let analyser = record.$u
    if (profile['E856$b - préfixe à supprimer']) {
      analyser = analyser.replace(profile['E856$b - préfixe à supprimer'], '')
    }
    if (profile['E856$b - suffixe à supprimer']) {
      analyser = analyser.replace(profile['E856$b - suffixe à supprimer'], '')
    }
    if (profile['E856$b - préfixe à ajouter']) {
      analyser = profile['E856$b - préfixe à ajouter'] + analyser
    }
    let newRecord = {}

    for (let key in record) {
      newRecord[key] = record[key]
      if (key === '991$a' && profile.Type === 'Ebooks') {
        newRecord['E856$b'] = analyser
      }
      if (key === '$4' && profile.Type === 'Périodique') {
        newRecord['E856$b'] = analyser
      }
      if (key === 'E856$l') {
        newRecord['$l'] = record['E856$l']
        delete newRecord['E856$l']
      }
    }
    return newRecord
  }

  function getEmbargoInfo(record) {
    let embargoInfo = ''
    if (record.embargo_info) {
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

  let result
  if (type === 'Ebooks') {
    console.log('goto createExemplarisationEbooks')
    result = createExemplarisationEbooks(records, profile)
  } else if (type === 'Périodique') {
    console.log('goto createExemplarisationPeriodics')
    result = createExemplarisationPeriodics(records, profile)
  }

  self.postMessage(result)
}
