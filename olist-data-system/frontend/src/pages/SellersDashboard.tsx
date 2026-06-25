import { useEffect, useState } from 'react';
import { 
  Store, Star, AlertTriangle, Trophy, MapPin, PieChart as PieChartIcon, Search, Filter, TrendingDown
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, CartesianGrid, Legend
} from 'recharts';

import KPIWidget from '../components/KPIWidget';
import { dashboardService } from '../services/api';
import { formatNumber } from '../utils/format';

interface SellersDashboardProps {
  filters: any;
}

const RATING_COLORS = ['#10b981', '#34d399', '#fbbf24', '#f87171', '#ef4444'];

export default function SellersDashboard({ filters }: SellersDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sla_warning' | 'rating_danger'>('all');

  useEffect(() => {
    const fetchSellers = async () => {
      setLoading(true);
      try {
        const result = await dashboardService.getSellers(filters);
        setData(result);
      } catch (err) {
        console.error("Error loading sellers metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSellers();
  }, [filters]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-slate-500 font-sans font-semibold text-sm">Đang tải phân tích người bán...</span>
      </div>
    );
  }

  // Đã bóc tách thêm biến bottomRegions được gửi từ Backend
  const { kpis, topSellers, allSellers, geoData, ratingData, bottomRegions } = data;

  const filteredSellers = allSellers?.filter((seller: any) => {
    const matchSearch = 
      seller.fullId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.state.toLowerCase().includes(searchTerm.toLowerCase());

    let matchType = true;
    if (filterType === 'sla_warning') {
      matchType = seller.deliverySuccessRate < 95.0;
    } else if (filterType === 'rating_danger') {
      matchType = seller.rating < 3.5;
    }

    return matchSearch && matchType;
  }) || [];

  const getDynamicStatus = (rating: number, deliveryRate: number) => {
    if (rating < 3.5) {
      return <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider">SUSPENDED</span>;
    }
    if (deliveryRate < 95.0) {
      return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider">WARNING</span>;
    }
    return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider">ACTIVE</span>;
  };

  return (
    <div id="sellers-dashboard" className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="font-sans font-black text-xl text-slate-800 tracking-tight flex items-center gap-2">
            <Store className="w-5 h-5 text-indigo-600" />
            Bảng điều khiển Người Bán 
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Giám sát hiệu suất bán hàng, thống kê doanh nghiệp và quản lý rủi ro SLA.
          </p>
        </div>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPIWidget id="kpi-sellers-active" title="Tổng nhà bán hàng cộng tác" value={formatNumber(kpis.total_sellers)} icon={Store} color="indigo" subtext="Số lượng doanh nghiệp hoạt động" />
        <KPIWidget id="kpi-sellers-rating" title="Điểm tích hợp trung bình" value={`${kpis.avg_seller_rating} / 5.0`} icon={Star} color="amber" subtext="Tính trên mọi đánh giá của khách" />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-sans font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-500" /> Mật độ kho hàng theo Bang (Top 10)
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={geoData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="state" stroke="#94a3b8" fontSize={11} tickMargin={10} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px' }} itemStyle={{ color: '#fff', fontSize: '12px' }} formatter={(val: number) => [formatNumber(val), 'Nhà bán']} />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-sans font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
              <PieChartIcon className="w-4 h-4 text-amber-500" /> Phân khúc chất lượng 
            </h3>
          </div>
          <div className="flex-1 w-full flex items-center justify-center min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ratingData} cx="50%" cy="45%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value">
                  {ratingData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={RATING_COLORS[index % RATING_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px' }} itemStyle={{ color: '#fff', fontSize: '11px' }} formatter={(val: number) => [`${formatNumber(val)} đối tác`, 'Số lượng']} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* THAY ĐỔI CẤU TRÚC GRID: Chia không gian cho Top Sellers và Khu vực yếu thế */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Khối bên trái: Top 5 Sellers (Chiếm 2 phần 3 chiều ngang) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden xl:col-span-2 flex flex-col justify-between"
        >
          <div>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-sans font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
                Xếp hạng đối tác cung cấp dịch vụ tốt nhất
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    <th className="py-4 px-6">Top</th>
                    <th className="py-4 px-6">ID đối tác</th>
                    <th className="py-4 px-6">Khu vực đô thị</th>
                    <th className="py-4 px-6 text-right">Doanh thu lũy kế</th>
                    <th className="py-4 px-6 text-right">Điểm hài lòng</th>
                    <th className="py-4 px-6 text-right">Tỉ lệ đúng hạn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-xs text-slate-600">
                  {topSellers?.map((s: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-4 px-6">
                        <span className={`w-5 h-5 rounded-md inline-flex items-center justify-center text-[10px] font-extrabold ${ idx === 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' : idx === 1 ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-slate-50 text-slate-400' }`}>
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-slate-800" title={s.fullId}>{s.id}</td>
                      <td className="py-4 px-6 capitalize">{s.city} ({s.state})</td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-indigo-600">{formatNumber(s.revenue)}</td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-slate-800"><span className="text-amber-500 mr-1">★</span>{s.rating.toFixed(2)}</td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-emerald-600">{s.deliverySuccessRate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Khối bên phải: Bảng Khu vực yếu thế (Chiếm 1 phần 3 chiều ngang) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between"
        >
          <div>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-sans font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
                Khu vực yếu thế
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    <th className="py-4 px-6">Mã Bang</th>
                    <th className="py-4 px-6 text-center">Số nhà bán</th>
                    <th className="py-4 px-6 text-right">Tổng sản lượng bán</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-xs text-slate-600">
                  {bottomRegions?.map((r: any, idx: number) => (
                    <tr key={idx} className="hover:bg-rose-50/20 transition-colors">
                      <td className="py-4 px-6 font-mono font-black text-rose-700">{r.state}</td>
                      <td className="py-4 px-6 text-center font-mono font-semibold text-slate-500">{r.sellersCount} shop</td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-slate-800">{formatNumber(r.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Hệ thống rà soát vi phạm SLA & Chất lượng */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h3 className="font-sans font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
              System Monitor: Hệ thống rà soát vi phạm SLA & Chất lượng
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Sử dụng bộ lọc để phát hiện các đối tác đang nằm trong vùng rủi ro cần xử lý.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-full sm:w-auto overflow-x-auto shrink-0">
              <button onClick={() => setFilterType('all')} className={`text-[11px] font-bold px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${filterType === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}>Tất cả đối tác</button>
              <button onClick={() => setFilterType('sla_warning')} className={`text-[11px] font-bold px-3 py-1.5 rounded-md transition-all whitespace-nowrap flex items-center gap-1 ${filterType === 'sla_warning' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-500 hover:text-amber-600'}`}><Filter className="w-3 h-3" /> Giao trễ (&lt;95%)</button>
              <button onClick={() => setFilterType('rating_danger')} className={`text-[11px] font-bold px-3 py-1.5 rounded-md transition-all whitespace-nowrap flex items-center gap-1 ${filterType === 'rating_danger' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500 hover:text-rose-600'}`}><Filter className="w-3 h-3" /> Điểm thấp (&lt;3.5)</button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-64 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3" />
              <input type="text" placeholder="Tìm mã ID, Bang..." className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 font-semibold w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-white shadow-xs z-10">
              <tr className="bg-slate-50/90 backdrop-blur-md border-b border-slate-100 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                <th className="py-4 px-6">Mã đối tác (Full ID)</th>
                <th className="py-4 px-6">Khu vực (City/State)</th>
                <th className="py-4 px-6 text-right">Tổng doanh thu</th>
                <th className="py-4 px-6 text-right">Đánh giá sao</th>
                <th className="py-4 px-6 text-right">Tỉ lệ đúng hạn</th>
                <th className="py-4 px-6 text-center">Trạng thái SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans text-xs text-slate-600">
              {filteredSellers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center font-mono text-slate-400">Không tìm thấy đối tác nào nằm trong diện cảnh báo/tìm kiếm.</td>
                </tr>
              ) : (
                filteredSellers.map((s: any, idx: number) => (
                  <tr key={idx} className={`transition-colors ${s.rating < 3.5 ? 'bg-rose-50/30 hover:bg-rose-50/60' : s.deliverySuccessRate < 95 ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-slate-50/40'}`}>
                    <td className="py-4 px-6 font-mono font-bold text-slate-800">{s.fullId}</td>
                    <td className="py-4 px-6 capitalize">{s.city} ({s.state})</td>
                    <td className="py-4 px-6 text-right font-mono font-black text-slate-800">{formatNumber(s.revenue)}</td>
                    <td className={`py-4 px-6 text-right font-mono font-bold ${s.rating < 3.5 ? 'text-rose-600' : 'text-slate-800'}`}><span className={`${s.rating < 3.5 ? 'text-rose-500' : 'text-amber-500'} mr-1`}>★</span>{s.rating.toFixed(2)}</td>
                    <td className={`py-4 px-6 text-right font-mono font-bold ${s.deliverySuccessRate < 95 ? 'text-amber-600' : 'text-emerald-600'}`}>{s.deliverySuccessRate.toFixed(1)}%</td>
                    <td className="py-4 px-6 text-center">{getDynamicStatus(s.rating, s.deliverySuccessRate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

    </div>
  );
}