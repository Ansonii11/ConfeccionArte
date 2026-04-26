-- Crear la tabla de productos si no existe
CREATE TABLE IF NOT EXISTS public.products (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    price decimal(10,2) NOT NULL,
    sku text,
    category_id uuid REFERENCES public.categories(id),
    featured boolean DEFAULT false,
    is_customizable boolean DEFAULT false,
    status text DEFAULT 'draft',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear la tabla de analíticas para clicks de productos
CREATE TABLE IF NOT EXISTS public.product_clicks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    session_id text -- Opcional, por si se quiere evitar spam en el futuro
);

-- Habilitar RLS (Seguridad a Nivel de Fila)
ALTER TABLE public.product_clicks ENABLE ROW LEVEL SECURITY;

-- Política para permitir que cualquier persona inserte (anónimo)
CREATE POLICY "Permitir insertar a anonimos" ON public.product_clicks
    FOR INSERT
    WITH CHECK (true);

-- Política para permitir que solo usuarios autenticados (admin) puedan leer
CREATE POLICY "Permitir leer solo a admin" ON public.product_clicks
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Políticas para acceso total de administradores (usuarios autenticados)
CREATE POLICY "Allow authenticated users full access to products"
ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to product_variants"
ON public.product_variants FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to product_images"
ON public.product_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to categories"
ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

