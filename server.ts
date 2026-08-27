import { eq } from 'drizzle-orm';
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { db } from './src/db/index.ts';
import { 
  users, 
  employees, 
  performanceAgreements, 
  cooperationContracts, 
  reporterTargets, 
  newsReports, 
  promotionActivities, 
  appSettings, 
  institutionalIdentity, 
  criticalNotifications 
} from './src/db/schema.ts';

dotenv.config();

async function withRetry<T>(operation: () => Promise<T>, maxRetries = 5): Promise<T> {
  let attempt = 0;
  let delay = 500;
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error.message);
      if (attempt >= maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 1.5; // Exponential backoff
    }
  }
  throw new Error("Maximum retries exceeded");
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  // Increase payload limit for importing large JSON files
  app.use(express.json({ limit: '50mb' }));

  // --- API ROUTES ---
  
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok",
      database: "Cloud SQL Configured"
    });
  });

  // Contoh rute API aman untuk mengambil data dari PostgreSQL
  app.get("/api/users", requireAuth, async (req: AuthRequest, res) => {
    try {
      const allUsers = await withRetry(() => db.select().from(users).limit(10));
      res.json({ data: allUsers });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Gagal mengambil data dari database" });
    }
  });

  // Endpoint to import JSON directly to Cloud SQL
  // Making it secure but accessible if token is provided. Or we can just leave it open for now for migration purposes (assuming development environment).
  app.post("/api/import-json", async (req: express.Request, res: express.Response) => {
    try {
      const data = req.body;
      let importCount = 0;

      // Import Employees
      if (data.employees && Array.isArray(data.employees)) {
        for (const emp of data.employees) {
          await withRetry(() => db.insert(employees).values({
            id: emp.id,
            nik: emp.nik || emp.nip || '',
            nip: emp.nip || '',
            nama: emp.nama || emp.namaLengkap || 'Unknown',
            tempatLahir: emp.tempatLahir,
            tanggalLahir: emp.tanggalLahir,
            gelarDepan: emp.gelarDepan,
            gelarBelakang: emp.gelarBelakang,
            alamat: emp.alamat,
            noHp: emp.noHp,
            surel: emp.surel,
            golDarah: emp.golDarah,
            jabatan: emp.jabatan,
            jenisJabatan: emp.jenisJabatan,
            status: emp.status,
            jenjangPendidikan: emp.jenjangPendidikan,
            divisi: emp.divisi || emp.bidang,
            jenisKelamin: emp.jenisKelamin,
            agama: emp.agama,
            pangkatGolongan: emp.pangkatGolongan,
            riwayatPendidikan: emp.riwayatPendidikan || [],
            riwayatPelatihan: emp.riwayatPelatihan || [],
            kompetensi: emp.kompetensi || [],
            loginRole: emp.loginRole || emp.role,
            username: emp.username,
            password: emp.password,
            isLoginActive: emp.isLoginActive,
            foto: emp.foto || emp.fotoUrl,
            ttdElektronik: emp.ttdElektronik,
            role: emp.role,
            isEditor: emp.isEditor,
            createdAt: emp.createdAt ? new Date(emp.createdAt) : new Date(),
          }).onConflictDoNothing());
          importCount++;
        }
      }

      // Import Performance Agreements
      if (data.agreements && Array.isArray(data.agreements)) {
        for (const ag of data.agreements) {
          await withRetry(() => db.insert(performanceAgreements).values({
            id: ag.id,
            year: ag.year || 2024,
            level: ag.level || 'Pegawai',
            assignedToEmployeeId: ag.assignedToEmployeeId,
            assignedToName: ag.assignedToName || 'Unknown',
            objectives: ag.objectives || [],
            status: ag.status || 'Draft',
            signaturePembuat: ag.signaturePembuat,
            signaturePenerima: ag.signaturePenerima,
            createdAt: ag.createdAt ? new Date(ag.createdAt) : new Date(),
          }).onConflictDoNothing());
          importCount++;
        }
      }

      // Import Cooperation Contracts
      if (data.contracts && Array.isArray(data.contracts)) {
        for (const c of data.contracts) {
          await withRetry(() => db.insert(cooperationContracts).values({
            id: c.id,
            partnerName: c.partnerName || 'Unknown',
            contractNo: c.contractNo || '-',
            activityName: c.activityName || '-',
            cooperationType: c.cooperationType || 'Lainnya',
            value: c.value || 0,
            realizedPnbp: c.realizedPnbp || 0,
            paymentStatus: c.paymentStatus || 'Belum Bayar',
            startDate: c.startDate || new Date().toISOString(),
            endDate: c.endDate || new Date().toISOString(),
            notes: c.notes,
            linkedIndicatorId: c.linkedIndicatorId || '',
          }).onConflictDoNothing());
          importCount++;
        }
      }

      // Import News Reports
      if (data.newsReports && Array.isArray(data.newsReports)) {
        for (const nr of data.newsReports) {
          await withRetry(() => db.insert(newsReports).values({
            id: nr.id,
            employeeId: nr.employeeId || '',
            editorId: nr.editorId,
            title: nr.title || nr.judul || 'Untitled',
            url: nr.url || '',
            type: nr.type || nr.kategori || 'Berita Online',
            date: nr.date || nr.tanggal || new Date().toISOString(),
            programa: nr.programa,
            writerName: nr.writerName || nr.penulis,
            editorName: nr.editorName,
            category: nr.category,
            publishDateTime: nr.publishDateTime,
            reporterName: nr.reporterName,
            daerah: nr.daerah,
          }).onConflictDoNothing());
          importCount++;
        }
      }

      // Import Promotion Activities
      if (data.promotions && Array.isArray(data.promotions)) {
        for (const p of data.promotions) {
          await withRetry(() => db.insert(promotionActivities).values({
            id: p.id,
            tanggal: p.tanggal || new Date().toISOString(),
            namaKegiatan: p.namaKegiatan || p.judul || 'Untitled',
            baliho: p.baliho || 0,
            spanduk: p.spanduk || 0,
            videotron: p.videotron || 0,
            umbulUmbul: p.umbulUmbul || 0,
            pamflet: p.pamflet || 0,
            yt: p.yt || 0,
            ig: p.ig || 0,
            tiktok: p.tiktok || 0,
            fb: p.fb || 0,
            eFlyer: p.eFlyer || 0,
            jumlah: p.jumlah || 0,
            keterangan: p.keterangan,
            linkDokumentasi: p.linkDokumentasi || p.fileUrl,
            fotoDokumentasi: p.fotoDokumentasi,
            creatorId: p.creatorId,
            creatorName: p.creatorName,
            divisi: p.divisi,
            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
          }).onConflictDoNothing());
          importCount++;
        }
      }

      res.json({ success: true, message: `Successfully imported ${importCount} records.` });
    } catch (error: any) {
      console.error("Error importing JSON:", error);
      res.status(500).json({ error: "Failed to import JSON", details: error.message });
    }
  });

  
  // Mapping collections to Drizzle tables
  const getTable = (collectionName: string) => {
    switch (collectionName) {
      case 'employees': return employees;
      case 'agreements': return performanceAgreements;
      case 'contracts': return cooperationContracts;
      case 'reporterTargets': return reporterTargets;
      case 'newsReports': return newsReports;
      case 'promotions': return promotionActivities;
      case 'settings': return appSettings;
      case 'identity': return institutionalIdentity;
      case 'notifications': return criticalNotifications;
      default: return null;
    }
  };

  

  // Generic GET collection
  app.get("/api/data/:collection", async (req, res) => {
    try {
      const table = getTable(req.params.collection);
      if (!table) return res.status(404).json({ error: "Collection not found" });
      
      const records = await withRetry(() => db.select().from(table));
      res.json(records);
    } catch (error: any) {
      console.error(`Error fetching ${req.params.collection}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // Generic GET document
  app.get("/api/data/:collection/:id", async (req, res) => {
    try {
      const table = getTable(req.params.collection);
      if (!table) return res.status(404).json({ error: "Collection not found" });
      
      const records = await withRetry(() => db.select().from(table).where(eq(table.id, req.params.id)));
      if (records.length === 0) return res.status(404).json({ error: "Not found" });
      res.json(records[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  
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

      
      // Upsert logic (insert or update on conflict)
      await withRetry(() => db.insert(table)
        .values(data)
        .onConflictDoUpdate({
          target: table.id,
          set: data
        }));
        
      res.json({ success: true, id: req.params.id });
    } catch (error: any) {
      console.error(`Error saving ${req.params.collection}/${req.params.id}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // Generic DELETE document
  app.delete("/api/data/:collection/:id", async (req, res) => {
    try {
      const table = getTable(req.params.collection);
      if (!table) return res.status(404).json({ error: "Collection not found" });
      
      await withRetry(() => db.delete(table).where(eq(table.id, req.params.id)));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- VITE MIDDLEWARE (Untuk Development) ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Static assets untuk produksi
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
