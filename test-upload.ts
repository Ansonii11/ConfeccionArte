import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
    // Create a dummy file
    const fileContent = new Blob(["test"], { type: "text/plain" });
    const fileName = "test-" + Date.now() + ".txt";

    console.log("Attempting upload to 'products' bucket...");
    try {
        const { data, error } = await supabase.storage.from("products").upload(fileName, fileContent as any);
        console.log("Data:", data);
        console.log("Error:", error);
    } catch (e) {
        console.log("Exception:", e);
    }
}

async function listBuckets() {
    console.log("Attempting to list buckets...");
    const { data, error } = await supabase.storage.listBuckets();
    console.log("Buckets:", data?.map(b => b.name));
    console.log("Error:", error);
}

testUpload();
listBuckets();
