import React, { useCallback, useEffect, useRef, useState } from "react"
import clsx from "clsx"
import { Check, ChevronDown, X } from "lucide-react"
import {
  INVITE_ROLE_OPTIONS,
  type InvitableRole,
  type WorkspaceInviteDraft,
} from "@/types/workspace"

/** حد أقصى للدعوات — يطابق حدّ الخادم */
export const MAX_INVITES = 25

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** المحارف التي تُنهي إدخال بريد وتحوّله إلى شريحة */
const SEPARATORS = [",", ";", " ", "\n", "\t"]

interface EmailChipsInputProps {
  invites: WorkspaceInviteDraft[]
  onChange: (invites: WorkspaceInviteDraft[]) => void
  /** الدور الافتراضي لكل بريد يُضاف */
  defaultRole?: InvitableRole
  disabled?: boolean
}

// ——————————————————————————————————————————————
// قائمة الأدوار المنسدلة — مكوّن فرعي
// ——————————————————————————————————————————————

interface RoleDropdownProps {
  currentRole: InvitableRole
  disabled?: boolean
  onChange: (role: InvitableRole) => void
}

const RoleDropdown: React.FC<RoleDropdownProps> = ({
  currentRole,
  disabled,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // إغلاق عند النقر خارج القائمة
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  const currentOption = INVITE_ROLE_OPTIONS.find(
    (opt) => opt.value === currentRole
  )

  return (
    <div ref={containerRef} className="relative shrink-0">
      {/* زر فتح القائمة */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={clsx(
          "flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all duration-150",
          isOpen
            ? "border-indigo-400 bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {currentOption?.label ?? "عضو"}
        <ChevronDown
          className={clsx(
            "h-3.5 w-3.5 text-slate-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* القائمة المنسدلة */}
      {isOpen && (
        <div
          className="absolute left-0 top-full z-50 mt-1.5 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg animate-in fade-in slide-in-from-top-1 duration-150"
          role="listbox"
          dir="rtl"
        >
          {INVITE_ROLE_OPTIONS.map((option) => {
            const isSelected = option.value === currentRole

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={clsx(
                  "flex w-full items-center justify-between px-3 py-2.5 text-right text-sm transition-colors",
                  isSelected
                    ? "bg-indigo-50/60 font-bold text-indigo-700"
                    : "font-medium text-slate-700 hover:bg-slate-50"
                )}
              >
                <span>{option.label}</span>
                {isSelected && (
                  <Check className="h-4 w-4 text-indigo-600" strokeWidth={2.5} />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ——————————————————————————————————————————————
// حقل إدخال إيميلات متعدد (Tag/Chip) — المكوّن الرئيسي
// ——————————————————————————————————————————————

/**
 * حقل إدخال إيميلات متعدد (Tag/Chip) مع اختيار دور لكل عضو.
 *
 * يقبل الإدخال بالفاصلة أو المسافة أو Enter، ويقبل لصق قائمة كاملة
 * دفعةً واحدة (مفصولة بفواصل أو أسطر) — وهي الحالة الشائعة حين
 * يُنسخ الفريق من جدول أو من رسالة.
 */
export const EmailChipsInput: React.FC<EmailChipsInputProps> = ({
  invites,
  onChange,
  defaultRole = "member",
  disabled = false,
}) => {
  const [draft, setDraft] = useState("")
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  /**
   * يحوّل نصاً (بريداً واحداً أو قائمة ملصوقة) إلى شرائح.
   * يعيد الجزء المتبقّي الذي لم يُغلق بفاصل بعد، ليبقى في الحقل.
   */
  const commit = useCallback(
    (raw: string): string => {
      const candidates = raw
        .split(/[,;\s\n\t]+/)
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)

      if (candidates.length === 0) return ""

      const existing = new Set(invites.map((invite) => invite.email))
      const added: WorkspaceInviteDraft[] = []
      const invalid: string[] = []
      let duplicate = false

      for (const email of candidates) {
        if (!EMAIL_PATTERN.test(email)) {
          invalid.push(email)
          continue
        }
        if (existing.has(email)) {
          duplicate = true
          continue
        }
        if (invites.length + added.length >= MAX_INVITES) break

        existing.add(email)
        added.push({ email, role: defaultRole })
      }

      if (invalid.length > 0) {
        setError(`بريد غير صالح: ${invalid.join("، ")}`)
      } else if (invites.length + added.length >= MAX_INVITES) {
        setError(`الحد الأقصى ${MAX_INVITES} دعوة في المرّة الواحدة.`)
      } else if (duplicate) {
        setError("هذا البريد مضاف بالفعل.")
      } else {
        setError(null)
      }

      if (added.length > 0) onChange([...invites, ...added])

      // ما لم يُقبل يبقى في الحقل ليصحّحه المستخدم بدل أن يختفي
      return invalid.join(", ")
    },
    [invites, onChange, defaultRole]
  )

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      setDraft(commit(draft))
      return
    }

    if (SEPARATORS.includes(event.key)) {
      // المسافة داخل حقل فارغ ليست فاصلاً
      if (!draft.trim()) {
        if (event.key !== " ") event.preventDefault()
        return
      }
      event.preventDefault()
      setDraft(commit(draft))
      return
    }

    // Backspace على حقل فارغ يحذف آخر شريحة — سلوك متوقّع في هذا النمط
    if (event.key === "Backspace" && !draft && invites.length > 0) {
      onChange(invites.slice(0, -1))
      setError(null)
    }
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData("text")
    if (!text) return
    event.preventDefault()
    setDraft(commit(`${draft}${text}`))
  }

  /** الخروج من الحقل يُثبّت ما كُتب — فلا يُفقد بريد لأن المستخدم نسي Enter */
  const handleBlur = () => {
    if (draft.trim()) setDraft(commit(draft))
  }

  const removeInvite = (email: string) => {
    onChange(invites.filter((invite) => invite.email !== email))
    setError(null)
  }

  const changeRole = (email: string, role: InvitableRole) => {
    onChange(
      invites.map((invite) =>
        invite.email === email ? { ...invite, role } : invite
      )
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-semibold text-slate-700">
        دعوة الأعضاء بالبريد الإلكتروني
      </label>

      {/* صندوق الإدخال — النقر في أي مكان منه يركّز الحقل */}
      <div
        onClick={() => inputRef.current?.focus()}
        className={clsx(
          "min-h-[52px] w-full rounded-xl border bg-white px-3 py-2.5 shadow-sm transition-all duration-150 cursor-text",
          error
            ? "border-red-300 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500"
            : "border-slate-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500",
          disabled && "opacity-60 pointer-events-none"
        )}
      >
        <input
          ref={inputRef}
          type="email"
          dir="ltr"
          inputMode="email"
          autoComplete="off"
          disabled={disabled}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
            if (error) setError(null)
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
          placeholder="name@company.com — افصل بين العناوين بفاصلة أو Enter"
          className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none text-left"
        />
      </div>

      {error ? (
        <span className="text-xs font-medium text-red-500">{error}</span>
      ) : (
        <span className="text-xs text-slate-500">
          يمكنك لصق عدة عناوين دفعة واحدة. أضيف {invites.length} من أصل{" "}
          {MAX_INVITES}.
        </span>
      )}

      {/* الشرائح — لكل عضو دوره الخاص مع قائمة منسدلة مخصصة */}
      {invites.length > 0 && (
        <ul className="flex flex-col gap-2">
          {invites.map((invite) => (
            <li
              key={invite.email}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2"
            >
              <span
                dir="ltr"
                className="flex-1 min-w-0 truncate text-sm font-medium text-slate-800 text-left"
                title={invite.email}
              >
                {invite.email}
              </span>

              <RoleDropdown
                currentRole={invite.role}
                disabled={disabled}
                onChange={(role) => changeRole(invite.email, role)}
              />

              <button
                type="button"
                disabled={disabled}
                onClick={() => removeInvite(invite.email)}
                aria-label={`إزالة ${invite.email}`}
                className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default EmailChipsInput

