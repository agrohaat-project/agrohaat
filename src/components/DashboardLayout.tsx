'use client';
import Navbar from './Navbar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem { href: string; icon: string; label: string }

export default function DashboardLayout({ children, navItems, title }: {
  children: React.ReactNode;
  navItems: NavItem[];
  title: string;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-gray-50">
      <Navbar />
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-white border-r-2 border-green-100 shadow-lg hidden md:block">
          <div className="p-6">
            <p className="text-xs font-bold text-green-700 uppercase tracking-widest mb-6 pl-1">{title}</p>
            <nav className="space-y-2">
              {navItems.map(item => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link key={item.href} href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group ${
                      active 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg scale-105 transform' 
                        : 'text-gray-600 hover:bg-green-50 hover:text-green-700 hover:shadow-md'
                    }`}>
                    <span className="text-xl group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
                    <span>{item.label}</span>
                    {active && <span className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
        {/* Main */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
