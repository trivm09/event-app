# AI Image Generator with Runway Gen-4

A production-ready AI image generation platform built with React, TypeScript, Vite, Supabase, and Runway Gen-4. Features secure authentication, credit-based system, real-time generation tracking, and comprehensive admin controls.

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
- [Edge Functions](#edge-functions)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Security Features](#security-features)
- [API Reference](#api-reference)
- [Development](#development)
- [Building for Production](#building-for-production)
- [License](#license)

---

## Features

### AI Image Generation
- Generate high-quality images using Runway Gen-4 via Replicate API
- Multiple aspect ratios (16:9, 9:16, 1:1, 4:3, 3:4, 21:9, 9:21)
- Real-time generation status tracking
- Automatic image upload to Supabase Storage
- Generation history with filtering and search

### Credit System
- Credit-based usage model
- Variable cost per generation based on aspect ratio (0.8 - 1.2 credits)
- Default 10 credits for new users
- Unlimited credits for admin users
- Low balance warnings

### Authentication & Security
- Secure email/password authentication with Supabase Auth
- Rate limiting (5 generations per minute, 2 concurrent max)
- Row Level Security (RLS) policies on all tables
- Input validation and sanitization
- Protected routes with role-based access

### User Management
- Role-based access control (Admin/Regular users)
- User profile management
- Admin dashboard with user statistics
- Generation tracking per user

### Real-time Features
- Live generation status updates
- Automatic polling for active generations
- Instant credit balance updates
- Real-time UI feedback

### UI/UX
- Responsive design for all screen sizes
- Clean, modern interface with TailwindCSS
- Loading states and progress indicators
- Vietnamese language support
- Image preview and download
- Copy prompt functionality

---

## Tech Stack

### Frontend
- **React 18.3** - UI framework
- **TypeScript 5.5** - Type safety
- **Vite 5.4** - Build tool and dev server
- **React Router 7.9** - Client-side routing
- **TailwindCSS 3.4** - Utility-first CSS framework
- **Lucide React** - Icon library

### Backend & Services
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication service
  - Row Level Security
  - Storage for images
  - Edge Functions
- **Replicate** - AI model API (Runway Gen-4)
- **Runway Gen-4** - Image generation model

### Development Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

---

## Prerequisites

Before you begin, ensure you have the following:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher) or **yarn**
- **Supabase Account** - [Sign up here](https://supabase.com)
- **Replicate Account** - [Sign up here](https://replicate.com)
- **Replicate API Token** - Get from [Replicate Dashboard](https://replicate.com/account/api-tokens)
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
VITE_SUPABASE_STORAGE_BUCKET=ai-generated-images
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
VITE_SUPABASE_STORAGE_BUCKET=ai-generated-images
```

### Replicate API Setup

1. **Get Replicate API Token**
   - Go to [Replicate Account](https://replicate.com/account/api-tokens)
   - Create a new API token
   - Copy the token (starts with `r8_`)

2. **Set as Supabase Edge Function Secret**

In Supabase Dashboard:
- Go to **Edge Functions** → **Secrets**
- Add new secret:
  - Key: `REPLICATE_API_TOKEN`
  - Value: Your Replicate API token

Or via Supabase CLI:
```bash
supabase secrets set REPLICATE_API_TOKEN=r8_your_token_here
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public API key | Yes |
| `VITE_SUPABASE_STORAGE_BUCKET` | Storage bucket name for images | Yes |
| `REPLICATE_API_TOKEN` | Replicate API token (Edge Function secret) | Yes |

---

## Database Setup

The project includes automated database migrations. Apply them in order:

1. **Navigate to Supabase Dashboard → SQL Editor**

2. **Run migrations in order**

   Execute these migration files located in `supabase/migrations/`:

   - `20251202170800_create_users_table.sql` - Users table with RLS
   - `20251202165511_fix_security_issues.sql` - Security optimizations
   - `20251202174923_create_ai_generations_table.sql` - AI generations system
   - `20251202180955_create_storage_policies_for_ai_images.sql` - Storage policies

### Database Schema

**Users Table:**
```sql
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT '',
  is_admin boolean NOT NULL DEFAULT false,
  credits numeric NOT NULL DEFAULT 10,
  total_generations integer NOT NULL DEFAULT 0,
  last_generation_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**AI Generations Table:**
```sql
CREATE TABLE ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  prompt text NOT NULL,
  aspect_ratio text NOT NULL DEFAULT '16:9',
  model_version text NOT NULL DEFAULT 'runway-gen-4',
  image_url text,
  replicate_prediction_id text,
  status text NOT NULL DEFAULT 'starting',
  error_message text,
  cost_credits numeric NOT NULL DEFAULT 1.0,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
```

### Storage Setup

1. **Create Storage Bucket**

Storage bucket `ai-generated-images` is automatically created via migration.

2. **Verify Bucket**

In Supabase Dashboard → Storage:
- Bucket name: `ai-generated-images`
- Public: Yes
- Policies: Automatically configured

### Creating Admin Users

**Method 1: Using Supabase Dashboard**

1. Go to Authentication → Users
2. Create a new user
3. Go to Table Editor → `users` table
4. Set `is_admin = true` for the user

**Method 2: Using SQL**

```sql
-- Grant admin privileges
UPDATE users
SET is_admin = true
WHERE email = 'admin@example.com';
```

---

## Edge Functions

The project uses Supabase Edge Functions to proxy Replicate API calls (avoiding CORS issues).

### Deployed Functions

**generate-image** - Handles all Replicate API interactions

Endpoints:
- `POST /functions/v1/generate-image/start` - Start image generation
- `POST /functions/v1/generate-image/status` - Check generation status
- `POST /functions/v1/generate-image/cancel` - Cancel generation

### Edge Function Setup

Edge function is automatically deployed. To manually redeploy:

```bash
supabase functions deploy generate-image
```

**Important:** Ensure `REPLICATE_API_TOKEN` is set as an Edge Function secret.

---

## Usage

### Development Mode

Start the development server:

```bash
npm run dev
```

Application available at `http://localhost:5173`

### Application Flow

1. **Login/Register** - Access at `/`
2. **Generate Images** - Navigate to `/generate`
   - Enter your prompt
   - Choose aspect ratio
   - Click "Tạo ảnh"
3. **View History** - Navigate to `/history`
   - See all generations
   - Filter by status
   - Search by prompt
   - Download images
4. **Admin Panel** - Navigate to `/admin` (admin only)
   - View user statistics
   - Manage users

### Code Examples

#### Generate an Image

```typescript
import { useRunwayContext } from './contexts/RunwayContext';

function MyComponent() {
  const { generateNewImage, credits } = useRunwayContext();

  const handleGenerate = async () => {
    await generateNewImage(
      'A beautiful sunset over mountains',
      '16:9'
    );
  };

  return (
    <div>
      <p>Available Credits: {credits?.credits}</p>
      <button onClick={handleGenerate}>Generate Image</button>
    </div>
  );
}
```

#### Check User Credits

```typescript
import { getUserCredits } from './services/runway.service';

const credits = await getUserCredits(userId);
console.log(`Credits: ${credits.credits}`);
console.log(`Total Generations: ${credits.total_generations}`);
```

---

## Project Structure

```
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Generic UI components
│   │   ├── CreditBalance.tsx
│   │   ├── GenerationCard.tsx
│   │   ├── ImageGenerationForm.tsx
│   │   ├── InputField.tsx
│   │   ├── LoginForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── config/             # Configuration files
│   │   ├── auth.config.ts
│   │   ├── profile.config.ts
│   │   ├── rateLimit.config.ts
│   │   ├── runway.config.ts
│   │   ├── supabase.ts
│   │   └── validation.config.ts
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.tsx
│   │   └── RunwayContext.tsx
│   ├── pages/              # Page components
│   │   ├── AdminPage.tsx
│   │   ├── GenerationHistoryPage.tsx
│   │   ├── ImageGeneratorPage.tsx
│   │   └── LoginPage.tsx
│   ├── services/           # Business logic services
│   │   ├── auth.service.ts
│   │   ├── profile.service.ts
│   │   └── runway.service.ts
│   ├── types/              # TypeScript type definitions
│   │   ├── auth.types.ts
│   │   ├── profile.types.ts
│   │   ├── rateLimit.types.ts
│   │   ├── runway.types.ts
│   │   └── validation.types.ts
│   ├── utils/              # Utility functions
│   │   ├── rateLimit.utils.ts
│   │   ├── runway.utils.ts
│   │   └── validation.utils.ts
│   ├── constants/          # Application constants
│   ├── App.tsx             # Root component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
├── supabase/
│   ├── functions/          # Edge Functions
│   │   └── generate-image/
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
- Email/password authentication via Supabase
- Session management with automatic cleanup
- Protected routes with role-based access
- Input validation and sanitization

### Rate Limiting
- 5 generations per minute per user
- Maximum 2 concurrent generations
- Login rate limiting (5 attempts per 15 minutes)
- Automatic cleanup of expired limits

### Database Security
- Row Level Security (RLS) on all tables
- Users can only access their own data
- Admin privileges protected
- Secure function search paths
- Credits system with fraud prevention

### API Security
- Edge Functions proxy all external API calls
- No API tokens exposed to client
- JWT verification on all requests
- CORS properly configured

### Image Storage Security
- Users can only upload to their own folder
- Public read access for sharing
- Admin can manage all files
- File type validation

---

## API Reference

### Runway Service API

#### `generateImage(userId, prompt, aspectRatio)`
Starts a new image generation.

**Parameters:**
- `userId` (string) - User ID
- `prompt` (string) - Text prompt
- `aspectRatio` (AspectRatio) - Aspect ratio

**Returns:** `Promise<GenerationResult>`

#### `getUserGenerations(userId, filters?)`
Gets user's generation history.

**Parameters:**
- `userId` (string) - User ID
- `filters` (GenerationFilters, optional) - Filter options

**Returns:** `Promise<AIGeneration[]>`

#### `checkUserCredits(userId, requiredCredits)`
Checks if user has sufficient credits.

**Parameters:**
- `userId` (string) - User ID
- `requiredCredits` (number) - Credits needed

**Returns:** `Promise<CreditCheckResult>`

#### `deleteGeneration(generationId, userId)`
Deletes a generation and its image.

**Parameters:**
- `generationId` (string) - Generation ID
- `userId` (string) - User ID

**Returns:** `Promise<boolean>`

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

### Adding New Features

1. Create types in `src/types/`
2. Add configuration in `src/config/`
3. Implement service logic in `src/services/`
4. Create UI components in `src/components/`
5. Add pages in `src/pages/`
6. Update routes in `App.tsx`

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

The `dist/` folder contains production-ready files.

### Deployment Checklist

- [ ] Set environment variables on hosting platform
- [ ] Apply all database migrations
- [ ] Configure Edge Function secrets
- [ ] Create storage bucket with policies
- [ ] Set up custom domain (optional)
- [ ] Configure CORS if needed

### Recommended Hosting

- **Vercel** - Zero configuration deployment
- **Netlify** - Git-based deployment
- **Supabase Hosting** - Integrated with backend

---

## License

This project is licensed under the MIT License.

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

## Changelog

### Version 2.0.0 (2025-12-02)

**Added**
- AI image generation with Runway Gen-4
- Credit-based usage system
- Multiple aspect ratio options
- Real-time generation tracking
- Image storage in Supabase
- Generation history with search/filter
- Edge Functions for API proxying
- Rate limiting for generations
- Download and copy features

**Database**
- Added `ai_generations` table
- Added credits system to users table
- Added storage bucket and policies
- Added generation statistics tracking

**UI/UX**
- Image generator page
- Generation history page
- Credit balance widget
- Generation cards with status
- Real-time progress indicators

### Version 1.0.0 (2024-12-02)

**Added**
- Initial release
- User authentication system
- Admin role management
- Protected routes
- Responsive UI

---

Made with ❤️ using Runway Gen-4, Supabase, and React
