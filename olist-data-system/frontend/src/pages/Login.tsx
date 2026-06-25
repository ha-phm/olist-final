import { useState } from 'react';
import { LogIn, Key, Mail, ShieldAlert, BarChart3, Tag } from 'lucide-react';
import { authService } from '../services/api';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(username, password);
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Đăng nhập thất bại. Vui lòng kiểm tra tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  const loginAsRole = async (roleUsername: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(roleUsername, 'password123');
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError('Lỗi kết nối giả lập đến máy chủ Olist API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-screen" className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative background radial grids */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#1e1e38_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
      
      <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative z-10 border border-slate-100 flex flex-col gap-6">
        
        {/* Brand header */}
        <div className="text-center">
          <div className="mx-auto bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100/50 mb-4">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-sans font-black text-2xl text-slate-800 tracking-tight">Olist Analytics Hub</h2>
          <p className="text-xs text-slate-400 mt-1">Hệ thống Trực quan hoá Dữ liệu Thương mại điện tử</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Regular Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tên đăng nhập</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Ví dụ: admin, analyst, seller, viewer"
                className="w-full pl-11 pr-4 py-3 bg-slate-55 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl outline-hidden text-slate-700 text-sm font-medium transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Mật khẩu</label>
            <div className="relative">
              <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="password"
                placeholder="Nhập mật khẩu (password123)"
                className="w-full pl-11 pr-4 py-3 bg-slate-55 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl outline-hidden text-slate-700 text-sm font-medium transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-slate-200/50 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 text-sm"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Đang xác thực...' : 'Đăng nhập'}</span>
          </button>
        </form>

        {/* Quick connect role buttons */}
        <div className="border-t border-slate-100 pt-5">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 text-center mb-4">Hoặc đăng nhập nhanh theo vai trò (RBAC)</p>
          
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'admin', label: 'Quản trị (Admin)', color: 'bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100/60' },
              { id: 'analyst', label: 'Phân tích (Analyst)', color: 'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100/60' },
              { id: 'seller', label: 'Nhà bán (Seller)', color: 'bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100/60' },
              { id: 'viewer', label: 'Khách (Viewer)', color: 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100' }
            ].map((role) => (
              <button
                key={role.id}
                id={`quick-login-${role.id}`}
                onClick={() => loginAsRole(role.id)}
                className={`text-[11px] font-bold py-2.5 px-2 rounded-xl transition-all cursor-pointer truncate ${role.color}`}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center">
          <p className="text-[10px] text-slate-400 leading-normal">
            Mật khẩu mặc định cho các vai trò là <code className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded-sm font-mono">password123</code>. Hệ thống sẽ cấp mã Token JWT thông qua Express và lưu an toàn.
          </p>
        </div>

      </div>
    </div>
  );
}