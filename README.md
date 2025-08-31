# DWD Capture App

A modern, mobile-friendly data capture application built with Next.js, Supabase, and Tailwind CSS. This application allows users to capture, store, and analyze environmental and water quality data with a beautiful, responsive interface.

## Features

### 🔐 Authentication
- User registration and login with Supabase Auth
- Email verification
- Secure session management
- User profile management

### 📱 Mobile-First Design
- Responsive design that works on all devices
- Touch-friendly interface
- Optimized for field work
- Progressive Web App ready

### 📊 Data Capture
- Comprehensive data entry forms
- Environmental measurements (temperature, humidity, wind speed)
- Water quality assessments
- Location tracking
- Photo uploads with preview
- Real-time form validation

### 📈 Analytics & Insights
- Dashboard with key metrics
- Data visualization
- Trend analysis
- Status tracking
- Export capabilities

### 🗄️ Data Management
- Search and filter capabilities
- Bulk operations
- Data export
- Status management (draft, submitted, approved, rejected)

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Lucide React Icons
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **UI Components**: Custom component library with Radix UI
- **State Management**: React Context + Supabase real-time subscriptions

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd dwd-capture-app
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings > API
3. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup

Run the following SQL in your Supabase SQL editor:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create captures table
CREATE TABLE captures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  data JSONB NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('capture-photos', 'capture-photos', true);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE captures ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Captures policies
CREATE POLICY "Users can view own captures" ON captures
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own captures" ON captures
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own captures" ON captures
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own captures" ON captures
  FOR DELETE USING (auth.uid() = user_id);

-- Storage policies
CREATE POLICY "Users can upload photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'capture-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'capture-photos');

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
```

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
dwd-capture-app/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── providers/        # Context providers
│   └── ui/               # Reusable UI components
├── lib/                  # Utility functions
│   ├── supabase.ts       # Supabase client
│   └── utils.ts          # Helper functions
├── public/               # Static assets
└── package.json          # Dependencies and scripts
```

## Key Components

### Authentication
- `AuthForm`: Sign up/sign in form with validation
- `SupabaseProvider`: Context provider for auth state

### Dashboard
- `Dashboard`: Main dashboard with navigation
- `CaptureForm`: Data capture form with file upload
- `DataList`: View and manage captured data
- `Analytics`: Data insights and visualizations

### UI Components
- `Button`: Reusable button component
- `Input`: Form input component
- `Card`: Card layout component
- `Select`: Dropdown select component
- `Alert`: Notification component

## Data Model

### Profiles
- `id`: User ID (UUID)
- `email`: User email
- `full_name`: User's full name
- `avatar_url`: Profile picture URL
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

### Captures
- `id`: Capture ID (UUID)
- `user_id`: User who created the capture
- `title`: Capture title
- `description`: Optional description
- `data`: JSON object containing:
  - `location`: Capture location
  - `date`: Capture date
  - `time`: Capture time
  - `temperature`: Temperature reading
  - `humidity`: Humidity reading
  - `windSpeed`: Wind speed reading
  - `waterLevel`: Water level reading
  - `waterQuality`: Water quality assessment
  - `observations`: Additional notes
  - `photoUrls`: Array of photo URLs
- `status`: Capture status (draft/submitted/approved/rejected)
- `created_at`: Capture creation timestamp
- `updated_at`: Last update timestamp

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.