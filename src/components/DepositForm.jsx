import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

export default function DepositForm({ onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        mobileNo: '',
        email: '',
        isDeposited: '',
        depositType: '',
        depositDate: '',
        accountNo: '',
        amount: '',
        returnedAmount: ''
    });
    const [dateError, setDateError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        let newValue = value;

        if (name === 'depositDate' && value) {
            const todayStr = new Date().toLocaleDateString('sv-SE');
            if (value > todayStr) {
                setDateError('Date cannot be of future');
                setFormData({ ...formData, [name]: '' });
                setTimeout(() => setDateError(''), 3000);
                return;
            } else {
                setDateError('');
            }
        }

        if (name === 'amount' || name === 'returnedAmount') {
            newValue = value.replace(/\D/g, '');
        }

        setFormData({ ...formData, [name]: newValue });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Future Date Validation
        if (formData.depositDate) {
            const todayStr = new Date().toLocaleDateString('sv-SE');
            if (formData.depositDate > todayStr) {
                alert("Deposit date cannot be in the future.");
                return;
            }
        }

        setLoading(true);

        try {
            // Data to be inserted into Firestore
            const docRef = await addDoc(collection(db, "deposits"), {
                full_name: formData.fullName,
                mobile_no: formData.mobileNo,
                email: formData.email,
                is_deposited: formData.isDeposited === 'Yes',
                deposit_type: formData.depositType,
                deposit_date: formData.depositDate || null,
                account_no: formData.accountNo,
                amount: formData.amount ? parseFloat(formData.amount) : null,
                returned_amount: formData.returnedAmount ? parseFloat(formData.returnedAmount) : null,
                created_at: new Date()
            });

            console.log("Document written with ID: ", docRef.id);
            onSuccess();
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Error saving data. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-blue-600 p-4">
                <h2 className="text-white text-xl font-semibold text-center">Dnyandhara Deposit Form</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                        type="text"
                        name="fullName"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile No</label>
                    <input
                        type="tel"
                        name="mobileNo"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your mobile number"
                        value={formData.mobileNo}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        name="email"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Whether the amount is deposited in Dnyandhara?
                    </label>
                    <select
                        name="isDeposited"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.isDeposited}
                        onChange={handleChange}
                    >
                        <option value="">--Select--</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                    </select>
                </div>

                {formData.isDeposited === 'Yes' && (
                    <div className="space-y-4 border-t pt-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Type</label>
                            <select
                                name="depositType"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.depositType}
                                onChange={handleChange}
                            >
                                <option value="">--Select--</option>
                                <option value="FD">FD</option>
                                <option value="RD">RD</option>
                                <option value="Saving">Saving</option>
                                <option value="Current">Current</option>
                                <option value="SIP">SIP</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                                type="date"
                                name="depositDate"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.depositDate}
                                onChange={handleChange}
                                max={new Date().toLocaleDateString('sv-SE')}
                            />
                            {dateError && (
                                <p className="text-red-500 text-[10px] mt-1 font-bold animate-pulse">{dateError}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Account No</label>
                            <input
                                type="text"
                                name="accountNo"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter account number"
                                value={formData.accountNo}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                            <input
                                type="number"
                                name="amount"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter amount"
                                value={formData.amount}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Returned Amount</label>
                            <input
                                type="number"
                                name="returnedAmount"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter returned amount"
                                value={formData.returnedAmount}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin mr-2 h-5 w-5" />
                            Processing...
                        </>
                    ) : (
                        'Proceed to Payment'
                    )}
                </button>
            </form>
        </div>
    );
}
