import { Link } from 'react-router-dom'

const AddProfile = () => {
  return (
    <Link
      to="/profile"
      className="flex items-center justify-center p-4 border from-pastel-green-500 to-pastel-green-400 dark:from-deep-sea-950 dark:to-deep-sea-900 border-cafe-300 bg-gradient-to-tr hover:drop-shadow-xl"
    >
      <p className="font-serif text-3xl tracking-wide text-cafe-300">Ajouter un profil</p>
    </Link>
  )
}

export default AddProfile
