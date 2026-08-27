import fs from 'fs';
async function run() {
  const data = JSON.parse(fs.readFileSync('user_agreements.json', 'utf8')).agreements;
  for (const ag of data) {
    const r = await fetch('http://localhost:3000/api/data/agreements/' + ag.id, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ag)
    });
    console.log(ag.id, r.status, await r.text());
  }
}
run();
