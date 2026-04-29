import type { APIRoute } from "astro";
import { getSupabase } from "../../../lib/supabaseServer";

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const supabase = getSupabase(cookies);
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error("Error al cerrar sesión:", error.message);
  }
  
  return redirect("/admin/login", 302);
};
