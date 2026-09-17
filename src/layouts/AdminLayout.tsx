import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LayoutDashboard, Users, Briefcase, FolderGit2, Wrench, CreditCard, Shield, Activity, LogOut, Menu, X, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/admin');
    } catch (error) {
      console.error('Logout failed', error);
      router.push('/admin');
    }
  };

  const navigation = [
    { name: 'نظرة عامة', href: '/admin/dashboard', icon: LayoutDashboard, exact: true },
    { name: 'المستخدمين', href: '/admin/users', icon: Users, exact: false },
    { name: 'مساحات العمل', href: '/admin/workspaces', icon: Briefcase, exact: false },
    { name: 'المشاريع', href: '/admin/projects', icon: FolderGit2, exact: false },
    { name: 'الأدوات', href: '/admin/tools', icon: Wrench, exact: false },
    { name: 'سجل الأدوات', href: '/admin/tool-runs', icon: Activity, exact: false },
    { name: 'المدفوعات', href: '/admin/payments', icon: CreditCard, exact: false },
    { name: 'حدود الاستخدام', href: '/admin/limits', icon: Shield, exact: false },
    { name: 'سجل النشاطات', href: '/admin/logs', icon: Activity, exact: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-l border-slate-800 fixed h-full z-10 shadow-sm text-slate-300">
        <div className="p-6">
          <Link href="/admin/dashboard" className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="bg-blue-600 text-white p-1.5 rounded-lg">
              <Shield size={24} />
            </span>
            لوحة الإدارة
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = item.exact 
                ? router.pathname === item.href 
                : router.pathname.startsWith(item.href);
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white font-semibold shadow-md' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-400'} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-400 hover:bg-red-500/10 transition-colors font-medium"
          >
            <LogOut size={20} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:mr-64 pb-20 md:pb-0 min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href="/admin/dashboard" className="md:hidden flex items-center gap-2">
            <span className="bg-blue-600 text-white p-1.5 rounded-lg">
              <Shield size={20} />
            </span>
            <span className="font-bold text-lg text-slate-900 leading-tight">الإدارة</span>
          </Link>

          <div className="flex-1 min-w-0 hidden md:flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900 shrink-0">
              Feasibility Suite Admin
            </span>
          </div>

          <div className="flex-1 md:hidden"></div>

          <div className="flex items-center gap-4 justify-end w-full md:w-auto">
            <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold">
                <UserIcon size={18} />
              </div>
              <span className="font-medium text-sm text-gray-700 hidden sm:block">{user?.name || 'مدير النظام'}</span>
            </div>
            <button className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-8 animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-30 pb-safe overflow-x-auto">
        <div className="flex items-center h-16 px-2 w-max min-w-full">
          {navigation.map((item) => {
            const isActive = item.exact 
                ? router.pathname === item.href 
                : router.pathname.startsWith(item.href);
                
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center w-20 px-1 h-full space-y-1 ${
                  isActive ? 'text-blue-500' : 'text-slate-400'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-blue-500' : 'text-slate-500'} />
                <span className="text-[10px] font-medium whitespace-nowrap">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

    </div>
  );
};
