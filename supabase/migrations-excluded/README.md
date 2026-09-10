# Excluded migrations

Kept for history, deliberately not applied to a fresh database.

## 20260903165214_…sql — test scaffolding

Written to try a seller flow against the old project. Applying it to a new
database would:

- `UPDATE public.products SET status = 'disabled', is_available = false` on
  every row — hiding the whole catalogue;
- insert a fake seller "Brand1";
- insert **100 test SKUs** ("Brand1_cloth1" … "Brand1_cloth100") with inline
  SVG placeholder images.

The live catalogue contains none of this, so it was reverted at the time.
The file remained in the migrations folder, which meant a clean rebuild
would have silently recreated it.
