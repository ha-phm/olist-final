import { useEffect, useState } from 'react';
import { 
  Star, MessageSquare, ShieldCheck, HeartCode, Clock, Percent, Smile 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { motion } from 'motion/react';

import KPIWidget from '../components/KPIWidget';
import ExportButtons from '../components/ExportButtons';
import { dashboardService } from '../services/api';
import { formatNumber } from '../utils/format';

interface ReviewsDashboardProps {
  filters: any;
}

export default function ReviewsDashboard({ filters }: ReviewsDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const { kpis, distribution, responseTimes } = data;
  const COLORS = ['#eab308', '#f59e0b', '#f97316', '#ef4444', '#b91c1c']; // Golden rating scale
  const RESP_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']; // Golden rating scale

  return (
    <div id="reviews-dashboard" className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="font-sans font-black text-xl text-slate-800 tracking-tight flex items-center gap-2">
            <Star className="w-5 h-5 text-indigo-600" />
            Bảng điều khiển Đánh Giá (Reviews & Ratings Board)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi mức độ hài lòng khách hàng, khảo sát phân phối mức điểm và kiểm tra tốc độ phản hồi nhận xét (SLA).
          </p>
        </div>

        <ExportButtons title="Quản lý đánh giá khách hàng" data={data} />
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPIWidget
          id="kpi-avg-review"
          title="Điểm số đánh giá trung bình"
          value={`${kpis.avg_rating} / 5.0`}
          icon={Star}
          color="amber"
          subtext="Vùng chỉ số hài lòng mức Cao"
        />
        <KPIWidget
          id="kpi-total-reviews"
          title="Khảo sát nhận xét thu về"
          value={formatNumber(kpis.total_reviews)}
          icon={MessageSquare}
          color="blue"
          subtext="Số phản hồi đánh giá hợp lệ"
        />
      </div>

      {/* Charts split representing scores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Rating distribution bar chart */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500 animate-pulse" />
              Tỉ lệ phân phối điểm đánh giá (Rating Assessment Share)
            </h3>
            <span className="text-[10px] bg-amber-50 text-amber-700 font-mono font-bold px-2 py-0.5 rounded-sm">
              Định mức 1-5 Sao
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="rating" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px' }}
                  formatter={(val: number) => [`${val}%`, 'Tỷ trọng']}
                />
                <Bar dataKey="percentage" fill="#eab308" radius={[4, 4, 0, 0]} barSize={40}>
                  {distribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* SLA response speeds */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-500" />
              Thời gian Olist đáp ứng phản hồi đánh giá (SLA Feedbacks)
            </h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-mono font-bold px-2 py-0.5 rounded-sm">
              Tốc độ giải quyết
            </span>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={responseTimes}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="percentage"
                >
                  {responseTimes.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={RESP_COLORS[index % RESP_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px' }}
                  formatter={(val: number) => [`${val}%`, 'Phần trăm phản hồi']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs border-t border-slate-100 pt-3">
            {responseTimes.map((r: any, idx: number) => (
              <div key={idx} className="flex items-center justify-start gap-1 p-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: RESP_COLORS[idx % RESP_COLORS.length] }}></span>
                <span className="text-[11px] font-semibold text-slate-600">{r.speed}:</span>
                <span className="text-[11px] font-mono font-bold text-slate-850">{r.percentage}%</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* Review list representations cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4"
      >
        <h3 className="font-sans font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
          <Smile className="w-4 h-4 text-indigo-500" />
          Một số phản hồi khách hàng tiêu biểu (Typical Customer Feedbacks)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { score: 5, msg: "Sản phẩm giao nhanh vượt cả mong đợi. Đóng gói chắc chắn, hoàn toàn 10 điểm!", code: "Order #8a9fc..." },
            { score: 5, msg: "Nhân viên hỗ trợ tư vấn nhiệt tình, sản phẩm làm từ chất liệu cao cấp đúng mô tả.", code: "Order #b18dc..." },
            { score: 1, msg: "Sản phẩm giao bị vỡ do khâu vận chuyển, cần tăng cường đệm bọt xốp đóng gói.", code: "Order #1f784..." }
          ].map((r, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="text-amber-500 text-xs font-bold font-mono tracking-wider mb-2">
                  {'★'.repeat(r.score)}{'☆'.repeat(5-r.score)}
                </div>
                <p className="text-slate-600 text-xs italic font-medium leading-relaxed">"{r.msg}"</p>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-4 flex items-center justify-between">
                <span>{r.code}</span>
                <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-sm border border-indigo-100 font-bold uppercase tracking-wider text-[8px]">Đã phản hồi</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

    </div>
  );
}
