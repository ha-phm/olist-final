import { useEffect, useState } from 'react';
import { 
  Package, Layers, ArrowUpRight, BarChart3, PieChartIcon 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell 
} from 'recharts';
import { motion } from 'motion/react';

import KPIWidget from '../components/KPIWidget';
import ExportButtons from '../components/ExportButtons';
import { dashboardService } from '../services/api';
import { formatNumber, formatCurrency } from '../utils/format';

interface ProductsDashboardProps {
  filters: any;
}

export default function ProductsDashboard({ filters}: ProductsDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const result = await dashboardService.getProducts(filters);
        setData(result);
      } catch (err) {
        console.error("Error loading products metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [filters]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-slate-500 font-sans font-semibold text-sm">Đang tải phân tích sản phẩm...</span>
      </div>
    );
  }

  const { kpis, categoryDistribution, topProducts } = data;
  const currency = 'VND';
  const COLORS = ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  return (
    <div id="products-dashboard" className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="font-sans font-black text-xl text-slate-800 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            Bảng điều khiển Sản Phẩm (Products Inventory Board)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi khối lượng sản phẩm, danh mục hàng hóa hàng đầu và đánh giá doanh thu sản phẩm tốt nhất.
          </p>
        </div>

        <ExportButtons title="Quản lý sản phẩm" data={data} />
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPIWidget
          id="kpi-total-prod"
          title="Tổng mã sản phẩm lưu kho"
          value={formatNumber(kpis.total_products)}
          icon={Package}
          color="indigo"
          subtext="Danh mục hàng đăng bán"
        />
        <KPIWidget
          id="kpi-total-categories"
          title="Tổng danh mục ngành hàng"
          value={formatNumber(kpis.total_categories)}
          icon={Layers}
          color="emerald"
          subtext="Đa dạng ngành hàng"
        />
      </div>

      {/* Chart Top categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs lg:col-span-2 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              Sản lượng bán theo Danh mục ngành hàng (Categories distribution)
            </h3>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-mono font-bold px-2 py-0.5 rounded-sm">
              Doanh số bán ra
            </span>
          </div>

          <div className="h-80 w-full font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryDistribution.slice(0, 10)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={110} fontSize={10} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px' }}
                  formatter={(val: number) => [`${formatNumber(val)} Đơn`, 'Sản lượng']}
                />
                <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={16}>
                  {categoryDistribution.slice(0, 10).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Revenue Contribution */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
              <PieChartIcon className="w-4 h-4 text-emerald-500" />
              Doanh thu Ước Tính tỷ lệ
            </h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-mono font-bold px-2 py-0.5 rounded-sm">
              Doanh thu
            </span>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[310px] pr-2">
            {categoryDistribution.slice(0, 6).map((c: any, index: number) => {
              const maxVal = categoryDistribution[0]?.revenue || 1;
              const percent = Math.round((c.revenue / maxVal) * 100);

              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span className="truncate max-w-40">{c.name}</span>
                    <span className="font-mono">{formatNumber(c.revenue)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${percent}%`, 
                        backgroundColor: COLORS[index % COLORS.length] 
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

      </div>

      {/* Top 5 Best Selling Products List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-sans font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-indigo-500" />
            Top 5 sản phẩm bán chạy nhất hệ thống (Best Selling Items)
          </h3>
          <span className="text-xs text-slate-400 font-medium">Lượng hóa đơn & doanh số</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                <th className="py-4 px-6">Xếp hạng</th>
                <th className="py-4 px-6">Tên/Mã sản phẩm</th>
                <th className="py-4 px-6">Ngành hàng (Category)</th>
                <th className="py-4 px-6 text-right">Lượng đơn đặt hàng</th>
                <th className="py-4 px-6 text-right">Giá trị Doanh số</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans text-xs text-slate-600">
              {topProducts.map((p: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                  <td className="py-4 px-6">
                    <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] font-extrabold ${
                      idx === 0 ? 'bg-indigo-100 text-indigo-700' : 
                      idx === 1 ? 'bg-emerald-100 text-emerald-700' :
                      idx === 2 ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-mono font-bold text-slate-800">{p.name}</td>
                  <td className="py-4 px-6">
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[10px] font-extrabold capitalize tracking-wide">
                      {p.category.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-mono font-bold text-slate-800">{formatNumber(p.orders)}</td>
                  <td className="py-4 px-6 text-right font-mono font-bold text-indigo-600">{formatCurrency(p.revenue, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

    </div>
  );
}
