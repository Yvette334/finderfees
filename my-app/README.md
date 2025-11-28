# Finders Fee - Lost and Found Platform

A web-based platform that connects people who have lost items with those who found them, facilitating returns through a commission-based reward system. Designed for Rwanda with expansion plans across Africa.

## 🌍 Mission

To create a lost and found system that leverages community participation to increase item recovery rates. The platform addresses the problem of low recovery rates in Rwanda by providing an organized digital system where losers can recover their items and finders earn rewards.

## ✨ Features

- **User Authentication**: Secure registration and login with role-based access
- **Item Reporting**: Report lost or found items with photos and details
- **Search & Browse**: Public search functionality to find matching items
- **Claim System**: Submit claims for items with admin verification
- **Payment Processing**: Flutterwave integration for MTN Mobile Money and Airtel Money
- **Admin Dashboard**: Complete system management for administrators
- **Multi-language Support**: English and Kinyarwanda
- **Notifications**: Real-time notifications for claim status updates

## 🚀 Tech Stack

- **Frontend**: React.js + Vite
- **Styling**: TailwindCSS
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payment**: Flutterwave (MTN Mobile Money & Airtel Money)
- **Routing**: React Router
- **Language**: JavaScript (ES6+)

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account and project
- Flutterwave account (for payments)

## 🔧 Installation

1. **Clone the repository**
```bash
git clone https://github.com/Yvette334/finderfees.git
cd my-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Create `.env` file in the root directory**
```env
# Supabase Configuration
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key



4. **Start the development server**
```bash
npm run dev
```

5. **Open browser to `http://localhost:5173`**

## 📁 Project Structure

```
my-app/
├── src/
│   ├── auth/              # Authentication pages
│   │   ├── login.jsx
│   │   └── register.jsx
│   ├── components/        # Reusable components
│   │   ├── AdminNavbar.jsx
│   │   ├── navbar.jsx
│   │   ├── footer.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/             # Page components
│   │   ├── Home.jsx
│   │   ├── Search.jsx
│   │   ├── dashboard.jsx
│   │   ├── admin.jsx
│   │   ├── lost.jsx
│   │   ├── found.jsx
│   │   ├── verify.jsx
│   │   ├── payment.jsx
│   │   ├── profile.jsx
│   │   └── reports.jsx
│   ├── utils/             # Utility functions
│   │   ├── api.js
│   │   ├── supabaseAPI.js
│   │   ├── supabaseClient.js
│   │   └── flutterwave.js  # Flutterwave payment integration
│   ├── App.jsx            # Main app component
│   └── main.jsx           # Entry point
├── package.json
├── vite.config.js
└── README.md
```

## 🔐 User Roles

### Regular User
- Register and create profile
- Report lost/found items
- Search and browse items
- Submit claims
- Make payments via Flutterwave
- View notifications

### Admin
- All user capabilities
- Approve/reject claims
- Manage users
- View system statistics
- Access admin dashboard

## 🌐 Multi-language Support

The platform supports:
- **English** (en)
- **Kinyarwanda** (rw)

Language preference is saved in localStorage and persists across sessions.

## 💳 Payment System

The platform uses **Flutterwave** for mobile money payments:

- **MTN Mobile Money** (Rwanda) - Phone numbers starting with 078
- **Airtel Money** (Rwanda) - Phone numbers starting with 073

**Setup Required:**
1. Create Flutterwave account at https://flutterwave.com/
2. Get API keys (test keys for development, live keys for production)
3. Add keys to `.env` file
4. Enable mobile money for Rwanda in Flutterwave dashboard


## 🔒 Security Features

- Row Level Security (RLS) on all database tables
- Secure authentication via Supabase
- Protected routes for authenticated pages
- Admin-only routes
- Phone number validation (Rwanda: 078 or 073)
- Contact information protection until payment
- Payment verification with Flutterwave API

## 📝 Database Schema

The platform uses Supabase (PostgreSQL) with the following main tables:
- `profiles` - User profiles
- `items` - Lost and found items
- `claims` - Item claims and verification
- `payments` - Payment records (with Flutterwave transaction IDs)
- `notifications` - User notifications

## 🛣️ Routes

### Public Routes
- `/` - Home page
- `/login` - Login page
- `/register` - Registration page
- `/search` - Item search (public browsing)

### Protected Routes (Require Login)
- `/dashboard` - User dashboard
- `/profile` - User profile management
- `/report/lost` - Report lost item
- `/report/found` - Report found item
- `/verify` - Submit claim
- `/payment` - Payment processing (Flutterwave)
- `/reports` - User's reported items

### Admin Routes (Require Admin Role)
- `/admin` - Admin dashboard

## 🧪 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Environment Variables

**Required:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_FLUTTERWAVE_PUBLIC_KEY` - Flutterwave public key
- `VITE_FLUTTERWAVE_SECRET_KEY` - Flutterwave secret key (for verification)

## 📚 Documentation

- [FLUTTERWAVE_SETUP.md](./FLUTTERWAVE_SETUP.md) - Flutterwave setup guide
- [FLUTTERWAVE_INTEGRATION.md](./FLUTTERWAVE_INTEGRATION.md) - Integration details

## 🤝 Contributing

This is a formative assignment project. For questions or issues, please contact the project maintainer.

## 📄 License

This project is developed as part of a formative assignment at African Leadership University.

## 👤 Author

**Yvette Muhoracyeye**  
African Leadership University

## 🔮 Future Enhancements

- Email notifications
- Real-time updates with Supabase subscriptions
- Mobile app (React Native)
- SMS notifications
- Advanced analytics
- Image optimization and cloud storage

---

**Built with ❤️ for Rwanda and Africa**
