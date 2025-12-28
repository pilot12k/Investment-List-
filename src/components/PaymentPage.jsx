import React from 'react';
import DepositForm from './DepositForm';

export default function PaymentPage({ onBack }) {
    return (
        <div className="w-full flex flex-col items-center">
            <div className="w-full max-w-md mb-4 flex justify-start">
                <button
                    onClick={onBack}
                    className="text-sm text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
                >
                    <span>&larr;</span> Back to Home
                </button>
            </div>
            <DepositForm onSuccess={onBack} />
        </div>
    );
}
