import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FolderGit2, FileText, Settings, LogOut, Menu, X, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'مشاريعي', href: '/dashboard/Projects', icon: FolderGit2 },
    { name: 'التقارير', href: '/dashboard/Reports', icon: FileText },
    { name: 'الإعدادات', href: '/dashboard/Settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-l border-gray-200 fixed h-full z-10 shadow-sm">
        <div className="p-6">
          <Link href="/dashboard/Projects" className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            <span className="bg-blue-600 text-white p-1.5 rounded-lg">
              <FolderGit2 size={24} />
            </span>
            جدوى
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navigation.map((item) => {
            const isActive = router.pathname.includes(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 font-semibold' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-600 hover:bg-red-50 transition-colors font-medium"
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
          <div className="md:hidden flex items-center gap-2">
            <span className="bg-blue-600 text-white p-1.5 rounded-lg">
              <FolderGit2 size={20} />
            </span>
            <span className="font-bold text-lg text-blue-600">جدوى</span>
          </div>

          <div className="flex-1 md:hidden"></div> {/* Spacer for mobile */}

          <div className="flex items-center gap-4 justify-end w-full md:w-auto">
            <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <User size={18} />
              </div>
              <span className="font-medium text-sm text-gray-700 hidden sm:block">{user?.name || 'مستخدم'}</span>
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {navigation.map((item) => {
            const isActive = router.pathname.includes(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

    </div>
  );
};
