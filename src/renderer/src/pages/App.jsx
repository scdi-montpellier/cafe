import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import AddProfile from '../components/AddProfile'
import ProfileCard from '../components/ProfileCard'

function App() {
  const { ipcRenderer } = window.electron
  const navigate = useNavigate() // Hook to navigate programmatically

  const [profiles, setProfiles] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  // Load documentation path
  const documentationPath = ipcRenderer.sendSync('documentationPath:get') || ''

  useEffect(() => {
    // Send the 'profiles:get' event
    ipcRenderer.send('profiles:get')

    // Function to handle 'profiles:load' event
    const handleProfilesLoad = (_, data) => {
      setProfiles(data)
    }

    // Add the event listener
    ipcRenderer.on('profiles:load', handleProfilesLoad)

    // Clean up the event listener when the effect is re-run or on component unmount
    return () => {
      ipcRenderer.removeListener('profiles:load', handleProfilesLoad)
    }
  }, []) // Empty dependency array means this effect runs once on mount and clean up on unmount

  useEffect(() => {
    // Écouteur pour la navigation
    const handleNavigation = (_, path) => {
      navigate(path)
    }

    ipcRenderer.on('navigate', handleNavigation)

    return () => {
      ipcRenderer.removeListener('navigate', handleNavigation)
    }
  }, [navigate])

  const filteredProfiles = profiles.filter((profile) =>
    profile['Nom du profil'].toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Order filtered profiles by name
  filteredProfiles.sort((a, b) => a['Nom du profil'].localeCompare(b['Nom du profil']))

  const lateProfiles = filteredProfiles.filter((profile) => profile.isLate === true)

  return (
    <>
      <Sidebar
        setSearchTerm={setSearchTerm}
        profiles={lateProfiles}
        documentationPath={documentationPath}
      ></Sidebar>
      <main className="w-full p-8">
        <Header></Header>
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <AddProfile></AddProfile>
          {filteredProfiles.map((item, index) => (
            <ProfileCard
              key={index}
              group={item['Nom du profil']}
              periodic={item.URL}
              history={item.profileHistory}
              profile={item}
              cardKey={item.lineNumber} // Pass 'key' as 'cardKey' to avoid conflict with React's 'key' prop
            ></ProfileCard>
          ))}
        </section>
      </main>
    </>
  )
}

export default App
