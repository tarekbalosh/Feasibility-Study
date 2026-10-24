import React, { useState } from "react";
import { X, Users, Check, AlertCircle } from "lucide-react";
import { WorkspaceMember } from "@/types/workspace";

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: WorkspaceMember[];
  currentUserId: string;
  onCreateGroup: (title: string, memberUserIds: string[]) => Promise<void>;
}

export const NewGroupModal: React.FC<NewGroupModalProps> = ({
  isOpen,
  onClose,
  members,
  currentUserId,
  onCreateGroup,
}) => {
  const [title, setTitle] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // استبعاد المستخدم الحالي من القائمة القابلة للاختيار (لأنه يُضاف تلقائياً)
  const selectableMembers = members.filter(
    (m) => m.userId && m.userId !== currentUserId && m.status === "active"
  );

  const toggleMember = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("يرجى إدخال اسم المجموعة.");
      return;
    }
    if (selectedUserIds.length === 0) {
      setError("يرجى اختيار عضو واحد على الأقل.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onCreateGroup(title.trim(), selectedUserIds);
      setTitle("");
      setSelectedUserIds([]);
      onClose();
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء إنشاء المجموعة.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-cairo animate-fade-in"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] animate-fade-in-up">
        {/* الترويسة */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users size={20} />
            </span>
            <h3 className="font-bold text-lg text-gray-900">إنشاء مجموعة جديدة</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          {/* حقل اسم المجموعة */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              اسم المجموعة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: فريق التسويق، نقاش المشروع..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              autoFocus
            />
          </div>

          {/* اختيار الأعضاء */}
          <div className="flex-1 flex flex-col min-h-0 mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700">
                اختر أعضاء المجموعة ({selectedUserIds.length})
              </label>
              {selectableMembers.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedUserIds.length === selectableMembers.length) {
                      setSelectedUserIds([]);
                    } else {
                      setSelectedUserIds(selectableMembers.map((m) => m.userId!));
                    }
                  }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {selectedUserIds.length === selectableMembers.length ? "إلغاء التحديد" : "تحديد الكل"}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 border border-gray-100 rounded-2xl p-2 bg-gray-50/50">
              {selectableMembers.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-6">
                  لا يوجد أعضاء آخرون مسجلون في مساحة العمل حالياً.
                </p>
              ) : (
                selectableMembers.map((member) => {
                  const isSelected = selectedUserIds.includes(member.userId!);
                  return (
                    <div
                      key={member.id}
                      onClick={() => toggleMember(member.userId!)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? "bg-blue-50/80 border border-blue-200"
                          : "bg-white hover:bg-gray-100/80 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {(member.name || member.email).slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {member.name || member.email}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate">{member.email}</p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                          isSelected ? "bg-blue-600 text-white" : "border border-gray-300"
                        }`}
                      >
                        {isSelected && <Check size={14} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* أزرار الإجراء */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 text-xs font-bold transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || selectedUserIds.length === 0}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? "جارِ الإنشاء..." : "إنشاء المجموعة"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
