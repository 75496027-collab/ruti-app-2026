
-- ===== ENUMS =====
CREATE TYPE public.app_role AS ENUM ('admin', 'driver', 'user');
CREATE TYPE public.user_role AS ENUM ('user', 'driver');
CREATE TYPE public.ride_status AS ENUM ('pending', 'accepted', 'completed', 'cancelled');

-- ===== PROFILES =====
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  dni TEXT,
  phone TEXT,
  role public.user_role,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ===== USER ROLES =====
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ===== DRIVER DOCS =====
CREATE TABLE public.driver_docs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  license_type TEXT,
  license_expiry DATE,
  plate_number TEXT,
  soat_expiry DATE,
  revision_expiry DATE,
  atu_auth TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.driver_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "driver_docs_select_own" ON public.driver_docs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "driver_docs_insert_own" ON public.driver_docs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "driver_docs_update_own" ON public.driver_docs FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ===== RIDES =====
CREATE TABLE public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  start_address TEXT,
  end_address TEXT,
  start_lat DOUBLE PRECISION NOT NULL,
  start_lng DOUBLE PRECISION NOT NULL,
  end_lat DOUBLE PRECISION NOT NULL,
  end_lng DOUBLE PRECISION NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  status public.ride_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- Usuarios ven sus propios rides
CREATE POLICY "rides_select_own_user" ON public.rides FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- Conductores ven los rides pendientes (para tomarlos) y los que ya tomaron
CREATE POLICY "rides_select_drivers_pending" ON public.rides FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'driver') AND (status = 'pending' OR driver_id = auth.uid()));
-- Usuarios crean sus propios rides
CREATE POLICY "rides_insert_own" ON public.rides FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- Usuario actualiza su propio ride (cancelar) o conductor que lo tomó
CREATE POLICY "rides_update_owner_or_driver" ON public.rides FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = driver_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER TABLE public.rides REPLICA IDENTITY FULL;

-- ===== TRIGGER: crear profile al registrarse =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== TRIGGER: updated_at =====
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER driver_docs_updated_at BEFORE UPDATE ON public.driver_docs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER rides_updated_at BEFORE UPDATE ON public.rides FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
