import React, { useState } from 'react';
import { toast } from 'react-hot-toast'; // adjust if using a different toast lib
import { useAuth } from '../../context/auth'; // assumed auth context hook

/** Props for the SaveReportButton */
interface SaveReportButtonProps {
  reportContent: any; // JSON structure of the report
  pdfPath?: string; // optional existing PDF path (if already generated)
}

/** Simple modal that prompts the user to log in/register */
const LoginPromptModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
    <div className="bg-white rounded-lg p-6 w-96">
      <h2 className="text-lg font-semibold mb-4">تسجيل الدخول مطلوب</h2>
      <p className="mb-4">
        لحفظ التقرير عليك إنشاء حساب أو تسجيل الدخول. سيتم حفظ البيانات مؤقتاً في المتصفح لتتمكن من إكمال العملية بعد تسجيل الدخول.
      </p>
      <div className="flex justify-end space-x-2">
        <button
          className="px-4 py-2 bg-gray-200 rounded"
          onClick={onClose}
        >
          إلغاء
        </button>
        <a
          href="/auth/login"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          تسجيل الدخول
        </a>
      </div>
    </div>
  </div>
);

export const SaveReportButton: React.FC<SaveReportButtonProps> = ({ reportContent, pdfPath }) => {
  const { user } = useAuth(); // { user?: { id: string } }
  const [showModal, setShowModal] = useState(false);

  const handleSave = async () => {
    if (!user) {
      // Store data in sessionStorage for later retrieval
      sessionStorage.setItem('pendingReport', JSON.stringify({ reportContent, pdfPath }));
      setShowModal(true);
      return;
    }

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          projectId: reportContent.projectId,
          content: reportContent,
          pdfPath,
        }),
      });
      if (!res.ok) throw new Error('Failed to save report');
      toast.success('تم حفظ التقرير بنجاح');
    } catch (err) {
      console.error(err);
      toast.error('خطأ في حفظ التقرير');
    }
  };

  return (
    <>
      <button
        onClick={handleSave}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        حفظ التقرير
      </button>
      {showModal && <LoginPromptModal onClose={() => setShowModal(false)} />}
    </>
  );
};
