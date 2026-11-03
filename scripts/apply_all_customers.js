const fs = require('fs');
const path = require('path');

const { customers, purchases } = JSON.parse(fs.readFileSync('scripts/generated_customers.json', 'utf8'));

console.log(`Loaded ${customers.length} customers and ${purchases.length} purchases.`);

// 1. Update data/crm_store.json
const crmStorePath = path.join(__dirname, '../data/crm_store.json');
let db = {};
if (fs.existsSync(crmStorePath)) {
  db = JSON.parse(fs.readFileSync(crmStorePath, 'utf8'));
}
db.customers = customers;
db.purchases = purchases;
db.lastUpdated = new Date().toISOString();
fs.writeFileSync(crmStorePath, JSON.stringify(db, null, 2), 'utf8');
console.log('Updated data/crm_store.json with 69 customers and 69 purchases.');

// 2. Update src/lib/seedData.ts
const seedDataPath = path.join(__dirname, '../src/lib/seedData.ts');
let seedContent = fs.readFileSync(seedDataPath, 'utf8');

// Replace INITIAL_CUSTOMERS block
const custStartMarker = 'export const INITIAL_CUSTOMERS: Customer[] = [';
const custEndMarker = 'export const INITIAL_LEADS: Lead[] = [';

const custStartIndex = seedContent.indexOf(custStartMarker);
const custEndIndex = seedContent.indexOf(custEndMarker);

if (custStartIndex === -1 || custEndIndex === -1) {
  console.error('Could not find markers for INITIAL_CUSTOMERS in seedData.ts');
  process.exit(1);
}

const newCustomersStr = `export const INITIAL_CUSTOMERS: Customer[] = ${JSON.stringify(customers, null, 2)};\n\n`;

seedContent = seedContent.substring(0, custStartIndex) + newCustomersStr + seedContent.substring(custEndIndex);

// Replace INITIAL_PURCHASES block
const purStartMarker = 'export const INITIAL_PURCHASES: CustomerPurchase[] = [';
const purEndMarker = 'export const INITIAL_FEEDBACK: CustomerFeedback[] = [';

const purStartIndex = seedContent.indexOf(purStartMarker);
const purEndIndex = seedContent.indexOf(purEndMarker);

if (purStartIndex === -1 || purEndIndex === -1) {
  console.error('Could not find markers for INITIAL_PURCHASES in seedData.ts');
  process.exit(1);
}

const newPurchasesStr = `export const INITIAL_PURCHASES: CustomerPurchase[] = ${JSON.stringify(purchases, null, 2)};\n\n`;

seedContent = seedContent.substring(0, purStartIndex) + newPurchasesStr + seedContent.substring(purEndIndex);

fs.writeFileSync(seedDataPath, seedContent, 'utf8');
console.log('Updated src/lib/seedData.ts with INITIAL_CUSTOMERS and INITIAL_PURCHASES.');
