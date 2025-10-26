import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Razorpay from 'razorpay';
import crypto from 'crypto';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error('❌ MongoDB Error:', err));

// Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

// ==================== MODELS ====================

// User Schema
const userSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  location: { type: String, required: true },
  plan: { 
    type: String, 
    enum: ['Starter', 'Professional', 'Enterprise'],
    default: 'Starter'
  },
  planPrice: { type: Number, default: 999 },
  subscriptionStatus: { 
    type: String, 
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  subscriptionId: String,
  subscriptionStartDate: Date,
  subscriptionEndDate: Date,
  documentsUsed: { type: Number, default: 0 },
  documentLimit: { type: Number, default: 500 },
  createdAt: { type: Date, default: Date.now },
  razorpayOrderId: String,
  razorpayPaymentId: String,
});

const User = mongoose.model('User', userSchema);

// Document Schema
const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  extractedData: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Document = mongoose.model('Document', documentSchema);

// ==================== MIDDLEWARE ====================

interface AuthRequest extends Request {
  userId?: string;
}

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ==================== ROUTES ====================

// 1. SIGNUP
app.post('/api/signup', async (req: Request, res: Response) => {
  try {
    const { companyName, email, password, phone, location, plan } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Plan pricing
    const planPricing: { [key: string]: { price: number; limit: number } } = {
      Starter: { price: 999, limit: 500 },
      Professional: { price: 1999, limit: 1000 },
      Enterprise: { price: 2999, limit: 5000 },
    };

    const selectedPlan = planPricing[plan] || planPricing.Starter;

    // Create user
    const user = new User({
      companyName,
      email,
      password: hashedPassword,
      phone,
      location,
      plan,
      planPrice: selectedPlan.price,
      documentLimit: selectedPlan.limit,
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      userId: user._id,
      email: user.email,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// 2. CREATE RAZORPAY ORDER
app.post('/api/create-order', async (req: Request, res: Response) => {
  try {
    const { amount, currency, plan, userId } = req.body;

    const options = {
      amount: amount * 100, // amount in paise
      currency: currency || 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        plan,
        userId,
      },
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

// 3. VERIFY PAYMENT
app.post('/api/verify-payment', async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      // Payment verified - Update user
      await User.findByIdAndUpdate(userId, {
        subscriptionStatus: 'active',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      res.json({ message: 'Payment verified successfully', verified: true });
    } else {
      res.status(400).json({ error: 'Invalid signature', verified: false });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// 4. LOGIN
app.post('/api/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
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
      { userId: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        companyName: user.companyName,
        email: user.email,
        plan: user.plan,
        documentsUsed: user.documentsUsed,
        documentLimit: user.documentLimit,
        subscriptionStatus: user.subscriptionStatus,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// 5. GET USER PROFILE (Protected)
app.get('/api/user/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// 6. SAVE DOCUMENT (Protected)
app.post('/api/documents/save', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { fileName, fileType, extractedData } = req.body;

    // Check document limit
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.documentsUsed >= user.documentLimit) {
      return res.status(403).json({ error: 'Document limit reached' });
    }

    // Save document
    const document = new Document({
      userId: req.userId,
      fileName,
      fileType,
      extractedData,
    });

    await document.save();

    // Increment usage
    user.documentsUsed += 1;
    await user.save();

    res.json({
      message: 'Document saved successfully',
      documentsUsed: user.documentsUsed,
      documentLimit: user.documentLimit,
    });
  } catch (error) {
    console.error('Document save error:', error);
    res.status(500).json({ error: 'Failed to save document' });
  }
});

// 7. GET DOCUMENTS (Protected)
app.get('/api/documents', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const documents = await Document.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ documents });
  } catch (error) {
    console.error('Documents fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// 8. HEALTH CHECK
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
