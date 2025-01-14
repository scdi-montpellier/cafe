/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { TextField } from '../components/common/TextField'
import { RadioField } from '../components/common/RadioField'
import Modal from '../components/Modal'

const Profile = () => {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [isEbooks, setIsEbooks] = useState(false)
  const [selectedTypeValue, setSelectedValue] = useState(profile ? profile.Type : '' || '')
  const [selectedInputType, setSelectedInputType] = useState(
    profile ? profile['Type de fichier en entrée'] : '' || ''
  )
  const [selectedPeriodicity, setSelectedPeriodicity] = useState(
    profile ? profile.Périodicité : '' || ''
  )
  const [modalMessages, setModalMessages] = useState([])
  const { ipcRenderer } = window.electron
  const [progressPercentage, setProgressPercentage] = useState(0)

  useEffect(() => {
    if (id) {
      const profileData = ipcRenderer.sendSync('profile:get', id)
      setProfile(profileData)
      setIsEbooks(profileData.Type === 'Ebooks')
      setSelectedValue(profileData.Type)
      setSelectedInputType(profileData['Type de fichier en entrée'])
      setSelectedPeriodicity(profileData.Périodicité)
    }
  }, [id]) // Depend on 'id'

  // Dans Profile.jsx
  useEffect(() => {
    ipcRenderer.on('profile:process:status', (event, message) => {
      // Mettez à jour l'état avec le nouveau message
      setModalMessages((prevMessages) => [...prevMessages, message])
    })

    // N'oubliez pas de nettoyer l'écouteur d'événements lorsque le composant est démonté
    return () => {
      ipcRenderer.removeAllListeners('profile:process:status')
    }
  }, [])

  // Progress bar
  useEffect(() => {
    ipcRenderer.on('profile:process:progress', (event, percentage) => {
      setProgressPercentage(percentage)
    })
  }, [])

  console.log('id', id)
  console.log('profile', profile)

  const handleRadioChange2 = (event) => {
    setIsEbooks(event.target.value === 'Ebooks')
    setSelectedValue(event.target.value)
  }

  const handleInputTypeChange = (event) => {
    setSelectedInputType(event.target.value)
  }

  const handlePeriodicityChange = (event) => {
    setSelectedPeriodicity(event.target.value)
  }

  if (profile === null && id) {
    return <div>Chargement...</div> // Affiche un message de chargement si profile est null
  }

  return (
    <div className="w-full px-16 py-8">
      <header className="flex items-end justify-between gap-4 my-4">
        <h1 className="text-3xl font-bold">{profile ? profile['Nom du profil'] : 'Formulaire'}</h1>
        <Link className="dark:text-deep-sea-50" to="/">
          Retour
        </Link>
      </header>
      <Formik
        initialValues={{
          'Nom du profil': profile ? profile['Nom du profil'] : '',
          Description: profile ? profile.Description : '',
          URL: profile ? profile.URL : '',
          'Type de fichier en entrée':
            profile && profile['Type de fichier en entrée']
              ? profile['Type de fichier en entrée']
              : '' || '',
          Type: profile && profile.Type ? profile.Type : '',
          Périodicité: profile && profile.Périodicité ? profile.Périodicité : '' || '',
          '930 $a': profile ? profile['930 $a'] : '' || '',
          '930 $b': profile ? profile['930 $b'] || profile['RCR'] : '' || '',
          '930$j': profile ? profile['930$j'] : '' || '',
          '955 $4': profile ? profile['955 $4'] : '' || '',
          '991$a': profile ? profile['991$a'] : '' || '',
          E316$a: profile ? profile['E316$a'] : '' || '',
          'E856$b - préfixe à supprimer': profile
            ? profile['E856$b - préfixe à supprimer']
            : '' || '',
          'E856$b - suffixe à supprimer': profile
            ? profile['E856$b - suffixe à supprimer']
            : '' || '',
          'E856$b - préfixe à ajouter': profile ? profile['E856$b - préfixe à ajouter'] : '' || '',
          'E856$u - préfixe à supprimer': profile
            ? profile['E856$u - préfixe à supprimer']
            : '' || '',
          'E856$u - suffixe à supprimer': profile
            ? profile['E856$u - suffixe à supprimer']
            : '' || '',
          'E856$u - préfixe à ajouter': profile ? profile['E856$u - préfixe à ajouter'] : '' || '',
          E856$l: profile ? profile['E856$l'] : '' || '',
          E856$q: profile ? profile['E856$q'] : '' || '',
          E856$z: profile ? profile['E856$z'] : '' || '',
          E856$9: profile ? profile['E856$9'] : '' || '',
          'Chemin du rapport Analytics': profile ? profile['Chemin du rapport Analytics'] : '' || ''
        }}
        validationSchema={Yup.object({
          'Nom du profil': Yup.string(),
          URL: Yup.string().url('Veuillez choisir une URL valide').nullable(),
          'Type de fichier en entrée': Yup.string()
            //.required('Obligatoire')
            .oneOf(['Bacon', 'Webservice'], 'Veuillez choisir un type de fichier valide'),
          Type: Yup.string()
            // eslint-disable-next-line prettier/prettier
            .oneOf(['Périodique', 'Ebooks'], "Veuillez choisir un type d'exemplarisation valide"),
          Périodicité: Yup.string()
            //.required('Obligatoire')
            .oneOf(
              ['Mensuelle', 'Annuelle', 'Non définie'],
              'Veuillez choisir une périodicité valide'
            )
        })}
        onSubmit={async (values) => {
          values.Type = selectedTypeValue
          values['Type de fichier en entrée'] = selectedInputType
          values.Périodicité = selectedPeriodicity
          console.log('Submit:', values)

          await new Promise((r) => setTimeout(r, 500))
          let error = []
          values['Type de fichier en entrée'] === ''
            ? error.push('Type de fichier en entrée est obligatoire')
            : null

          values.Type === '' ? error.push("Type d'exemplarisation est obligatoire") : null
          values.Périodicité === '' ? error.push('Périodicité est obligatoire') : null
          values['Nom du profil'] === '' ? error.push('Nom du profil est obligatoire') : null
          values['930 $b'] === '' ? error.push('RCR est obligatoire') : null

          if (error.length > 0) {
            alert(error.join('\n'))
            ipcRenderer.send('focus-fix')
            return
          } else {
            // Fusionner les données de profile et les values du formulaire
            const mergedData = { ...profile, ...values }
            console.log('Merged Data:', mergedData)
            ipcRenderer.send('profile:save', mergedData)
            alert('Enregistré avec succès')
            ipcRenderer.send('focus-fix')
          }
        }}
      >
        {() => (
          <Form className="w-full px-16 py-8 overflow-auto bg-pastel-green-50 dark:bg-cafe-100">
            <section className="pb-4 border-b border-pastel-green-800 dark:border-cafe-400">
              <TextField label="Nom du profil" name="Nom du profil" isMandatory></TextField>
              <TextField label="Description" name="Description"></TextField>
              <div className="grid items-center gap-6 pt-6 md:grid-cols-2">
                <TextField label="URL" name="URL"></TextField>
                <div>
                  <Field
                    type="file"
                    name="input_file"
                    id="input_file"
                    onChange={(event) => {
                      const file = event.target.files[0]
                      if (file) {
                        // Envoyer le chemin du fichier au processus principal
                        const filePath = window.filePath.showFilePath(file)
                        ipcRenderer.send('file-selected', filePath)
                      }
                    }}
                  ></Field>
                </div>
              </div>
            </section>
            <section className="grid gap-6 py-8 border-b border-pastel-green-800 dark:border-cafe-400 md:grid-cols-3">
              <RadioField
                label="Type de fichier en entrée"
                name="Type de fichier en entrée"
                options={[
                  { value: 'Bacon', label: 'Bacon' },
                  { value: 'Webservice', label: 'Web Service' }
                ]}
                value={selectedInputType}
                handleRadioChange={handleInputTypeChange}
                isMandatory
              ></RadioField>
              <RadioField
                label="Type d'exemplarisation"
                name="Type"
                options={[
                  { value: 'Périodique', label: 'Périodique' },
                  { value: 'Ebooks', label: 'Ebooks' }
                ]}
                value={selectedTypeValue}
                handleRadioChange={handleRadioChange2}
                isMandatory
              ></RadioField>
              <RadioField
                label="Périodicité"
                name="Périodicité"
                options={[
                  { value: 'Mensuelle', label: 'Mensuelle' },
                  { value: 'Annuelle', label: 'Annuelle' },
                  { value: 'Non définie', label: 'Non définie' }
                ]}
                value={selectedPeriodicity}
                handleRadioChange={handlePeriodicityChange}
                isMandatory
              ></RadioField>
            </section>
            <section className="py-6 border-b border-pastel-green-800 dark:border-cafe-400">
              <div id="930">
                <h2 className="font-semibold">930</h2>
                <div className="grid gap-6 pt-4 md:grid-cols-3">
                  <TextField label="$a (cote)" name="930 $a"></TextField>
                  <TextField label="$b (RCR)" name="930 $b" isMandatory></TextField>
                  <TextField label="$j" name="930$j"></TextField>
                </div>
              </div>
              <div className="grid gap-6 pt-4 md:grid-cols-3">
                <div id="955" style={{ display: isEbooks ? 'none' : 'block' }}>
                  <h2 className="mb-2 font-semibold">955</h2>
                  <TextField label="$4 (note sur l'état de collection)" name="955 $4"></TextField>
                </div>
                <div id="991">
                  <h2 className="mb-2 font-semibold">991</h2>
                  <TextField label="$a (indexation locale)" name="991$a"></TextField>
                </div>
                <div id="E316">
                  <h2 className="mb-2 font-semibold">E316</h2>
                  <TextField label="$a (note sur l'exemplaire)" name="E316$a"></TextField>
                </div>
              </div>
            </section>
            <section
              id="E856"
              className="py-6 border-b border-pastel-green-800 dark:border-cafe-400"
            >
              <h2 className="font-semibold">E856</h2>
              <div className="grid items-center gap-6 pt-4 md:grid-cols-4">
                <p>$b (paramètre d'analyseur)</p>
                <TextField
                  label="Préfixe d'URL à supprimer"
                  name="E856$b - préfixe à supprimer"
                ></TextField>
                <TextField
                  label="Suffixe d'URL à supprimer"
                  name="E856$b - suffixe à supprimer"
                ></TextField>
                <TextField
                  label="Préfixe de paramètre d'analyseur à ajouter"
                  name="E856$b - préfixe à ajouter"
                ></TextField>
                {/* $u */}
                <p>$u</p>
                <TextField
                  label="Préfixe d'URL à supprimer"
                  name="E856$u - préfixe à supprimer"
                ></TextField>
                <TextField
                  label="Suffixe d'URL à supprimer"
                  name="E856$u - suffixe à supprimer"
                ></TextField>
                <TextField
                  label="Préfixe d'URL à ajouter ($u)"
                  name="E856$u - préfixe à ajouter"
                ></TextField>
              </div>
              <div className="grid items-center gap-6 pt-4 md:grid-cols-2">
                <TextField label="$l (code de périmètre d'accès)" name="E856$l"></TextField>
                <TextField label="$q (format)" name="E856$q"></TextField>
                <TextField label="$z (note)" name="E856$z"></TextField>
                <TextField label="$9 (code de bouquet)" name="E856$9"></TextField>
              </div>
              <div className="grid gap-6 pt-6 md:grid-cols-2">
                <TextField
                  label="Chemin du rapport Analytics"
                  name="Chemin du rapport Analytics"
                ></TextField>
                <div className="flex flex-col gap-2 mb-6">
                  <label className="block mb-2 text-sm font-medium" htmlFor="compare">
                    Charger un fichier de comparaison
                  </label>
                  <Field
                    type="file"
                    name="compare"
                    id="compare"
                    accept=".csv,.txt"
                    onChange={(event) => {
                      const file = event.target.files[0]
                      if (file) {
                        // Si fichier pas csv ou txt
                        if (!['text/csv', 'text/plain'].includes(file.type)) {
                          alert('Veuillez choisir un fichier CSV ou TXT')
                          ipcRenderer.send('focus-fix')
                          return
                        }
                        // Envoyer le chemin du fichier au processus principal
                        const filePath = window.filePath.showFilePath(file)
                        ipcRenderer.send('compare-file-selected', filePath)
                      }
                    }}
                  ></Field>
                </div>
              </div>
            </section>
            <footer className="flex justify-center mt-8">
              <Modal
                title="Traitements en cours"
                buttonText="Lancer le traitement"
                progressPercentage={progressPercentage}
                modalMessages={modalMessages}
                handleProcess={(event) => {
                  event.preventDefault()
                  // get the Formik form values
                  const values = {}
                  event.currentTarget.form.querySelectorAll('input, select').forEach((field) => {
                    const { name, value } = field
                    values[name] = value
                  })
                  console.log('Values:', values)
                  //values.Type = isEbooks ? 'Ebooks' : 'Périodique'
                  values.Type = selectedTypeValue
                  values['Type de fichier en entrée'] = selectedInputType
                  values.Périodicité = selectedPeriodicity

                  // Effacer les balises p dans le rapport
                  setModalMessages([])

                  // Fusionner les données de profile et les values du formulaire
                  const mergedData = { ...profile, ...values }
                  ipcRenderer.send('profile:process', mergedData)
                  //Effacer le fichier de comparaison
                  document.getElementById('compare').value = ''
                }}
              ></Modal>
              <button
                type="submit"
                className="w-56 px-4 py-2 mr-2 text-white bg-deep-sea-500 hover:bg-deep-sea-600"
              >
                Enregistrer
              </button>
              <button
                type="button"
                className="w-56 px-4 py-2 mr-2 text-white bg-gray-500 hover:bg-gray-600"
                onClick={(event) => {
                  event.preventDefault()
                  ipcRenderer.send('navigate-home')
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                className="w-56 px-4 py-2 text-white bg-red-500 hover:bg-red-600"
                onClick={(event) => {
                  event.preventDefault()
                  ipcRenderer.send('profile:delete', profile)
                  ipcRenderer.send('focus-fix')
                  ipcRenderer.send('navigate-home')
                }}
              >
                Supprimer
              </button>
            </footer>
          </Form>
        )}
      </Formik>
    </div>
  )
}

export default Profile
