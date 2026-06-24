import { FileDown, FileSpreadsheet, Image } from 'lucide-react';
import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

interface ExportButtonsProps {
  title: string;
  data: any;
}

export default function ExportButtons({ title, data }: ExportButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  // 1. Hàm Xuất Excel
  const exportToExcel = () => {
    setLoading('EXCEL');
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: KPIs
      if (data?.kpis) {
        const kpiData = Object.entries(data.kpis).map(([key, value]) => ({
          Metric: key.replace(/_/g, ' ').toUpperCase(),
          Value: value
        }));
        const wsKpis = XLSX.utils.json_to_sheet(kpiData);
        XLSX.utils.book_append_sheet(wb, wsKpis, "KPIs");
      }

      // Sheet 2: Data Tables (Dựa vào dữ liệu trang hiện tại)
      if (data?.monthlyData) {
        const wsMonthly = XLSX.utils.json_to_sheet(data.monthlyData);
        XLSX.utils.book_append_sheet(wb, wsMonthly, "Monthly Trends");
      } else if (data?.stateDistribution) {
        const wsStates = XLSX.utils.json_to_sheet(data.stateDistribution);
        XLSX.utils.book_append_sheet(wb, wsStates, "State Distribution");
      } else if (data?.categoryDistribution) {
        const wsCategories = XLSX.utils.json_to_sheet(data.categoryDistribution);
        XLSX.utils.book_append_sheet(wb, wsCategories, "Categories");
      }

      XLSX.writeFile(wb, `Olist_Report_${title.replace(/\s+/g, '_')}.xlsx`);
    } catch (err) {
      console.error("Lỗi xuất Excel:", err);
      alert("Có lỗi xảy ra khi xuất Excel.");
    } finally {
      setLoading(null);
    }
  };

  // 2. Hàm Xuất PDF
  const exportToPDF = () => {
    setLoading('PDF');
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`OLIST SYSTEM REPORT: ${title}`, 14, 20);
      doc.setFontSize(10);
      doc.text(`Export Date: ${new Date().toLocaleDateString('vi-VN')}`, 14, 28);

      let startY = 35;

      // Vẽ bảng KPIs
      if (data?.kpis) {
        const kpiRows = Object.entries(data.kpis).map(([key, value]) => [
          key.replace(/_/g, ' ').toUpperCase(),
          value?.toString() || '0'
        ]);
        autoTable(doc, {
          startY: startY,
          head: [['Metric', 'Value']],
          body: kpiRows,
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229] } // Màu Indigo-600
        });
        startY = (doc as any).lastAutoTable.finalY + 10;
      }

      // Vẽ bảng Dữ liệu chi tiết
      if (data?.monthlyData) {
        const monthlyRows = data.monthlyData.map((row: any) => [row.month, row.revenue, row.orders]);
        autoTable(doc, {
          startY: startY,
          head: [['Month', 'Revenue', 'Orders']],
          body: monthlyRows,
          theme: 'striped',
        });
      }

      doc.save(`Olist_Report_${title.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("Lỗi xuất PDF:", err);
      alert("Có lỗi xảy ra khi xuất PDF.");
    } finally {
      setLoading(null);
    }
  };

  // 3. Hàm Xuất ảnh PNG Biểu đồ
  const exportToPNG = async () => {
    setLoading('PNG');
    try {
      // Tìm thẻ div chứa các biểu đồ (giả sử bạn bọc chúng trong một class hoặc ID cụ thể)
      // Ở đây lấy đại diện phần body hoặc phần tử chính, bạn có thể truyền ID chính xác hơn vào
      const chartElement = document.getElementById('overview-dashboard'); 
      if (!chartElement) {
        alert("Không tìm thấy khu vực biểu đồ để chụp ảnh.");
        setLoading(null);
        return;
      }

      const canvas = await html2canvas(chartElement, {
        scale: 2, // Tăng độ nét
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Olist_Dashboard_${title.replace(/\s+/g, '_')}.png`;
      link.href = imgData;
      link.click();
    } catch (err) {
      console.error("Lỗi tải ảnh PNG:", err);
      alert("Có lỗi xảy ra khi tải ảnh.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div id="export-controls" className="flex flex-wrap items-center gap-2">
      <button
        disabled={loading !== null}
        onClick={exportToPDF}
        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-sans text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition-all font-semibold shadow-xs disabled:opacity-50"
      >
        <FileDown className="w-3.5 h-3.5" />
        <span>{loading === 'PDF' ? 'Đang xuất...' : 'Xuất PDF'}</span>
      </button>

      <button
        disabled={loading !== null}
        onClick={exportToExcel}
        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs px-3 py-1.5 rounded-lg border border-emerald-500 transition-all font-semibold shadow-xs disabled:opacity-50"
      >
        <FileSpreadsheet className="w-3.5 h-3.5" />
        <span>{loading === 'EXCEL' ? 'Đang xuất...' : 'Xuất Excel'}</span>
      </button>

      <button
        disabled={loading !== null}
        onClick={exportToPNG}
        className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-sans text-xs px-3 py-1.5 rounded-lg border border-indigo-100 transition-all font-semibold shadow-xs disabled:opacity-50"
      >
        <Image className="w-3.5 h-3.5" />
        <span>{loading === 'PNG' ? 'Đang tải...' : 'Tải biểu đồ PNG'}</span>
      </button>
    </div>
  );
}