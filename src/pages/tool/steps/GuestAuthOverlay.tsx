import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Loader2, X } from 'lucide-react';
import { useRouter } from 'next/router';

type FormMode = 'login' | 'register';

interface GuestAuthOverlayProps {
  onClose?: () => void;
}

export default function GuestAuthOverlay({ onClose }: GuestAuthOverlayProps = {}) {
  const { register: registerUser, login, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const returnTo = (router.query.returnTo as string) || '/tool/FeasibilityTool';

  const [mode, setMode] = useState<FormMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === 'register') {
        await registerUser(name, email, password, returnTo);
      } else {
        await login(email, password, false, returnTo);
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.message ||
        (mode === 'register' ? 'فشل إنشاء الحساب' : 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user becomes authenticated, overlay will disappear automatically via parent check.

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative">
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        )}
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center mt-2">
          {mode === 'register'
            ? 'دراستك جاهزة! أنشئ حساباً لعرضها وحفظها'
            : 'سجّل دخولك لعرض الدراسة وحفظها'}
        </h2>
        <p className="text-gray-600 mb-6 text-center">التقرير محفوظ وسيظهر فور التسجيل.</p>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm flex items-start gap-2">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <Input
              id="guest-name"
              type="text"
              label="الاسم الكامل"
              placeholder="أدخل اسمك الكامل"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <Input
            id="guest-email"
            type="email"
            label="البريد الإلكتروني"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            dir="ltr"
            className="text-left"
          />
          <Input
            id="guest-password"
            type="password"
            label="كلمة المرور"
            placeholder={mode === 'register' ? 'أدخل كلمة مرور قوية' : 'أدخل كلمة المرور'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            disabled={isSubmitting || authLoading}
            className="w-full py-2 text-lg font-semibold flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
            {mode === 'register' ? 'إنشاء الحساب' : 'تسجيل الدخول'}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="text-indigo-600 hover:underline"
          >
            {mode === 'register' ? 'لدي حساب بالفعل' : 'ليس لدي حساب'}
          </button>
        </div>
      </div>
    </div>
  );
}
