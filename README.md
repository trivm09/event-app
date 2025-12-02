# Secure Authentication System with Admin Access Control

A production-ready authentication system built with React, TypeScript, Vite, and Supabase. Features secure user authentication, role-based access control, rate limiting, and comprehensive input validation.

![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue)
![React](https://img.shields.io/badge/React-18.3.1-61dafb)
![Vite](https://img.shields.io/badge/Vite-5.4.2-646cff)
![Supabase](https://img.shields.io/badge/Supabase-2.57.4-3ecf8e)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.1-38bdf8)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Creating Admin Users](#creating-admin-users)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Security Features](#security-features)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

---

## Features

### Authentication & Security
- Secure email/password authentication with Supabase Auth
- Rate limiting to prevent brute force attacks (5 attempts per 15 minutes)
- Input validation and sanitization to prevent XSS attacks
- Row Level Security (RLS) policies optimized for performance
- Password strength requirements (uppercase, lowercase, numbers, min 8 characters)
- Session management with automatic cleanup

### User Management
- Role-based access control (Admin/Regular users)
- Protected routes with authentication checks
- User profile management with automatic triggers
- Admin-only pages with authorization guards

### Code Quality
- TypeScript for type safety
- Clean architecture with separation of concerns
- Centralized configuration management
- Comprehensive error handling
- Reusable components and utilities
- SOLID principles implementation

### UI/UX
- Responsive design for all screen sizes
- Clean, modern interface with TailwindCSS
- Loading states and error feedback
- Accessible components
- Vietnamese language support

---

## Tech Stack

### Frontend
- **React 18.3** - UI framework
- **TypeScript 5.5** - Type safety
- **Vite 5.4** - Build tool and dev server
- **React Router 7.9** - Client-side routing
- **TailwindCSS 3.4** - Utility-first CSS framework
- **Lucide React** - Icon library

### Backend & Database
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication service
  - Row Level Security
  - Real-time subscriptions
  - Edge Functions support

### Development Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher) or **yarn**
- **Supabase Account** - [Sign up here](https://supabase.com)
- **Git** (for version control)

---

## Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd <project-directory>
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Configuration

### Supabase Setup

1. **Create a new Supabase project**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Click "New Project"
   - Fill in project details and create

2. **Get your credentials**
   - Go to Project Settings → API
   - Copy `Project URL` → Use as `VITE_SUPABASE_URL`
   - Copy `anon public` key → Use as `VITE_SUPABASE_ANON_KEY`

3. **Update `.env` file**

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public API key | Yes |

---

## Database Setup

The project includes automated database migrations. Apply them in order:

1. **Navigate to Supabase Dashboard**
   - Go to SQL Editor

2. **Run migrations in order**

   Execute these migration files located in `supabase/migrations/`:

   - `20251202170800_create_users_table.sql` - Creates users table with RLS policies
   - `20251202165511_fix_security_issues.sql` - Optimizes RLS and security

### Database Schema

The `users` table structure:

```sql
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT '',
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### Row Level Security (RLS)

All tables have RLS enabled with optimized policies:

- Users can view their own profile
- Users can update their own profile (except admin status)
- Users can create their own profile (once)
- Users can delete their own profile
- Admin status can only be modified via direct database access

---

## Creating Admin Users

### Method 1: Using Supabase Dashboard (Recommended)

1. **Create user via Authentication**
   - Go to Authentication → Users
   - Click "Add User" → "Create new user"
   - Enter email and password
   - Click "Create User"

2. **Grant admin privileges**
   - Go to Table Editor → Select `users` table
   - Find the user by email
   - Set `is_admin` to `true`
   - Save changes

### Method 2: Using SQL

```sql
-- Step 1: Create user (Supabase Auth handles this)
-- You need to sign up through the app first, then:

-- Step 2: Grant admin privileges
UPDATE users
SET is_admin = true
WHERE email = 'admin@example.com';
```

### Method 3: Automated Script

Create a file `scripts/create-admin.sql`:

```sql
-- Update existing user to admin
UPDATE users
SET is_admin = true
WHERE email = 'your-email@example.com';

-- Verify
SELECT id, email, full_name, is_admin, created_at
FROM users
WHERE is_admin = true;
```

Run in Supabase SQL Editor.

---

## Usage

### Development Mode

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### User Registration & Login

1. **Access the login page** at `/`
2. **Create an account** (if registration is enabled)
3. **Login** with email and password
4. **Access protected routes** based on your role

### Admin Access

1. Create a user account
2. Grant admin privileges using one of the methods above
3. Login to access `/admin` route

### Code Examples

#### Using the Auth Context

```typescript
import { useAuthContext } from './contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, isLoading, login, logout, checkAdminStatus } = useAuthContext();

  const handleLogin = async () => {
    const result = await login({
      email: 'user@example.com',
      password: 'SecurePass123'
    });

    if (result.success) {
      console.log('Logged in successfully');
    } else {
      console.error('Login failed:', result.error?.message);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.full_name}</p>
          {checkAdminStatus() && <p>You are an admin!</p>}
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

#### Protected Routes

```typescript
import { ProtectedRoute } from './components/ProtectedRoute';

// Regular protected route
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  }
/>

// Admin-only route
<Route
  path="/admin"
  element={
    <ProtectedRoute requireAdmin={true}>
      <AdminPage />
    </ProtectedRoute>
  }
/>
```

---

## Project Structure

```
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Generic UI components
│   │   ├── InputField.tsx  # Form input component
│   │   ├── LoginForm.tsx   # Login form component
│   │   └── ProtectedRoute.tsx
│   ├── config/             # Configuration files
│   │   ├── auth.config.ts
│   │   ├── profile.config.ts
│   │   ├── rateLimit.config.ts
│   │   ├── supabase.ts
│   │   └── validation.config.ts
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx
│   ├── pages/              # Page components
│   │   ├── AdminPage.tsx
│   │   └── LoginPage.tsx
│   ├── services/           # Business logic services
│   │   ├── auth.service.ts
│   │   └── profile.service.ts
│   ├── types/              # TypeScript type definitions
│   │   ├── auth.types.ts
│   │   ├── profile.types.ts
│   │   ├── rateLimit.types.ts
│   │   └── validation.types.ts
│   ├── utils/              # Utility functions
│   │   ├── rateLimit.utils.ts
│   │   └── validation.utils.ts
│   ├── constants/          # Application constants
│   │   └── index.ts
│   ├── App.tsx             # Root component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
├── supabase/
│   └── migrations/         # Database migrations
├── public/                 # Static assets
├── .env                    # Environment variables
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── vite.config.ts          # Vite config
└── tailwind.config.js      # Tailwind config
```

---

## Security Features

### Authentication Security
- Password strength validation
- Email format validation and sanitization
- XSS protection through input sanitization
- CSRF protection via Supabase Auth tokens

### Rate Limiting
- 5 login attempts per 15-minute window
- 30-minute lockout after exceeding limit
- Per-email address tracking
- Automatic cleanup of expired attempts

### Database Security
- Row Level Security (RLS) on all tables
- Optimized RLS policies with `(SELECT auth.uid())`
- Secure function search paths
- Admin privileges protected from user modification
- Automatic user profile creation
- Cascading deletes for data integrity

### Code Security
- Type-safe operations with TypeScript
- Input validation at multiple layers
- Error handling without exposing sensitive data
- Secure environment variable management
- HTTPS-only communication with Supabase

---

## Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Type checking
npm run typecheck
```

### Code Style Guidelines

- Use TypeScript for all new files
- Follow SOLID principles
- Write self-documenting code with clear naming
- Keep functions small and focused
- Use proper error handling
- Add types for all function parameters and returns

### Adding New Features

1. Create types in `src/types/`
2. Add configuration in `src/config/`
3. Implement service logic in `src/services/`
4. Create UI components in `src/components/`
5. Update routes in `App.tsx`

---

## Building for Production

1. **Build the application**

```bash
npm run build
```

2. **Test the production build**

```bash
npm run preview
```

3. **Deploy to hosting platform**

The `dist/` folder contains the production-ready files.

### Deployment Options

- **Vercel** - Zero configuration deployment
- **Netlify** - Git-based deployment
- **Supabase Hosting** - Integrated with backend
- **AWS S3 + CloudFront** - Custom infrastructure

### Environment Variables for Production

Ensure these are set in your hosting platform:

```env
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

---

## Contributing

We welcome contributions! Please follow these guidelines:

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests and linting
5. Commit with clear messages: `git commit -m 'Add amazing feature'`
6. Push to your fork: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Standards

- Follow existing code style
- Write TypeScript (no `any` types)
- Add proper error handling
- Update documentation
- Include tests when applicable

### Pull Request Process

1. Update README.md with details of changes if needed
2. Ensure all tests pass
3. Update version numbers following SemVer
4. Get approval from maintainers

---

## License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Support

### Getting Help

- **Documentation**: Check this README and code comments
- **Issues**: [Open an issue](https://github.com/your-repo/issues) on GitHub
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)

### Common Issues

**Login fails with "Rate limit exceeded"**
- Wait 30 minutes and try again
- Check if email is correct
- Contact admin to reset rate limit

**Cannot access admin page**
- Verify `is_admin` is set to `true` in database
- Check browser console for errors
- Clear browser cache and cookies

**Database connection errors**
- Verify `.env` file has correct credentials
- Check Supabase project status
- Ensure database migrations have been applied

### Contact

- **Email**: support@example.com
- **GitHub**: [@your-username](https://github.com/your-username)
- **Twitter**: [@your-handle](https://twitter.com/your-handle)

---

## Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [Vite](https://vitejs.dev) - Build tool
- [React](https://react.dev) - UI framework
- [TailwindCSS](https://tailwindcss.com) - Styling
- [Lucide](https://lucide.dev) - Icons

---

## Changelog

### Version 1.0.1 (2025-12-02)

**Changed**
- Consolidated database migrations from 4 files to 2 files
- Removed redundant table rename migrations
- Updated migration documentation

**Migrations**
- `20251202170800_create_users_table.sql` - Initial users table setup
- `20251202165511_fix_security_issues.sql` - Security optimizations

### Version 1.0.0 (2024-12-02)

**Added**
- Initial release
- User authentication system
- Admin role management
- Rate limiting
- Input validation
- Protected routes
- Responsive UI

**Security**
- Optimized RLS policies
- Secure function search paths
- XSS protection
- Rate limiting implementation

---

Made with ❤️ by the development team
