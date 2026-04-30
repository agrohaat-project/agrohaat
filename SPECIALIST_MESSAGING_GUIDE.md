# Specialist Messaging System - Implementation Guide

## Overview
A complete specialist messaging system has been created allowing agricultural specialists to login, view conversations with farmers, and provide expert guidance through real-time messaging.

---

## ✅ What's Been Created

### 1. **Specialist Module Structure**
```
src/app/specialist/
├── layout.tsx              # Specialist panel layout with navigation
├── dashboard/
│   └── page.tsx            # Specialist dashboard with statistics
└── messages/
    └── page.tsx            # Specialist messaging interface
```

### 2. **API Endpoints**
- **`GET /api/specialist/farmers`** - Get list of farmers who have chatted with specialists
- **`GET /api/specialist/conversations`** - Get conversation statistics (active conversations, total farmers, unreplied messages)
- **`GET/POST /api/chat`** - Existing chat endpoint (room-based messaging)

### 3. **Database Models**
- **User Model** - Already includes 'specialist' role
- **ChatMessage Model** - Room-based messaging (format: `farmer-{farmerId}`)

### 4. **Middleware Protection**
- `/specialist/*` routes are protected - only users with 'specialist' role can access
- Specialists need admin approval to access the panel
- Updated middleware configuration to include specialist routes

---

## 🚀 How to Use

### For Specialists (Agricultural Experts)

#### **1. Login**
- Go to `/login`
- Enter email and password for the specialist account
- The account needs to be created by an admin or registered with specialist role
- After login, automatically redirected to `/specialist/dashboard`

#### **2. Dashboard (`/specialist/dashboard`)**
Displays:
- **Active Conversations** - Number of conversations with farmers in the last 7 days
- **Farmers Connected** - Total number of farmers who have messaged
- **Messages to Reply** - Number of unreplied farmer messages
- **Recent Conversations** - Quick access to recent farmer conversations
- **Quick Actions** - View messages or access learning hub

#### **3. Messages (`/specialist/messages`)**
- **Left Sidebar**: List of all farmers who have contacted you
  - Shows farmer name, email, and location
  - Click a farmer to open conversation
  - Displays unread message count

- **Main Chat Area**: 
  - Messages from farmer (gray bubbles)
  - Your replies (blue bubbles)
  - Timestamps and sender information
  - Real-time message updates (every 2.5 seconds)
  - Input field to type and send replies

### For Farmers

#### **1. Send Message to Specialist**
- Go to `/chat`
- Farmer automatically gets their unique chat room: `farmer-{farmerId}`
- Type messages and send
- Messages visible to specialists in their `/specialist/messages` panel

#### **2. Existing Chat Page**
- Farmers use `/chat` to communicate with specialists
- Messages are persistent and update in real-time
- Multiple farmers can chat simultaneously

---

## 🔧 Technical Details

### Room-Based Messaging Architecture
```
Room Format: "farmer-{farmerId}"
Example: "farmer-507f1f77bcf86cd799439011"

Flow:
1. Farmer sends message to their room: "farmer-{farmerId}"
2. Specialist views all farmer rooms in /specialist/messages
3. Specialist selects a farmer and chats in that farmer's room
4. Both can see all conversation history
```

### API Response Examples

#### Get Farmers List
```json
{
  "farmers": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Rahim Ali",
      "email": "rahim@example.com",
      "location": {
        "district": "Dhaka",
        "upazila": "Mirpur"
      }
    }
  ]
}
```

#### Get Conversations Stats
```json
{
  "activeConversations": 5,
  "totalFarmers": 12,
  "unrepliedMessages": 2,
  "recentConversations": [
    {
      "farmerId": "507f1f77bcf86cd799439011",
      "farmerName": "Rahim Ali",
      "lastMessage": "When should I apply pesticides?",
      "lastMessageTime": "23/04/2026",
      "unreadCount": 1
    }
  ]
}
```

---

## 📋 Admin Account Setup

To create a specialist account, an admin needs to:

1. Register the user via the admin panel or directly in MongoDB:
```javascript
{
  name: "Dr. Ahmed Khan",
  email: "ahmed@agrohaat.com",
  password: "hashed_password",
  phone: "01700000000",
  role: "specialist",
  isVerified: true,
  isApproved: true,  // Must be approved for specialist to access panel
  isSuspended: false,
  location: {
    district: "Dhaka",
    upazila: "Dhanmondi",
    address: "AgroHaat Office"
  }
}
```

2. The specialist can then login with their credentials

---

## 🎨 UI Features

### Dashboard Features
- Welcome message with specialist name
- Color-coded statistics cards with icons
- Recent conversations with quick links
- Action buttons for viewing messages

### Messaging Interface Features
- Two-column layout (farmers list + conversation)
- Responsive design (mobile-friendly)
- Auto-scroll to latest messages
- Real-time message updates
- Message status indicators
- Search/filter ready (can be added)
- Unread message badges

---

## 🔐 Security Features

✅ Role-based access control (specialist only)
✅ Approval requirement for specialist access
✅ Authentication via NextAuth with JWT
✅ Server-side session validation
✅ Database queries restricted by role

---

## 📱 Routes Overview

| Route | Role | Purpose |
|-------|------|---------|
| `/specialist/dashboard` | Specialist | Main dashboard with stats |
| `/specialist/messages` | Specialist | View and reply to farmer messages |
| `/chat` | Farmer | Send messages to specialists |
| `/api/specialist/farmers` | Specialist | Get list of farmers |
| `/api/specialist/conversations` | Specialist | Get conversation statistics |
| `/api/chat` | All | Room-based messaging API |

---

## 🚨 Important Notes

1. **Specialist Account Creation**: Must be created by admin (role: 'specialist')
2. **Approval Required**: Specialist accounts need `isApproved: true` to access the panel
3. **Message Persistence**: All messages are stored in MongoDB ChatMessage collection
4. **Real-time Updates**: Specialists need to refresh messages manually (no live Socket.io)
5. **Farmer Access**: Farmers must have an account to message specialists
6. **Room Format**: Strictly `farmer-{farmerId}` format for proper functioning

---

## 🎯 Future Enhancements

- [ ] WebSocket support for real-time messaging (replace polling)
- [ ] File/image upload in messages
- [ ] Typing indicators
- [ ] Read receipts
- [ ] Message search functionality
- [ ] Archived conversations
- [ ] Automated specialist response templates
- [ ] Specialist performance analytics
- [ ] Farmer feedback ratings for specialists

---

## ✨ Testing the System

### Step 1: Create Test Accounts
```bash
# Create specialist account in MongoDB
db.users.insertOne({
  name: "Dr. Test",
  email: "specialist@test.com",
  password: "hashed_password",
  role: "specialist",
  isApproved: true,
  phone: "01700000000"
})

# Create farmer account
db.users.insertOne({
  name: "Test Farmer",
  email: "farmer@test.com",
  password: "hashed_password",
  role: "farmer",
  isApproved: true,
  phone: "01700000001"
})
```

### Step 2: Test Flow
1. Login as farmer → `/chat` → Send message
2. Login as specialist → `/specialist/dashboard` → View stats
3. Click on farmer in `/specialist/messages` → Reply to message
4. Refresh farmer's chat → See specialist's reply

---

## 📞 Support

For issues or questions:
1. Check the specialist dashboard for connection status
2. Verify specialist account has `isApproved: true`
3. Check browser console for any JavaScript errors
4. Verify MongoDB connection and ChatMessage collection exists
