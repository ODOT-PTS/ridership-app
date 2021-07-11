const ToggleMenu = ({ fieldOptions, field, setField }) => {
  return (
    <div className="flex justify-start pb-2">
      {fieldOptions.map(fieldOption => {
        return (
          <div className="group">
            <a
              href="#"
              className={`flex items-end justify-center text-center mx-auto px-4 pt-2 w-full`}
              onClick={event => {
                event.preventDefault()
                setField(fieldOption.value)
              }}
            >
              <span className={`block px-1 pt-1 pb-1 text-gray-400 group-hover:text-blue-500 ${field === fieldOption.value && 'text-gray-800'}`}>
                  <span className="block text-xs pb-2">{fieldOption.label}</span>
                  {field === fieldOption.value && <span className="block w-5 mx-auto h-1 bg-gray-800 group-hover:bg-blue-500 rounded-full"></span>}
              </span>
            </a>
          </div>
        )
      })}
    </div>
  )
}

export default ToggleMenu