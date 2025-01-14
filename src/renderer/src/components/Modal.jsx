import React from 'react'
import PropTypes from 'prop-types'
import { useState } from 'react'

const Modal = (props) => {
  const [showModal, setShowModal] = React.useState(false)
  const [showAlert, setShowAlert] = useState(false)

  //Copy report to clipboard
  const copyToClipboard = () => {
    const text = props.modalMessages.join('\n')
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

  const openFolder = () => {
    window.electron.ipcRenderer.send('open:folder')
  }

  return (
    <>
      <button
        className="w-56 px-4 py-2 mr-2 text-white bg-gradient-to-br from-deep-sea-800 to-deep-sea-700 hover:from-deep-sea-700 hover:to-deep-sea-600"
        type="button"
        onClick={(e) => {
          setShowModal(true)
          props.handleProcess(e)
        }}
      >
        {props.buttonText}
      </button>
      {showModal ? (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
            <div className="relative w-auto max-w-5xl mx-auto my-6">
              {/*content*/}
              <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none dark:bg-cafe-100 focus:outline-none">
                {/*header*/}
                <div className="flex items-start justify-between p-5 rounded-t">
                  <h3 className="text-3xl font-semibold">{props.title}</h3>
                  <button
                    className="relative float-right p-1 ml-auto text-3xl font-semibold leading-none outline-none focus:outline-none"
                    onClick={() => setShowModal(false)}
                  >
                    <span className="block w-6 h-6 text-sm outline-none font-extralight text-cafe-700">
                      X
                    </span>
                  </button>
                </div>

                <div className="p-4 text-center">
                  <div
                    className="rounded-full bg-deep-sea-500 text-deep-sea-50"
                    style={{ width: `${props.progressPercentage}%` }}
                  >
                    {Math.round(props.progressPercentage)}%
                  </div>
                </div>

                {/*body*/}
                <div
                  id="report"
                  className="relative flex-auto p-6 text-sm overflow-auto max-h-[60vh]"
                >
                  {props.modalMessages.map((message, index) => (
                    <p key={index}>{message}</p>
                  ))}
                </div>
                {/*footer*/}
                <div className="relative flex items-center justify-end p-6 border-t border-solid rounded-b border-blueGray-200">
                  {showAlert && (
                    <div className="absolute p-2 border rounded shadow alert -top-8 drop-shadow bg-slate-50/95 dark:bg-cafe-100/95 border-cafe-700">
                      Rapport copié !
                    </div>
                  )}
                  <button
                    className="px-6 py-2 mb-1 mr-1 text-sm font-bold uppercase transition-all duration-150 ease-linear outline-none background-transparent focus:outline-none"
                    type="button"
                    onClick={() => copyToClipboard()}
                  >
                    Copier le rapport
                  </button>
                  <button
                    className="px-6 py-2 mb-1 mr-1 text-sm font-bold uppercase transition-all duration-150 ease-linear outline-none text-deep-sea-700 background-transparent focus:outline-none"
                    type="button"
                    onClick={openFolder}
                  >
                    Ouvrir le dossier
                  </button>
                  <button
                    className="px-6 py-2 mb-1 mr-1 text-sm font-bold text-red-500 uppercase transition-all duration-150 ease-linear outline-none background-transparent focus:outline-none"
                    type="button"
                    onClick={() => setShowModal(false)}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="fixed inset-0 z-40 bg-black opacity-25"></div>
        </>
      ) : null}
    </>
  )
}

Modal.propTypes = {
  show: PropTypes.bool,
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func,
  modalMessages: PropTypes.array.isRequired,
  buttonText: PropTypes.string.isRequired,
  handleProcess: PropTypes.func.isRequired,
  progressPercentage: PropTypes.number
}

export default Modal
