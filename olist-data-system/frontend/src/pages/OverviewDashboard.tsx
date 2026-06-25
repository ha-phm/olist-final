import { useEffect, useState } from 'react';
import { 
  DollarSign, ShoppingCart, Users, Package, Store, 
  ArrowUpRight, BarChart3, Presentation, Compass, Flame 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar} from 'recharts';
import { motion } from 'motion/react';

import KPIWidget from '../components/KPIWidget';
import ExportButtons from '../components/ExportButtons';
import { dashboardService } from '../services/api';
import { formatCurrency, formatNumber } from '../utils/format';

interface OverviewDashboardProps {
  filters: any;
  currency: 'BRL' | 'VND' | 'USD';
}

export default function OverviewDashboard({ filters, currency }: OverviewDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);
      try {
        const result = await dashboardService.getOverview(filters);
        setData(result);
      } catch (err) {
        console.error("Error loading overview metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [filters]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-slate-500 font-sans font-semibold text-sm">Đang tải phân tích tổng quan...</span>
      </div>
    );
  }

  const { kpis, monthlyData, growthRate } = data;

  return (
    <div id="overview-dashboard" className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="font-sans font-black text-xl text-slate-800 tracking-tight flex items-center gap-2">
            <Presentation className="w-5 h-5 text-indigo-600" />
            Bảng điều khiển Tổng Quan 
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tổng hợp dữ liệu e-commerce Olist, phân tích xu hướng tăng trưởng doanh thu tháng/năm.
          </p>
        </div>

        {/* Export buttons */}
        <ExportButtons title="Tổng quan doanh thu" data={data} />
      </div>

      {/* KPI Display widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <KPIWidget
          id="kpi-revenue"
          title="Tổng doanh thu"
          value={formatCurrency(kpis.total_revenue)}
          icon={DollarSign}
          color="indigo"
          trend={growthRate}
          subtext="Tháng này so với trước"
        />
        <KPIWidget
          id="kpi-orders"
          title="Tổng đơn hàng"
          value={formatNumber(kpis.total_orders)}
          icon={ShoppingCart}
          color="emerald"
          subtext="Đơn hàng được ghi nhận"
        />
        <KPIWidget
          id="kpi-customers"
          title="Tổng khách hàng"
          value={formatNumber(kpis.total_customers)}
          icon={Users}
          color="amber"
          subtext="Khách hàng duy nhất"
        />
        <KPIWidget
          id="kpi-products"
          title="Tổng sản phẩm"
          value={formatNumber(kpis.total_products)}
          icon={Package}
          color="blue"
          subtext="Sản phẩm hoạt động"
        />
        <KPIWidget
          id="kpi-sellers"
          title="Tổng người bán"
          value={formatNumber(kpis.total_sellers)}
          icon={Store}
          color="rose"
          subtext="Đối tác nhà bán Olist"
        />
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Revenue Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs lg:col-span-2 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              Biểu đồ doanh thu theo thời gian
            </h3>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-mono font-bold px-2 py-0.5 rounded-sm">
              Doanh thu hàng tháng
            </span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} fontStyle="italic" />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickFormatter={(val) => `${formatNumber(val/1000)}k`}
                />
                <Tooltip 
                  contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontStyle: 'italic', fontFamily: 'Inter', fontSize: '12px' }}
                  itemStyle={{ color: '#fff', fontFamily: 'Inter', fontSize: '12px' }}
                  formatter={(val: number) => [formatNumber(val), 'Doanh thu']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Order growth bar chart */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-500" />
              Sản lượng đơn hàng
            </h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-mono font-bold px-2 py-0.5 rounded-sm">
              Số lượng Đơn
            </span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px' }}
                  formatter={(val: number) => [`${formatNumber(val)} đơn`, 'Sản lượng']}
                />
                <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
