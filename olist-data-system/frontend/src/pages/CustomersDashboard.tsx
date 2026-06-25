import { useEffect, useState } from 'react';
import { 
  Users, UserPlus, UserCheck, Percent, Map, BarChart3, PieChartIcon 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { motion } from 'motion/react';

import KPIWidget from '../components/KPIWidget';
import ExportButtons from '../components/ExportButtons';
import { dashboardService } from '../services/api';
import { formatNumber, formatCurrency } from '../utils/format';

interface CustomersDashboardProps {
  filters: any;
  currency: 'BRL' | 'VND' | 'USD';
}

export default function CustomersDashboard({ filters, currency }: CustomersDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const result = await dashboardService.getCustomers(filters);
        setData(result);
      } catch (err) {
        console.error("Error loading customers metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [filters]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <span className="ml-3 text-slate-500 font-sans font-semibold text-sm">Đang tải phân tích khách hàng...</span>
      </div>
    );
  }

  const { kpis, stateDistribution, topCities, frequencyData } = data;
  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];

  return (
    <div id="customers-dashboard" className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="font-sans font-black text-xl text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Bảng điều khiển Khách Hàng 
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Phân tích tệp địa lý khách hàng, tần suất quay lại mua hàng, giá trị đơn hàng trung bình (AOV).
          </p>
        </div>

        <ExportButtons title="Quản lý khách hàng" data={data} />
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <KPIWidget
          id="kpi-total-cust"
          title="Tổng tệp khách hàng"
          value={formatNumber(kpis.total_customers)}
          icon={Users}
          color="emerald"
          subtext="Tính theo id định danh"
        />
        <KPIWidget
          id="kpi-new-cust"
          title="Khách hàng mới"
          value={formatNumber(kpis.new_customers)}
          icon={UserPlus}
          color="indigo"
          subtext="Chiếm % tệp kh đầu tiên"
        />
        <KPIWidget
          id="kpi-returning-cust"
          title="Khách hàng quay lại"
          value={formatNumber(kpis.returning_customers)}
          icon={UserCheck}
          color="amber"
          subtext="Tỉ lệ mua lại trung bình"
        />
        <KPIWidget
          id="kpi-aov-cust"
          title="Đơn giá trị trung bình (AOV)"
          value={kpis.avg_order_value ? kpis.avg_order_value.toFixed(2) : "0"}
          icon={Percent}
          color="blue"
          subtext="Mỗi giỏ hàng thanh toán"
        />
      </div>

      {/* Main Charts Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* State distribution bar chart */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs lg:col-span-2 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
              <Map className="w-4 h-4 text-emerald-500" />
              Mật độ phân chia khách hàng theo Bang (States Split)
            </h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-mono font-bold px-2 py-0.5 rounded-sm">
              Sắp xếp theo State
            </span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="state" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px' }}
                  formatter={(val: number) => [`${formatNumber(val)} cá nhân`, 'Mật độ']}
                />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={36}>
                  {stateDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Purchase frequency pie chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
              <PieChartIcon className="w-4 h-4 text-indigo-500" />
              Tần suất mua hàng (Frequency)
            </h3>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-mono font-bold px-2 py-0.5 rounded-sm">
              Đếm số hóa đơn
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={frequencyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="quantity"
                >
                  {frequencyData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px' }}
                  formatter={(val: number) => [`${formatNumber(val)} Thẻ`, 'Khách hàng']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs border-t border-slate-100 pt-4">
            {frequencyData.map((f: any, idx: number) => (
              <div key={idx} className="flex items-center justify-start gap-1 p-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="text-[11px] font-semibold text-slate-600">{f.name}: </span>
                <span className="text-[11px] font-mono font-bold text-slate-800">{formatNumber(f.quantity)}</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* Top customer cities list */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4"
      >
        <h3 className="font-sans font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-emerald-500" />
          Danh sách đô thị (Cities) có mật độ khách hàng lớn nhất
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {topCities.map((city: any, idx: number) => (
            <div key={idx} className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-center relative overflow-hidden">
              <span className="absolute top-1 left-2 font-mono text-slate-200 font-extrabold text-2xl">#{idx+1}</span>
              <p className="font-sans text-xs font-bold text-slate-700 capitalize tracking-tight relative z-10 truncate mt-2">{city.name}</p>
              <h4 className="font-mono text-base font-black text-slate-800 relative z-10 mt-1">{formatNumber(city.value)}</h4>
              <p className="text-[9px] text-slate-400 font-mono tracking-wider mt-1 relative z-10 uppercase">KHÁCH HÀNG</p>
            </div>
          ))}
        </div>
      </motion.div>

    </div>
  );
}
