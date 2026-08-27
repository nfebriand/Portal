const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `
  // Generic POST/UPSERT document
  app.post("/api/data/:collection/:id", async (req, res) => {
    try {
      const table = getTable(req.params.collection);
      if (!table) return res.status(404).json({ error: "Collection not found" });
      
      const data = { ...req.body, id: req.params.id };
      
      // Clean dates (convert integers to Dates)
      const dateFields = ['createdAt', 'updatedAt'];
      for (const field of dateFields) {
        if (data[field]) {
          if (typeof data[field] === 'number') {
            data[field] = new Date(data[field]);
          } else if (typeof data[field] === 'string') {
            data[field] = new Date(data[field]);
          }
        }
      }
      
      // Also handle 'timestamp' if the schema expects a string or date, but schema for critical_notifications expects string timestamp.
      // Wait, let's just do it generally:
`;

code = code.replace(
  /\/\/ Generic POST\/UPSERT document[\s\S]*?const data = { \.\.\.req\.body, id: req\.params\.id };/,
  replacement
);

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts to handle dates");
