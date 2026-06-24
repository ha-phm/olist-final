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
import { formatNumber, formatCurrency, formatDate } from '../utils/format';

interface OrdersDashboardProps {
  filters: any;
  currency: 'BRL' | 'VND' | 'USD';
}

export default function OrdersDashboard({ filters, currency }: OrdersDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const result = await dashboardService.getOrders(filters);
        setData(result);
        
        // Initial orders load
        const list = await orderService.searchOrders('');
        setOrdersList(list.results);
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
      setOrdersList(list.results);
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
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'invoiced': return 'bg-amber-100 text-amber-800 border border-amber-200';
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
            Bảng điều khiển Đơn Hàng (Orders Control)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Quản trị trạng thái giao dịch, lượng đơn hoàn thành và thời gian chuyển phát thực tế so với cam kết.
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
          subtext="Tính trên mọi giỏ hàng"
        />
        <KPIWidget
          id="kpi-orders-delivered"
          title="Giao thành công"
          value={formatNumber(kpis.delivered)}
          icon={CheckCircle2}
          color="emerald"
          subtext="Đã phát cho khách hàng"
        />
        <KPIWidget
          id="kpi-orders-pending"
          title="Chờ lập hoá đơn / Chuyển"
          value={formatNumber(kpis.pending)}
          icon={Loader}
          color="amber"
          subtext="Đang xử lý ở kho bãi"
        />
        <KPIWidget
          id="kpi-orders-canceled"
          title="Đơn hàng thất bại / Huỷ"
          value={formatNumber(kpis.canceled)}
          icon={XCircle}
          color="rose"
          subtext="Giao hàng lỗi hoặc huỷ đơn"
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
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-mono font-bold px-2 py-0.5 rounded-sm">
              Đo lường tốc độ giao
            </span>
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
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-mono font-bold px-2 py-0.5 rounded-sm">
              Status share
            </span>
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
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
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
              Tra cứu và Lọc sâu mã vận đơn hàng (Order Searching Console)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Tìm kiếm theo mã đơn, thành phố, bang hoặc loại thẻ thanh toán.</p>
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
                <th className="py-4 px-6 text-right">Tổng giá thanh toán</th>
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
                    <td className="py-4 px-6 text-right font-mono font-black text-slate-800">{formatCurrency(row.total_price, currency)}</td>
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
                <span className="text-[10px] font-mono text-slate-400 tracking-wider">Mã đầy đủ: {selectedOrder.order.order_id}</span>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Đóng lại
              </button>
            </div>

            <div className="space-y-6 flex-1 text-slate-700 text-xs leading-relaxed">
              {/* Timing metrics block */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-1 text-xs font-bold text-slate-600 mb-2">
                  <Truck className="w-4 h-4 text-emerald-500" />
                  Hành trình chuyển phát
                </div>
                <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-400 block uppercase text-[9px] font-bold">Ngày Đặt hàng</span>
                    <span className="font-semibold text-slate-700">{formatDate(selectedOrder.order.order_purchase_timestamp)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase text-[9px] font-bold">Phê duyệt (Approved)</span>
                    <span className="font-semibold text-slate-700">{formatDate(selectedOrder.order.order_approved_at)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase text-[9px] font-bold">Giao cho Shiper (Carrier)</span>
                    <span className="font-semibold text-slate-700">{formatDate(selectedOrder.order.order_delivered_carrier_date) || 'Đang xử lý'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase text-[9px] font-bold">Khách nhận thực tế</span>
                    <span className="font-semibold text-slate-700">{formatDate(selectedOrder.order.order_delivered_customer_date) || 'Đang giao'}</span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              {selectedOrder.client && (
                <div className="border border-slate-100 p-4 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">Thông tin người mua</div>
                  <div className="text-[11px] leading-relaxed">
                    <p><span className="text-slate-400 font-semibold inline-block w-24">Zip code:</span> <span className="font-mono text-slate-800 font-bold">{selectedOrder.client.customer_zip_code_prefix}</span></p>
                    <p className="capitalize"><span className="text-slate-400 font-semibold inline-block w-24">Đô thị sinh sống:</span> {selectedOrder.client.customer_city}</p>
                    <p><span className="text-slate-400 font-semibold inline-block w-24">Bang vùng:</span> {selectedOrder.client.customer_state}</p>
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="border border-slate-100 p-4 rounded-xl space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono border-b border-slate-100 pb-2">Danh sách món hàng ({selectedOrder.items.length})</div>
                
                <div className="space-y-3 Divide-y divide-slate-100">
                  {selectedOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="pt-2 flex items-start justify-between gap-4 text-[11px]">
                      <div>
                        <p className="font-bold text-indigo-700 font-mono text-[9px]">{item.product_id}</p>
                        <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wide mt-1">Nhà bán hàng: {item.seller_name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-slate-800 font-mono">{formatCurrency(item.price, currency)}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Phí cước: +{formatCurrency(item.freight_value, currency)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payments sequentially */}
              {selectedOrder.payment && selectedOrder.payment.length > 0 && (
                <div className="border border-slate-100 p-4 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">Dữ liệu thanh toán</div>
                  {selectedOrder.payment.map((pay: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-[11px] font-mono leading-relaxed">
                      <span className="capitalize">{pay.payment_type.replace(/_/g, ' ')} (Trả góp: {pay.payment_installments} kì)</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(pay.payment_value, currency)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Reviews score display */}
              {selectedOrder.reviews && selectedOrder.reviews.length > 0 && (
                <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">Nhận xét khách quan</div>
                  {selectedOrder.reviews.map((rev: any, idx: number) => (
                    <div key={idx} className="text-[11px] leading-relaxed">
                      <p className="text-amber-700 font-bold">Điểm số: {'★'.repeat(rev.review_score)}{'☆'.repeat(5 - rev.review_score)}</p>
                      {rev.review_comment_message && (
                        <p className="italic text-slate-600 mt-1">"{rev.review_comment_message}"</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4 mt-4 text-center">
              <span className="text-[9px] text-slate-400 font-mono">Dữ liệu được gọi trực tiếp bằng Express JWT middleware</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
