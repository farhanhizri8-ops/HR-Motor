const { createClient } = require('@supabase/supabase-js');

const sb = createClient('https://mzgbawudyaimckpaluio.supabase.co', 'sb_publishable_4tPlTCD5p4GesC4jLig8zg_45oOvCAe');

async function test() {
  const { data } = await sb.from('crm_snapshots').select('data').eq('id', 'latest').single();
  const list = data.data.customers;
  console.log('Total count:', list.length);
  console.log('First 10 names:', list.slice(0, 10).map(c => c.fullName));
  console.log('Last 5 names:', list.slice(-5).map(c => c.fullName));
  
  // Find where Neng Tian, Baoa, Udin, Wildan Fitriadi came from
  const oldNames = ['Neng Tian', 'Baoa', 'Udin', 'Wildan Fitriadi'];
  oldNames.forEach(name => {
    const found = list.find(c => c.fullName === name);
    console.log('Old item:', name, '=>', found ? found.id : 'NOT FOUND');
  });
}

test().catch(console.error);
