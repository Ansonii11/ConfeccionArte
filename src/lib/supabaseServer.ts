import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { AstroCookies } from 'astro';
import type { Database } from './types';

export function getSupabase(cookies: AstroCookies) {
  return createServerClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(key: string) {
          return cookies.get(key)?.value;
        },
        set(key: string, value: string, options: CookieOptions) {
          try {
            cookies.set(key, value, { ...options, path: '/' });
          } catch (e) {
            // If headers are already sent, we can't set cookies.
            // With the middleware fix, this should not happen, but we add it for safety.
            console.warn(`Could not set cookie ${key} because headers were already sent.`);
          }
        },
        remove(key: string, options: CookieOptions) {
          try {
            cookies.delete(key, { ...options, path: '/' });
          } catch (e) {
            console.warn(`Could not delete cookie ${key} because headers were already sent.`);
          }
        },
      },
    }
  );
}
