import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Import document extraction controller
import documentRoutes from './routes/document.routes';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://digitalclerk.app',
    'https://*.digitalclerk.app',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Razorpay Instance (Optional - only if you need payments now)
const razorpay = process.env.RAZORPAY_KEY_ID ? new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
}) : null;

// ==================== IN-MEMORY STORAGE ====================

interface User {
  id: string;
  companyName: string;
  email: string;
  password: string;
  phone: string;
  location: string;
  plan: string;
  planPrice: number;
  subscriptionStatus: 'active' | 'expired' | 'cancelled';
  documentsUsed: number;
  documentLimit: number;
  subscriptionEndDate: Date;
  createdAt: Date;
}

interface Document {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  documentType?: string;
  extractedData: any;
  confidence?: number;
  createdAt: Date;
}

// In-memory stores
const users: Map<string, User> = new Map();
const documents: Map<string, Document> = new Map();
const extractionHistory: any[] = [];

// Helper to generate IDs
const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Plan pricing
const PLAN_PRICING: { [key: string]: { price: number; limit: number } } = {
  Starter: { price: 999, limit: 500 },
  Professional: { price: 1999, limit: 1000 },
  Enterprise: { price: 2999, limit: 5000 },
};

// ==================== MIDDLEWARE ====================

interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    companyName: string;
  };
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'UNAUTHORIZED',
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    req.userId = decoded.userId;
    
    // Set user object for compatibility
    const user = users.get(decoded.userId);
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        companyName: user.companyName
      };
    }
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Your session has expired. Please login again.' 
      });
    }
    return res.status(401).json({ 
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Invalid token' 
    });
  }
};

// Export for use in other files
export { authMiddleware };

// Export data access functions for controllers
export const getUserById = (userId: string): User | null => {
  return users.get(userId) || null;
};

export const updateUserUsage = (userId: string, count: number): number => {
  const user = users.get(userId);
  if (!user) throw new Error('User not found');
  
  user.documentsUsed += count;
  users.set(userId, user);
  return user.documentsUsed;
};

export const saveDocument = (doc: Omit<Document, 'id' | 'createdAt'>): Document => {
  const document: Document = {
    ...doc,
    id: generateId(),
    createdAt: new Date()
  };
  documents.set(document.id, document);
  return document;
};

export const saveHistory = (userId: string, data: any): void => {
  extractionHistory.push({
    userId,
    ...data,
    timestamp: new Date()
  });
};

export const getHistory = (userId: string, limit: number = 10): any[] => {
  return extractionHistory
    .filter(h => h.userId === userId)
    .slice(0, limit);
};

// ==================== ROUTES ====================

// 1. SIGNUP
app.post('/api/signup', async (req: Request, res: Response) => {
  try {
    const { companyName, email, password, phone, location, plan } = req.body;

    // Check if user exists
    const existingUser = Array.from(users.values()).find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const selectedPlan = PLAN_PRICING[plan] || PLAN_PRICING.Starter;

    // Create user
    const userId = generateId();
    const user: User = {
      id: userId,
      companyName,
      email,
      password: hashedPassword,
      phone,
      location,
      plan,
      planPrice: selectedPlan.price,
      documentLimit: selectedPlan.limit,
      documentsUsed: 0,
      subscriptionStatus: 'active',
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date()
    };

    users.set(userId, user);

    res.status(201).json({
      message: 'User created successfully',
      userId: user.id,
      email: user.email,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// 2. LOGIN
app.post('/api/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = Array.from(users.values()).find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        companyName: user.companyName,
        email: user.email,
        plan: user.plan,
        documentsUsed: user.documentsUsed,
        monthlyLimit: user.documentLimit,
        documentLimit: user.documentLimit,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionEndsAt: user.subscriptionEndDate,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// 3. AUTH VERIFICATION (for Chrome Extension)
app.get('/api/auth/verify', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const user = users.get(req.userId!);
    if (!user) {
      return res.status(404).json({ 
        valid: false,
        error: 'User not found' 
      });
    }

    res.json({ 
      valid: true,
      user: {
        id: user.id,
        companyName: user.companyName,
        email: user.email,
        plan: user.plan,
        documentsUsed: user.documentsUsed,
        monthlyLimit: user.documentLimit,
        subscriptionStatus: user.subscriptionStatus,
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ valid: false, error: 'Verification failed' });
  }
});

// 4. GET USER PROFILE (Protected)
app.get('/api/user/profile', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const user = users.get(req.userId!);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// 5. INCREMENT USAGE (for Chrome Extension)
app.post('/api/usage/increment', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { count } = req.body;
    
    const user = users.get(req.userId!);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    user.documentsUsed += count;
    users.set(req.userId!, user);

    res.json({
      success: true,
      newUsageCount: user.documentsUsed
    });
  } catch (error) {
    console.error('Usage increment error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update usage' 
    });
  }
});

// 6. GET DOCUMENTS (Protected)
app.get('/api/documents', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userDocs = Array.from(documents.values())
      .filter(doc => doc.userId === req.userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    res.json({ documents: userDocs });
  } catch (error) {
    console.error('Documents fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// ==================== RAZORPAY ROUTES (Optional) ====================

// CREATE ORDER (only if Razorpay is configured)
app.post('/api/create-order', async (req: Request, res: Response) => {
  if (!razorpay) {
    return res.status(503).json({ error: 'Payment service not configured' });
  }

  try {
    const { amount, currency, plan, userId } = req.body;

    const options = {
      amount: amount * 100,
      currency: currency || 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: { plan, userId },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// VERIFY PAYMENT
app.post('/api/verify-payment', async (req: Request, res: Response) => {
  if (!razorpay) {
    return res.status(503).json({ error: 'Payment service not configured' });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      const user = users.get(userId);
      if (user) {
        user.subscriptionStatus = 'active';
        user.subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        users.set(userId, user);
      }

      res.json({ message: 'Payment verified successfully', verified: true });
    } else {
      res.status(400).json({ error: 'Invalid signature', verified: false });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// ==================== DOCUMENT EXTRACTION ROUTES ====================
app.use('/api/document', documentRoutes);

// ==================== UTILITY ROUTES ====================

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    storage: 'in-memory',
    stats: {
      users: users.size,
      documents: documents.size,
    },
    services: {
      razorpay: razorpay ? '✅ Configured' : '❌ Not configured',
      googleVision: process.env.GOOGLE_VISION_API_KEY ? '✅ Configured' : '❌ Not configured'
    }
  });
});

// Test endpoint
app.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'DigitalClerk API is running!' });
});

// ==================== ERROR HANDLERS ====================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: 'Endpoint not found',
    path: req.path
  });
});

// Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║      DigitalClerk API Server (Simplified)         ║
╠════════════════════════════════════════════════════╣
║  🚀 Server: http://localhost:${PORT}                    ║
║  💾 Storage: In-Memory (No Database)               ║
║  💳 Razorpay: ${razorpay ? '✅ Enabled' : '❌ Disabled'}                      ║
║  🔍 Google Vision OCR: ${process.env.GOOGLE_VISION_API_KEY ? '✅ Enabled' : '❌ Disabled'}         ║
║  📄 Document Processing: Ready                     ║
║  🌐 Environment: ${process.env.NODE_ENV || 'development'}                           ║
╚════════════════════════════════════════════════════╝
  `);
  
  console.log('📡 Available Endpoints:');
  console.log('   Authentication:');
  console.log(`     POST http://localhost:${PORT}/api/signup`);
  console.log(`     POST http://localhost:${PORT}/api/login`);
  console.log(`     GET  http://localhost:${PORT}/api/auth/verify`);
  console.log('');
  console.log('   Document Extraction (OCR):');
  console.log(`     POST http://localhost:${PORT}/api/document/extract`);
  console.log(`     GET  http://localhost:${PORT}/api/document/history`);
  console.log('');
  console.log('   User & Documents:');
  console.log(`     GET  http://localhost:${PORT}/api/user/profile`);
  console.log(`     GET  http://localhost:${PORT}/api/documents`);
  console.log(`     POST http://localhost:${PORT}/api/usage/increment`);
  console.log('');
  console.log('   Utility:');
  console.log(`     GET  http://localhost:${PORT}/api/health`);
  console.log('\n✅ Server is ready! (Data will be lost on restart)\n');
  
  // Warnings
  if (!process.env.GOOGLE_VISION_API_KEY) {
    console.warn('⚠️  WARNING: GOOGLE_VISION_API_KEY not found!');
    console.warn('   OCR functionality will not work.\n');
  }
});
