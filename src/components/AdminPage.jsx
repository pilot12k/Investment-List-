import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { Loader2, ArrowLeft, Shield } from 'lucide-react';

export default function AdminPage({ onBack, onLogout }) {
    const [deposits, setDeposits] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Active Filter State (applied when Filter button is clicked)
    const [filters, setFilters] = useState({
        search: '',
        from: '',
        to: ''
    });

    useEffect(() => {
        fetchDeposits();
    }, []);

    const fetchDeposits = async () => {
        try {
            const q = query(collection(db, "deposits"), orderBy("created_at", "desc"));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                raw_created_at: doc.data().created_at,
                // Format: dd-mm-yyyy for display
                display_date: doc.data().created_at?.toDate().toLocaleDateString('en-GB').replace(/\//g, '-')
            }));
            setDeposits(data);
        } catch (error) {
            console.error("Error fetching deposits:", error);
            alert("Error fetching data");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterClick = () => {
        setFilters({
            search: searchTerm,
            from: fromDate,
            to: toDate
        });
    };

    const handleResetClick = () => {
        setSearchTerm('');
        setFromDate('');
        setToDate('');
        setFilters({
            search: '',
            from: '',
            to: ''
        });
    };

    const filteredDeposits = React.useMemo(() => {
        let processed = [...deposits];

        // 1. Search Filter
        if (filters.search) {
            const lowerQuery = filters.search.toLowerCase();
            processed = processed.filter(item =>
                (item.full_name && item.full_name.toLowerCase().includes(lowerQuery)) ||
                (item.account_no && item.account_no.toString().includes(lowerQuery)) ||
                (item.mobile_no && item.mobile_no.toString().includes(lowerQuery)) ||
                (item.email && item.email.toLowerCase().includes(lowerQuery))
            );
        }

        // 2. Date Range Filter
        if (filters.from) {
            const from = new Date(filters.from);
            from.setHours(0, 0, 0, 0);
            processed = processed.filter(item => {
                if (!item.raw_created_at) return false;
                const itemDate = item.raw_created_at.toDate();
                return itemDate >= from;
            });
        }
        if (filters.to) {
            const to = new Date(filters.to);
            to.setHours(23, 59, 59, 999);
            processed = processed.filter(item => {
                if (!item.raw_created_at) return false;
                const itemDate = item.raw_created_at.toDate();
                return itemDate <= to;
            });
        }

        return processed;
    }, [deposits, filters]);

    const exportToExcel = () => {
        const dataToExport = filteredDeposits.map((item, index) => ({
            "Sr no": index + 1,
            "firstname": item.first_name || '',
            "middle name": item.middle_name || '',
            "last name": item.last_name || '',
            "deposit_type": item.deposit_type || '',
            "account_no": item.account_no || '',
            "invested_amount": item.amount || '',
            "returned amount": item.returned_amount || ''
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Deposits");
        XLSX.writeFile(workbook, `Portal_Data_v2.xlsx`);
    };

    return (
        <div className="w-full max-w-7xl bg-white rounded shadow-lg overflow-hidden min-h-[600px] flex flex-col mt-4">

            {/* Header */}
            <div className="bg-[#0f172a] p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button onClick={onBack} className="text-white hover:text-slate-300">
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h2 className="text-xl md:text-2xl font-sans text-white font-medium">Admin Dashboard (v2)</h2>
                        <p className="text-slate-400 text-xs mt-1">All submitted client entries</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <button
                        onClick={exportToExcel}
                        className="flex-1 md:flex-none bg-[#22c55e] hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded transition-colors text-center"
                    >
                        Download Excel
                    </button>
                    {onLogout && (
                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className="flex-1 md:flex-none bg-[#ef4444] hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded transition-colors text-center"
                        >
                            Logout
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-[#f8fafc] p-4 md:p-6 border-b border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-4">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Search</label>
                        <input
                            type="text"
                            placeholder="Name, mobile, or account..."
                            className="w-full p-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1">From Date</label>
                        <input
                            type="date"
                            className="w-full p-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            max={new Date().toLocaleDateString('sv-SE')}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1">To Date</label>
                        <input
                            type="date"
                            className="w-full p-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            max={new Date().toLocaleDateString('sv-SE')}
                        />
                    </div>
                    <div className="md:col-span-4 flex gap-2 w-full">
                        <button
                            onClick={handleFilterClick}
                            className="flex-1 bg-[#3b82f6] hover:bg-blue-600 text-white text-sm font-medium px-6 py-2 rounded transition-colors"
                        >
                            Filter
                        </button>
                        <button
                            onClick={handleResetClick}
                            className="flex-1 bg-[#64748b] hover:bg-slate-600 text-white text-sm font-medium px-6 py-2 rounded transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="p-0 flex-1 overflow-auto bg-white">
                {loading ? (
                    <div className="flex flex-col justify-center items-center h-full text-slate-500 gap-3 py-10">
                        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
                        <p>Loading...</p>
                    </div>
                ) : (
                    <div className="overflow-auto h-[530px] border-b border-slate-100">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-[#f1f5f9]">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Instrument</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Account</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {filteredDeposits.length > 0 ? (
                                    filteredDeposits.map((deposit) => (
                                        <tr key={deposit.id} className="hover:bg-slate-50 transition-colors text-slate-600 text-sm">
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{deposit.full_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{deposit.deposit_type || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">{deposit.account_no || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800">
                                                {deposit.amount ? `₹${deposit.amount.toLocaleString('en-IN')}` : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs">{deposit.display_date || '-'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-10 text-center text-slate-500 text-sm">
                                            No records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm border border-slate-200 transform transition-all scale-100">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Shield className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Logout from admin?</h3>
                            <p className="text-slate-500 text-sm mt-2">Are you sure you want to end your session?</p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 px-4 py-3 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                            >
                                NO
                            </button>
                            <button
                                onClick={onLogout}
                                className="flex-1 px-4 py-3 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-lg"
                            >
                                YES
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
