// components/ExportButton.tsx
'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';

const ExportButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2 text-xs md:text-sm bg-white hover:bg-gray-50 transition-colors"
      >
        <Download className="h-4 w-4" />
        Export Laporan
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={closeModal}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Export Laporan Dashboard
                      </h3>
                      <button
                        onClick={closeModal}
                        type="button"
                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-2 max-h-[70vh] overflow-y-auto">
                      {/* Konten DashboardExport akan ditempatkan di sini */}
                      <div className="min-h-screen bg-gray-50 p-6">
                        <div className="max-w-6xl mx-auto">
                          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg shadow-md mb-6">
                            <h1 className="text-2xl font-bold">Dashboard Sales Admin</h1>
                            <p className="opacity-90">Singapore performs pregiants size address tedios</p>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                              <div className="bg-white p-4 rounded-lg shadow">
                                <h2 className="text-lg font-semibold mb-3">Task Messages</h2>
                                <div className="flex items-center text-sm text-gray-600">
                                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">1.10.pumpgrade on tutorials</span>
                                  <span className="ml-3">Last clock: 0</span>
                                </div>
                              </div>

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
                                      <tr>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-700">001/07/01-5-00/02(2015)</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">09 Apr 2025</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">PT, Bank Buyer Indonesia (Premier), Tbe</td>
                                      </tr>
                                      <tr>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-700">001/07/01-5-00/02(2015)</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">09 Apr 2025</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">PT, Bank Buyer Indonesia (Premier), Tbe</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow">
                              <h2 className="text-xl font-bold mb-6 text-center text-blue-700">Ekspor Laporan</h2>
                              
                              <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Jenis Laporan</label>
                                <select className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                                  <option value="sales">Laporan Order Penjualan</option>
                                  <option value="status">Laporan Status Order</option>
                                  <option value="performance">Laporan Performa Sales</option>
                                </select>
                              </div>
                              
                              <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Format</label>
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="p-3 border border-blue-500 bg-blue-50 rounded-md text-center cursor-pointer">
                                    <div className="text-2xl">📊</div>
                                    <div className="text-sm mt-1">Excel</div>
                                  </div>
                                  <div className="p-3 border border-gray-300 rounded-md text-center cursor-pointer hover:border-blue-300">
                                    <div className="text-2xl">📄</div>
                                    <div className="text-sm mt-1">PDF</div>
                                  </div>
                                  <div className="p-3 border border-gray-300 rounded-md text-center cursor-pointer hover:border-blue-300">
                                    <div className="text-2xl">📝</div>
                                    <div className="text-sm mt-1">CSV</div>
                                  </div>
                                </div>
                              </div>
                              
                              <button className="w-full py-3 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
                                Ekspor Laporan
                              </button>
                              
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
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={closeModal}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExportButton;