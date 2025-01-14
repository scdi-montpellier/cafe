import { Link } from 'react-router-dom'

const Header = () => {
  return (
    <header className="flex items-end justify-between mb-8 space-x-5">
      <h1>Liste des profils</h1>
      <Link to="/config" className="dark:text-deep-sea-50">
        Configuration
      </Link>
    </header>
  )
}

export default Header
