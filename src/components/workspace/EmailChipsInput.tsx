import React, { useCallback, useRef, useState } from "react"
import clsx from "clsx"
import { X } from "lucide-react"
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

      {/* الشرائح — لكل عضو دوره الخاص */}
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

              <select
                value={invite.role}
                disabled={disabled}
                onChange={(event) =>
                  changeRole(invite.email, event.target.value as InvitableRole)
                }
                aria-label={`دور ${invite.email}`}
                className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {INVITE_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

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
