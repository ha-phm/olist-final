import { useEffect, useState } from 'react';
import { 
  Star, MessageSquare, Clock, AlertTriangle, Search, TrendingDown, Truck, Store
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line
} from 'recharts';
import { motion } from 'motion/react';

import KPIWidget from '../components/KPIWidget';
import { dashboardService } from '../services/api';
import { formatNumber } from '../utils/format';

interface ReviewsDashboardProps {
  filters: any;
}

export default function ReviewsDashboard({ filters }: ReviewsDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State quản lý việc chuyển đổi Tab ở bảng Tử huyệt
  const [badTab, setBadTab] = useState<'category' | 'seller'>('seller');

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const result = await dashboardService.getReviews(filters);
        setData(result);
      } catch (err) {
        console.error("Error loading reviews metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [filters]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-slate-500 font-sans font-semibold text-sm">Đang tải phân tích đánh giá...</span>
      </div>
    );
  }

  // Đã lấy thêm badSellers
  const { kpis, distribution, responseTimes, correlationData, badCategories, badSellers, criticalReviews } = data;
  const COLORS = ['#eab308', '#f59e0b', '#f97316', '#ef4444', '#b91c1c']; 
  const RESP_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  const filteredReviews = criticalReviews?.filter((r: any) => 
    r.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.message.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div id="reviews-dashboard" className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="font-sans font-black text-xl text-slate-800 tracking-tight flex items-center gap-2">
            <Star className="w-5 h-5 text-indigo-600" />
            Bảng điều khiển Đánh Giá 
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Khám phá nguyên nhân cốt lõi đằng sau sự sụt giảm hài lòng và rà soát các nhà bán hàng vi phạm.
          </p>
        </div>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPIWidget id="kpi-avg-review" title="Điểm số đánh giá trung bình" value={`${kpis.avg_rating} / 5.0`} icon={Star} color="amber" />
        <KPIWidget id="kpi-total-reviews" title="Khảo sát nhận xét thu về" value={formatNumber(kpis.total_reviews)} icon={MessageSquare} color="blue" />
      </div>

      {/* DÒNG 1: Tương quan & Phân phối */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in">
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs xl:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-indigo-500" /> Tương quan: Thời gian giao hàng & Điểm đánh giá
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={correlationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="days" stroke="#94a3b8" fontSize={11} label={{ value: 'Ngày', position: 'insideBottomRight', offset: -5 }} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[1, 5]} />
                <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px' }} labelStyle={{ color: '#94a3b8', fontSize: '11px' }} itemStyle={{ color: '#fff', fontSize: '11px' }} formatter={(val: number) => [`${val} ★`, 'Mức độ hài lòng']} labelFormatter={(label) => `Giao trong: ${label} ngày`} />
                <Line type="monotone" name="Điểm trung bình" dataKey="rating" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-400 italic text-center">Biểu đồ chứng minh: Thời gian giao hàng càng kéo dài, sự hài lòng của khách hàng càng lao dốc.</p>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500 animate-pulse" /> Tỉ lệ phân phối Điểm
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} hide />
                <YAxis dataKey="rating" type="category" stroke="#94a3b8" fontSize={11} width={45} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px' }} itemStyle={{ color: '#fff', fontSize: '11px' }} formatter={(val: number) => [`${val}%`, 'Tỷ trọng']} />
                <Bar dataKey="percentage" radius={[0, 4, 4, 0]} barSize={24}>
                  {distribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* DÒNG 2: Tử huyệt (Bây giờ có Tabs) & Survey SLA */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in">
        
        {/* Bảng Xếp hạng rủi ro (CÓ TABS) */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs xl:col-span-2 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-sans font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1.5 px-2">
              Đối tượng có tỉ lệ bị chê (1-2 sao) cao nhất
            </h3>
            
            {/* Thanh chuyển đổi Tab */}
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
              <button 
                onClick={() => setBadTab('seller')} 
                className={`text-[11px] font-bold px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${badTab === 'seller' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500 hover:text-rose-600'}`}
              >
                <Store className="w-3 h-3" /> Theo Nhà Bán (Sellers)
              </button>
              <button 
                onClick={() => setBadTab('category')} 
                className={`text-[11px] font-bold px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${badTab === 'category' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500 hover:text-rose-600'}`}
              >
                <AlertTriangle className="w-3 h-3" /> Theo Ngành Hàng
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto p-2">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  <th className="py-3 px-4">{badTab === 'seller' ? 'Mã Đối Tác (Seller ID)' : 'Tên Ngành Hàng (Category)'}</th>
                  <th className="py-3 px-4 text-center">Tổng Đánh giá</th>
                  <th className="py-3 px-4 text-right">Tỉ lệ 1-2 Sao (Rủi ro)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-sans text-xs text-slate-600">
                {badTab === 'category' 
                  ? badCategories?.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-rose-50/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-700 capitalize">{item.category.replace(/_/g, ' ')}</td>
                        <td className="py-3 px-4 text-center font-mono">{formatNumber(item.total)}</td>
                        <td className="py-3 px-4 text-right font-mono font-black text-rose-600">{item.badRate}%</td>
                      </tr>
                    ))
                  : badSellers?.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-rose-50/30 transition-colors">
                        <td className="py-3 px-4 font-bold font-mono text-slate-700" title={item.fullId}>{item.id}</td>
                        <td className="py-3 px-4 text-center font-mono">{formatNumber(item.total)}</td>
                        <td className="py-3 px-4 text-right font-mono font-black text-rose-600">{item.badRate}%</td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Khảo sát Pie Chart */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-500" /> Tốc độ Khách gửi Đánh giá
            </h3>
          </div>
          <div className="h-40 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={responseTimes} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="percentage">
                  {responseTimes.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={RESP_COLORS[index % RESP_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px' }} itemStyle={{ color: '#fff', fontSize: '11px' }} formatter={(val: number) => [`${val}%`, 'Tỉ lệ khách hàng']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-xs border-t border-slate-100 pt-3">
            {responseTimes.map((r: any, idx: number) => (
              <div key={idx} className="flex items-center justify-start gap-1 p-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: RESP_COLORS[idx % RESP_COLORS.length] }}></span>
                <span className="text-[11px] font-semibold text-slate-600">{r.speed}:</span>
                <span className="text-[11px] font-mono font-bold text-slate-800">{r.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DÒNG 3: TRẠM XỬ LÝ KHỦNG HOẢNG TICKETING */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-rose-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-rose-100 bg-rose-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-sans font-bold text-sm text-rose-800 tracking-tight flex items-center gap-1.5">   
              Danh sách các Đơn hàng bị khách hàng chê trách (Dưới 3 sao kèm bình luận). Cần xử lý gấp!
            </h3>
          </div>
          
          <div className="flex items-center gap-2 max-w-sm w-full relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3" />
            <input 
              type="text" 
              placeholder="Tìm mã Đơn hàng, nội dung..."
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 text-xs rounded-xl outline-hidden focus:border-rose-400 focus:ring-1 focus:ring-rose-400 text-slate-700 font-semibold w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-white shadow-xs z-10">
              <tr className="bg-slate-50/90 backdrop-blur-md border-b border-slate-100 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                <th className="py-4 px-6">Ngày Đánh giá</th>
                <th className="py-4 px-6">Mã Đơn Hàng (Order ID)</th>
                <th className="py-4 px-6 text-center">Điểm</th>
                <th className="py-4 px-6 w-1/2">Nội dung khách hàng phàn nàn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans text-xs text-slate-600">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center font-mono text-slate-400">Tạm thời không có đánh giá xấu nào khớp với tìm kiếm.</td>
                </tr>
              ) : (
                filteredReviews.map((r: any, idx: number) => (
                  <tr key={idx} className="hover:bg-rose-50/40 transition-colors">
                    <td className="py-4 px-6 font-mono text-slate-500 whitespace-nowrap">{r.review_date}</td>
                    <td className="py-4 px-6 font-mono font-bold text-indigo-600">{r.order_id.substring(0, 16)}...</td>
                    <td className="py-4 px-6 text-center">
                      <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-md font-bold font-mono">
                        {r.review_score} ★
                      </span>
                    </td>
                    <td className="py-4 px-6 italic text-slate-700">"{r.message}"</td>
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