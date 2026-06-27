import React from "react"
import clsx from "clsx"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  className?: string
  containerClassName?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, className = "", containerClassName = "", ...props },
    ref
  ) => {
    return (
      <div className={clsx("flex flex-col gap-1.5 w-full", containerClassName)}>
        {label && (
          <label className="text-sm font-semibold text-slate-700">
            {label}
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          <input
            ref={ref}
            className={clsx(
              "w-full px-4 py-2.5 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 transition-all duration-150",
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <span className="text-xs text-red-500 font-medium">{error}</span>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

export default Input
