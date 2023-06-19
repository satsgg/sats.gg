const Button = ({
  disabled = false,
  onClick,
  icon,
  children,
}: {
  disabled?: boolean
  onClick: () => void
  icon?: JSX.Element
  children?: string | JSX.Element
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-8 items-center gap-1 rounded bg-primary px-3 py-2 text-sm font-semibold capitalize shadow-md transition duration-150 ease-in-out hover:bg-primary/80 hover:shadow-lg focus:bg-primary focus:shadow-lg focus:outline-none focus:ring-0 active:bg-primary active:shadow-lg disabled:cursor-not-allowed disabled:bg-gray-500"
    >
      {icon}
      {children}
    </button>
  )
}

export default Button
