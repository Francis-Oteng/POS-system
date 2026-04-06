# POS-System
This is an app designed to facilitate transactions between end users and retailers 
# Point of Sale (POS) System

A modern, responsive Point of Sale system built with **React** for the frontend and **Node.js with Express** for the backend. Features dummy data (no database), clean UI, and full payment integration with Paystack.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [Payment Methods](#payment-methods)
- [License](#license)

## ✨ Features

### Core Functionality
- ✅ **Product Display** - Grid of products with name and price
- ✅ **Shopping Cart** - Add, remove, and update item quantities
- ✅ **Discount System** - Apply percentage discounts dynamically
- ✅ **Real-time Totals** - Automatic calculation including discounts
- ✅ **Multiple Payment Methods** - Cash, Mobile Money, Card
- ✅ **Cash Payment** - Calculate change with validation
- ✅ **Paystack Integration** - Mobile Money and Card payment processing
- ✅ **Receipt Generation** - Print receipts (console logging)
- ✅ **Cart Reset** - Start new sale after payment

### UI/UX Features
- 📱 Fully Responsive Design
- 🎨 Clean, Modern Interface
- ⚡ Real-time Updates
- 🎯 Intuitive Navigation
- 💅 Professional Styling with Flexbox/Grid

## 🛠 Tech Stack

### Frontend
- **React 18** - UI framework
- **React Hooks** - State management (useState, useEffect)
- **CSS3** - Responsive styling
- **Fetch API** - HTTP requests

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Axios** - HTTP client for Paystack API
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables

### Payment
- **Paystack API** - Payment processing

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v14 or higher ([Download](https://nodejs.org/))
- **npm** v6 or higher (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **Paystack Account** (Optional, for payment testing) ([Sign up](https://paystack.com/))

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Francis-Oteng/POS-system.git
cd POS-system
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
PAYSTACK_SECRET_KEY=your_paystack_secret_key_here
PORT=5000
NODE_ENV=development
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Ensure the frontend is configured to call the backend at `http://localhost:5000`.

## ▶️ Running the Application

### Start Backend Server

```bash
cd backend
npm run dev
```

The backend will run on `http://localhost:5000`

```
🚀 POS System Backend running on http://localhost:5000
📝 Products endpoint: http://localhost:5000/api/products
💳 Payment endpoint: http://localhost:5000/api/pay
```

### Start Frontend Development Server

In a new terminal:

```bash
cd frontend
npm start
```

The frontend will open automatically at `http://localhost:3000`

## 📁 Project Structure

```
POS-system/
├── backend/
│   ├── server.js              # Express server
│   ├── .env                   # Environment variables
│   ├── .env.example           # Example env file
│   └── package.json           # Backend dependencies
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.jsx            # Main component
    │   ├── App.css            # Main styles
    │   ├── index.js           # React entry point
    │   ├── components/
    │   │   ├── ProductSection.jsx
    │   │   ├── CartSection.jsx
    │   │   └── payments/
    │   │       ├── CashPayment.jsx
    │   │       └── PaystackPayment.jsx
    │   └── styles/
    │       ├── ProductSection.css
    │       ├── CartSection.css
    │       ├── CashPayment.css
    │       └── PaystackPayment.css
    └── package.json           # Frontend dependencies
```

## 🔌 API Endpoints

### GET /api/products

Returns a list of available products.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Coca Cola",
    "price": 5.99
  },
  {
    "id": 2,
    "name": "Fanta Orange",
    "price": 4.99
  }
]
```

### POST /api/pay

Initializes a Paystack payment transaction.

**Request Body:**
```json
{
  "amount": 25.50,
  "paymentMethod": "momo",
  "email": "customer@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "authorizationUrl": "https://checkout.paystack.com/...",
  "accessCode": "...",
  "reference": "..."
}
```

### GET /api/verify-payment/:reference

Verifies a Paystack payment (optional).

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "success",
    "amount": 2550,
    "customer": {...}
  }
}
```

## ⚙️ Configuration

### Paystack Setup

1. **Create a Paystack Account**
   - Go to [Paystack.com](https://paystack.com)
   - Sign up and verify your account

2. **Get Your Secret Key**
   - Navigate to Settings → API Keys & Webhooks
   - Copy your Secret Key

3. **Add to .env**
   ```env
   PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
   ```

## 📖 Usage Guide

### 1. **Adding Products to Cart**
   - Browse the products on the left side
   - Click on any product to add it to the cart
   - The cart updates in real-time

### 2. **Managing Cart Items**
   - Increase/decrease quantity using +/- buttons
   - Remove items by clicking the X button
   - Items update total automatically

### 3. **Applying Discount**
   - Enter percentage in the discount field
   - Discount applies immediately to the total

### 4. **Paying with Cash**
   - Select "Cash" payment method
   - Enter the amount paid by customer
   - System calculates change automatically
   - Click "Complete Payment" after verification

### 5. **Paying with Mobile Money or Card**
   - Select "MoMo" or "Card" payment method
   - Click the payment button
   - You'll be redirected to Paystack payment page
   - Complete payment on Paystack
   - Return to the system

### 6. **Starting New Sale**
   - After successful payment, click "New Sale"
   - Cart clears and system resets for next transaction

## 💳 Payment Methods

### Cash Payment
- Input amount paid
- Automatic change calculation
- Validation for insufficient payment
- Receipt printing option

### Mobile Money (MoMo)
- Integrated with Paystack
- Secure transaction processing
- Real-time payment confirmation

### Card Payment
- Multiple card types supported (Visa, MasterCard, etc.)
- Integrated with Paystack
- PCI-DSS compliant

## 🧪 Testing

### Test Products
The system comes with 12 dummy products:
- Beverages (Coca Cola, Fanta, Sprite, Water, Juice)
- Dairy (Milk, Butter, Eggs)
- Staples (Bread, Rice, Sugar, Salt)

### Test Transactions
Use test credentials on Paystack:
- **Card**: 4084084084084081
- **CVV**: Any 3 digits
- **Expiry**: Any future date

## 📝 Dummy Data

All product data is stored in `backend/server.js`:

```javascript
const dummyProducts = [
  { id: 1, name: 'Coca Cola', price: 5.99 },
  { id: 2, name: 'Fanta Orange', price: 4.99 },
  // ... more products
];
```

To add more products, edit this array directly.

## 🐛 Troubleshooting

### Backend not connecting?
- Ensure backend is running on port 5000
- Check CORS is enabled in Express
- Verify `.env` file exists with correct port

### Payment not working?
- Verify Paystack Secret Key in `.env`
- Check internet connection
- Ensure email is valid in payment request

### Products not loading?
- Backend server must be running
- Check browser console for errors
- Verify API endpoint: `http://localhost:5000/api/products`

## 📚 Resources

- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [Paystack Integration Guide](https://paystack.com/docs)
- [REST API Best Practices](https://restfulapi.net)

## 🤝 Contributing

Feel free to fork this project and submit pull requests for improvements.

## 📄 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

## 👨‍💻 Author

**Francis Oteng**
- GitHub: [@Francis-Oteng](https://github.com/Francis-Oteng)

---

## 🎯 Next Steps

1. Clone the repository
2. Install dependencies for both backend and frontend
3. Add your Paystack Secret Key to `.env`
4. Run backend: `npm run dev`
5. Run frontend: `npm start`
6. Start making sales! 🎉

---

**Happy Selling!** 💰
