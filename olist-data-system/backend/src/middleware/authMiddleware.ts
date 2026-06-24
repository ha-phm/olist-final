import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_token_for_authentication_key_99';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: 'Admin' | 'Business Analyst' | 'Seller Manager' | 'Viewer';
  };
}

/**
 * JWT Authentication Guard Middleware
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Truy cập bị từ chối. Vui lòng đăng nhập.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET) as any;
    req.user = verified;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
}

/**
 * Role Permission Guard (RBAC)
 * Predefined roles hierarchy or specific permissions
 */
export function requireRoles(roles: Array<'Admin' | 'Business Analyst' | 'Seller Manager' | 'Viewer'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Yêu cầu xác thực người dùng.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Bạn không có quyền thực hiện hành động này. Cần vai trò: ${roles.join(' hoặc ')}` 
      });
    }

    next();
  };
}
