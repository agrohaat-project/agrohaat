export function formatCurrency(amount: number): string {
  return `৳${amount.toLocaleString('en-BD')}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-BD', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending:    'bg-yellow-100 text-yellow-800',
    accepted:   'bg-blue-100 text-blue-800',
    rejected:   'bg-red-100 text-red-800',
    paid:       'bg-purple-100 text-purple-800',
    delivered:  'bg-green-100 text-green-800',
    available:  'bg-green-100 text-green-800',
    delivering: 'bg-blue-100 text-blue-800',
    completed:  'bg-gray-100 text-gray-800',
    suspended:  'bg-red-100 text-red-800',
    approved:   'bg-green-100 text-green-800',
  };
  return map[status] ?? 'bg-gray-100 text-gray-800';
}

export const DISTRICTS = [
  'Dhaka','Chittagong','Rajshahi','Khulna','Sylhet','Barisal',
  'Rangpur','Mymensingh','Cumilla','Narayanganj','Gazipur',
  'Bogura','Jessore','Dinajpur','Tangail','Faridpur','Pabna',
  'Sirajganj','Jashore','Naogaon','Habiganj','Moulvibazar',
  'Sunamganj','Netrokona','Jamalpur','Sherpur','Kishoreganj',
  'Narsingdi','Munshiganj','Manikganj',
];

export const CATEGORIES = [
  'Rice & Grains','Vegetables','Fruits','Fish & Seafood',
  'Spices & Herbs','Pulses','Dairy','Poultry','Other',
];

export const QUALITY_GRADES = ['A+', 'A', 'B+', 'B', 'C'];

export const UNITS = ['kg', 'ton', 'piece', 'dozen', 'bundle', 'liter'];
