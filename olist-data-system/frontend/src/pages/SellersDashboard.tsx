import { useEffect, useState } from 'react';
import { 
  Store, Star, Award, TrendingUp, AlertTriangle, Trophy, Percent 
} from 'lucide-react';
import { motion } from 'motion/react';

import KPIWidget from '../components/KPIWidget';
import ExportButtons from '../components/ExportButtons';
import { dashboardService } from '../services/api';
import { formatNumber, formatCurrency } from '../utils/format';

interface SellersDashboardProps {
  filters: any;
  currency: 'BRL' | 'VND' | 'USD';
}

export default function SellersDashboard({ filters, currency }: SellersDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const { kpis, sellers } = data;

  return (
    <div id="sellers-dashboard" className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="font-sans font-black text-xl text-slate-800 tracking-tight flex items-center gap-2">
            <Store className="w-5 h-5 text-indigo-600" />
            Bảng điều khiển Người Bán (Sellers Performance Board)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Đánh giá hiệu suất bán hàng của đối tác, thống kê doanh nghiệp và so sánh tỉ lệ giao hàng thành công.
          </p>
        </div>

        <ExportButtons title="Báo cáo người bán" data={data} />
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPIWidget
          id="kpi-sellers-active"
          title="Tổng nhà bán hàng cộng tác"
          value={formatNumber(kpis.total_sellers)}
          icon={Store}
          color="indigo"
          subtext="Số lượng doanh nghiệp hoạt động"
        />
        <KPIWidget
          id="kpi-sellers-rating"
          title="Điểm tích hợp trung bình"
          value={`${kpis.avg_seller_rating} / 5.0`}
          icon={Star}
          color="amber"
          subtext="Tính trên mọi đánh giá của khách"
        />
      </div>

      {/* Sellers comparison lists */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-sans font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            Xếp hạng đối tác cung cấp dịch vụ tốt nhất (Star Sellers Ranking)
          </h3>
          <span className="text-xs text-slate-400 font-medium font-mono">Top sellers</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                <th className="py-4 px-6">Top</th>
                <th className="py-4 px-6">ID đối tác (Seller ID)</th>
                <th className="py-4 px-6">Khu vực đô thị (City / State)</th>
                <th className="py-4 px-6 text-right">Giá trị doanh thu lũy kế</th>
                <th className="py-4 px-6 text-right">Điểm hài lòng</th>
                <th className="py-4 px-6 text-right">Tỉ lệ giao đúng hạn</th>
                <th className="py-4 px-6 text-center">Tình trạng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans text-xs text-slate-600">
              {sellers.map((s: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                  <td className="py-4 px-6">
                    <span className={`w-5 h-5 rounded-md inline-flex items-center justify-center text-[10px] font-extrabold ${
                      idx === 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      idx === 1 ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                      'bg-slate-50 text-slate-400'
                    }`}>
                      #{idx + 1}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-mono font-bold text-slate-800" title={s.fullId}>{s.id}</td>
                  <td className="py-4 px-6 capitalize">{s.city} ({s.state})</td>
                  <td className="py-4 px-6 text-right font-mono font-bold text-indigo-600">{formatCurrency(s.revenue, currency)}</td>
                  <td className="py-4 px-6 text-right font-mono font-bold text-slate-800">
                    <span className="text-amber-500 mr-1">★</span>
                    {s.rating.toFixed(2)}
                  </td>
                  <td className="py-4 px-6 text-right font-mono font-bold text-emerald-600">{s.deliverySuccessRate.toFixed(1)}%</td>
                  <td className="py-4 px-6 text-center">
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Operational guidelines and risk management alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl flex items-start gap-4">
          <div className="bg-indigo-100 text-indigo-700 p-3 rounded-xl shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-sans font-bold text-sm text-slate-800 tracking-tight">Quy chuẩn Nhà bán Olist (SLA Rules)</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Các nhà bán hàng tham gia vào hệ thống phân phối Olist bắt buộc phải cam kết tỉ lệ giao hàng đúng hẹn trên 95% và phản hồi đánh giá khách hàng dưới 2 ngày để duy trì trạng thái hoạt động tốt.
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex items-start gap-4">
          <div className="bg-amber-100 text-amber-700 p-3 rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <h4 className="font-sans font-bold text-sm text-amber-900 tracking-tight">Kiểm soát hoạt động bất thường</h4>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              Phát hiện đối tác có tỉ lệ đánh giá dưới 3.5 sao hoặc tỉ lệ huỷ đơn trên 4% sẽ bị hệ thống tạm khóa hoặc giới hạn hiển thị danh mục sản phẩm tự động thông qua Express cron filters.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
