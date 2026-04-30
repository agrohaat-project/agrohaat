import DashboardLayout from '@/components/DashboardLayout';

const navItems = [
  { href: '/buyer/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/buyer/products',  icon: '🛒', label: 'Browse Products' },
  { href: '/buyer/orders',    icon: '📦', label: 'My Orders' },
  { href: '/learning-hub',    icon: '📘', label: 'Learning Hub' },
];

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout navItems={navItems} title="Buyer Panel">{children}</DashboardLayout>;
}
