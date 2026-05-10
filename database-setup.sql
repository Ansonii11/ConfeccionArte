-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pg_crypto";

-- 2. Tabla de Categorías
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    image_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla de Productos
CREATE TABLE IF NOT EXISTS public.products (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    price decimal(10,2) NOT NULL,
    sku text,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    featured boolean DEFAULT false,
    is_customizable boolean DEFAULT false,
    status text DEFAULT 'draft', -- 'active', 'draft', 'archived'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabla de Variantes (Tallas/Stock)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    size text NOT NULL,
    stock integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabla de Imágenes de Producto
CREATE TABLE IF NOT EXISTS public.product_images (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    storage_path text NOT NULL,
    is_primary boolean DEFAULT false,
    alt_text text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tabla de Analíticas (Clicks)
CREATE TABLE IF NOT EXISTS public.product_clicks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    session_id text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Habilitar RLS en todas las tablas
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_clicks ENABLE ROW LEVEL SECURITY;

-- 8. Políticas de ACCESO PÚBLICO (Lectura)
CREATE POLICY "Permitir lectura publica de categorias" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de productos" ON public.products FOR SELECT USING (status = 'active');
CREATE POLICY "Permitir lectura publica de variantes" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de imagenes" ON public.product_images FOR SELECT USING (true);

-- 9. Políticas de ACCESO ADMINISTRADOR (Todo para autenticados)
CREATE POLICY "Acceso total admin categorias" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total admin productos" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total admin variantes" ON public.product_variants FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total admin imagenes" ON public.product_images FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total admin clicks" ON public.product_clicks FOR SELECT TO authenticated USING (true);

-- 10. Política especial para Clicks (Cualquiera puede insertar)
CREATE POLICY "Permitir insertar clicks a anonimos" ON public.product_clicks FOR INSERT WITH CHECK (true);

-- 11. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- 12. Configuración de Storage para Productos
-- Crear el bucket 'products' si no existe y hacerlo público
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS en storage.objects si no estuviera (suele estar por defecto, pero por seguridad)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para el bucket 'products'

-- 12.1 Permitir lectura pública de cualquier imagen en 'products'
CREATE POLICY "Lectura pública de imágenes de productos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'products' );

-- 12.2 Permitir a los administradores (autenticados) subir nuevas imágenes
CREATE POLICY "Autenticados pueden subir imágenes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'products' );

-- 12.3 Permitir a los administradores actualizar imágenes existentes
CREATE POLICY "Autenticados pueden actualizar imágenes"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'products' );

-- 12.4 Permitir a los administradores eliminar imágenes
CREATE POLICY "Autenticados pueden borrar imágenes"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'products' );
