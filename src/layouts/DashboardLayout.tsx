import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FolderGit2, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Breadcrumb } from '@/components/Breadcrumb';
import { UserProfileDropdown } from '@/components/dashboard/UserProfileDropdown';
import { SidebarNav } from '@/components/dashboard/SidebarNav';

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout } = useAuth();
  const { workspace } = useWorkspace();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-l border-gray-200 fixed right-0 top-0 h-full z-30 shadow-sm">
        <div className="p-6">
          <Link href="/" className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            <span className="bg-blue-600 text-white p-1.5 rounded-lg">
              <FolderGit2 size={24} />
            </span>
            جدوى
          </Link>
        </div>

        <div className="flex-1 px-4 mt-2 overflow-y-auto">
          <SidebarNav />
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-600 hover:bg-red-50 transition-colors font-medium text-sm"
          >
            <LogOut size={20} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Mobile Slide-over Drawer (القائمة الجانبية المنزلقة للجوال) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" dir="rtl">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <aside className="relative mr-0 w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-xl font-bold text-blue-600 flex items-center gap-2"
              >
                <span className="bg-blue-600 text-white p-1.5 rounded-lg">
                  <FolderGit2 size={20} />
                </span>
                جدوى
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg focus:outline-none"
                aria-label="إغلاق القائمة"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 px-4 mt-3 overflow-y-auto">
              <SidebarNav onItemClick={() => setIsMobileMenuOpen(false)} />
            </div>

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-600 hover:bg-red-50 transition-colors font-medium text-sm"
              >
                <LogOut size={18} />
                تسجيل الخروج
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:mr-64 pb-20 md:pb-0 min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="md:hidden flex items-center gap-2">
            <Link href="/" className="flex items-center gap-1.5 shrink-0">
              <span className="bg-blue-600 text-white p-1.5 rounded-lg">
                <FolderGit2 size={20} />
              </span>
              <span className="font-bold text-lg text-blue-600 leading-tight">جدوى</span>
            </Link>
            {workspace && (
              <>
                <span className="text-gray-300" aria-hidden="true">|</span>
                <Link
                  href="/dashboard/Overview"
                  title={`الانتقال إلى لوحة تحكم ${workspace.name}`}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors truncate max-w-[9rem] leading-tight"
                >
                  {workspace.name}
                </Link>
              </>
            )}
          </div>

          {/* هوية المنصة ومساحة العمل الحالية — "Feasibility Suite | اسم الشركة" */}
          <div className="flex-1 min-w-0 hidden md:flex items-center gap-2">
            <Link href="/" className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors shrink-0">
              Feasibility Suite
            </Link>
            {workspace && (
              <>
                <span className="text-gray-300 shrink-0" aria-hidden="true">|</span>
                <Link
                  href="/dashboard/Overview"
                  title={`الانتقال إلى لوحة تحكم ${workspace.name}`}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors truncate max-w-[16rem]"
                >
                  {workspace.name}
                </Link>
              </>
            )}
          </div>

          <div className="flex-1 md:hidden"></div> {/* Spacer for mobile */}

          <div className="flex items-center gap-4 justify-end w-full md:w-auto">
            <UserProfileDropdown />
            <button
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-8 animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
          {/* Breadcrumb Navigation */}
          <Breadcrumb />
          {children}
        </div>
      </main>

    </div>
  );
};
