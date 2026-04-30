import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Product from '@/models/Product';
import Order from '@/models/Order';
import DeliveryJob from '@/models/DeliveryJob';
import Review from '@/models/Review';

export async function GET() {
  return POST();
}

export async function POST() {
  try {
    await connectDB();

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      DeliveryJob.deleteMany({}),
      Review.deleteMany({}),
    ]);

    const pass = await bcrypt.hash('Test1234!', 12);

    // ── Users ────────────────────────────────────────────────
    const users = await User.insertMany([
      {
        name: 'AgroHaat Admin', email: 'admin@agrohaat.com', password: pass,
        phone: '01700000001', role: 'admin',
        isVerified: true, isApproved: true, isSuspended: false,
        location: { district: 'Dhaka', upazila: 'Motijheel', address: 'AgroHaat HQ, Motijheel' },
        bio: 'Platform administrator',
      },
      {
        name: 'Rahim Uddin', email: 'rahim@farmer.com', password: pass,
        phone: '01711111111', role: 'farmer',
        isVerified: true, isApproved: true, isSuspended: false,
        location: { district: 'Rajshahi', upazila: 'Godagari', address: 'Village Char Ashariadah, Rajshahi' },
        bio: 'Rice and mango farmer with 15 years of experience in Rajshahi.',
      },
      {
        name: 'Karim Hossain', email: 'karim@farmer.com', password: pass,
        phone: '01722222222', role: 'farmer',
        isVerified: true, isApproved: true, isSuspended: false,
        location: { district: 'Mymensingh', upazila: 'Trishal', address: 'Village Dhanikhola, Mymensingh' },
        bio: 'Vegetable and fish farmer from Mymensingh. Organic farming advocate.',
      },
      {
        name: 'Farida Begum', email: 'farida@farmer.com', password: pass,
        phone: '01733333333', role: 'farmer',
        isVerified: true, isApproved: true, isSuspended: false,
        location: { district: 'Sylhet', upazila: 'Beanibazar', address: 'Village Lauta, Sylhet' },
        bio: 'Lychee and seasonal fruit grower from Sylhet highlands.',
      },
      {
        name: 'Abdul Malek', email: 'malek@farmer.com', password: pass,
        phone: '01744444444', role: 'farmer',
        isVerified: true, isApproved: true, isSuspended: false,
        location: { district: 'Khulna', upazila: 'Dumuria', address: 'Village Ghona, Khulna' },
        bio: 'Fish and prawn farmer from Khulna delta region.',
      },
      {
        name: 'Nasima Akter', email: 'nasima@farmer.com', password: pass,
        phone: '01755555555', role: 'farmer',
        isVerified: true, isApproved: true, isSuspended: false,
        location: { district: 'Bogura', upazila: 'Shibganj', address: 'Village Shantahar, Bogura' },
        bio: 'Potato, onion and garlic specialist from Bogura, the potato capital.',
      },
      {
        name: 'Rafiqul Islam', email: 'buyer1@agrohaat.com', password: pass,
        phone: '01766666666', role: 'buyer',
        isVerified: true, isApproved: true, isSuspended: false,
        location: { district: 'Dhaka', upazila: 'Mirpur', address: 'House 12, Road 5, Mirpur-10, Dhaka' },
        bio: 'Wholesale buyer supplying supermarkets in Dhaka.',
      },
      {
        name: 'Sohana Rahman', email: 'buyer2@agrohaat.com', password: pass,
        phone: '01777777777', role: 'buyer',
        isVerified: true, isApproved: true, isSuspended: false,
        location: { district: 'Chittagong', upazila: 'Pahartali', address: 'Agrabad Commercial Area, Chittagong' },
        bio: 'Restaurant owner sourcing fresh ingredients directly from farmers.',
      },
      {
        name: 'Nurul Islam', email: 'buyer3@agrohaat.com', password: pass,
        phone: '01788888888', role: 'buyer',
        isVerified: true, isApproved: true, isSuspended: false,
        location: { district: 'Sylhet', upazila: 'Sylhet Sadar', address: 'Ambarkhana, Sylhet' },
        bio: 'Local market trader from Sylhet.',
      },
      {
        name: 'Jamal Truck Services', email: 'truck1@transport.com', password: pass,
        phone: '01799999991', role: 'transporter',
        isVerified: true, isApproved: true, isSuspended: false,
        location: { district: 'Dhaka', upazila: 'Demra', address: 'Demra Truck Terminal, Dhaka' },
        bio: 'Refrigerated truck transport covering Dhaka, Rajshahi, Mymensingh routes.',
      },
      {
        name: 'Chittagong Express Logistics', email: 'truck2@transport.com', password: pass,
        phone: '01799999992', role: 'transporter',
        isVerified: true, isApproved: true, isSuspended: false,
        location: { district: 'Chittagong', upazila: 'Sitakunda', address: 'Sitakunda Highway, Chittagong' },
        bio: 'Fast delivery covering Chittagong, Sylhet, Comilla routes.',
      },
      {
        name: 'Dr. Anwar Hossain', email: 'specialist@agrohaat.com', password: pass,
        phone: '01700000099', role: 'specialist',
        isVerified: true, isApproved: true, isSuspended: false,
        location: { district: 'Dhaka', upazila: 'Farmgate', address: 'BARI Office, Farmgate, Dhaka' },
        bio: 'Senior Agricultural Scientist at BARI. Expert in crop diseases, fertilizers and pest management.',
      },
      {
        name: 'Mizanur Rahman', email: 'farmer6@agrohaat.com', password: pass,
        phone: '01756565656', role: 'farmer',
        isVerified: true, isApproved: false, isSuspended: false,
        location: { district: 'Rangpur', upazila: 'Pirganj', address: 'Village Madhopara, Rangpur' },
        bio: 'New farmer applying to sell on AgroHaat.',
      },
    ]);

    const [admin, rahim, karim, farida, malek, nasima,
           buyer1, buyer2, buyer3, truck1, truck2, _specialist, _pendingFarmer] = users;

    // ── Products ──────────────────────────────────────────────
    const products = await Product.insertMany([
      {
        title: 'Boro Rice (BRRI dhan28)', description: 'Premium quality boro rice grown in Rajshahi. Low moisture, excellent milling quality. Suitable for wholesale purchase.',
        category: 'Rice & Grains', price: 45, quantity: 500, unit: 'kg', qualityGrade: 'A',
        harvestDate: new Date('2026-03-20'),
        location: { district: 'Rajshahi', upazila: 'Godagari', address: 'Village Char Ashariadah' },
        images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'],
        farmerId: rahim._id, farmerName: rahim.name, farmerPhone: rahim.phone, isAvailable: true,
      },
      {
        title: 'Aromatic Kataribhog Rice', description: 'Famous aromatic variety from Dinajpur region. Long, slender grains with a distinctive fragrance. Used for special occasions and biriyani.',
        category: 'Rice & Grains', price: 85, quantity: 200, unit: 'kg', qualityGrade: 'A+',
        harvestDate: new Date('2026-02-15'),
        location: { district: 'Rajshahi', upazila: 'Godagari', address: 'Village Char Ashariadah' },
        images: ['https://images.unsplash.com/photo-1568347355280-d33fdf77d42a?w=400'],
        farmerId: rahim._id, farmerName: rahim.name, farmerPhone: rahim.phone, isAvailable: true,
      },
      {
        title: 'Himsagar Mango (Grade A)', description: 'The king of Bangladeshi mangoes. Grown in Rajshahi orchards with no chemical fertilizers. Sweet, juicy, large fruit. Seasonal harvest June-July.',
        category: 'Fruits', price: 140, quantity: 300, unit: 'kg', qualityGrade: 'A+',
        harvestDate: new Date('2026-06-10'),
        location: { district: 'Rajshahi', upazila: 'Bagmara', address: 'Mango Garden, Bagmara' },
        images: ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=400'],
        farmerId: rahim._id, farmerName: rahim.name, farmerPhone: rahim.phone, isAvailable: true,
      },
      {
        title: 'Fresh Tomato', description: 'Bright red, firm tomatoes from Mymensingh. Grown using organic compost. No harmful pesticides. Ideal for daily cooking and restaurants.',
        category: 'Vegetables', price: 40, quantity: 400, unit: 'kg', qualityGrade: 'A',
        harvestDate: new Date('2026-03-25'),
        location: { district: 'Mymensingh', upazila: 'Trishal', address: 'Village Dhanikhola' },
        images: ['https://images.unsplash.com/photo-1546094096-0df4bcaad337?w=400'],
        farmerId: karim._id, farmerName: karim.name, farmerPhone: karim.phone, isAvailable: true,
      },
      {
        title: 'Brinjal / Eggplant (Begun)', description: 'Large purple brinjal, perfect for bharta and curries. Fresh harvest from Mymensingh. Pesticide-free cultivation.',
        category: 'Vegetables', price: 30, quantity: 250, unit: 'kg', qualityGrade: 'A',
        harvestDate: new Date('2026-03-28'),
        location: { district: 'Mymensingh', upazila: 'Trishal', address: 'Village Dhanikhola' },
        images: ['https://images.unsplash.com/photo-1659995756154-c4041e879284?w=400'],
        farmerId: karim._id, farmerName: karim.name, farmerPhone: karim.phone, isAvailable: true,
      },
      {
        title: 'Fresh Catfish (Magur)', description: 'Live catfish from natural ponds in Mymensingh. High protein, clean freshwater fish. Delivered same-day in insulated containers.',
        category: 'Fish & Seafood', price: 380, quantity: 80, unit: 'kg', qualityGrade: 'A+',
        harvestDate: new Date('2026-04-01'),
        location: { district: 'Mymensingh', upazila: 'Trishal', address: 'Village Dhanikhola pond' },
        images: ['https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400'],
        farmerId: karim._id, farmerName: karim.name, farmerPhone: karim.phone, isAvailable: true,
      },
      {
        title: 'Madrazi Lychee', description: 'Premium lychee from Sylhet. Juicy, sweet, thin-skinned. One of the best lychee varieties in Bangladesh. Short harvest window — order early!',
        category: 'Fruits', price: 95, quantity: 150, unit: 'kg', qualityGrade: 'A+',
        harvestDate: new Date('2026-05-20'),
        location: { district: 'Sylhet', upazila: 'Beanibazar', address: 'Village Lauta' },
        images: ['https://images.unsplash.com/photo-1578403881766-c4fb4e4b7a2f?w=400'],
        farmerId: farida._id, farmerName: farida.name, farmerPhone: farida.phone, isAvailable: true,
      },
      {
        title: 'Fresh Jackfruit (Kanthal)', description: 'Large ripe jackfruit from Sylhet. Each fruit 10-15 kg. Sweet, fragrant, naturally ripened on the tree. Great for cooking and eating fresh.',
        category: 'Fruits', price: 18, quantity: 60, unit: 'kg', qualityGrade: 'A',
        harvestDate: new Date('2026-04-15'),
        location: { district: 'Sylhet', upazila: 'Beanibazar', address: 'Village Lauta' },
        images: ['https://images.unsplash.com/photo-1626074353765-517a681e40be?w=400'],
        farmerId: farida._id, farmerName: farida.name, farmerPhone: farida.phone, isAvailable: true,
      },
      {
        title: 'Hilsa Fish (Ilish — Padma River)', description: 'Authentic Padma Hilsa — the pride of Bangladesh. Caught fresh from the Padma River near Rajbari. Rich, oily, full of omega-3. Minimum order 5 kg.',
        category: 'Fish & Seafood', price: 1200, quantity: 50, unit: 'kg', qualityGrade: 'A+',
        harvestDate: new Date('2026-04-05'),
        location: { district: 'Khulna', upazila: 'Dumuria', address: 'Padma Ghat, Khulna' },
        images: ['https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400'],
        farmerId: malek._id, farmerName: malek.name, farmerPhone: malek.phone, isAvailable: true,
      },
      {
        title: 'Rui Fish (Rohu)', description: 'Farm-raised Rui fish from Khulna. Medium to large size (1.5–3 kg per fish). Clean freshwater ponds, no growth hormones used.',
        category: 'Fish & Seafood', price: 280, quantity: 120, unit: 'kg', qualityGrade: 'A',
        harvestDate: new Date('2026-04-02'),
        location: { district: 'Khulna', upazila: 'Dumuria', address: 'Village Ghona fish farm' },
        images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400'],
        farmerId: malek._id, farmerName: malek.name, farmerPhone: malek.phone, isAvailable: true,
      },
      {
        title: 'Tiger Prawn (Bagda Chingri)', description: 'Premium Bagda tiger prawns from Khulna mangrove farms. Large size (12–15 pieces/kg). Excellent for export-quality cooking.',
        category: 'Fish & Seafood', price: 850, quantity: 40, unit: 'kg', qualityGrade: 'A+',
        harvestDate: new Date('2026-03-30'),
        location: { district: 'Khulna', upazila: 'Batiaghata', address: 'Sundarban Buffer Zone Farm' },
        images: ['https://images.unsplash.com/photo-1534482421-64566f976cfa?w=400'],
        farmerId: malek._id, farmerName: malek.name, farmerPhone: malek.phone, isAvailable: true,
      },
      {
        title: 'Granola Potato', description: 'High-yield Granola variety from Bogura. Uniform shape, clean skin. Widely used in restaurants and for wholesale. 1 ton minimum order available.',
        category: 'Vegetables', price: 28, quantity: 2000, unit: 'kg', qualityGrade: 'A',
        harvestDate: new Date('2026-02-28'),
        location: { district: 'Bogura', upazila: 'Shibganj', address: 'Village Shantahar, Bogura cold storage' },
        images: ['https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400'],
        farmerId: nasima._id, farmerName: nasima.name, farmerPhone: nasima.phone, isAvailable: true,
      },
      {
        title: 'Yellow Onion', description: 'Dried yellow onion from Bogura. Medium to large bulbs. Low moisture, long shelf life. Suitable for cold storage and long transport.',
        category: 'Vegetables', price: 65, quantity: 800, unit: 'kg', qualityGrade: 'A',
        harvestDate: new Date('2026-03-10'),
        location: { district: 'Bogura', upazila: 'Shibganj', address: 'Village Shantahar' },
        images: ['https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400'],
        farmerId: nasima._id, farmerName: nasima.name, farmerPhone: nasima.phone, isAvailable: true,
      },
      {
        title: 'Fresh Garlic', description: 'Aromatic garlic from Bogura. Large bulbs with thick cloves. Naturally sun-dried. No chemical treatment. Ideal for cooking and processing.',
        category: 'Spices & Herbs', price: 175, quantity: 300, unit: 'kg', qualityGrade: 'A+',
        harvestDate: new Date('2026-03-05'),
        location: { district: 'Bogura', upazila: 'Shibganj', address: 'Village Shantahar' },
        images: ['https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=400'],
        farmerId: nasima._id, farmerName: nasima.name, farmerPhone: nasima.phone, isAvailable: true,
      },
      {
        title: 'Green Chili (Mirchi)', description: 'Spicy green chili from Bogura. Fresh harvest, bright green color. Used extensively in Bangladeshi cooking. Available in bulk.',
        category: 'Spices & Herbs', price: 55, quantity: 200, unit: 'kg', qualityGrade: 'B+',
        harvestDate: new Date('2026-04-01'),
        location: { district: 'Bogura', upazila: 'Shibganj', address: 'Village Shantahar' },
        images: ['https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400'],
        farmerId: nasima._id, farmerName: nasima.name, farmerPhone: nasima.phone, isAvailable: true,
      },
      {
        title: 'Cauliflower (Ful Kopi)', description: 'White, tight-headed cauliflower from Mymensingh. Each head 600g–1kg. Fresh cut to order. Ideal for vegetable markets and restaurants.',
        category: 'Vegetables', price: 38, quantity: 200, unit: 'kg', qualityGrade: 'A',
        harvestDate: new Date('2026-03-20'),
        location: { district: 'Mymensingh', upazila: 'Trishal', address: 'Village Dhanikhola' },
        images: ['https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=400'],
        farmerId: karim._id, farmerName: karim.name, farmerPhone: karim.phone, isAvailable: true,
      },
      {
        title: 'Mustard Seeds (Sarisha)', description: 'Black mustard seeds from Rajshahi. Oil extraction quality — 42% oil content. Used for mustard oil production and cooking.',
        category: 'Spices & Herbs', price: 78, quantity: 500, unit: 'kg', qualityGrade: 'A',
        harvestDate: new Date('2026-03-01'),
        location: { district: 'Rajshahi', upazila: 'Godagari', address: 'Village Char Ashariadah' },
        images: ['https://images.unsplash.com/photo-1617975375505-f64e68a9b855?w=400'],
        farmerId: rahim._id, farmerName: rahim.name, farmerPhone: rahim.phone, isAvailable: true,
      },
      {
        title: 'Bitter Gourd (Korola)', description: 'Fresh bitter gourd from Khulna. Dark green, medium size. Harvested daily for maximum freshness. Rich in vitamins and minerals.',
        category: 'Vegetables', price: 35, quantity: 150, unit: 'kg', qualityGrade: 'B+',
        harvestDate: new Date('2026-04-03'),
        location: { district: 'Khulna', upazila: 'Dumuria', address: 'Village Ghona' },
        images: ['https://images.unsplash.com/photo-1617390754099-3e06cd59d7fa?w=400'],
        farmerId: malek._id, farmerName: malek.name, farmerPhone: malek.phone, isAvailable: true,
      },
      {
        title: 'Sobri Banana (per dozen)', description: 'Sweet Sobri bananas from Sylhet. Ripe and ready to eat. Small-medium size. Available in dozens. Great for retail markets.',
        category: 'Fruits', price: 28, quantity: 150, unit: 'dozen', qualityGrade: 'A',
        harvestDate: new Date('2026-04-08'),
        location: { district: 'Sylhet', upazila: 'Beanibazar', address: 'Village Lauta' },
        images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400'],
        farmerId: farida._id, farmerName: farida.name, farmerPhone: farida.phone, isAvailable: true,
      },
      {
        title: 'Ginger (Ada)', description: 'Fresh ginger from Sylhet hills. Strong aroma, high gingerol content. Used for cooking, tea, and medicinal purposes.',
        category: 'Spices & Herbs', price: 115, quantity: 200, unit: 'kg', qualityGrade: 'A',
        harvestDate: new Date('2026-03-15'),
        location: { district: 'Sylhet', upazila: 'Companiganj', address: 'Hill garden, Companiganj' },
        images: ['https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400'],
        farmerId: farida._id, farmerName: farida.name, farmerPhone: farida.phone, isAvailable: true,
      },
    ]);

    // ── Orders ────────────────────────────────────────────────
    const orders = await Order.insertMany([
      {
        productId: products[0]._id, productTitle: products[0].title,
        productImage: products[0].images[0],
        farmerId: rahim._id, farmerName: rahim.name,
        buyerId: buyer1._id, buyerName: buyer1.name, buyerPhone: buyer1.phone,
        quantity: 50, unitPrice: 45, totalAmount: 2250, unit: 'kg',
        status: 'delivered', paymentStatus: 'paid', paymentMethod: 'bkash',
        paymentTransactionId: 'BK168523XB42',
        deliveryAddress: { district: 'Dhaka', upazila: 'Mirpur', address: 'House 12, Road 5, Mirpur-10' },
        notes: 'Please pack in 25kg sacks.',
      },
      {
        productId: products[8]._id, productTitle: products[8].title,
        productImage: products[8].images[0],
        farmerId: malek._id, farmerName: malek.name,
        buyerId: buyer2._id, buyerName: buyer2.name, buyerPhone: buyer2.phone,
        quantity: 10, unitPrice: 1200, totalAmount: 12000, unit: 'kg',
        status: 'paid', paymentStatus: 'paid', paymentMethod: 'nagad',
        paymentTransactionId: 'NG168812KN77',
        deliveryAddress: { district: 'Chittagong', upazila: 'Pahartali', address: 'Agrabad Commercial Area' },
        notes: 'Fresh Hilsa for restaurant.',
      },
      {
        productId: products[11]._id, productTitle: products[11].title,
        productImage: products[11].images[0],
        farmerId: nasima._id, farmerName: nasima.name,
        buyerId: buyer1._id, buyerName: buyer1.name, buyerPhone: buyer1.phone,
        quantity: 200, unitPrice: 28, totalAmount: 5600, unit: 'kg',
        status: 'accepted', paymentStatus: 'unpaid',
        deliveryAddress: { district: 'Dhaka', upazila: 'Mirpur', address: 'House 12, Road 5, Mirpur-10' },
        notes: 'Need delivery within 3 days.',
      },
      {
        productId: products[3]._id, productTitle: products[3].title,
        productImage: products[3].images[0],
        farmerId: karim._id, farmerName: karim.name,
        buyerId: buyer3._id, buyerName: buyer3.name, buyerPhone: buyer3.phone,
        quantity: 30, unitPrice: 40, totalAmount: 1200, unit: 'kg',
        status: 'pending', paymentStatus: 'unpaid',
        deliveryAddress: { district: 'Sylhet', upazila: 'Sylhet Sadar', address: 'Ambarkhana market' },
        notes: 'For my retail stall.',
      },
      {
        productId: products[9]._id, productTitle: products[9].title,
        productImage: products[9].images[0],
        farmerId: malek._id, farmerName: malek.name,
        buyerId: buyer2._id, buyerName: buyer2.name, buyerPhone: buyer2.phone,
        quantity: 25, unitPrice: 280, totalAmount: 7000, unit: 'kg',
        status: 'accepted', paymentStatus: 'unpaid',
        deliveryAddress: { district: 'Chittagong', upazila: 'Pahartali', address: 'Agrabad' },
      },
      {
        productId: products[6]._id, productTitle: products[6].title,
        productImage: products[6].images[0],
        farmerId: farida._id, farmerName: farida.name,
        buyerId: buyer1._id, buyerName: buyer1.name, buyerPhone: buyer1.phone,
        quantity: 20, unitPrice: 95, totalAmount: 1900, unit: 'kg',
        status: 'rejected', paymentStatus: 'unpaid',
        rejectionReason: 'Out of stock at requested delivery date.',
        deliveryAddress: { district: 'Dhaka', upazila: 'Mirpur', address: 'House 12' },
      },
      {
        productId: products[12]._id, productTitle: products[12].title,
        productImage: products[12].images[0],
        farmerId: nasima._id, farmerName: nasima.name,
        buyerId: buyer3._id, buyerName: buyer3.name, buyerPhone: buyer3.phone,
        quantity: 50, unitPrice: 65, totalAmount: 3250, unit: 'kg',
        status: 'paid', paymentStatus: 'paid', paymentMethod: 'bkash',
        paymentTransactionId: 'BK169001ON55',
        deliveryAddress: { district: 'Sylhet', upazila: 'Sylhet Sadar', address: 'Ambarkhana' },
      },
      {
        productId: products[1]._id, productTitle: products[1].title,
        productImage: products[1].images[0],
        farmerId: rahim._id, farmerName: rahim.name,
        buyerId: buyer2._id, buyerName: buyer2.name, buyerPhone: buyer2.phone,
        quantity: 30, unitPrice: 85, totalAmount: 2550, unit: 'kg',
        status: 'pending', paymentStatus: 'unpaid',
        deliveryAddress: { district: 'Chittagong', upazila: 'Pahartali', address: 'Agrabad' },
        notes: 'Premium rice for restaurant.',
      },
    ]);

    // ── Delivery Jobs ──────────────────────────────────────────
    await DeliveryJob.insertMany([
      {
        orderId: orders[0]._id, productTitle: orders[0].productTitle,
        farmerId: rahim._id, farmerName: rahim.name,
        buyerId: buyer1._id, buyerName: buyer1.name,
        transporterId: truck1._id, transporterName: truck1.name,
        pickupLocation:   { district: 'Rajshahi', upazila: 'Godagari', address: 'Village Char Ashariadah' },
        deliveryLocation: { district: 'Dhaka', upazila: 'Mirpur', address: 'House 12, Road 5' },
        productWeight: 50, deliveryFee: 113, status: 'delivered',
      },
      {
        orderId: orders[1]._id, productTitle: orders[1].productTitle,
        farmerId: malek._id, farmerName: malek.name,
        buyerId: buyer2._id, buyerName: buyer2.name,
        transporterId: truck2._id, transporterName: truck2.name,
        pickupLocation:   { district: 'Khulna', upazila: 'Dumuria', address: 'Village Ghona' },
        deliveryLocation: { district: 'Chittagong', upazila: 'Pahartali', address: 'Agrabad' },
        productWeight: 10, deliveryFee: 600, status: 'delivering',
      },
      {
        orderId: orders[6]._id, productTitle: orders[6].productTitle,
        farmerId: nasima._id, farmerName: nasima.name,
        buyerId: buyer3._id, buyerName: buyer3.name,
        pickupLocation:   { district: 'Bogura', upazila: 'Shibganj', address: 'Village Shantahar' },
        deliveryLocation: { district: 'Sylhet', upazila: 'Sylhet Sadar', address: 'Ambarkhana' },
        productWeight: 50, deliveryFee: 163, status: 'available',
      },
      {
        orderId: orders[2]._id, productTitle: orders[2].productTitle,
        farmerId: nasima._id, farmerName: nasima.name,
        buyerId: buyer1._id, buyerName: buyer1.name,
        pickupLocation:   { district: 'Bogura', upazila: 'Shibganj', address: 'Village Shantahar' },
        deliveryLocation: { district: 'Dhaka', upazila: 'Mirpur', address: 'House 12' },
        productWeight: 200, deliveryFee: 280, status: 'available',
      },
    ]);

    // ── Reviews ────────────────────────────────────────────────
    await Review.insertMany([
      {
        fromUserId: buyer1._id, fromUserName: buyer1.name,
        toUserId: rahim._id, orderId: orders[0]._id,
        rating: 5,
        timeliness: 5,
        pricing: 5,
        communication: 5,
        comment: 'Excellent rice quality! Very fresh and exactly as described. Rahim bhai is very professional.',
      },
      {
        fromUserId: rahim._id, fromUserName: rahim.name,
        toUserId: buyer1._id, orderId: orders[0]._id,
        rating: 5,
        timeliness: 5,
        pricing: 5,
        communication: 5,
        comment: 'Great buyer. Payment on time, clear instructions. Will definitely sell to him again.',
      },
      {
        fromUserId: buyer2._id, fromUserName: buyer2.name,
        toUserId: malek._id, orderId: orders[1]._id,
        rating: 4,
        timeliness: 4,
        pricing: 4,
        communication: 4,
        comment: 'Hilsa was very fresh and authentic Padma quality. Minor delay in confirmation but overall great.',
      },
    ]);

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully!',
      summary: {
        users:    users.length,
        products: products.length,
        orders:   orders.length,
        jobs: 4,
        reviews: 3,
      },
      credentials: {
        admin:       'admin@agrohaat.com / Test1234!',
        farmer:      'rahim@farmer.com / Test1234!',
        buyer:       'buyer1@agrohaat.com / Test1234!',
        transporter: 'truck1@transport.com / Test1234!',
        specialist:  'specialist@agrohaat.com / Test1234!',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Seed failed';
    console.error('Seed error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}