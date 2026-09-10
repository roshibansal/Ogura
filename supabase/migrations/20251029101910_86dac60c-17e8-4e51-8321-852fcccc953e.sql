-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create designers table
CREATE TABLE IF NOT EXISTS public.designers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  city TEXT NOT NULL,
  category TEXT NOT NULL,
  price_range TEXT NOT NULL,
  instagram_link TEXT,
  followers INTEGER DEFAULT 0,
  contact_number TEXT,
  email TEXT,
  profile_image TEXT,
  product_images JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_designers_brand_name ON public.designers(brand_name);
CREATE INDEX IF NOT EXISTS idx_designers_category ON public.designers(category);
CREATE INDEX IF NOT EXISTS idx_designers_city ON public.designers(city);

-- Enable Row Level Security
ALTER TABLE public.designers ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
DROP POLICY IF EXISTS "Anyone can view designers" ON public.designers;
CREATE POLICY "Anyone can view designers" ON public.designers 
FOR SELECT 
USING (true);

-- Create policy for authenticated users to insert (for future admin panel)
DROP POLICY IF EXISTS "Authenticated users can insert designers" ON public.designers;
CREATE POLICY "Authenticated users can insert designers" ON public.designers 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create policy for authenticated users to update (for future admin panel)
DROP POLICY IF EXISTS "Authenticated users can update designers" ON public.designers;
CREATE POLICY "Authenticated users can update designers" ON public.designers 
FOR UPDATE 
TO authenticated
USING (true);

-- Create policy for authenticated users to delete (for future admin panel)
DROP POLICY IF EXISTS "Authenticated users can delete designers" ON public.designers;
CREATE POLICY "Authenticated users can delete designers" ON public.designers 
FOR DELETE 
TO authenticated
USING (true);

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_designers_updated_at ON public.designers;
CREATE TRIGGER update_designers_updated_at
BEFORE UPDATE ON public.designers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert designer records
INSERT INTO public.designers (name, brand_name, city, category, price_range, instagram_link, followers, contact_number, email, profile_image, product_images, description) VALUES
(
  'Aisha Mehta',
  'Aisha Couture',
  'Delhi',
  'Bridal Wear',
  'Luxury',
  'https://instagram.com/aishacouture',
  12500,
  '+91 9876543210',
  'contact@aishacouture.in',
  'https://images.unsplash.com/photo-1542060742-0b3f3e8e9b87',
  '["https://images.unsplash.com/photo-1562158070-622a13db7f2d", "https://images.unsplash.com/photo-1520974735194-4cba3b04b26b"]'::jsonb,
  'Aisha Couture specializes in handcrafted bridal outfits with intricate zardozi work and luxurious fabric combinations.'
),
(
  'Karan Bhatia',
  'Karan Studio',
  'Mumbai',
  'Men''s Designer Wear',
  'Premium',
  'https://instagram.com/karanstudio',
  9800,
  '+91 9988776655',
  'hello@karanstudio.com',
  'https://images.unsplash.com/photo-1519744792095-2f2205e87b6f',
  '["https://images.unsplash.com/photo-1618354694983-7dc6dc07a7f4", "https://images.unsplash.com/photo-1616486364433-48f62d3a6435"]'::jsonb,
  'Karan Studio offers contemporary men''s fashion with an edge — known for Indo-Western fusion and sharp tailoring.'
),
(
  'Riya Kapoor',
  'Studio Riya',
  'Jaipur',
  'Ethnic & Festive',
  'Affordable',
  'https://instagram.com/studioriya',
  7200,
  '+91 9811122233',
  'riya@studioriya.com',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
  '["https://images.unsplash.com/photo-1532372320572-cda25653a26d", "https://images.unsplash.com/photo-1602407294553-6f9a5f0c8aa5"]'::jsonb,
  'Studio Riya offers affordable ethnic wear with pastel tones and minimalistic embroidery — perfect for festive occasions.'
),
(
  'Ananya Deshmukh',
  'House of Ananya',
  'Pune',
  'Western Wear',
  'Mid-range',
  'https://instagram.com/houseofananya',
  8600,
  '+91 9090909090',
  'hello@houseofananya.com',
  'https://images.unsplash.com/photo-1520974735194-4cba3b04b26b',
  '["https://images.unsplash.com/photo-1517841905240-472988babdf9", "https://images.unsplash.com/photo-1556909212-6e7c6d7c6b4d"]'::jsonb,
  'House of Ananya creates chic western wear for modern women — blending elegance with comfort.'
);

-- Enable realtime for designers table
ALTER PUBLICATION supabase_realtime ADD TABLE public.designers;