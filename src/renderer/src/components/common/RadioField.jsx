import { Field, ErrorMessage } from 'formik'

import PropTypes from 'prop-types'

/**
 * Renders a group of Radio with a label.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.label - The label for the Radio.
 * @param {string} props.name - The name attribute for the Radio.
 * @param {Array} props.options - The options for the Radio.
 * @param {function} [props.handleRadioChange=null] - The event handler for radio button change.
 * @param {string} props.value - The value for the Radio.
 * @param {boolean} [props.isMandatory] - The flag to indicate if the field is mandatory.
 * @returns {JSX.Element} The rendered component.
 */
export const RadioField = ({ label, name, options, value, handleRadioChange = null, ...props }) => {
  let radios = options.map(function (option) {
    if (handleRadioChange) {
      return (
        <label key={option.value} className="flex items-center gap-4">
          <Field
            type="radio"
            name={name}
            value={option.value}
            checked={option.value == value}
            onChange={handleRadioChange}
          />
          {option.label}
        </label>
      )
    } else {
      return (
        <label key={option.value} className="flex items-center gap-4">
          <Field type="radio" name={name} value={option.value} />
          {option.label}
        </label>
      )
    }
  })

  return (
    <div className="flex flex-col gap-2" role="group" aria-labelledby={name}>
      <h3 className="text-sm font-medium">
        {props.isMandatory && <span className="text-red-500">*</span>} {label}
      </h3>
      {radios}
      <ErrorMessage name={name} component="div" className="text-red-500"></ErrorMessage>
    </div>
  )
}

RadioField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  value: PropTypes.string,
  handleRadioChange: PropTypes.func,
  isMandatory: PropTypes.bool
}
