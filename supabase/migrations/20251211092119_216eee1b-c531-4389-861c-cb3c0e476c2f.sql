-- CREATE TABLE IF NOT EXISTS for influencer videos
CREATE TABLE IF NOT EXISTS public.influencer_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_filename TEXT NOT NULL,
  poster_url TEXT,
  caption TEXT NOT NULL,
  link TEXT NOT NULL DEFAULT '/collections/dresses',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.influencer_videos ENABLE ROW LEVEL SECURITY;

-- Anyone can view active videos
DROP POLICY IF EXISTS "Anyone can view active influencer videos" ON public.influencer_videos;
CREATE POLICY "Anyone can view active influencer videos" ON public.influencer_videos
FOR SELECT
USING (is_active = true);

-- Authenticated users can manage videos
DROP POLICY IF EXISTS "Authenticated users can insert influencer videos" ON public.influencer_videos;
CREATE POLICY "Authenticated users can insert influencer videos" ON public.influencer_videos
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update influencer videos" ON public.influencer_videos;
CREATE POLICY "Authenticated users can update influencer videos" ON public.influencer_videos
FOR UPDATE
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete influencer videos" ON public.influencer_videos;
CREATE POLICY "Authenticated users can delete influencer videos" ON public.influencer_videos
FOR DELETE
USING (auth.role() = 'authenticated');

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_influencer_videos_updated_at ON public.influencer_videos;
CREATE TRIGGER update_influencer_videos_updated_at
BEFORE UPDATE ON public.influencer_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default placeholder data (will use Pexels until custom videos are uploaded)
INSERT INTO public.influencer_videos (video_filename, poster_url, caption, link, sort_order) VALUES
('video-1.mp4', 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&q=80', 'outfit @ogura', '/collections/dresses', 1),
('video-2.mp4', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80', '✨💛', '/collections/dresses', 2),
('video-3.mp4', 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400&q=80', 'Get ready with me for a date 💜✨', '/collections/tops', 3),
('video-4.mp4', 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&q=80', '"Don''t buy another dress, you got enough"', '/collections/dresses', 4),
('video-5.mp4', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=80', 'outfit @ogura', '/collections/outerwear', 5);