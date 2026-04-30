import DashboardLayout from '@/components/DashboardLayout';

const navItems = [
  { href: '/farmer/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/farmer/products',  icon: '🌾', label: 'My Products' },
  { href: '/farmer/orders',    icon: '📦', label: 'Orders' },
  { href: '/farmer/crop-help', icon: '🧑‍🌾', label: 'Crop Help' },
  { href: '/learning-hub',     icon: '🎓', label: 'Learning Hub' },
  { href: '/learning-hub/submit', icon: '📤', label: 'Submit Content' },
  { href: '/chat',             icon: '💬', label: 'Chat' },
];

export default function FarmerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout navItems={navItems} title="Farmer Panel">{children}</DashboardLayout>;
}
