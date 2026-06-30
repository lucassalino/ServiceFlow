-- Add cover image to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS cover_image_url text;

-- Create storage bucket for event cover images (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('events', 'events', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "events bucket: public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'events');

CREATE POLICY "events bucket: auth insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'events' AND auth.uid() IS NOT NULL);

CREATE POLICY "events bucket: auth update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'events' AND auth.uid() IS NOT NULL);

CREATE POLICY "events bucket: auth delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'events' AND auth.uid() IS NOT NULL);
