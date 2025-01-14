import { useState } from 'react'
import { Link } from 'react-router-dom'

const Config = () => {
  const { ipcRenderer } = window.electron
  const [folderPath, setFolderPath] = useState(ipcRenderer.sendSync('folderPath:get') || '')
  const [documentationPath, setDocumentationPath] = useState(
    ipcRenderer.sendSync('documentationPath:get') || ''
  )
  const [analyticsPath, setAnalyticsPath] = useState(
    ipcRenderer.sendSync('analyticsPath:get') || ''
  )
  const [paginationPath, setPaginationPath] = useState(
    ipcRenderer.sendSync('paginationPath:get') || ''
  )
  const [tokenAPI, setTokenAPI] = useState(ipcRenderer.sendSync('tokenAPI:get') || '')

  const [darkMode, setDarkMode] = useState(false) // Add dark mode state

  const handleFolderPathChange = () => {
    window.myAPI.selectFolder().then((result) => {
      setFolderPath(result)
    })
  }

  const handleSave = () => {
    {
      console.log('folderPath', folderPath)
      ipcRenderer.send('folderPath:set', folderPath)
      ipcRenderer.send('documentationPath:set', documentationPath)
      ipcRenderer.send('analyticsPath:set', analyticsPath)
      ipcRenderer.send('paginationPath:set', paginationPath)
      ipcRenderer.send('tokenAPI:set', tokenAPI)
      //alert to confirm the save
      alert('Configuration enregistrée')
      ipcRenderer.send('focus-fix')
    }
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode) // Toggle dark mode state
    ipcRenderer.invoke('dark-mode:toggle') // Send toggle dark mode event to main process
  }

  return (
    <div className={`w-full min-h-screen px-16 py-8 ${darkMode ? 'dark' : ''}`}>
      <header className="flex items-end justify-between gap-4 my-4">
        <h1>Configuration</h1>
        <Link to="/">Retour</Link>
      </header>
      <main className="flex flex-col justify-between gap-10 py-8 dark:text-deep-sea-50">
        <div className="flex items-center gap-2">
          {/* Add dark mode toggle button */}
          <button
            className="inline-block px-4 py-2 font-serif font-bold tracking-wider text-center border text-cafe-300 border-cafe-300 dark:hover:bg-deep-sea-800 dark:bg-deep-sea-900 bg-pastel-green-500 hover:bg-pastel-green-600"
            onClick={toggleDarkMode}
          >
            {darkMode ? 'Mode clair' : 'Mode sombre'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-block px-4 py-2 font-serif font-bold tracking-wider text-center border bg-pastel-green-500 hover:bg-pastel-green-600 text-cafe-300 dark:bg-deep-sea-900 border-cafe-300 dark:hover:bg-deep-sea-800"
            onClick={handleFolderPathChange}
          >
            Choisissez un dossier :
          </button>
          <p>{folderPath}</p>
        </div>
        <div className="grid items-center grid-cols-1 gap-2">
          <label htmlFor="documentationPath" className="font-serif font-bold dark:text-cafe-300">
            Lien vers la documentation :
          </label>
          <input
            id="documentationPath"
            type="text"
            className="w-full px-4 py-2 border border-deep-sea-900 dark:bg-deep-sea-50 dark:text-deep-sea-950"
            value={documentationPath}
            onChange={(e) => setDocumentationPath(e.target.value)}
          />
          <label htmlFor="analyticsPath" className="font-serif font-bold dark:text-cafe-300">
            Lien vers le rapport Analytics :
          </label>
          <input
            id="analyticsPath"
            type="text"
            className="w-full px-4 py-2 border border-deep-sea-900 dark:bg-deep-sea-50 dark:text-deep-sea-950"
            value={analyticsPath}
            onChange={(e) => setAnalyticsPath(e.target.value)}
          />
          <label htmlFor="paginationPath" className="font-serif font-bold dark:text-cafe-300">
            Lien de la pagination du rapport Analytics :
          </label>
          <input
            id="paginationPath"
            type="text"
            className="w-full px-4 py-2 border border-deep-sea-900 dark:bg-deep-sea-50 dark:text-deep-sea-950"
            value={paginationPath}
            onChange={(e) => setPaginationPath(e.target.value)}
          />
          <label htmlFor="tokenAPI" className="font-serif font-bold dark:text-cafe-300">
            Token API :
          </label>
          <input
            id="tokenAPI"
            type="password"
            className="w-full px-4 py-2 border border-deep-sea-900 dark:bg-deep-sea-50 dark:text-deep-sea-950"
            value={tokenAPI}
            onChange={(e) => setTokenAPI(e.target.value)}
          />
        </div>
        <div className="flex justify-center gap-2">
          <button
            className="w-56 px-4 py-2 mr-2 text-deep-sea-50 bg-deep-sea-700 hover:bg-deep-sea-600"
            onClick={handleSave}
          >
            Enregistrer
          </button>
        </div>
      </main>
    </div>
  )
}

export default Config
