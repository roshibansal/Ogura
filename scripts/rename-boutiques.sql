-- Renames the eight rows in `designers` that still carry real designers' names,
-- and points each at a boutique photograph in public/boutiques/.
--
-- The anon key cannot do this: a migration replaced the old "Authenticated
-- users can update designers" policy with "Admins can manage designers", so
-- row-level security blocks it. Run this in the Supabase Dashboard SQL Editor,
-- which runs as the postgres role and is not subject to RLS.
--
--   Dashboard -> SQL Editor -> New query -> paste -> Run
--
-- Roshi's row is deliberately untouched.
-- To undo, see the revert block at the bottom.

update public.designers set
  name = v.name, brand_name = v.name, slug = v.slug, city = v.city,
  category = v.category, price_range = v.price_range, followers = v.followers,
  description = v.description, instagram_link = v.instagram_link,
  collection_name = v.collection_name,
  profile_image = v.image, banner_image = v.image,
  updated_at = now()
from (values
  ('206034a6-da5f-47e4-b747-7b50cf32cc4a'::uuid, 'Aranya Studio', 'aranya-studio', 'Mumbai', 'Bridal & Occasion', '₹2,000 – ₹5,000', 8400, 'https://instagram.com/aranya.studio', 'Enchanted Garden', '/boutiques/aranya-studio.jpg', 'A Mumbai studio working in block print and hand embroidery, cutting occasion wear to order for a customer they have usually spoken to first.'),
  ('304f5711-f971-4101-a0d1-c5c9275193f3'::uuid, 'Sootra Atelier', 'sootra-atelier', 'Delhi', 'Couture', '₹1,500 – ₹5,000', 6100, 'https://instagram.com/sootra.atelier', 'India Modern', '/boutiques/sootra-atelier.jpg', 'Drape-led silhouettes from a small Delhi workroom. Every piece is cut for one person, and the fit is settled before anything is stitched.'),
  ('d8df0437-a4ff-4d76-92d8-f0f6aa022c79'::uuid, 'Kaarigari House', 'kaarigari-house', 'Kolkata', 'Contemporary', '₹2,000 – ₹5,000', 5200, 'https://instagram.com/kaarigari.house', 'Modern Heritage', '/boutiques/kaarigari-house.jpg', 'Kolkata karigars working contemporary cuts in traditional surface craft. Small runs, long lead times, nothing repeated exactly.'),
  ('64caa4cc-cdd4-46eb-8f50-fba2903b5b68'::uuid, 'Baagh Studio', 'baagh-studio', 'Jaipur', 'Ethnic', '₹1,500 – ₹3,000', 7300, 'https://instagram.com/baagh.studio', 'Heritage Redux', '/boutiques/baagh-studio.jpg', 'Jaipur prints on everyday ethnic wear. The studio keeps a rail of ready pieces and makes the rest to your measurements.'),
  ('c1f242a9-f74e-4420-9ef4-8595ecfac131'::uuid, 'Meher & Noor', 'meher-and-noor', 'Delhi', 'Evening Wear', '₹1,500 – ₹3,000', 4800, 'https://instagram.com/meherandnoor', 'Midnight Glamour', '/boutiques/meher-and-noor.jpg', 'Two sisters in Delhi making evening and cocktail wear. They will talk you through fabric weight and fall before you commit.'),
  ('dd421d5a-1d6b-4265-bc04-840b8931ca71'::uuid, 'Anant Threadworks', 'anant-threadworks', 'Mumbai', 'Menswear', '₹1,500 – ₹3,000', 3900, 'https://instagram.com/anant.threadworks', 'The Gentleman Edit', '/boutiques/anant-threadworks.jpg', 'Menswear cut in a Mumbai tailoring room — bandhgalas, kurtas and shirting, measured in person or from your own numbers.'),
  ('660635c7-fab1-4698-97ef-395f448c788f'::uuid, 'Kanthaa Studio', 'kanthaa-studio', 'Delhi', 'Sustainable Fashion', '₹1,500 – ₹3,000', 9100, 'https://instagram.com/kanthaa.studio', 'Conscious Craft', '/boutiques/kanthaa-studio.jpg', 'Handloom cotton and recycled textile, cut slowly. The studio works to order so nothing is made that nobody wanted.'),
  ('ecd5401b-3475-4845-991f-545d7cf82c77'::uuid, 'Ranghar Studio', 'ranghar-studio', 'Mumbai', 'Bridal', '₹2,000 – ₹5,000', 6700, 'https://instagram.com/ranghar.studio', 'Eternal Bride 2024', '/boutiques/ranghar-studio.jpg', 'Bridal and trousseau pieces made over weeks, not minutes. Fittings happen on a call if you cannot get to the Mumbai studio.')
) as v(id, name, slug, city, category, price_range, followers, instagram_link, collection_name, image, description)
where designers.id = v.id;

-- Confirm: this must return zero rows.
select id, name from public.designers
where name in ('Anita Dongre','Tarun Tahiliani','Anamika Khanna','Punit Balana',
               'Gauri & Nainika','Aseem Kapoor','KA-Sha','Rajiramniq');

-- ---------------------------------------------------------------------------
-- REVERT (only if needed) — restores the original eight rows.
-- ---------------------------------------------------------------------------
-- update public.designers set
--   name = v.name, brand_name = v.name, slug = v.slug, followers = v.followers
-- from (values
--   ('206034a6-da5f-47e4-b747-7b50cf32cc4a'::uuid,'Anita Dongre','anita-dongre',2890000),
--   ('304f5711-f971-4101-a0d1-c5c9275193f3'::uuid,'Tarun Tahiliani','tarun-tahiliani',890000),
--   ('d8df0437-a4ff-4d76-92d8-f0f6aa022c79'::uuid,'Anamika Khanna','anamika-khanna',567000),
--   ('64caa4cc-cdd4-46eb-8f50-fba2903b5b68'::uuid,'Punit Balana','punit-balana',89000),
--   ('c1f242a9-f74e-4420-9ef4-8595ecfac131'::uuid,'Gauri & Nainika','gauri-nainika',156000),
--   ('dd421d5a-1d6b-4265-bc04-840b8931ca71'::uuid,'Aseem Kapoor','aseem-kapoor',67000),
--   ('660635c7-fab1-4698-97ef-395f448c788f'::uuid,'KA-Sha','ka-sha',112000),
--   ('ecd5401b-3475-4845-991f-545d7cf82c77'::uuid,'Rajiramniq','rajiramniq',125000)
-- ) as v(id,name,slug,followers) where designers.id = v.id;
