// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        companyName: string;
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

/**
 * Verify JWT token and attach user to request
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Attach user to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      companyName: decoded.companyName
    };

    next();

  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Your session has expired. Please login again.'
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid authentication token'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Authentication failed'
    });
  }
}

/**
 * Generate JWT token for user
 */
export function generateToken(user: {
  id: string;
  email: string;
  companyName: string;
}): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      companyName: user.companyName
    },
    JWT_SECRET,
    {
      expiresIn: '30d' // Token expires in 30 days
    }
  );
}

/**
 * Verify token without middleware (for manual verification)
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
