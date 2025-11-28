# Finders Fee - Lost and Found Platform

A web-based platform that connects people who have lost items with those who found them, facilitating returns through a commission-based reward system. Designed for Rwanda with expansion plans across Africa.

## 🌍 Mission

To create a lost and found system that leverages community participation to increase item recovery rates. The platform addresses the problem of low recovery rates in Rwanda by providing an organized digital system where losers can recover their items and finders earn rewards.

## ✨ Features

- **User Authentication**: Secure registration and login with role-based access control
- **Item Reporting**: Report lost or found items with photos and detailed descriptions
- **Search & Browse**: Public search functionality to find matching items by name, category, location
- **Claim System**: Submit claims for items with admin verification
- **Admin Dashboard**: Complete system management for administrators including:
  - Approve/reject claims
  - Manage users
  - View system statistics
  - Monitor all items and claims
- **Multi-language Support**: English and Kinyarwanda (language preference saved in localStorage)
- **Notifications**: Real-time notifications for claim status updates
- **Phone Number Validation**: Enforces Rwanda phone numbers (078 or 073 prefix, 10 digits)
- **Protected Routes**: Route protection based on authentication and admin roles
- **Session Management**: Supports multiple simultaneous logins (useful for presentations)

## 🚀 Tech Stack

- **Frontend**: React 19.2.0 + Vite 7.2.2
- **Styling**: TailwindCSS 4.1.17
- **Backend**: Supabase (PostgreSQL database)
- **Authentication**: Supabase Auth
- **Routing**: React Router DOM 7.9.6
- **Build Tool**: Vite
- **Language**: JavaScript (ES6+)

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Supabase Account** - [Sign up here](https://supabase.com/)
  - A Supabase project with the following tables:
    - `profiles` - User profiles
    - `items` - Lost and found items
    - `claims` - Item claims and verification
    - `notifications` - User notifications

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Yvette334/finderfees.git
cd finderfees/my-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `my-app` directory (root of the project):

```env
# Supabase Configuration
# You can use any of these variable names (the app checks all three)
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key

# OR use Vite prefix
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# OR use React prefix (legacy support)
REACT_APP_SUPABASE_URL=your-supabase-project-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**To get your Supabase credentials:**
1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to Settings → API
4. Copy the "Project URL" and "anon/public" key

### 4. Set Up Supabase Database

Your Supabase project needs the following tables with Row Level Security (RLS) enabled:

#### `profiles` table
- Stores user profile information
- Should have columns: `id` (UUID, references auth.users), `email`, `full_name`, `phone`, `role`, `created_at`, `updated_at`

#### `items` table
- Stores lost and found items
- Should have columns: `id`, `user_id`, `item_name`, `description`, `category`, `location`, `type` (lost/found), `status`, `photo`, `reward`, `commission`, `verified`, `owner_phone`, `created_at`

#### `claims` table
- Stores item claims submitted by users
- Should have columns: `id`, `item_id`, `claimant_id`, `claimant_phone`, `claimant_name`, `description`, `status` (pending/approved/rejected), `reviewed_by`, `reviewed_at`, `created_at`

#### `notifications` table
- Stores user notifications
- Should have columns: `id`, `user_id`, `title`, `body`, `notif_type`, `data` (JSONB), `read`, `created_at`

**Important**: Ensure Row Level Security (RLS) policies are configured appropriately for your use case.

### 5. Configure Email Settings in Supabase

1. Go to Authentication → Settings in your Supabase dashboard
2. **Disable** "Enable email confirmations" (if you want users to log in immediately after registration)
3. **Keep** "Enable Email provider" **ON**
4. **Turn OFF** "Secure email change" (for simplicity during development)

### 6. Create an Admin User

To create an admin user, you can either:
- Update a user's role in the `profiles` table to 'admin' in Supabase dashboard
- Use SQL: `UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';`

## 🏃 Running the Project

### Development Mode

```bash
npm run dev
```

The development server will start at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

### Lint Code

```bash
npm run lint
```

## 📁 Project Structure

```
my-app/
├── src/
│   ├── auth/                  # Authentication pages
│   │   ├── login.jsx          # Login page
│   │   └── register.jsx       # Registration page
│   ├── components/            # Reusable React components
│   │   ├── AdminNavbar.jsx    # Admin navigation bar
│   │   ├── navbar.jsx         # Regular user navigation bar
│   │   ├── footer.jsx         # Footer component
│   │   └── ProtectedRoute.jsx # Route protection wrapper
│   ├── pages/                 # Page components
│   │   ├── Home.jsx           # Landing/home page
│   │   ├── Search.jsx         # Public search page
│   │   ├── dashboard.jsx      # User dashboard
│   │   ├── admin.jsx          # Admin dashboard
│   │   ├── lost.jsx           # Report lost item
│   │   ├── found.jsx          # Report found item
│   │   ├── verify.jsx         # Submit claim for item
│   │   ├── payment.jsx        # Payment processing (currently simulated)
│   │   ├── profile.jsx        # User profile management
│   │   └── reports.jsx        # User's reported items
│   ├── utils/                 # Utility functions and API wrappers
│   │   ├── api.js             # General API utilities
│   │   ├── supabaseAPI.js     # Supabase API wrappers
│   │   └── supabaseClient.js  # Supabase client configuration
│   ├── App.jsx                # Main app component with routing
│   ├── main.jsx               # Application entry point
│   ├── App.css                # App styles
│   └── index.css              # Global styles
├── public/                    # Static assets
├── package.json               # Dependencies and scripts
├── vite.config.js             # Vite configuration
├── eslint.config.js           # ESLint configuration
└── README.md                  # This file
```

## 🔐 User Roles & Permissions

### Regular User
- Register and create profile
- Report lost/found items with photos
- Search and browse all items
- Submit claims for items
- Make payments (currently simulated)
- View notifications
- Manage profile and view reported items

### Admin User
- All regular user capabilities
- Approve/reject claims
- View and manage all users
- View comprehensive system statistics
- Access admin dashboard
- Monitor all items, claims, and system activity

## 🌐 Multi-language Support

The platform supports two languages:
- **English** (en) - Default
- **Kinyarwanda** (rw)

Language preference is automatically saved in `localStorage` and persists across browser sessions. Users can switch languages using the language selector in the navigation bar.

## 💳 Payment System

**Note**: Payment processing is currently **simulated** for development purposes. The payment method integration (MTN Mobile Money, Airtel Money, etc.) will be added later.

- Payments are currently stored in `localStorage` for development
- Items are marked as "paid" after simulated payment
- Real payment gateway integration is deferred

## 📱 Phone Number Validation

The platform enforces Rwanda phone number format:
- Must start with **078** or **073**
- Must be exactly **10 digits**
- Validation is enforced in:
  - Registration
  - Profile updates
  - Claim submission
  - Payment processing

## 🔒 Security Features

- **Row Level Security (RLS)**: All database tables have RLS policies
- **Secure Authentication**: Via Supabase Auth
- **Protected Routes**: Authentication and admin role checks
- **Session Management**: Uses `sessionStorage` for tab-specific sessions (allows multiple simultaneous logins)
- **Phone Number Validation**: Enforced format for Rwanda
- **Contact Protection**: Contact information hidden until payment for lost items

## 🛣️ Routes

### Public Routes (No Authentication Required)
- `/` - Home/Landing page
- `/login` - User login
- `/register` - User registration
- `/search` - Public item search and browsing

### Protected Routes (Require Authentication)
- `/dashboard` - User dashboard
- `/profile` - User profile management
- `/report/lost` - Report a lost item
- `/report/found` - Report a found item
- `/verify` - Submit a claim for an item
- `/payment` - Payment processing (simulated)
- `/reports` - View user's reported items

### Admin Routes (Require Admin Role)
- `/admin` - Admin dashboard with full system management

## 🧪 Development

### Available Scripts

```bash
npm run dev      # Start development server (http://localhost:5173)
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Run ESLint to check code quality
```

### Environment Variables

The application supports multiple environment variable naming conventions for compatibility:

**Required:**
- `SUPABASE_URL` or `VITE_SUPABASE_URL` or `REACT_APP_SUPABASE_URL`
- `SUPABASE_ANON_KEY` or `VITE_SUPABASE_ANON_KEY` or `REACT_APP_SUPABASE_ANON_KEY`

The app checks all three naming conventions, so you can use whichever format you prefer.

### Development Notes

- **Hot Module Replacement (HMR)**: Enabled for fast development
- **Session Storage**: Users can log in to multiple tabs simultaneously (useful for presentations)
- **Local Storage**: Used for language preference, payment records (dev), and other client-side data
- **Case Sensitivity**: File imports must match exact casing for production builds (Linux/Vercel)

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com/)
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

**Important**: Make sure all file imports use correct casing (e.g., `./Search` not `./search`) for Linux-based deployment environments.

### Build Output

Production build creates optimized files in the `dist/` directory:
- Minified JavaScript bundles
- Optimized CSS
- Static assets

## 📝 Database Schema Overview

### Main Tables

1. **profiles** - User profiles linked to Supabase Auth
2. **items** - Lost and found items
3. **claims** - Claims submitted by users
4. **notifications** - User notifications

Ensure your Supabase database has these tables with appropriate RLS policies configured.

## 🐛 Troubleshooting

### Common Issues

**Build fails on Vercel/Linux:**
- Check file import casing (use `./Search` not `./search`)
- Ensure environment variables are set in deployment platform

**Supabase connection issues:**
- Verify environment variables are set correctly
- Check Supabase project is active
- Ensure RLS policies allow necessary operations

**Authentication not working:**
- Check Supabase Auth settings
- Verify email confirmation settings
- Check browser console for errors

**Phone validation errors:**
- Phone numbers must start with 078 or 073
- Must be exactly 10 digits

## 🤝 Contributing

This is a formative assignment project. For questions or issues, please contact the project maintainer.

## 📄 License

This project is developed as part of a formative assignment at African Leadership University.

## 👤 Author

**Yvette Muhoracyeye**  
African Leadership University

## 🔮 Future Enhancements

- Real payment gateway integration (MTN Mobile Money, Airtel Money)
- Email notifications via Supabase
- Real-time updates with Supabase subscriptions
- Mobile app (React Native)
- SMS notifications
- Advanced analytics and reporting
- Image optimization and cloud storage
- Email verification flow
- Password reset functionality

---

**Built with ❤️ for Rwanda and Africa**
