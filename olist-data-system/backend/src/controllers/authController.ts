import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_token_for_authentication_key_99';

// Predefined demo accounts for easy role switching and testing
const PREDEFINED_USERS = [
  { id: "1", username: "admin", passwordHash: "", role: "Admin", label: "Quản trị hệ thống" },
  { id: "2", username: "analyst", passwordHash: "", role: "Business Analyst", label: "Nhà phân tích kinh doanh" },
  { id: "3", username: "seller", passwordHash: "", role: "Seller Manager", label: "Trình quản lý người bán" },
  { id: "4", username: "viewer", passwordHash: "", role: "Viewer", label: "Trình xem cơ bản" }
];

// Initialize crypt hashes
(async () => {
  for (const user of PREDEFINED_USERS) {
    user.passwordHash = await bcrypt.hash("password123", 10);
  }
})();

export const authController = {
  /**
   * User login endpoint
   */
  async login(req: Request, res: Response) {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng cung cấp tên đăng nhập và mật khẩu.' });
    }

    try {
      const user = PREDEFINED_USERS.find(u => u.username.toLowerCase() === username.toLowerCase());

      if (!user) {
        return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
      }

      // Check BCrypt hash matching
      const validPass = await bcrypt.compare(password, user.passwordHash || "fallback");
      if (!validPass && password !== "password123") { // fallback for safe startup
        return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
      }

      // Issue JWT Token
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        message: 'Đăng nhập thành công!',
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          label: user.label
        }
      });
    } catch (err: any) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Đã xảy ra lỗi hệ thống khi đăng nhập.' });
    }
  },

  /**
   * Fetch current profile
   */
  getMe(req: any, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Chưa đăng nhập.' });
    }
    const fullUser = PREDEFINED_USERS.find(u => u.id === req.user.id);
    return res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        label: fullUser ? fullUser.label : "Người dùng"
      }
    });
  }
};
