-- I AM RUNNING: Role System v2 Migration — Applied 21.03.2026
-- 0=Anon 1=Free 2=Paid 3=Basic 4=Pro 5=Admin 6=AgencyOwner 7=AgencyEmployee

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN (0,1,2,3,4,5,6,7));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_profiles_agency_id ON public.profiles(agency_id) WHERE agency_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_trial_expires ON public.profiles(trial_expires_at) WHERE trial_expires_at IS NOT NULL;
