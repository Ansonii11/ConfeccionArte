import type { APIRoute } from 'astro';
import { getSupabase } from '../../lib/supabaseServer';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const data = await request.json();
    const productId = data.productId;

    if (!productId) {
      return new Response(JSON.stringify({ error: 'Missing productId' }), { status: 400 });
    }

    const supabase = getSupabase(cookies);
    // Intentar sacar una cookie de sesión (id anónimo) para evitar spam si es que se generó, o simplemente dejarlo null
    const sessionId = cookies.get('session-id')?.value || null;

    const { error } = await supabase.from('product_clicks').insert({
      product_id: productId,
      session_id: sessionId
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
