import { db } from './src/db';
import { performanceAgreements } from './src/db/schema';
import fs from 'fs';

async function test() {
  const data = JSON.parse(fs.readFileSync('user_agreements.json', 'utf8')).agreements[0];
  
  try {
    await db.insert(performanceAgreements).values({
      ...data,
      createdAt: new Date(data.createdAt)
    }).onConflictDoUpdate({
      target: performanceAgreements.id,
      set: {
        ...data,
        createdAt: new Date(data.createdAt)
      }
    });
    console.log("Success");
  } catch (e) {
    console.error("PG Error:", e);
  }
}
test();
