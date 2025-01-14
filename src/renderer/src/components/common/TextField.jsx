import { Field, ErrorMessage } from 'formik'
import PropTypes from 'prop-types'

/**
 * A custom text input field component.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.label - The label for the text input field.
 * @param {string} props.name - The name attribute for the text input field.
 * @param {boolean} props.isMandatory - Indicates if the field is mandatory.
 * @returns {JSX.Element} The rendered TextField component.
 */
export const TextField = ({ label, name, ...props }) => {
  return (
    <div className="flex flex-col gap-2 mb-6">
      <label htmlFor={name} className="block mb-2 text-sm font-medium">
        {props.isMandatory && <span className="text-red-500">*</span>}
        {label}
      </label>
      <Field
        name={name}
        id={name}
        className="w-full px-2 py-1 border border-pastel-green-600 focus:ring-pastel-green-400 dark:bg-cafe-100 dark:border-cafe-600 focus:outline-none focus:ring-2 dark:focus:ring-cafe-400 focus:border-transparent"
        type="text"
        {...props}
      ></Field>
      <ErrorMessage name={name} component="div" className="text-red-500"></ErrorMessage>
    </div>
  )
}

TextField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  isMandatory: PropTypes.bool
}
