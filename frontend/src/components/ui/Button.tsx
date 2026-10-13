import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
  secondary:
    'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-400',
}

function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center
        rounded-lg px-4 py-2
        text-sm font-medium
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        ${variantStyles[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button