import { defineMiddleware } from "astro:middleware";
import { getSupabase } from "./lib/supabaseServer";

const publicAdminRoutes = ["/admin/login"];

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect, request } = context;
  
  // 1. Protección CSRF adicional para peticiones mutables (POST, etc)
  // Aunque Astro tiene checkOrigin, reforzamos en rutas de API críticas
  if (request.method !== "GET" && url.pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    
    // Verificación básica de origen para prevenir ataques CSRF simples
    if (origin && !origin.includes(host || "")) {
      return new Response("Forbidden: Invalid Origin", { status: 403 });
    }
  }

  // 2. Inicializar Supabase y Auth
  const supabase = getSupabase(cookies);
  const { data: { user } } = await supabase.auth.getUser();

  // 3. Protección de rutas de administración
  if (url.pathname.startsWith("/admin")) {
    if (!publicAdminRoutes.includes(url.pathname)) {
      if (!user) {
        return redirect("/admin/login");
      }
    }
  }

  // 4. Ejecutar la petición y obtener la respuesta
  const response = await next();

  // 5. Inyectar Cabeceras de Seguridad (Blindaje)
  // X-Frame-Options: Previene que el sitio sea puesto en un iframe (Anti-Clickjacking)
  response.headers.set("X-Frame-Options", "DENY");
  
  // X-Content-Type-Options: Previene que el navegador intente adivinar el tipo de contenido (MIME sniffing)
  response.headers.set("X-Content-Type-Options", "nosniff");
  
  // Referrer-Policy: Controla cuánta información se envía en el encabezado Referer
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Strict-Transport-Security: Fuerza el uso de HTTPS (HSTS) - 1 año
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  // Content-Security-Policy: El escudo definitivo contra XSS
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https://*.supabase.co https://placehold.co https://*.googleusercontent.com https://lh3.googleusercontent.com",
    "connect-src 'self' https://*.supabase.co",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join("; ");
  
  response.headers.set("Content-Security-Policy", csp);

  return response;
});
