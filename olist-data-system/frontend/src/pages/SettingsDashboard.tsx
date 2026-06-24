import { useState } from 'react';
import { 
  Shield, UserPlus, Trash, Edit, RefreshCw, Play, 
  CheckCircle, Database, FileText, ClipboardList 
} from 'lucide-react';
import { motion } from 'motion/react';

export default function SettingsDashboard() {
  const [users, setUsers] = useState([
    { id: "1", username: "admin", role: "Admin", label: "Quản trị hệ thống" },
    { id: "2", username: "analyst", role: "Business Analyst", label: "Nhà phân tích kinh doanh" },
    { id: "3", username: "seller", role: "Seller Manager", label: "Trình quản lý người bán" },
    { id: "4", username: "viewer", role: "Viewer", label: "Trình xem cơ bản" }
  ]);

  const [logs, setLogs] = useState([
    { id: 1, user: "admin", action: "Đăng nhập hệ thống", ip: "192.168.1.10", time: "2026-06-22 07:11:02" },
    { id: 2, user: "admin", action: "Dọn dẹp và nạp raw_data/olist_orders_dataset.csv", ip: "192.168.1.10", time: "2026-06-22 07:12:35" },
    { id: 3, user: "analyst", action: "Xuất báo cáo doanh thu PDF", ip: "192.168.1.15", time: "2026-06-22 07:14:10" },
    { id: 4, user: "admin", action: "Cấp quyền cho người dùng 'seller'", ip: "192.168.1.10", time: "2026-06-22 07:15:19" }
  ]);

  const [newUser, setNewUser] = useState('');
  const [newRole, setNewRole] = useState<'Admin' | 'Business Analyst' | 'Seller Manager' | 'Viewer'>('Viewer');
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);

  const handleAddUser = () => {
    if (!newUser) return;
    const labelMap = {
      'Admin': "Quản trị hệ thống",
      'Business Analyst': "Nhà phân tích kinh doanh",
      'Seller Manager': "Trình quản lý người bán",
      'Viewer': "Trình xem cơ bản"
    };

    const added = {
      id: String(users.length + 1),
      username: newUser.toLowerCase(),
      role: newRole,
      label: labelMap[newRole]
    };
    setUsers([...users, added]);
    
    // Add audit log
    const log = {
      id: logs.length + 1,
      user: "admin",
      action: `Tạo tài khoản và phân quyền cho '${added.username}' là '${added.role}'`,
      ip: "127.0.0.1",
      time: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setLogs([log, ...logs]);
    setNewUser('');
  };

  const handleDeleteUser = (id: string, username: string) => {
    setUsers(users.filter(u => u.id !== id));
    // Add log
    const log = {
      id: logs.length + 1,
      user: "admin",
      action: `Xóa tài khoản người dùng '${username}'`,
      ip: "127.0.0.1",
      time: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setLogs([log, ...logs]);
  };

  const runPipeline = () => {
    setPipelineRunning(true);
    setPipelineLogs([]);
    const messages = [
      ">> Khởi động Pipeline Python Pandas dọn dẹp dữ liệu raw...",
      ">> Đọc olist_customers_dataset.csv (9 dòng thành công).",
      ">> Nhập product_category_name_translation.csv thành công.",
      ">> Chuẩn hóa ngày tháng của orders_dataset bằng pd.to_datetime().",
      ">> Loại bỏ trùng lặp tọa độ địa lý olist_geolocation_dataset.csv.",
      ">> Thiếp lập cấu hình truy vấn và mở kết nối tới PostgreSQL Pool...",
      ">> Tạo và ánh xạ khóa ngoại: Khách hàng -> Đơn hàng -> Sản phẩm.",
      ">> Đẩy thành công dữ liệu dọn sạch (cleaned_data) lên PostgreSQL!",
      "SUCCESS: Đồng bộ hệ thống dọn dẹp kết thúc tốt đẹp."
    ];

    messages.forEach((msg, idx) => {
      setTimeout(() => {
        setPipelineLogs(prev => [...prev, msg]);
        if (idx === messages.length - 1) {
          setPipelineRunning(false);
          // Add pipeline log
          setLogs(prev => [
            {
              id: prev.length + 1,
              user: "admin",
              action: "Trực tiếp kích hoạt Pipeline Python và đồng bộ CSDL PostgreSQL",
              ip: "127.0.0.1",
              time: new Date().toISOString().replace('T', ' ').substring(0, 19)
            },
            ...prev
          ]);
        }
      }, (idx + 1) * 350);
    });
  };

  return (
    <div id="settings-dashboard" className="space-y-6 font-sans text-xs">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="font-sans font-black text-xl text-slate-800 tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            Nhật Ký Hệ thống & Quản lý Phân Quyền (RBAC & Portal Settings)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Chức năng Độc quyền cho Quản trị viên (Admin) để kiến tạo dữ liệu và quản lý tài khoản người dùng hệ thống.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* User security management */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-sans font-bold text-sm text-slate-800 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-indigo-500" />
            Quản trị viên Quản lý người dùng và Phân quyền
          </h3>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
            <input 
              type="text" 
              placeholder="Tên tài khoản mới..."
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 text-slate-700 outline-hidden flex-1 font-semibold"
              value={newUser}
              onChange={(e) => setNewUser(e.target.value)}
            />
            <select
              aria-label="New User Role"
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium cursor-pointer focus:border-indigo-500 outline-hidden"
              value={newRole}
              onChange={(e: any) => setNewRole(e.target.value)}
            >
              <option value="Admin">Admin</option>
              <option value="Business Analyst">Analyst</option>
              <option value="Seller Manager">Seller</option>
              <option value="Viewer">Viewer</option>
            </select>
            <button
              onClick={handleAddUser}
              className="bg-slate-800 hover:bg-slate-900 text-white font-sans text-xs px-4 py-2.5 rounded-xl font-bold cursor-pointer transition-all"
            >
              Thêm mới
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  <th className="py-2.5">User</th>
                  <th className="py-2.5">Role</th>
                  <th className="py-2.5">Mô tả quyền hạn</th>
                  <th className="py-2.5 text-center">Xóa bỏ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans text-xs text-slate-600">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-bold text-slate-800">{u.username}</td>
                    <td className="py-2.5">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-[9px] font-extrabold">{u.role}</span>
                    </td>
                    <td className="py-2.5 text-slate-400">{u.label}</td>
                    <td className="py-2.5 text-center">
                      {u.username !== 'admin' ? (
                        <button 
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="p-1 text-slate-300 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash className="w-4 h-4 inline" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-300 italic">Mặc định</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Python script and postgres synchronizer */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-sans font-bold text-sm text-slate-800 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-500" />
            Kiểm thử Pipeline & Nạp dữ liệu PostgreSQL (CSV to DB Pipeline)
          </h3>
          
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Hệ thống dọn dẹp và dán dán dữ liệu. Admin có thể trực tiếp kéo kích hoạt dọn rác bằng Python Pandas dọn và dán dữ liệu thô vào các bảng PostgreSQL và ánh xạ quan hệ.
          </p>

          <div className="flex items-center justify-between border border-slate-100 p-4 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-slate-500">CSDL PostgreSQL: CONNECTED</span>
            </div>
            
            <button
              onClick={runPipeline}
              disabled={pipelineRunning}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{pipelineRunning ? 'Đang chạy...' : 'Run Pipeline'}</span>
            </button>
          </div>

          <div className="bg-slate-900 text-slate-300 p-4 rounded-xl h-40 overflow-y-auto font-mono text-[10px] space-y-1.5 border border-slate-800">
            {pipelineLogs.length === 0 ? (
              <p className="text-slate-500 italic">// Bấm 'Run Pipeline' để bắt đầu kích hoạt script Python dọn dẹp dữ liệu và nạp CSDL...</p>
            ) : (
              pipelineLogs.map((log, idx) => (
                <p key={idx} className={log.startsWith('SUCCESS') ? 'text-emerald-400 font-bold' : log.startsWith('>>') ? 'text-slate-400' : 'text-slate-200'}>
                  {log}
                </p>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Audit Log (Nhật ký kiểm tra) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4"
      >
        <h3 className="font-sans font-bold text-sm text-slate-800 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-indigo-500" />
          Nhật ký hoạt động hệ thống toàn diện (Audit Log Security Audit)
        </h3>
        
        <div className="overflow-x-auto text-[11px]">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono bg-slate-50 p-2">
                <th className="py-2.5 px-4">Audit ID</th>
                <th className="py-2.5 px-4 font-mono">Tài khoản thao tác</th>
                <th className="py-2.5 px-4">Hành động ghi nhận</th>
                <th className="py-2.5 px-4">IP Địa chỉ</th>
                <th className="py-2.5 px-4">Thời gian</th>
                <th className="py-2.5 px-4">Trình trạng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">#{log.id}</td>
                  <td className="py-3 px-4 font-mono font-black">{log.user}</td>
                  <td className="py-3 px-4 font-medium">{log.action}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{log.ip}</td>
                  <td className="py-3 px-4 font-mono">{log.time}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md font-mono font-bold flex items-center gap-1 w-max">
                      <CheckCircle className="w-3 h-3" />
                      SECURE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

    </div>
  );
}
