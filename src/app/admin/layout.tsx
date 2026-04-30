'use client';
import DashboardLayout from '@/components/DashboardLayout';
const navItems = [
  { href: '/admin/dashboard',         label: 'Dashboard',        icon: '📊' },
  { href: '/admin/users',             label: 'User Management',  icon: '👥' },
  { href: '/admin/products',          label: 'Products',         icon: '🌾' },
  { href: '/admin/learning-content',  label: 'Learning Review',  icon: '🎓' },
];
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout navItems={navItems} title="Admin Panel">{children}</DashboardLayout>;
}
