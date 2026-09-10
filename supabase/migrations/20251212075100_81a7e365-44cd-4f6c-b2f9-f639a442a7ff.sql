-- CREATE TABLE IF NOT EXISTS for OTP storage with security features
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  otp_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean DEFAULT false,
  attempts integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_otp_phone ON public.otp_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON public.otp_verifications(expires_at);

-- Enable RLS (edge functions use service role, no public access needed)
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Function to cleanup expired OTPs (runs on insert)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.otp_verifications WHERE expires_at < now();
  RETURN NEW;
END;
$$;

-- Trigger to auto-cleanup on new OTP insert
DROP TRIGGER IF EXISTS trigger_cleanup_expired_otps ON public.otp_verifications;
CREATE TRIGGER trigger_cleanup_expired_otps
  BEFORE INSERT ON public.otp_verifications
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_expired_otps();