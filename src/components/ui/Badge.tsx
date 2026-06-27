import React from "react"
import clsx from "clsx"

type BadgeVariant = "default" | "success" | "warning" | "danger"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  className?: string
  children: React.ReactNode
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  className = "",
  children,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"

  const variantClasses = {
    default: "bg-slate-100 text-slate-800",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-800",
  }

  return (
    <span
      className={clsx(baseClasses, variantClasses[variant], className)}
      {...props}
    >
      {children}
    </span>
  )
}

export default Badge
