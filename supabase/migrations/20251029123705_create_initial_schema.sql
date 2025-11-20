/*
  # Artist Marketplace Database Schema

  ## Overview
  This migration creates the complete database schema for an artist marketplace platform
  with separate authentication for artists and users, artwork management, orders, reviews, and wishlists.

  ## 1. New Tables

  ### `profiles`
  - `id` (uuid, primary key, references auth.users)
  - `user_type` (text) - Either 'artist' or 'user'
  - `full_name` (text, required)
  - `email` (text, unique, required)
  - `phone` (text, optional)
  - `profile_picture` (text, optional URL)
  - `address` (text, optional)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `artist_profiles`
  - `id` (uuid, primary key, references profiles)
  - `artist_name` (text, required)
  - `bio` (text, 200-300 chars)
  - `portfolio_link` (text, optional)
  - `art_style` (text, optional)
  - `location` (text, optional)
  - `social_links` (jsonb, optional)
  - `verification_badge` (boolean, default false)
  - `total_sales` (integer, default 0)
  - `avg_rating` (decimal, default 0)
  - `created_at` (timestamptz)

  ### `artworks`
  - `id` (uuid, primary key)
  - `artist_id` (uuid, references artist_profiles)
  - `title` (text, required)
  - `description` (text)
  - `category` (text, required)
  - `medium` (text)
  - `price` (decimal, required)
  - `image_url` (text, required)
  - `tags` (text array)
  - `size` (text) - 'small', 'medium', 'large'
  - `status` (text, default 'pending') - 'pending', 'published', 'sold'
  - `likes_count` (integer, default 0)
  - `views_count` (integer, default 0)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `orders`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `artwork_id` (uuid, references artworks)
  - `artist_id` (uuid, references artist_profiles)
  - `amount` (decimal, required)
  - `status` (text, default 'pending') - 'pending', 'completed', 'cancelled'
  - `order_date` (timestamptz, default now)
  - `created_at` (timestamptz)

  ### `reviews`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `artwork_id` (uuid, references artworks)
  - `artist_id` (uuid, references artist_profiles)
  - `rating` (integer, 1-5)
  - `comment` (text)
  - `created_at` (timestamptz)

  ### `wishlist`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `artwork_id` (uuid, references artworks)
  - `created_at` (timestamptz)

  ## 2. Security
  - Enable RLS on all tables
  - Profiles: Users can read all profiles, but only update their own
  - Artist Profiles: Public read, artists can update their own
  - Artworks: Public read for published works, artists manage their own
  - Orders: Users see their own orders, artists see orders for their art
  - Reviews: Public read, users can create/update their own
  - Wishlist: Users manage their own wishlist items

  ## 3. Indexes
  - Email uniqueness on profiles
  - Artist and artwork lookups optimized
  - Order and review queries optimized
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type text NOT NULL CHECK (user_type IN ('artist', 'user')),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  profile_picture text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create artist_profiles table
CREATE TABLE IF NOT EXISTS artist_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  artist_name text NOT NULL,
  bio text CHECK (length(bio) BETWEEN 200 AND 300),
  portfolio_link text,
  art_style text,
  location text,
  social_links jsonb,
  verification_badge boolean DEFAULT false,
  total_sales integer DEFAULT 0,
  avg_rating decimal(3,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create artworks table
CREATE TABLE IF NOT EXISTS artworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  medium text,
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  image_url text NOT NULL,
  tags text[],
  size text CHECK (size IN ('small', 'medium', 'large')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'sold')),
  likes_count integer DEFAULT 0,
  views_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  artwork_id uuid NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  artist_id uuid NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL CHECK (amount >= 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  order_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  artwork_id uuid NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  artist_id uuid NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Create wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  artwork_id uuid NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, artwork_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_artworks_artist ON artworks(artist_id);
CREATE INDEX IF NOT EXISTS idx_artworks_status ON artworks(status);
CREATE INDEX IF NOT EXISTS idx_artworks_category ON artworks(category);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_artist ON orders(artist_id);
CREATE INDEX IF NOT EXISTS idx_reviews_artwork ON reviews(artwork_id);
CREATE INDEX IF NOT EXISTS idx_reviews_artist ON reviews(artist_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for artist_profiles
CREATE POLICY "Artist profiles are viewable by everyone"
  ON artist_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Artists can insert their own profile"
  ON artist_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Artists can update their own profile"
  ON artist_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for artworks
CREATE POLICY "Published artworks are viewable by everyone"
  ON artworks FOR SELECT
  TO authenticated
  USING (status = 'published' OR artist_id = auth.uid());

CREATE POLICY "Artists can insert their own artworks"
  ON artworks FOR INSERT
  TO authenticated
  WITH CHECK (artist_id = auth.uid());

CREATE POLICY "Artists can update their own artworks"
  ON artworks FOR UPDATE
  TO authenticated
  USING (artist_id = auth.uid())
  WITH CHECK (artist_id = auth.uid());

CREATE POLICY "Artists can delete their own artworks"
  ON artworks FOR DELETE
  TO authenticated
  USING (artist_id = auth.uid());

-- RLS Policies for orders
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR artist_id = auth.uid());

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for reviews
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for wishlist
CREATE POLICY "Users can view their own wishlist"
  ON wishlist FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can add to their wishlist"
  ON wishlist FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove from their wishlist"
  ON wishlist FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());