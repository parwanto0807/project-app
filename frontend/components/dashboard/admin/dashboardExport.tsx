// components/DashboardExport.tsx
'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Define proper types for our data
interface SalesOrder {
  id: string;
  name: string;
  target: string;
  content: string;
}

interface StatusItem {
  id: string;
  status: string;
  value: string;
}

interface ExportFormat {
  id: string;
  name: string;
  icon: string;
}

interface ReportType {
  id: string;
  name: string;
}

// Define a generic type for exportable data
type ExportData = SalesOrder[] | StatusItem[];

const DashboardExport = () => {
  const [exporting, setExporting] = useState(false);
  const [selectedReport, setSelectedReport] = useState('sales');
  const [selectedFormat, setSelectedFormat] = useState('excel');

  // Sample data
  const salesOrders: SalesOrder[] = [
    {
      id: '001/07/01-5-00/02(2015)',
      name: 'SD',
      target: '09 Apr 2025',
      content: 'PT, Bank Buyer Indonesia (Premier), Tbe'
    },
    {
      id: '001/07/01-5-00/02(2015)',
      name: 'SD',
      target: '09 Apr 2025',
      content: 'PT, Bank Buyer Indonesia (Premier), Tbe'
    },
    {
      id: '001/07/01-5-00/02(2015)',
      name: 'SD',
      target: '09 Apr 2025',
      content: 'PT, Bank Buyer Indonesia (Premier), Tbe'
    }
  ];

  const statusItems: StatusItem[] = [
    { id: 'No 100/2025', status: 'B (SMT)', value: '—' },
    { id: 'No 100/2025', status: 'B (SMT)', value: '—' },
    { id: 'No 100/2025', status: 'B (SMT)', value: '—' }
  ];

  const reportTypes: ReportType[] = [
    { id: 'sales', name: 'Laporan Order Penjualan' },
    { id: 'status', name: 'Laporan Status Order' },
    { id: 'performance', name: 'Laporan Performa Sales' },
    { id: 'notes', name: 'Laporan Catatan Penjualan' },
    { id: 'pending', name: 'Laporan Pending Orders' },
    { id: 'connection', name: 'Laporan Koneksi AP' },
    { id: 'quick', name: 'Laporan Quick Order' },
    { id: 'channel', name: 'Laporan Sales per Channel' },
    { id: 'upcoming', name: 'Laporan Rencana Order Mendatang' },
    { id: 'history', name: 'Laporan Historis Status Stores' }
  ];

  const exportFormats: ExportFormat[] = [
    { id: 'excel', name: 'Excel', icon: '📊' },
    { id: 'pdf', name: 'PDF', icon: '📄' },
    { id: 'csv', name: 'CSV', icon: '📝' }
  ];

  // Function to export data to Excel
  const exportToExcel = (data: ExportData, fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  // Function to export data to PDF
  const exportToPDF = (data: ExportData, headers: string[], fileName: string) => {
    const doc = new jsPDF();
    doc.text(`${fileName}`, 14, 15);
    
    // Convert data to format suitable for autoTable
    const body = data.map(item => Object.values(item));
    
    autoTable(doc, {
      head: [headers],
      body: body,
      startY: 20,
    });
    doc.save(`${fileName}.pdf`);
  };

  // Function to export data to CSV
  const exportToCSV = (data: ExportData, fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.csv`;
    link.click();
  };

  // Handle export based on selected format and report type
  const handleExport = () => {
    setExporting(true);
    
    let data: ExportData = [];
    let headers: string[] = [];
    let fileName = '';

    switch (selectedReport) {
      case 'sales':
        data = salesOrders;
        headers = ['ID', 'Name', 'Target', 'Content'];
        fileName = 'Sales_Order_Report';
        break;
      case 'status':
        data = statusItems;
        headers = ['ID', 'Status', 'Value'];
        fileName = 'Order_Status_Report';
        break;
      // Add cases for other report types
      default:
        data = salesOrders;
        headers = ['ID', 'Name', 'Target', 'Content'];
        fileName = 'Report';
    }

    setTimeout(() => {
      try {
        if (selectedFormat === 'excel') {
          exportToExcel(data, fileName);
        } else if (selectedFormat === 'pdf') {
          exportToPDF(data, headers, fileName);
        } else if (selectedFormat === 'csv') {
          exportToCSV(data, fileName);
        }
      } catch (error) {
        console.error('Export error:', error);
      } finally {
        setExporting(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg shadow-md mb-6">
          <h1 className="text-2xl font-bold">Dashboard Sales Admin</h1>
          <p className="opacity-90">Singapore performs pregiants size address tedios</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Messages */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-3">Task Messages</h2>
              <div className="flex items-center text-sm text-gray-600">
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">1.10.pumpgrade on tutorials</span>
                <span className="ml-3">Last clock: 0</span>
              </div>
            </div>

            {/* Data Order Feature */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-3">Data Order Feature</h2>
              <p className="text-sm text-red-500 mb-3">3 sales order indicate zero chanel</p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name: SD</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Target:</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Content:</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salesOrders.map((order, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-700">{order.id}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{order.target}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{order.content}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Status */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-3">Total Status</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="bg-white divide-y divide-gray-200">
                    {statusItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-700">{item.id}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{item.status}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{item.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Export Sidebar */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-6 text-center text-blue-700">Ekspor Laporan</h2>
            
            {/* Report Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Jenis Laporan</label>
              <select 
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                {reportTypes.map((report) => (
                  <option key={report.id} value={report.id}>{report.name}</option>
                ))}
              </select>
            </div>
            
            {/* Format Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Format</label>
              <div className="grid grid-cols-3 gap-2">
                {exportFormats.map((format) => (
                  <div
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id)}
                    className={`p-3 border rounded-md text-center cursor-pointer transition-colors ${
                      selectedFormat === format.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-2xl">{format.icon}</div>
                    <div className="text-sm mt-1">{format.name}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={exporting}
              className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors ${
                exporting
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {exporting ? (
                <span>Mengekspor...</span>
              ) : (
                <span>Ekspor Laporan</span>
              )}
            </button>
            
            {/* Help Text */}
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-700 mb-2">Petunjuk Ekspor:</h3>
              <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                <li>Pilih jenis laporan yang ingin diekspor</li>
                <li>Pilih format file yang diinginkan</li>
                <li>Klik tombol &quot;Ekspor Laporan&quot;</li>
                <li>File akan otomatis terunduh</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardExport;