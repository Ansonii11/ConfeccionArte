-- Actualización de la tabla products para soportar personalización y estado de publicación
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_customizable boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft'; -- 'active', 'draft', 'archived'

-- Opcional: Asegurarse de que el RLS permita a los admins actualizar estos campos si ya hay políticas
