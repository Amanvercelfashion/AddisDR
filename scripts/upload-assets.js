const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function uploadFile(fileName, filePath, contentType) {
  const buffer = fs.readFileSync(filePath);
  const { error } = await supabase.storage
    .from('uploads')
    .upload(fileName, buffer, { contentType, upsert: true });
  if (error) {
    console.error(`  Failed to upload ${fileName}: ${error.message}`);
    return null;
  }
  const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
  const url = data.publicUrl;
  console.log(`  Uploaded ${fileName} → ${url}`);
  return url;
}

async function main() {
  console.log('Uploading assets to Supabase Storage...\n');

  const imagesDir = path.resolve(__dirname, '..', 'frontend', 'public', 'images');

  // Upload logo
  const logoSrc = path.join(imagesDir, 'addisdr-logo.png');
  let logoUrl = null;
  if (fs.existsSync(logoSrc)) {
    logoUrl = await uploadFile('addisdr-logo.png', logoSrc, 'image/png');
  } else {
    console.log('  addisdr-logo.png not found, skipping logo upload.');
  }

  // Upload footer background
  const footerBgSrc = path.join(imagesDir, 'footer-bg.png');
  if (fs.existsSync(footerBgSrc)) {
    await uploadFile('footer-bg.png', footerBgSrc, 'image/png');
  } else {
    console.log('  footer-bg.png not found, skipping.');
  }

  // Save logo URL to site_settings if uploaded
  if (logoUrl) {
    const { error: dbError } = await supabase
      .from('site_settings')
      .upsert({ key: 'logo_url', value: logoUrl }, { onConflict: 'key' });
    if (dbError) {
      console.log('\nCould not write logo_url to site_settings:', dbError.message);
      console.log('Logo URL to use manually:', logoUrl);
    } else {
      console.log('\nsite_settings.logo_url saved:', logoUrl);
    }
  }

  console.log('\nDone!');
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
