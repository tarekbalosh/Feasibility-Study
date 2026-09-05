import React, { useEffect, useRef } from "react"
import clsx from "clsx"

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  /** يُستدعى فور اكتمال الأرقام الستة — فلا يحتاج المستخدم لزر إضافي */
  onComplete?: (value: string) => void
  disabled?: boolean
  hasError?: boolean
  length?: number
}

/**
 * حقل إدخال رمز من 6 أرقام — خانة لكل رقم.
 *
 * الاتجاه هنا LTR رغم أن الصفحة RTL: الأرقام تُقرأ وتُكتب من اليسار
 * إلى اليمين في العربية أيضاً، فترتيب الخانات بصرياً يجب أن يطابق
 * ترتيبها في الرسالة.
 */
export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
  length = 6,
}) => {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])
  const completedFor = useRef<string | null>(null)

  const digits = value.padEnd(length, " ").slice(0, length).split("")

  /** تركيز أول خانة فارغة عند أول عرض */
  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  // الإكمال التلقائي يُطلق مرّة واحدة لكل رمز مكتمل، وإلا أُعيد
  // الإرسال عند كل إعادة تصيير.
  useEffect(() => {
    if (value.length === length && completedFor.current !== value) {
      completedFor.current = value
      onComplete?.(value)
    }
    if (value.length < length) {
      completedFor.current = null
    }
  }, [value, length, onComplete])

  const focusAt = (index: number) => {
    const target = inputsRef.current[Math.max(0, Math.min(index, length - 1))]
    target?.focus()
    target?.select()
  }

  const handleChange = (index: number, raw: string) => {
    const clean = raw.replace(/\D/g, "")
    if (!clean) return

    // لصق الرمز كاملاً في أي خانة يوزّعه على الخانات كلها
    const next = (
      value.slice(0, index) +
      clean +
      value.slice(index + clean.length)
    ).slice(0, length)

    onChange(next)
    focusAt(index + clean.length)
  }

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Backspace") {
      event.preventDefault()
      if (value[index]) {
        onChange(value.slice(0, index) + value.slice(index + 1))
        focusAt(index)
      } else {
        onChange(value.slice(0, Math.max(index - 1, 0)))
        focusAt(index - 1)
      }
      return
    }

    // الأسهم بصرية: الخانات LTR، فاليسار يعني الخانة السابقة
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      focusAt(index - 1)
    }
    if (event.key === "ArrowRight") {
      event.preventDefault()
      focusAt(index + 1)
    }
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData("text").replace(/\D/g, "")
    if (!text) return
    event.preventDefault()
    onChange(text.slice(0, length))
    focusAt(Math.min(text.length, length - 1))
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3" dir="ltr">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={length}
          disabled={disabled}
          aria-label={`الرقم ${index + 1} من ${length}`}
          value={digits[index]?.trim() ?? ""}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
          className={clsx(
            "h-14 w-11 sm:h-16 sm:w-13 rounded-xl border-2 bg-white text-center text-2xl font-bold text-slate-900 shadow-sm transition-all duration-150 focus:outline-none",
            hasError
              ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              : "border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100",
            disabled && "cursor-not-allowed opacity-60"
          )}
        />
      ))}
    </div>
  )
}

export default OtpInput
