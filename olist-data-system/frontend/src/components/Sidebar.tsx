import { 
  BarChart3, Users, Package, ShoppingCart, 
  Store, Star
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
  ];

  const hasAccess = (item: typeof menuItems[0]) => {
    if (!currentUser) return false;
    return item.allowedRoles.includes(currentUser.role);
  };

  return (
    <aside id="app-sidebar" className="bg-slate-900 text-slate-100 w-64 min-h-screen flex flex-col border-r border-slate-800">
      {/* Brand Header */}
      <div className="flex flex-col items-center justify-center mt-6 mb-8 w-full text-center">
        <span className="text-2xl font-black text-indigo-500 tracking-[0.2em] uppercase">
           OLIST
        </span>
        <span className="text-[10px] font-bold text-slate-400 tracking-widest mt-1">
           DATA VISUALIZATION SYSTEM
        </span>
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
    </aside>
  );
}
