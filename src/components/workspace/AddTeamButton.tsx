import React, { useCallback, useState } from "react"
import clsx from "clsx"
import { Users } from "lucide-react"
import { useWorkspace } from "@/context/WorkspaceContext"
import { InviteTeamModal } from "@/components/workspace/InviteTeamModal"

interface AddTeamButtonProps {
  className?: string
  /** استدعاء بعد فتح النافذة — لإغلاق قائمة الجوال مثلاً */
  onNavigate?: () => void
}

/**
 * زر «إضافة فريق» — يفتح نافذة دعوة الأعضاء لمساحة العمل الحالية.
 *
 * لا يُصيَّر إطلاقاً لمن لا يملك مساحة عمل فعّالة بعد (زائر، أو
 * مسجَّل في منتصف إنشاء مساحته الأولى) — فلا معنى لدعوة فريق إلى
 * مساحة غير موجودة، وزر البدء (StartWorkspaceButton) هو الذي يقود
 * هذه الفئة إلى إنشائها أولاً.
 */
export const AddTeamButton: React.FC<AddTeamButtonProps> = ({
  className,
  onNavigate,
}) => {
  const { workspace, hasWorkspace } = useWorkspace()
  const [isOpen, setIsOpen] = useState(false)

  const handleOpen = useCallback(() => {
    onNavigate?.()
    setIsOpen(true)
  }, [onNavigate])

  if (!hasWorkspace || !workspace) return null

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={clsx("inline-flex items-center justify-center gap-2", className)}
      >
        <Users className="h-4 w-4" />
        إضافة فريق
      </button>

      <InviteTeamModal
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}

export default AddTeamButton
