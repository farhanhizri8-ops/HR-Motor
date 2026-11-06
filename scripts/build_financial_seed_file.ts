import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scratch_generated_data.json', 'utf-8'));

const tsContent = `// ============================================================================
// HR MOTOR CRM - COMPREHENSIVE FINANCIAL MASTER DATA & CORRELATED CUSTOMERS
// Sourced from Official Google Spreadsheet (1qAm9MYtWPGzR92kAl5ry7-PVa0BLC9Jm1pWBjU6vMbY)
// Total 436 Unit Ledgers, 249 Cash Flows, 392 Customers, 379 Purchases
// ============================================================================

import {
  UnitFinancialRecord,
  CashFlowRecord,
  Investor,
  PayrollCommissionRecord,
  Customer,
  CustomerPurchase,
} from '@/types/crm';

export const INITIAL_FINANCIAL_UNITS: UnitFinancialRecord[] = ${JSON.stringify(data.financialUnits, null, 2)};

export const INITIAL_CASH_FLOW: CashFlowRecord[] = ${JSON.stringify(data.cashFlows, null, 2)};

export const INITIAL_INVESTORS: Investor[] = ${JSON.stringify(data.investors, null, 2)};

export const INITIAL_PAYROLL_COMMISSIONS: PayrollCommissionRecord[] = ${JSON.stringify(data.payrollCommissions, null, 2)};

export const INITIAL_CORRELATED_CUSTOMERS: Customer[] = ${JSON.stringify(data.allCustomers, null, 2)};

export const INITIAL_CORRELATED_PURCHASES: CustomerPurchase[] = ${JSON.stringify(data.allPurchases, null, 2)};
`;

fs.writeFileSync('src/lib/financialSeedData.ts', tsContent);
console.log('Successfully wrote src/lib/financialSeedData.ts!');
console.log(`Units: ${data.financialUnits.length}, CashFlows: ${data.cashFlows.length}, Customers: ${data.allCustomers.length}, Purchases: ${data.allPurchases.length}`);
