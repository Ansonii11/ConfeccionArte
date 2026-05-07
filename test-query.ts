import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    let query = supabase.from("products").select(
      `
            *,
            product_images (
                storage_path,
                is_primary
            ),
            product_variants!inner(size)
        `
    ).eq("product_variants.size", "M");
    const { data, error } = await query;
    console.log("Data:", JSON.stringify(data, null, 2));
    console.log("Error:", error);
}
test();
