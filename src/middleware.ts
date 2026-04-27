import { defineMiddleware } from "astro:middleware";
import { getSupabase } from "./lib/supabaseServer";

const publicAdminRoutes = ["/admin/login"];

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;
  
  // Initialize Supabase for ALL requests. 
  // This ensures that session refreshing happens in the middleware
  // before any page starts rendering, avoiding "ResponseSentError".
  const supabase = getSupabase(cookies);
  
  // getUser() is more secure than getSession() and handles token refreshing automatically
  const { data: { user } } = await supabase.auth.getUser();

  if (url.pathname.startsWith("/admin")) {
    if (publicAdminRoutes.includes(url.pathname)) {
      return next();
    }

    if (!user) {
      return redirect("/admin/login");
    }
  }

  return next();
});
