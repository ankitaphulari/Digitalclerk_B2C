// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import documentRoutes from './routes/document.routes';
import authRoutes from './routes/auth.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '50mb' })); // Allow large base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS Configuration - Allow Chrome Extension
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://digitalclerk.app',
    'https://*.digitalclerk.app',
    'chrome-extension://*' // Allow all Chrome extensions
  ],
  credentials: true
}));

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'DigitalClerk API',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/document', documentRoutes);
app.use('/api/usage', documentRoutes);

// Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: 'Endpoint not found'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║      DigitalClerk API Server          ║
╠════════════════════════════════════════╣
║  🚀 Server running on port ${PORT}       ║
║  🔍 Google Vision OCR: Enabled         ║
║  📄 Document Processing: Ready         ║
║  🌐 Environment: ${process.env.NODE_ENV || 'development'}         ║
╚════════════════════════════════════════╝
  `);
  
  console.log('📡 API Endpoints:');
  console.log(`   POST http://localhost:${PORT}/api/document/extract`);
  console.log(`   GET  http://localhost:${PORT}/api/document/history`);
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   POST http://localhost:${PORT}/api/auth/signup`);
  console.log('\n✅ Server is ready to accept requests!\n');
});
