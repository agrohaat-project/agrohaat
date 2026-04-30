'use client';
import DashboardLayout from '@/components/DashboardLayout';
const navItems = [
  { href: '/transporter/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/transporter/jobs', label: 'Delivery Jobs', icon: '🚚' },
];
export default function TransporterLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout navItems={navItems} title="Transporter Panel">{children}</DashboardLayout>;
}
