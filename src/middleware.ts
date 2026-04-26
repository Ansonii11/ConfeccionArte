import { defineMiddleware } from "astro:middleware";
import { getSupabase } from "./lib/supabaseServer";

const publicAdminRoutes = ["/admin/login"];

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;
  if (url.pathname.startsWith("/admin")) {
    if (publicAdminRoutes.includes(url.pathname)) {
       return next();
    }

    const supabase = getSupabase(cookies);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return redirect("/admin/login");
    }
  }

  return next();
});
