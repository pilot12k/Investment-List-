import React from 'react';
import { Award, ShieldCheck, BookOpen, Fingerprint } from 'lucide-react';

function CredentialsBar() {
    const credentials = [
        { icon: Fingerprint, label: "Certified Ethical Hacker" },
        { icon: ShieldCheck, label: "Certified Forensic Auditor (ICAI)" },
        { icon: BookOpen, label: "Certified Bank Auditor" },
        { icon: Award, label: "Insolvency Professional" },
    ];

    return (
        <div className="bg-slate-900 border-b border-slate-800 text-slate-300 py-2">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-center justify-center md:justify-between gap-4 text-xs font-medium uppercase tracking-wider">
                    <div className="hidden md:block text-amber-500 font-bold">
                        EXPERT CREDENTIALS
                    </div>
                    <div className="flex flex-wrap justify-center gap-6">
                        {credentials.map((cred, index) => (
                            <div key={index} className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                                <cred.icon className="w-4 h-4 text-slate-500" />
                                <span>{cred.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CredentialsBar;
