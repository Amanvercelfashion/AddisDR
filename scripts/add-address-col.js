const { Pool } = require('pg');

const sKey = process.env.SUPABASE_SERVICE_KEY;
if (!sKey) { console.error('Missing SUPABASE_SERVICE_KEY'); process.exit(1); }

const projectRef = 'biezesxrofebizlirpxk';
const regions = ['eu-west-1','eu-west-2','us-east-1','us-east-2','eu-central-1','ap-southeast-1','ap-northeast-1','ap-south-1','sa-east-1','ca-central-1'];
const ports = [5432, 6543];

async function tryConnect(region, port) {
  const cs = `postgresql://postgres.${projectRef}:${sKey}@aws-0-${region}.pooler.supabase.com:${port}/postgres`;
  let pool;
  try {
    pool = new Pool({
      connectionString: cs,
      ssl: { rejectUnauthorized: false },
      max: 1,
      connectionTimeoutMillis: 5000
    });
    await pool.query('ALTER TABLE businesses ADD COLUMN IF NOT EXISTS address TEXT');
    console.log('Column added via ' + region + ':' + port);
    return true;
  } catch(e) {
    return false;
  } finally {
    if (pool) try { await pool.end(); } catch(e) {}
  }
}

(async () => {
  for (const r of regions) {
    for (const p of ports) {
      if (await tryConnect(r, p)) process.exit(0);
    }
  }
  console.log('Failed all regions/ports');
  process.exit(1);
})();
