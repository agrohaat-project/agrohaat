# AgroHaat – Digital Agricultural Marketplace

A full-stack web application built with **Next.js 14**, **TypeScript**, **TailwindCSS**, and **MongoDB Atlas** that connects farmers, buyers, transporters, and administrators in Bangladesh.

---

## 👥 Team – Group 07, CSE471 (BRAC University, Spring 2026)

| ID | Name |
|---|---|
| 22299508 | Md Faysal Mahfuz |
| 22201119 | Priya Saha |
| 22201603 | Mania Afrin Mahin |

---

## 🚀 Features Implemented (Module 1 + 2)

### Module 1
- ✅ Product Listing Management (CRUD) – Farmers
- ✅ Advanced Product Search & Filtering – Buyers
- ✅ Admin User Management (approve/suspend/reinstate)

### Module 2
- ✅ Order Management Dashboard – Farmers
- ✅ Secure Digital Payment (bKash / Nagad fake flow) – Buyers
- ✅ Delivery Job Marketplace – Transporters

### Auth & Platform
- ✅ Sign up, Login, Logout (NextAuth v4, JWT)
- ✅ Role-based routing (Farmer / Buyer / Transporter / Admin)
- ✅ Account approval flow (Admin approves farmers & transporters)
- ✅ Profile management, image upload
- ✅ Review & rating system

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Auth | NextAuth v4 |
| Deployment | Vercel (recommended) |

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (free tier works fine)
- VSCode (recommended)

### Step 1 – Install Dependencies

```bash
npm install
```

### Step 2 – Create Environment File

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your values:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/agrohaat?retryWrites=true&w=majority
NEXTAUTH_SECRET=any-random-long-string-here
NEXTAUTH_URL=http://localhost:3000
```

**How to get MONGODB_URI:**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free cluster (M0)
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with `agrohaat`

**How to generate NEXTAUTH_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3 – Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 4 – Seed the Database

After the server is running, seed the database with realistic data:

```
POST http://localhost:3000/api/seed
```

You can do this in Postman:
- Method: `POST`
- URL: `http://localhost:3000/api/seed`
- No body required

This creates **13 users**, **20 products**, **8 orders**, **4 delivery jobs**, and **3 reviews**.

---

## 🔐 Demo Credentials

All passwords: `Test1234!`

| Role | Email |
|---|---|
| **Admin** | admin@agrohaat.com |
| **Farmer 1** (Rajshahi – Rice/Mango) | rahim@farmer.com |
| **Farmer 2** (Mymensingh – Vegetables) | karim@farmer.com |
| **Farmer 3** (Sylhet – Lychee/Fruits) | farida@farmer.com |
| **Farmer 4** (Khulna – Fish/Prawns) | malek@farmer.com |
| **Farmer 5** (Bogura – Potato/Onion) | nasima@farmer.com |
| **Buyer 1** | buyer1@agrohaat.com |
| **Buyer 2** | buyer2@agrohaat.com |
| **Buyer 3** | buyer3@agrohaat.com |
| **Transporter 1** (Dhaka) | truck1@transport.com |
| **Transporter 2** (Chittagong) | truck2@transport.com |
| **Specialist** | specialist@agrohaat.com |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/          # Login page
│   │   └── signup/         # Registration page
│   ├── api/
│   │   ├── auth/           # NextAuth + register
│   │   ├── products/       # Product CRUD
│   │   ├── orders/         # Order management
│   │   ├── payment/        # bKash/Nagad payment
│   │   ├── delivery-jobs/  # Transporter jobs
│   │   ├── admin/          # Admin endpoints
│   │   ├── reviews/        # Rating system
│   │   ├── upload/         # File upload
│   │   └── seed/           # Database seeder
│   ├── farmer/             # Farmer dashboard & pages
│   ├── buyer/              # Buyer dashboard & pages
│   ├── transporter/        # Transporter dashboard & pages
│   └── admin/              # Admin dashboard & pages
├── components/             # Shared components
├── lib/                    # MongoDB connection, utilities
├── models/                 # Mongoose schemas
├── middleware.ts            # Route protection
└── types/                  # TypeScript type extensions
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| GET/POST | `/api/products` | List/create products |
| GET/PUT/DELETE | `/api/products/[id]` | Single product |
| GET/POST | `/api/orders` | List/create orders |
| PUT | `/api/orders/[id]` | Update order status |
| POST | `/api/payment` | Process bKash/Nagad |
| GET | `/api/delivery-jobs` | List delivery jobs |
| PUT | `/api/delivery-jobs/[id]` | Update job status |
| GET/PUT | `/api/admin/users` | Admin user management |
| GET | `/api/admin/stats` | Platform statistics |
| POST | `/api/upload` | Upload product images |
| GET/POST | `/api/reviews` | Reviews & ratings |
| POST | `/api/seed` | Seed database |

---

## 💳 Payment Flow (Fake bKash / Nagad)

1. Buyer places an order
2. From the Orders page, clicks "Pay Now"
3. Selects bKash or Nagad
4. Enters mobile number and OTP (fake – any 6 digits work)
5. System generates a transaction ID (e.g. `BK1234567890-ABCD`)
6. Order status updates to "Paid"
7. Delivery job automatically created for transporters

---

## 🚀 Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Set the same environment variables in Vercel Dashboard → Settings → Environment Variables.

---

## 📝 Notes

- Product images are stored in `public/uploads/` locally. For production, use Cloudinary or AWS S3.
- The payment system is a realistic fake flow (no real money is processed).
- Farmers and transporters require admin approval before they can use the platform.
- Buyers are auto-approved on signup.
