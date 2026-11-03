async function run() {
  for (let i = 1; i <= 12; i++) {
    await new Promise((r) => setTimeout(r, 6000));
    try {
      const res = await fetch('https://hr-motor.vercel.app/api/crm?t=' + Date.now(), { cache: 'no-store' });
      const d = await res.json();
      const count = d?.data?.customers?.length;
      const first = d?.data?.customers?.[0]?.fullName;
      const last = d?.data?.customers?.[d?.data?.customers?.length - 1]?.fullName;
      console.log(`Attempt ${i}: count=${count}, first=${first}, last=${last}`);
      if (count === 69 && first === 'ASEP KODRAT' && last === 'USEP') {
        console.log('SUCCESS! Verified exactly 69 official customers live on Vercel!');
        return;
      }
    } catch (e) {
      console.log(`Attempt ${i} error:`, e.message);
    }
  }
}

run();
