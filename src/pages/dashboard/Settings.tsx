import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Save, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Update form when user data is available
  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || '', email: user.email || '' });
    }
  }, [user]);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const { data: res } = await apiClient.put('/users/me', {
        name: profileForm.name,
        email: profileForm.email,
      });
      // Update local AuthContext state so header/sidebar reflect the change
      updateUser({ name: res.data.name, email: res.data.email });
      toast.success('تم حفظ البيانات بنجاح!');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message || 'حدث خطأ أثناء حفظ البيانات.';
      toast.error(msg);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('كلمة المرور الجديدة غير متطابقة!');
      return;
    }
    setPasswordLoading(true);
    try {
      await apiClient.put('/users/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('تم تغيير كلمة المرور بنجاح!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message || 'حدث خطأ أثناء تغيير كلمة المرور.';
      toast.error(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'حذف حسابي') {
      toast.error('يرجى كتابة "حذف حسابي" لتأكيد العملية.');
      return;
    }
    setDeleteLoading(true);
    try {
      await apiClient.delete('/users/me');
      toast.success('تم حذف الحساب بنجاح.');
      setShowDeleteModal(false);
      logout();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message || 'حدث خطأ أثناء حذف الحساب.';
      toast.error(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Head>
        <title>الإعدادات - أداة دراسة الجدوى</title>
      </Head>

      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إعدادات الحساب</h1>
          <p className="text-gray-500 mt-1">إدارة معلوماتك الشخصية والأمان</p>
        </div>

        {/* Profile Settings */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">المعلومات الشخصية</h2>
          </div>
          <form onSubmit={handleProfileSave} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={profileLoading} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {profileLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {profileLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
            </div>
          </form>
        </div>

        {/* Password Settings */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">تغيير كلمة المرور</h2>
          </div>
          <form onSubmit={handlePasswordSave} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور الحالية</label>
              <input
                type="password"
                required
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full md:w-1/2 px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                dir="ltr"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تأكيد كلمة المرور الجديدة</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={passwordLoading} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {passwordLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {passwordLoading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 rounded-2xl border border-red-200 shadow-sm overflow-hidden mt-8">
          <div className="p-6">
            <h2 className="text-lg font-bold text-red-900 flex items-center gap-2 mb-2">
              <AlertTriangle size={20} />
              منطقة الخطر (Danger Zone)
            </h2>
            <p className="text-red-700 text-sm mb-6">
              بمجرد حذف حسابك، سيتم مسح جميع مشاريعك وتقاريرك وبياناتك نهائياً. لا يمكن التراجع عن هذه الخطوة.
            </p>
            <button 
              type="button" 
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-red-200 flex items-center gap-2"
            >
              <Trash2 size={18} />
              حذف الحساب نهائياً
            </button>
          </div>
        </div>

        {/* Delete Account Modal (Double Confirmation) */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">تأكيد أخير: حذف الحساب</h3>
              <p className="text-gray-500 mb-4 text-sm leading-relaxed">
                سيتم حذف حسابك وجميع مشاريعك إلى الأبد. للتأكيد، يرجى كتابة <strong>حذف حسابي</strong> في المربع أدناه.
              </p>
              
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="حذف حسابي"
                className="w-full px-4 py-3 rounded-xl border border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all mb-6 bg-red-50 text-red-900 placeholder:text-red-300"
              />

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                  className="px-5 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  تراجع
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'حذف حسابي'}
                  className="px-5 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  أنا متأكد، احذف الحساب
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
