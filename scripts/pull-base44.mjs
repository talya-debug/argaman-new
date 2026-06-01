import { createClient } from '@base44/sdk';
import { writeFileSync } from 'fs';

const APP_ID = '68b3dec209adbcb52b0ebf8a';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0YWx5YUB0YWx5YW9zaGVyLmNvbSIsImV4cCI6MTc4MjgwODMxMiwiaWF0IjoxNzgwMjE2MzEyLCJhdWQiOiJwbGF0Zm9ybSJ9.qA_2aEusz4fiuZZt9jxJIBAvOwl-Krv3pqX8tbPcCio';

const client = createClient({
  appId: APP_ID,
  token: TOKEN,
  serverUrl: '',
  requiresAuth: false,
});

const entities = ['Lead','Quote','QuoteLine','Project','Task','ProgressEntry','WorkLogEntry','PurchaseRecord','SubContractor','CollectionTask','ChangeLog','TaskActivity','PriceItem'];

const data = {};
let total = 0;

console.log('מושך נתונים מ-Base44...\n');

for (const name of entities) {
  try {
    const records = await client.entities[name].list('-created_date', 5000);
    data[name] = records;
    total += records.length;
    console.log(`✅ ${name}: ${records.length} רשומות`);
  } catch(e) {
    console.log(`❌ ${name}: ${e.message}`);
    data[name] = [];
  }
}

const filename = 'scripts/base44-export-latest.json';
writeFileSync(filename, JSON.stringify(data, null, 2));
console.log(`\nסה"כ: ${total} רשומות`);
console.log(`נשמר ל: ${filename}`);

process.exit(0);
