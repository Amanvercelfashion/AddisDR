const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const uploadsDir = path.resolve(__dirname, '..', 'api', 'uploads');

async function uploadImages() {
  const files = fs.readdirSync(uploadsDir).filter(f => f.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i));

  if (files.length === 0) {
    console.log('No image files found in api/uploads/');
    return {};
  }

  const urlMap = {};

  for (const file of files) {
    const filePath = path.join(uploadsDir, file);
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(file).toLowerCase();
    const mimeTypes = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp' };

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(file, buffer, { contentType: mimeTypes[ext] || 'image/png', upsert: true });

    if (uploadError) {
      console.error(`  Failed to upload ${file}: ${uploadError.message}`);
      continue;
    }

    const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(file);
    const publicUrl = publicUrlData.publicUrl;
    urlMap[file] = publicUrl;
    console.log(`  Uploaded ${file} → ${publicUrl}`);
  }

  return urlMap;
}

async function updateDatabaseUrls(urlMap) {
  for (const [filename, publicUrl] of Object.entries(urlMap)) {
    const oldPath = `/uploads/${filename}`;

    const { data: businesses, error: bizError } = await supabase
      .from('businesses')
      .select('id, image_url')
      .eq('image_url', oldPath);

    if (bizError) {
      console.error(`  Error querying businesses: ${bizError.message}`);
    } else if (businesses && businesses.length > 0) {
      for (const biz of businesses) {
        const { error: updateError } = await supabase
          .from('businesses')
          .update({ image_url: publicUrl })
          .eq('id', biz.id);
        if (updateError) {
          console.error(`  Failed to update business ${biz.id}: ${updateError.message}`);
        } else {
          console.log(`  Updated business ${biz.id} image_url → ${publicUrl}`);
        }
      }
    }

    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, image_url')
      .eq('image_url', oldPath);

    if (prodError) {
      console.error(`  Error querying products: ${prodError.message}`);
    } else if (products && products.length > 0) {
      for (const prod of products) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ image_url: publicUrl })
          .eq('id', prod.id);
        if (updateError) {
          console.error(`  Failed to update product ${prod.id}: ${updateError.message}`);
        } else {
          console.log(`  Updated product ${prod.id} image_url → ${publicUrl}`);
        }
      }
    }
  }
}

async function main() {
  console.log('Uploading local images to Supabase Storage...\n');
  const urlMap = await uploadImages();

  if (Object.keys(urlMap).length > 0) {
    console.log('\nUpdating database records with new URLs...');
    await updateDatabaseUrls(urlMap);
  }

  console.log('\nDone!');
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
