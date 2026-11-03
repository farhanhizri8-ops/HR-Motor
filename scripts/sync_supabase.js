const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const sb = createClient('https://mzgbawudyaimckpaluio.supabase.co', 'sb_publishable_4tPlTCD5p4GesC4jLig8zg_45oOvCAe');

async function main() {
  const storePath = path.join(__dirname, '..', 'data', 'crm_store.json');
  const raw = fs.readFileSync(storePath, 'utf8');
  const db = JSON.parse(raw);

  console.log('Local customers to upload:', db.customers.length);
  console.log('Local purchases to upload:', db.purchases.length);

  // Update Supabase snapshot
  const { data, error } = await sb
    .from('crm_snapshots')
    .upsert({
      id: 'latest',
      data: db,
      updated_at: new Date().toISOString()
    })
    .select();

  if (error) {
    console.error('Error syncing to Supabase:', error);
  } else {
    console.log('Successfully synced snapshot to Supabase!', data);
  }
}

main().catch(console.error);
