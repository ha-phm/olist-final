import React, { useEffect, useState } from 'react';
import { 
  ShoppingCart, CheckCircle2, Loader, XCircle, Search, 
  ArrowRight, Landmark, Eye, Info, Truck 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { motion } from 'motion/react';

import KPIWidget from '../components/KPIWidget';
import ExportButtons from '../components/ExportButtons';
import { dashboardService, orderService } from '../services/api';
// Thay formatCurrency bằng formatNumber
import { formatNumber, formatDate } from '../utils/format';

interface OrdersDashboardProps {
  filters: any;
  currency: 'BRL' | 'VND' | 'USD'; // Giữ nguyên kiểu dữ liệu currency
  // Đã xóa biến currency ở đây
}

// Bộ từ điển màu sắc cố định cho từng trạng thái
const STATUS_COLORS: Record<string, string> = {
  'DELIVERED': '#10b981',   // Xanh lá
  'SHIPPED': '#3b82f6',     // Xanh dương
  'UNAVAILABLE': '#f59e0b', // Vàng cam
  'CANCELED': '#ef4444',    // Đỏ
  'PROCESSING': '#8b5cf6',  // Tím
  'INVOICED': '#0ea5e9',    // Xanh lơ
  'CREATED': '#64748b',     // Xám
  'APPROVED': '#f43f5e'     // Hồng
};

export default function OrdersDashboard({ filters }: OrdersDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const result = await dashboardService.getOrders(filters);
        setData(result);
        
        const list = await orderService.searchOrders('');
        setOrdersList(list.results || []);
      } catch (err) {
        console.error("Error loading orders metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [filters]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    try {
      const list = await orderService.searchOrders(searchTerm);
      setOrdersList(list.results || []);
    } catch (err) {
      console.error("Search orders failed:", err);
    } finally {
      setSearching(false);
    }
  };

  const openOrderDetails = async (id: string) => {
    setModalLoading(true);
    try {
      const details = await orderService.getOrderDetails(id);
      setSelectedOrder(details);
    } catch (err) {
      console.error("Fetch order details failed:", err);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-slate-500 font-sans font-semibold text-sm">Đang tải phân tích đơn hàng...</span>
      </div>
    );
  }

  const { kpis, statusData, deliverySpeed } = data;

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'invoiced': return 'bg-sky-100 text-sky-800 border border-sky-200';
      case 'shipped': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'processing': return 'bg-violet-100 text-violet-800 border border-violet-200';
      case 'unavailable': return 'bg-amber-100 text-amber-800 border border-amber-200';
      default: return 'bg-rose-100 text-rose-800 border border-rose-200';
    }
  };

  return (
    <div id="orders-dashboard" className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="font-sans font-black text-xl text-slate-800 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-600" />
            Bảng điều khiển Đơn Hàng 
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Quản trị trạng thái giao dịch, lượng đơn hoàn thành và thời gian chuyển phát.
          </p>
        </div>

        <ExportButtons title="Quản lý hóa đơn đơn hàng" data={data} />
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
        <KPIWidget
          id="kpi-orders-count"
          title="Tổng lượng đặt hàng"
          value={formatNumber(kpis.total_orders)}
          icon={ShoppingCart}
          color="indigo"
        />
        <KPIWidget
          id="kpi-orders-delivered"
          title="Giao thành công"
          value={formatNumber(kpis.delivered)}
          icon={CheckCircle2}
          color="emerald"
        />
        <KPIWidget
          id="kpi-orders-pending"
          title="Chờ lập hoá đơn / Chuyển"
          value={formatNumber(kpis.pending)}
          icon={Loader}
          color="amber"
        />
        <KPIWidget
          id="kpi-orders-canceled"
          title="Đơn hàng thất bại / Huỷ"
          value={formatNumber(kpis.canceled)}
          icon={XCircle}
          color="rose"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Delivery speed line chart */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs lg:col-span-2 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-500" />
              Hiệu năng vận chuyển - Thời gian giao trung bình (Ngày)
            </h3>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={deliverySpeed} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} label={{ value: 'Ngày', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Line type="monotone" name="Giao thực tế (ngày)" dataKey="speed" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
                <Line type="monotone" name="Ước tính cam kết (ngày)" dataKey="estimated" stroke="#1e1e38" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Order status share */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-500" />
              Tỷ lệ hoá đơn theo trạng thái
            </h3>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry: any, index: number) => (
                    // Lấy màu từ STATUS_COLORS
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name.toUpperCase()] || '#cbd5e1'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px' }}
                  formatter={(val: number) => [`${formatNumber(val)} đơn`, 'Sản lượng']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-2 text-xs border-t border-slate-100 pt-4">
            {statusData.map((s: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-slate-600">
                  {/* Cập nhật màu chấm tròn */}
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: STATUS_COLORS[s.name.toUpperCase()] || '#cbd5e1' }}></span>
                  <span className="uppercase text-[11px] font-bold">{s.name}</span>
                </div>
                <span className="font-mono text-slate-800 font-black">{formatNumber(s.value)} đơn</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* Interactive Listing and Search engine */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-sans font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
              <Search className="w-4 h-4 text-indigo-500" />
              Tra cứu và Lọc sâu mã vận đơn hàng
            </h3>
          </div>

          <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-sm w-full">
            <input 
              type="text" 
              placeholder="Nhập mã đơn, bang (Ví dụ: SP)..."
              className="px-4 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 font-semibold w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="bg-slate-800 hover:bg-slate-900 text-white font-sans text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700 cursor-pointer transition-all shrink-0"
            >
              {searching ? 'Đang tìm...' : 'Tìm kiếm'}
            </button>
          </form>
        </div>

        {/* Listing Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                <th className="py-4 px-6">Mã hoá đơn (ID)</th>
                <th className="py-4 px-6">Ngày mua</th>
                <th className="py-4 px-6">Đô thị (City / State)</th>
                <th className="py-4 px-6 text-center">Số lượng món</th>
                <th className="py-4 px-6 text-right">Tổng giá</th>
                <th className="py-4 px-6">Phương thức</th>
                <th className="py-4 px-6">Trạng thái</th>
                <th className="py-4 px-6 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans text-xs text-slate-600">
              {ordersList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center font-mono text-slate-400">Không tìm thấy đơn hàng nào khớp với mã tra cứu hoặc bộ lọc hoạt động.</td>
                </tr>
              ) : (
                ordersList.map((row) => (
                  <tr key={row.order_id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-800">{row.order_id.substring(0, 16)}...</td>
                    <td className="py-4 px-6 font-mono">{row.purchase_date}</td>
                    <td className="py-4 px-6 font-medium capitalize">{row.city} ({row.state})</td>
                    <td className="py-4 px-6 text-center font-mono font-bold">{row.items_count}</td>
                    {/* Bỏ formatCurrency, chỉ dùng số */}
                    <td className="py-4 px-6 text-right font-mono font-black text-slate-800">{formatNumber(row.total_price)}</td>
                    <td className="py-4 px-6 font-mono font-semibold text-slate-400 text-[10px] uppercase">{row.payment_type.replace(/_/g, ' ')}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${getStatusBadge(row.order_status)}`}>
                        {row.order_status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => openOrderDetails(row.order_id)}
                        className="p-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg text-indigo-700 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer md:mx-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Slide detail modal */}
      {selectedOrder && (
        <div id="order-details-modal" className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-end font-sans">
          <div className="bg-white w-full max-w-xl h-full flex flex-col shadow-2xl relative animate-slide-in p-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <h3 className="font-sans font-black text-base text-slate-800 tracking-tight">Chi tiết vận đơn: {selectedOrder.order.order_id.substring(0, 12)}...</h3>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Đóng lại
              </button>
            </div>

            <div className="space-y-6 flex-1 text-slate-700 text-xs leading-relaxed">
              {/* Các khối chi tiết đơn hàng giữ nguyên cấu trúc, chỉ bỏ formatCurrency */}
              
              <div className="border border-slate-100 p-4 rounded-xl space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono border-b border-slate-100 pb-2">Danh sách món hàng ({selectedOrder.items.length})</div>
                <div className="space-y-3 Divide-y divide-slate-100">
                  {selectedOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="pt-2 flex items-start justify-between gap-4 text-[11px]">
                      <div>
                        <p className="font-bold text-indigo-700 font-mono text-[9px]">{item.product_id}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-slate-800 font-mono">{formatNumber(item.price)}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Phí cước: +{formatNumber(item.freight_value)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.payment && selectedOrder.payment.length > 0 && (
                <div className="border border-slate-100 p-4 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">Dữ liệu thanh toán</div>
                  {selectedOrder.payment.map((pay: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-[11px] font-mono leading-relaxed">
                      <span className="capitalize">
                        {pay.payment_type.replace(/_/g, ' ')} 
                        {pay.payment_installments > 1 
                        ? ` (Trả góp: ${pay.payment_installments} tháng)` 
                        : ' (Trả thẳng)'}
                      </span>
                      <span className="font-bold text-emerald-600">{formatNumber(pay.payment_value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}