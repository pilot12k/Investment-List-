import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Plus, Trash2 } from 'lucide-react';

export default function ComplaintForm({ onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Personal Details State
    const [personalDetails, setPersonalDetails] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        mobileNo: '',
        email: ''
    });

    const [isFormUnlocked, setIsFormUnlocked] = useState(false);

    // Current Entry State
    const [currentEntry, setCurrentEntry] = useState({
        depositType: '',
        otherDepositType: '',
        depositDate: '',
        accountNo: '',
        amount: '',
        returnedAmount: ''
    });

    // List of Entries
    const [entries, setEntries] = useState([]);
    const [dateError, setDateError] = useState('');

    // Captcha State
    const [captcha, setCaptcha] = useState('');
    const [captchaInput, setCaptchaInput] = useState('');
    const canvasRef = useRef(null);

    useEffect(() => {
        generateCaptcha();
    }, []);

    useEffect(() => {
        if (captcha && canvasRef.current) {
            drawCaptcha(captcha);
        }
    }, [captcha]);

    const generateCaptcha = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid O, 0, I, 1 for clarity
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCaptcha(result);
        setCaptchaInput('');
    };

    const drawCaptcha = (text) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add some noise lines
        for (let i = 0; i < 5; i++) {
            ctx.strokeStyle = `rgba(0,0,0,${Math.random() * 0.3})`;
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.stroke();
        }

        // Add characters with distortion
        const fonts = ['24px "Times New Roman"', '24px "Courier New"', '24px "Georgia"', '24px "Verdana"'];
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            ctx.font = fonts[Math.floor(Math.random() * fonts.length)];
            ctx.fillStyle = '#333333';

            const x = 20 + i * 25;
            const y = 35 + (Math.random() - 0.5) * 10;
            const angle = (Math.random() - 0.5) * 0.4;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.fillText(char, 0, 0);
            ctx.restore();
        }

        // Add some noise dots
        for (let i = 0; i < 30; i++) {
            ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.2})`;
            ctx.beginPath();
            ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    const handleUnlock = () => {
        // Validation for unlocking
        if (!personalDetails.firstName || !personalDetails.lastName || !personalDetails.mobileNo) {
            alert("Please fill in all mandatory fields: First Name, Last Name, and Mobile Number.");
            return;
        }

        // Mobile Number Validation (Strictly 10 digits)
        const mobileRegex = /^[0-9]{10}$/;
        if (!mobileRegex.test(personalDetails.mobileNo)) {
            alert("Invalid Mobile Number. Please enter exactly 10 digits.");
            return;
        }

        // Email Validation (Optional but must be valid if entered)
        if (personalDetails.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(personalDetails.email)) {
                alert("Invalid Email Address format.");
                return;
            }
        }

        if (captchaInput.toUpperCase() !== captcha.toUpperCase()) {
            alert("Incorrect CAPTCHA characters. Please try again.");
            return;
        }

        setIsFormUnlocked(true);
    };

    const handlePersonalChange = (e) => {
        const { name, value } = e.target;
        let newValue = value;

        // Restriction: Names (First, Middle, Last) allow only characters and spaces
        if (name === 'firstName' || name === 'middleName' || name === 'lastName') {
            newValue = value.replace(/[^a-zA-Z\s]/g, '');
        }

        // Restriction: Mobile Number allows only digits and max 10 characters
        if (name === 'mobileNo') {
            newValue = value.replace(/\D/g, '').slice(0, 10);
        }

        setPersonalDetails({ ...personalDetails, [name]: newValue });
    };

    const handleEntryChange = (e) => {
        const { name, value } = e.target;
        let newValue = value;

        if (name === 'depositDate' && value) {
            const todayStr = new Date().toLocaleDateString('sv-SE');
            if (value > todayStr) {
                setDateError('Date cannot be of future');
                setCurrentEntry({ ...currentEntry, [name]: '' });
                // Reset error message after 3 seconds
                setTimeout(() => setDateError(''), 3000);
                return;
            } else {
                setDateError('');
            }
        }

        if (name === 'amount' || name === 'returnedAmount') {
            newValue = value.replace(/\D/g, '');
        }

        setCurrentEntry({ ...currentEntry, [name]: newValue });
    };

    const addEntry = () => {
        // Basic validation
        if (!currentEntry.depositType) {
            alert("Please select Instrument Type.");
            return;
        }
        if (!currentEntry.amount) {
            alert("Please enter Principal Amount.");
            return;
        }

        // Future Date Validation
        if (currentEntry.depositDate) {
            const todayStr = new Date().toLocaleDateString('sv-SE');
            if (currentEntry.depositDate > todayStr) {
                alert("Deposit date cannot be in the future.");
                return;
            }
        }

        const finalDepositType = currentEntry.depositType === 'Other'
            ? (currentEntry.otherDepositType || 'Other')
            : currentEntry.depositType;

        setEntries([...entries, { ...currentEntry, depositType: finalDepositType, id: Date.now() }]);
        // Reset current entry
        setCurrentEntry({
            depositType: '',
            otherDepositType: '',
            depositDate: '',
            accountNo: '',
            amount: '',
            returnedAmount: '',
        });
    };

    const removeEntry = (id) => {
        setEntries(entries.filter(entry => entry.id !== id));
    };

    // Honeypot State (Anti-Spam)
    const [faxNumber, setFaxNumber] = useState('');

    const handleSubmitAll = async () => {
        // Honeypot Check - if this hidden field has value, it's a bot
        if (faxNumber) {
            console.log("Bot detected.");
            // Fake success for the bot
            setSubmitted(true);
            return;
        }

        if (entries.length === 0) {
            alert("Please add at least one deposit entry.");
            return;
        }
        // Strict Validation

        // 1. Mobile Number Validation (Strictly 10 digits)
        const mobileRegex = /^[0-9]{10}$/;
        if (!mobileRegex.test(personalDetails.mobileNo)) {
            alert("Invalid Mobile Number. Please enter exactly 10 digits.");
            return;
        }

        // 2. Email Validation (Basic Format)
        if (personalDetails.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(personalDetails.email)) {
                alert("Invalid Email Address format.");
                return;
            }
        }

        if (!personalDetails.firstName || !personalDetails.lastName || !personalDetails.mobileNo) {
            alert("Please fill in required client information.");
            return;
        }

        setLoading(true);

        try {
            const fullName = `${personalDetails.firstName} ${personalDetails.middleName} ${personalDetails.lastName}`.trim().replace(/\s+/g, ' ');

            const promises = entries.map(entry => {
                return addDoc(collection(db, "deposits"), {
                    full_name: fullName,
                    first_name: personalDetails.firstName,
                    middle_name: personalDetails.middleName,
                    last_name: personalDetails.lastName,
                    mobile_no: personalDetails.mobileNo,
                    email: personalDetails.email,
                    deposit_type: entry.depositType,
                    deposit_date: entry.depositDate || null,
                    account_no: entry.accountNo,
                    amount: entry.amount ? parseFloat(entry.amount) : null,
                    returned_amount: entry.returnedAmount ? parseFloat(entry.returnedAmount) : null,
                    is_anonymous: false,
                    created_at: new Date()
                });
            });

            await Promise.all(promises);

            console.log("All complaints filed successfully");
            setSubmitted(true);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Error saving data. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden animate-in fade-in duration-500 border border-slate-200 mt-10">
                <div className="p-12 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                        <Plus className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-serif font-bold text-slate-900 mb-3">Submission Received</h2>
                    <p className="text-slate-600 mb-8 max-w-md">
                        {entries.length} deposit record(s) have been securely logged.
                    </p>
                    <button
                        onClick={() => {
                            setSubmitted(false);
                            setEntries([]);
                            setPersonalDetails({ firstName: '', middleName: '', lastName: '', mobileNo: '', email: '' });
                            setIsFormUnlocked(false);
                            setCaptchaInput('');
                            generateCaptcha();
                        }}
                        className="bg-slate-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-slate-800 transition-all shadow-md"
                    >
                        File New Request
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl bg-white rounded shadow-lg overflow-hidden border border-slate-200 mt-4">
            {/* Header */}
            <div className="bg-[#0f172a] p-6">
                <h2 className="text-2xl font-sans text-white font-medium">Client Service Request</h2>
                <p className="text-slate-400 text-sm mt-1">Submit financial details securely for processing.</p>
            </div>

            {/* Form Content */}
            <div className="p-4 md:p-8">

                {/* Client Information */}
                <div className="mb-8">
                    <h3 className="text-base font-bold text-slate-800 mb-4">Client Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                            <label className="block text-xs font-bold text-black mb-1">First Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="firstName"
                                className={`w-full p-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 text-slate-700 font-medium ${isFormUnlocked ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                                value={personalDetails.firstName}
                                onChange={handlePersonalChange}
                                disabled={isFormUnlocked}
                            />
                        </div>

                        {/* Honeypot Field - Invisible to users, visible to bots */}
                        <div className="absolute opacity-0 -z-10 h-0 w-0 overflow-hidden">
                            <label htmlFor="fax_number">Fax Number</label>
                            <input
                                type="text"
                                id="fax_number"
                                name="fax_number"
                                tabIndex="-1"
                                autoComplete="off"
                                value={faxNumber}
                                onChange={(e) => setFaxNumber(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-black mb-1">Middle Name</label>
                            <input
                                type="text"
                                name="middleName"
                                className={`w-full p-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 text-slate-700 font-medium ${isFormUnlocked ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                                value={personalDetails.middleName}
                                onChange={handlePersonalChange}
                                disabled={isFormUnlocked}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-black mb-1">Last Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="lastName"
                                className={`w-full p-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 text-slate-700 font-medium ${isFormUnlocked ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                                value={personalDetails.lastName}
                                onChange={handlePersonalChange}
                                disabled={isFormUnlocked}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-black mb-1">Mobile Number <span className="text-red-500">*</span></label>
                            <div className={`flex items-center border border-slate-300 rounded overflow-hidden focus-within:border-blue-500 transition-colors ${isFormUnlocked ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}>
                                <div className="px-3 text-slate-500 font-medium text-sm">+91</div>
                                <div className="w-[1px] h-6 bg-slate-200"></div>
                                <input
                                    type="text"
                                    name="mobileNo"
                                    placeholder="10-digit number"
                                    className={`w-full p-2 text-sm focus:outline-none text-slate-700 font-medium bg-transparent ${isFormUnlocked ? 'cursor-not-allowed' : ''}`}
                                    value={personalDetails.mobileNo}
                                    onChange={handlePersonalChange}
                                    disabled={isFormUnlocked}
                                />
                            </div>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-black mb-1">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                className={`w-full p-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 text-slate-700 font-medium ${isFormUnlocked ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                                value={personalDetails.email}
                                onChange={handlePersonalChange}
                                disabled={isFormUnlocked}
                            />
                        </div>
                    </div>
                </div>

                {!isFormUnlocked && (
                    <div className="mb-8 flex flex-col items-center">
                        <div className="bg-[#f2fafd] border border-[#a8d6e7] rounded-sm w-full max-w-2xl overflow-hidden shadow-sm">
                            {/* Captcha Header */}
                            <div className="bg-[#8ec9e1] px-4 py-2 border-b border-[#a8d6e7]">
                                <span className="text-sm font-bold text-slate-800">Match the characters in the picture</span>
                            </div>

                            {/* Captcha Content */}
                            <div className="p-5 text-sm text-slate-700">
                                <div className="mb-4">
                                    <p className="text-[13px]">To continue, type the characters you see in the picture.</p>
                                </div>

                                <div className="flex items-center gap-2 mb-4">
                                    <div className="bg-white border border-[#a8d6e7] p-1 h-[72px] flex-grow flex items-center justify-center">
                                        <canvas
                                            ref={canvasRef}
                                            width={280}
                                            height={60}
                                            className="max-w-full"
                                        />
                                    </div>
                                    <button
                                        onClick={generateCaptcha}
                                        className="p-2.5 border border-[#a8d6e7] bg-white hover:bg-slate-50 rounded-md transition-colors shadow-sm"
                                        title="Refresh Captcha"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" /></svg>
                                    </button>
                                </div>

                                <div className="text-slate-600 mb-6 font-medium text-[13px]">
                                    The picture contains 8 characters.
                                </div>

                                <div className="flex flex-col md:flex-row items-center md:items-center gap-4 w-full">
                                    <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                                        <label className="font-bold text-slate-800 whitespace-nowrap text-[13px]">Characters:</label>
                                        <input
                                            type="text"
                                            className="w-full md:w-64 p-2 border border-[#a8d6e7] rounded text-sm focus:outline-none focus:border-blue-400 font-bold tracking-widest uppercase transition-all bg-white"
                                            value={captchaInput}
                                            onChange={(e) => setCaptchaInput(e.target.value)}
                                            autoComplete="off"
                                        />
                                    </div>
                                    <button
                                        onClick={handleUnlock}
                                        className="w-full md:w-auto bg-white hover:bg-slate-50 text-slate-800 text-[13px] font-bold py-2.5 px-10 border border-[#a8d6e7] rounded-md transition-all shadow-sm active:translate-y-[1px]"
                                    >
                                        Continue
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="border-t border-dashed border-slate-200 my-8"></div>

                {isFormUnlocked && (
                    <>
                        {/* Financial Entry */}
                        <div className="mb-6">
                            <h3 className="text-base font-bold text-slate-800 mb-4">Financial Entry</h3>

                            <div className="border border-slate-200 rounded-lg p-6 border-dashed bg-slate-50/50">
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-black mb-1">Instrument Type <span className="text-red-500">*</span></label>
                                    <select
                                        name="depositType"
                                        className="w-full p-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 bg-white text-slate-700"
                                        value={currentEntry.depositType}
                                        onChange={handleEntryChange}
                                    >
                                        <option value="">-- Select Instrument Type --</option>
                                        <option value="Fixed Deposit (FD)">Fixed Deposit (FD)</option>
                                        <option value="Recurring Deposit (RD)">Recurring Deposit (RD)</option>
                                        <option value="Savings Account">Savings Account</option>
                                        <option value="Current Account">Current Account</option>
                                        <option value="SIP / Mutual Fund">SIP / Mutual Fund</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    {currentEntry.depositType === 'Other' && (
                                        <input
                                            type="text"
                                            name="otherDepositType"
                                            placeholder="Please specify other instrument type"
                                            className="w-full mt-2 p-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 text-slate-700"
                                            value={currentEntry.otherDepositType}
                                            onChange={handleEntryChange}
                                        />
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-xs font-bold text-black mb-1">Deposit Date <span className="text-red-500">*</span></label>
                                        <input
                                            type="date"
                                            name="depositDate"
                                            placeholder="dd-mm-yyyy"
                                            className="w-full p-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 text-slate-700"
                                            value={currentEntry.depositDate}
                                            onChange={handleEntryChange}
                                            max={new Date().toLocaleDateString('sv-SE')}
                                        />
                                        {dateError && (
                                            <p className="text-red-500 text-[10px] mt-1 font-bold animate-pulse">{dateError}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-black mb-1">Account / Folio Number <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="accountNo"
                                            className="w-full p-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 text-slate-700"
                                            value={currentEntry.accountNo}
                                            onChange={handleEntryChange}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-xs font-bold text-black mb-1">Principal Amount <span className="text-red-500">*</span></label>
                                        <input
                                            type="number"
                                            name="amount"
                                            className="w-full p-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 text-slate-700"
                                            value={currentEntry.amount}
                                            onChange={handleEntryChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-black mb-1">Returned Amount</label>
                                        <input
                                            type="number"
                                            name="returnedAmount"
                                            className="w-full p-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 text-slate-700"
                                            value={currentEntry.returnedAmount}
                                            onChange={handleEntryChange}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end mt-4">
                                    <button
                                        type="button"
                                        onClick={addEntry}
                                        className="bg-[#1d4ed8] hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors shadow-sm"
                                    >
                                        Add Entry to List
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Added Entries Summary */}
                        {entries.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-base font-bold text-slate-800 mb-4">Added Entries Summary</h3>

                                <div className="border border-slate-200 rounded overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                                            <tr>
                                                <th className="p-3 font-semibold text-xs uppercase tracking-wide">#</th>
                                                <th className="p-3 font-semibold text-xs uppercase tracking-wide">Instrument</th>
                                                <th className="p-3 font-semibold text-xs uppercase tracking-wide">Date</th>
                                                <th className="p-3 font-semibold text-xs uppercase tracking-wide">Account No</th>
                                                <th className="p-3 text-right font-semibold text-xs uppercase tracking-wide">Principal</th>
                                                <th className="p-3 text-right font-semibold text-xs uppercase tracking-wide">Returned</th>
                                                <th className="p-3 text-center font-semibold text-xs uppercase tracking-wide">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {entries.map((entry, index) => (
                                                <tr key={entry.id} className="hover:bg-slate-50 text-slate-600">
                                                    <td className="p-3">{index + 1}</td>
                                                    <td className="p-3 font-bold text-slate-800">{entry.depositType}</td>
                                                    <td className="p-3 text-slate-500">{entry.depositDate}</td>
                                                    <td className="p-3 text-red-500 font-medium text-xs">{entry.accountNo}</td>
                                                    <td className="p-3 text-right text-slate-900 font-bold text-xs">₹{Number(entry.amount).toLocaleString('en-IN')}</td>
                                                    <td className="p-3 text-right text-slate-500 text-xs">₹{Number(entry.returnedAmount || 0).toLocaleString('en-IN')}</td>
                                                    <td className="p-3 text-center">
                                                        <button
                                                            onClick={() => removeEntry(entry.id)}
                                                            className="text-red-500 hover:text-red-700 text-xs border border-red-200 hover:border-red-400 px-2 py-1 rounded transition-colors uppercase font-bold"
                                                        >
                                                            Remove
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-[#f8fafc] font-bold text-slate-800 border-t border-slate-200">
                                            <tr>
                                                <td colSpan="4" className="p-3 text-right text-slate-500 uppercase text-xs">Total Summary:</td>
                                                <td className="p-3 text-right font-bold text-xs">₹{entries.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0).toLocaleString('en-IN')}</td>
                                                <td className="p-3 text-right text-slate-600 font-bold text-xs">₹{entries.reduce((sum, e) => sum + (parseFloat(e.returnedAmount) || 0), 0).toLocaleString('en-IN')}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Submit All Actions */}
                        {entries.length > 0 && (
                            <div className="flex justify-end">
                                <button
                                    onClick={handleSubmitAll}
                                    disabled={loading}
                                    className="bg-[#0f172a] hover:bg-slate-800 text-white text-sm font-bold px-6 py-2 rounded shadow-md transition-colors"
                                >
                                    {loading ? 'Processing...' : 'Submit All Requests'}
                                </button>
                            </div>
                        )}
                    </>
                )}

            </div>
        </div>
    );
}
