/**
 * Compares a given URL with a set of URLs from a compare record.
 *
 * @param {string} urlToCompare - The URL to be compared.
 * @param {Object} compareRecord - The record containing URLs to compare against.
 * @param {string} compareRecord.URL - The primary URL in the compare record.
 * @param {string} compareRecord['Portfolio Internal Description'] - An internal description URL in the compare record.
 * @param {string} compareRecord['Portfolio Static URL (override)'] - An override static URL in the compare record.
 * @param {string} compareRecord['Portfolio Static URL'] - A static URL in the compare record.
 * @returns {boolean} - Returns true if the URL matches any in the compare record, otherwise false.
 */
export function compareUrls(urlToCompare, compareRecord) {
  const extractJkey = (url) => {
    if (typeof url !== 'string') {
      return null // Retourne null si l'URL n'est pas une chaîne de caractères
    }

    const prefix = 'jkey='
    const index = url.indexOf(prefix)
    return index !== -1 ? url.substring(index + prefix.length) : url
  }

  const urlSet = new Set([
    compareRecord.URL,
    compareRecord['Portfolio Internal Description'],
    extractJkey(compareRecord['Portfolio Static URL (override)']),
    extractJkey(compareRecord['Portfolio Static URL'])
  ])

  // Vérifier si l'une des URLs correspond
  return urlSet.has(urlToCompare)
}

export function processUrls(recordUrl, profile) {
  if (profile['E856$u - préfixe à supprimer']) {
    //Replace at the begin of URL
    recordUrl = recordUrl.replace(profile['E856$u - préfixe à supprimer'], '')
  }
  if (profile['E856$u - suffixe à supprimer']) {
    //Replace at the end of URL
    recordUrl = recordUrl.replace(profile['E856$u - suffixe à supprimer'], '')
  }
  if (profile['E856$u - préfixe à ajouter']) {
    //Add at the begin of URL
    recordUrl = profile['E856$u - préfixe à ajouter'] + recordUrl
  }
  return recordUrl
}
