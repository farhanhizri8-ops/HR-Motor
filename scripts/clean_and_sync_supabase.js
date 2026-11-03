const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const sb = createClient('https://mzgbawudyaimckpaluio.supabase.co', 'sb_publishable_4tPlTCD5p4GesC4jLig8zg_45oOvCAe');

const OLD_DEMO_NAMES = new Set([
  'Wildan Fitriadi',
  'Dr. Hj. Nina Marlina',
  'Neng Tian',
  'Baoa',
  'Udin',
  'Agus Gunawan',
  'H. Dadan Wildan',
  'Wawan Hermawan',
  'Siska Oktaviani, S.Pd.',
  'Tatang Hendrawan',
  'Yudi Karyadi',
]);

async function main() {
  const storePath = path.join(__dirname, '..', 'data', 'crm_store.json');
  const db = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  // Ensure local db has strictly the 69 official customers and 69 purchases
  db.customers = db.customers.filter(c => !OLD_DEMO_NAMES.has(c.fullName));
  db.purchases = db.purchases.filter(p => !OLD_DEMO_NAMES.has(p.customerName));

  console.log('Sanitized local customers:', db.customers.length);
  console.log('Sanitized local purchases:', db.purchases.length);

  fs.writeFileSync(storePath, JSON.stringify(db, null, 2), 'utf8');

  // Upsert to Supabase
  const { data, error } = await sb
    .from('crm_snapshots')
    .upsert({
      id: 'latest',
      data: db,
      updated_at: new Date().toISOString()
    })
    .select();

  if (error) {
    console.error('Error saving to Supabase:', error);
  } else {
    console.log('Successfully saved clean 69 customers to Supabase snapshot!');
  }
}

main().catch(console.error);
