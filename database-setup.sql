-- DWD Capture App Database Setup
-- Run this in your Supabase SQL editor

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

-- Create indexes for better performance
CREATE INDEX idx_captures_user_id ON captures(user_id);
CREATE INDEX idx_captures_status ON captures(status);
CREATE INDEX idx_captures_created_at ON captures(created_at);
CREATE INDEX idx_profiles_email ON profiles(email);