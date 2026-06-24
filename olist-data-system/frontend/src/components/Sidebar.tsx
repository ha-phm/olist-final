import { 
  BarChart3, Users, Package, ShoppingCart, 
  Store, Star, Search, Shield, Info, LogOut
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  currentUser: {
    username: string;
    role: string;
  } | null;
}

export default function Sidebar({ currentPage, onPageChange, currentUser }: SidebarProps) {
  
  // Custom navigation structure restricted by role access control as specified
  const menuItems = [
    { 
      id: 'overview', 
      label: 'Tổng quan', 
      icon: BarChart3, 
      allowedRoles: ['Admin', 'Business Analyst', 'Seller Manager', 'Viewer'] 
    },
    { 
      id: 'customers', 
      label: 'Khách hàng', 
      icon: Users, 
      allowedRoles: ['Admin', 'Business Analyst'] 
    },
    { 
      id: 'products', 
      label: 'Sản phẩm', 
      icon: Package, 
      allowedRoles: ['Admin', 'Business Analyst'] 
    },
    { 
      id: 'orders', 
      label: 'Đơn hàng', 
      icon: ShoppingCart, 
      allowedRoles: ['Admin', 'Business Analyst', 'Seller Manager'] 
    },
    { 
      id: 'sellers', 
      label: 'Người bán', 
      icon: Store, 
      allowedRoles: ['Admin', 'Business Analyst', 'Seller Manager'] 
    },
    { 
      id: 'reviews', 
      label: 'Đánh giá', 
      icon: Star, 
      allowedRoles: ['Admin', 'Business Analyst', 'Seller Manager'] 
    },
    { 
      id: 'admin_panel', 
      label: 'Nhật ký & Quyền', 
      icon: Shield, 
      allowedRoles: ['Admin'] 
    }
  ];

  const hasAccess = (item: typeof menuItems[0]) => {
    if (!currentUser) return false;
    return item.allowedRoles.includes(currentUser.role);
  };

  return (
    <aside id="app-sidebar" className="bg-slate-900 text-slate-100 w-64 min-h-screen flex flex-col border-r border-slate-800">
      {/* Brand Header */}
      <div className="flex items-center justify-center gap-2 px-6 py-6 border-b border-slate-800">
        <div className="bg-indigo-600 p-2 rounded-xl shadow-md">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div className="text-left">
          <h1 className="font-sans font-bold text-sm tracking-widest text-indigo-400 leading-tight">OLIST</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Data Hub System</p>
        </div>
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Bảng điều khiển</p>
        
        {menuItems.map((item) => {
          const allowed = hasAccess(item);
          const active = currentPage === item.id;
          const IconComp = item.icon;

          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              disabled={!allowed}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-sans text-xs font-semibold tracking-wide transition-all ${
                !allowed 
                  ? 'opacity-30 cursor-not-allowed select-none' 
                  : active 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <IconComp className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              
              {!allowed && (
                <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-mono">Khoá</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Info card footer */}
      <div className="p-4 border-t border-slate-800 m-4 bg-slate-950/40 rounded-xl border border-slate-800/40">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-400 font-sans leading-relaxed">
            <span className="font-bold text-slate-300">RBAC Hoạt động:</span> Vai trò này giới hạn các bảng dữ liệu có thể truy cập để đảm bảo an toàn bảo mật.
          </div>
        </div>
      </div>
    </aside>
  );
}
