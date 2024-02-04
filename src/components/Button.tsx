import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
  icon?: JSX.Element
  disabled?: boolean
  onClick?: () => void
}

const Button: React.FC<ButtonProps> = ({ className, disabled = false, onClick, icon, children, ...rest }) => {
  const defaultStyle =
    // 'relative inline-flex h-8 items-center justify-center gap-1 rounded bg-primary-500 px-3 py-2 text-center text-sm font-semibold capitalize shadow-md hover:bg-primary-600 hover:shadow-lg focus:shadow-lg focus:outline-none focus:ring-0 active:bg-primary-700 active:shadow-lg disabled:cursor-not-allowed disabled:bg-stone-700'
    'relative inline-flex items-center justify-center gap-1 rounded bg-primary-500 px-3 py-2 text-center text-sm font-semibold capitalize shadow-md hover:bg-primary-600 hover:shadow-lg focus:shadow-lg focus:outline-none focus:ring-0 active:bg-primary-700 active:shadow-lg disabled:cursor-not-allowed disabled:bg-stone-700'
  const styles = className ? `${className} ${defaultStyle}` : defaultStyle
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={styles} {...rest}>
      {icon}
      {children}
    </button>
  )
}

export default Button
