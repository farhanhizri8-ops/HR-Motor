const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const sb = createClient('https://mzgbawudyaimckpaluio.supabase.co', 'sb_publishable_4tPlTCD5p4GesC4jLig8zg_45oOvCAe');

async function main() {
  const { data, error } = await sb.from('crm_snapshots').select('id, updated_at, data').eq('id', 'latest').single();
  if (error) {
    console.error('Error fetching snapshot:', error);
    return;
  }
  console.log('Snapshot updated_at:', data.updated_at);
  console.log('Snapshot customers length:', data.data?.customers?.length);
  console.log('Sample customer:', data.data?.customers?.[0]?.fullName);
}

main().catch(console.error);
