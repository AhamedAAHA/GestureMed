import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import patientRoutes from './routes/patients.js';
import doctorRoutes from './routes/doctors.js';
import wardRoutes from './routes/wards.js';
import templateRoutes from './routes/templates.js';
import requestRoutes from './routes/requests.js';
import noteRoutes from './routes/notes.js';
import aiRoutes from './routes/ai.js';
import voiceRoutes from './routes/voice.js';
import auditRoutes from './routes/audit.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'MediSign Voice API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/wards', wardRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/audit', auditRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  // #region agent log
  fetch('http://127.0.0.1:7584/ingest/625ab932-2ffa-4880-9a9e-5308a63da83a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5badbd'},body:JSON.stringify({sessionId:'5badbd',location:'server.js:start',message:'start() entered',data:{port:PORT,envPort:process.env.PORT||null},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  await connectDB();
  // #region agent log
  fetch('http://127.0.0.1:7584/ingest/625ab932-2ffa-4880-9a9e-5308a63da83a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5badbd'},body:JSON.stringify({sessionId:'5badbd',location:'server.js:pre-listen',message:'DB connected, attempting listen',data:{port:PORT},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const server = app.listen(PORT, () => {
    // #region agent log
    fetch('http://127.0.0.1:7584/ingest/625ab932-2ffa-4880-9a9e-5308a63da83a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5badbd'},body:JSON.stringify({sessionId:'5badbd',location:'server.js:listen-ok',message:'Server listening',data:{port:PORT},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.log(`MediSign Voice API running on http://localhost:${PORT}`);
  });
  server.on('error', (err) => {
    // #region agent log
    fetch('http://127.0.0.1:7584/ingest/625ab932-2ffa-4880-9a9e-5308a63da83a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5badbd'},body:JSON.stringify({sessionId:'5badbd',location:'server.js:listen-error',message:'Listen failed',data:{code:err.code,errno:err.errno,port:PORT,syscall:err.syscall},timestamp:Date.now(),hypothesisId:'A',runId:'post-fix'})}).catch(()=>{});
    // #endregion
    if (err.code === 'EADDRINUSE') {
      console.error(
        `Port ${PORT} is already in use. Stop the other process (e.g. another "npm run dev") or set PORT in .env to a free port.`
      );
    }
    throw err;
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
