import React from "react"
import clsx from "clsx"

type ButtonVariant = "primary" | "secondary" | "ghost"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  className?: string
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  className = "",
  children,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center px-6 py-2.5 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"

  const variantClasses = {
    primary:
      "bg-primary hover:bg-primary-dark text-white focus:ring-primary shadow-sm",
    secondary:
      "bg-secondary hover:bg-secondary-dark text-white focus:ring-secondary shadow-sm",
    ghost:
      "bg-transparent hover:bg-slate-100 text-slate-700 hover:text-slate-900 focus:ring-slate-400",
  }

  return (
    <button
      className={clsx(baseClasses, variantClasses[variant], className)}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
