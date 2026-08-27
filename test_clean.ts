import fs from 'fs';
import { cleanObjectForFirestore } from './src/lib/firebaseSync';

const data = JSON.parse(fs.readFileSync('user_agreements.json', 'utf8')).agreements[0];
const cleaned = cleanObjectForFirestore(data);
console.log(Object.keys(cleaned));
console.log("Has objectives?", !!cleaned.objectives);
