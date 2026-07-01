import React from "react"
import clsx from "clsx"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children: React.ReactNode
}

export const Card: React.FC<CardProps> = ({
  className = "",
  children,
  ...props
}) => {
  return (
    <div
      className={clsx(
        "bg-white border border-slate-200 rounded-xl shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children: React.ReactNode
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  className = "",
  children,
  ...props
}) => {
  return (
    <div
      className={clsx("p-6 border-b border-slate-100", className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children: React.ReactNode
}

export const CardContent: React.FC<CardContentProps> = ({
  className = "",
  children,
  ...props
}) => {
  return (
    <div className={clsx("p-6", className)} {...props}>
      {children}
    </div>
  )
}

export default Card
