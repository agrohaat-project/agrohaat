import DashboardLayout from '@/components/DashboardLayout';

const navItems = [
  { href: '/specialist/dashboard', icon: '🔬', label: 'Dashboard' },
  { href: '/specialist/messages',  icon: '💬', label: 'Farmer Messages' },
  { href: '/learning-hub',         icon: '🎓', label: 'Learning Hub' },
];

export default function SpecialistLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout navItems={navItems} title="Specialist Panel">{children}</DashboardLayout>;
}
