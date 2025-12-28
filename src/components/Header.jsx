import React from 'react';

function Header({ onSecretClick }) {
    return (
        <header className="bg-white shadow-md border-b border-slate-200 select-none">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div onClick={onSecretClick} className="cursor-pointer active:scale-95 transition-transform">
                    <h1 className="text-lg md:text-2xl font-serif font-bold text-slate-900 leading-tight">
                        EOW Thane / Forensic / TWJ
                    </h1>
                </div>

            </div>
        </header>
    );
}

export default Header;
