import { LogOut, ShieldCheck, Database, Calendar } from 'lucide-react';

interface HeaderProps {
  currentUser: {
    username: string;
    role: string;
    label: string;
  } | null;
  onLogout: () => void;

  filters: {
    startDate: string;
    endDate: string;
    orderStatus: string;
    category: string;
    state: string;
    city: string;
  };
  onFilterChange: (filters: any) => void;
  categories: any[];
  locations: { cities: string[]; states: string[] };
}

export default function Header({
  currentUser,
  onLogout,
  filters,
  onFilterChange,
  categories,
  locations
}: HeaderProps) {
  
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
      case 'Business Analyst': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'Seller Manager': return 'bg-amber-100 text-amber-700 border border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  return (
    <header id="app-header" className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xs">
      {/* Brand Search and Filter Controls */}
      <div className="flex flex-wrap items-center gap-4 flex-1">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-600" />
          <span className="font-mono text-sm uppercase tracking-wide font-black text-slate-700">Filter Engine</span>
        </div>
        
        {/* Date Filters */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1" />
          <input 
            type="date" 
            className="bg-transparent border-0 focus:ring-0 p-1 font-mono text-slate-600 outline-hidden"
            value={filters.startDate}
            onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
          />
          <span className="text-slate-400">→</span>
          <input 
            type="date" 
            className="bg-transparent border-0 focus:ring-0 p-1 font-mono text-slate-600 outline-hidden"
            value={filters.endDate}
            onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
          />
        </div>

        {/* Category Filters */}
        <select
          aria-label="Product Category Filter"
          className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-1.5 text-slate-600 font-medium cursor-pointer outline-hidden focus:border-indigo-500"
          value={filters.category}
          onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((cat, idx) => (
            <option key={idx} value={cat.english}>{cat.vietnamese}</option>
          ))}
        </select>

        {/* State/City Filters */}
        <select
          aria-label="Customer State Filter"
          className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-1.5 text-slate-600 font-medium cursor-pointer outline-hidden focus:border-indigo-500"
          value={filters.state}
          onChange={(e) => onFilterChange({ ...filters, state: e.target.value })}
        >
          <option value="">Tất cả các bang</option>
          {locations.states.map((st, idx) => (
            <option key={idx} value={st}>{st}</option>
          ))}
        </select>

        {/* Status filters */}
        <select
          aria-label="Order Status Filter"
          className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-1.5 text-slate-600 font-medium cursor-pointer outline-hidden focus:border-indigo-500"
          value={filters.orderStatus}
          onChange={(e) => onFilterChange({ ...filters, orderStatus: e.target.value })}
        >
          <option value="">Mọi trạng thái đơn</option>
          <option value="delivered">Đã giao (Delivered)</option>
          <option value="shipped">Đang vận chuyển (Shipped)</option>
          <option value="canceled">Đã huỷ (Canceled)</option>
          <option value="invoiced">Đã lập hoá đơn (Invoiced)</option>
        </select>
      </div>

      {/* Profile & Currency settings */}
      <div className="flex items-center gap-4 justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
       

        {/* User Badges */}
        {currentUser && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="font-semibold text-slate-800 text-sm">{currentUser.username}</div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center justify-end gap-1">
                <ShieldCheck className="w-3 h-3 text-indigo-500" />
                {currentUser.label}
              </div>
            </div>
            
            <div className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${getRoleBadgeColor(currentUser.role)}`}>
              {currentUser.role === 'Business Analyst' ? 'Analyst' : currentUser.role}
            </div>

            <button
              id="logout-btn"
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 rounded-lg transition-all"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
