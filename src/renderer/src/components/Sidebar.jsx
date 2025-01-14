import logo from '../assets/logo.svg'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import VersionApp from './VersionApp'
import feuilles from '../assets/feuilles.svg'

const Sidebar = ({ setSearchTerm, profiles, documentationPath }) => {
  const handleSearch = (event) => {
    const value = event.target.value
    if (value.length >= 3) {
      setSearchTerm(value)
    } else {
      setSearchTerm('')
    }
  }

  return (
    <div className="flex flex-col justify-center min-h-full border from-pastel-green-500 to-pastel-green-400 dark:from-deep-sea-950 dark:to-deep-sea-900 bg-gradient-to-br w-80 border-cafe-300">
      <div className="flex flex-col items-center justify-center p-8">
        <img src={logo} alt="Café" />
        <VersionApp />
      </div>
      <nav className="relative flex-grow overflow-hidden">
        <ul className="flex flex-col justify-center px-4">
          <li className="p-4">
            <input
              type="text"
              id="search"
              className="w-full h-10 px-5 pr-10 text-sm bg-deep-sea-50 focus:outline-none"
              placeholder="Chercher un profil..."
              onChange={handleSearch}
            />
          </li>
          <li className="p-4">
            <a
              href={documentationPath}
              target="_blank"
              rel="noreferrer"
              className="inline-block w-full px-4 py-2 font-serif font-bold tracking-wider text-center border hover:bg-pastel-green-600 text-cafe-300 bg-pastel-green-500 dark:bg-deep-sea-900 border-cafe-300 dark:hover:bg-deep-sea-800"
            >
              Documentation
            </a>
          </li>
          {profiles.map((profile, index) => (
            <li key={index} className="p-4">
              <Link
                to={`/profile/${profile.lineNumber}`}
                className="inline-block w-full px-4 py-2 font-serif font-bold tracking-wider text-center border text-cafe-300 border-cafe-300 bg-pastel-green-500 hover:bg-pastel-green-600 dark:bg-deep-sea-900 dark:hover:bg-deep-sea-800"
              >
                {profile['Nom du profil']}
                {' - '}
                {profile && profile['profileHistory'] && profile['profileHistory'].length === 0
                  ? 'Jamais traité'
                  : profile && profile['profileHistory']
                    ? new Date(profile['profileHistory'][0].date).toLocaleDateString('fr-FR')
                    : 'Données non disponibles'}
              </Link>
            </li>
          ))}
        </ul>
        <div className="w-[70rem] -ml-10">
          <img src={feuilles} alt="cafeier" />
        </div>
      </nav>
    </div>
  )
}

Sidebar.propTypes = {
  setSearchTerm: PropTypes.func.isRequired,
  profiles: PropTypes.array.isRequired,
  documentationPath: PropTypes.string
}

export default Sidebar
