import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import edit from '../assets/edit.svg'
import copy from '../assets/copy.svg'
import { useState, useEffect } from 'react'

const ProfileCard = ({ group, periodic, history, profile, cardKey }) => {
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    const handleProfileDuplicated = () => {
      window.location.reload()
    }

    window.electron.ipcRenderer.on('profile:duplicated', handleProfileDuplicated)

    return () => {
      window.electron.ipcRenderer.removeListener('profile:duplicated', handleProfileDuplicated)
    }
  }, [])

  useEffect(() => {
    // Restaurer la position de défilement après le rechargement de la page
    const scrollPosition = localStorage.getItem('scrollPosition')
    if (scrollPosition) {
      window.scrollTo(0, parseInt(scrollPosition, 10))
      localStorage.removeItem('scrollPosition')
    }
  }, [])

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // Afficher l'alerte
        setShowAlert(true)
        // Masquer l'alerte après 2 secondes
        setTimeout(() => setShowAlert(false), 2000)
      })
      .catch((err) => {
        console.error('Erreur lors de la copie du texte :', err)
      })
  }

  let link = `/profile/${cardKey}`
  const lastDate = history.length > 0 ? new Date(history[0].date).toLocaleDateString('fr-FR') : ''
  const datesInFrench =
    history.length > 0
      ? history.map((date) => new Date(date.date).toLocaleDateString('fr-FR')).join(', ')
      : ''
  return (
    <div className="relative p-4 transition border-2 bg-pastel-green-50 dark:bg-cafe-100 border-cafe-700 hover:border-cafe-300 hover:drop-shadow">
      {/* Card Header */}
      <div className="flex gap-2">
        <h2
          className="w-5/6 text-lg font-semibold"
          onClick={() => copyToClipboard(group)}
          style={{ cursor: 'pointer' }}
        >
          {group}
        </h2>
        {/* Affichage conditionnel de l'alerte */}
        {showAlert && (
          <div className="absolute p-2 border rounded shadow -right-3 alert -top-8 drop-shadow bg-slate-50/95 dark:bg-cafe-100/95 border-cafe-700">
            Nom du profil copié !
          </div>
        )}
        <ul className="flex flex-col items-end justify-start w-1/6 space-y-2">
          <li>
            <Link to={link} className="flex justify-end">
              <img className="h-8" src={edit} alt="Editer" title="Editer le profil" />
            </Link>
          </li>
          <li>
            <button
              onClick={() => {
                localStorage.setItem('scrollPosition', window.scrollY)
                window.electron.ipcRenderer.send('profile:duplicate', profile)
              }}
              className="flex justify-end"
            >
              <img className="h-8" src={copy} alt="Copier" title="Dupliquer le profil" />
            </button>
          </li>
        </ul>
      </div>
      {/* Card Body */}
      <div className="my-8 text-wrap">
        <p className="mb-2" title={datesInFrench}>
          {lastDate} ({history.length} traitement{history.length > 1 ? 's' : ''})
        </p>
        <p
          className="text-sm break-all text-deep-sea-700"
          dangerouslySetInnerHTML={{ __html: periodic.replace(/;/g, '<br />') }}
        />
      </div>
    </div>
  )
}

ProfileCard.propTypes = {
  group: PropTypes.string,
  periodic: PropTypes.string,
  history: PropTypes.array,
  profile: PropTypes.object,
  cardKey: PropTypes.number.isRequired
}

export default ProfileCard
