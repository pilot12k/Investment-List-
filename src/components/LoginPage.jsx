import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Loader2, Shield, Lock } from 'lucide-react';

export default function LoginPage({ onSuccess, onCancel }) {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // const handleRegister = async () => {
    //     setLoading(true);
    //     setError('');
    //     try {
    //         await createUserWithEmailAndPassword(auth, email, password);
    //         if (onSuccess) onSuccess();
    //     } catch (err) {
    //         console.error("Registration failed", err);
    //         setError(err.message);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Auth listener in App.jsx will handle the redirect, but we can call onSuccess too
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error("Login failed", err);
            // Attempt to register if user not found (Quick Fix for User)
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                try {
                    await createUserWithEmailAndPassword(auth, email, password);
                    if (onSuccess) onSuccess();
                    return;
                } catch (regErr) {
                    console.error("Registration fallback failed", regErr);
                    setError("Login failed: " + err.message);
                }
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-96 border border-slate-200">
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Shield className="w-6 h-6 text-slate-900" />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-slate-900">Admin Portal</h3>
                    <p className="text-slate-500 text-sm mt-1">Striclty for authorized personnel</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center font-medium">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all font-sans"
                            placeholder="admin@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all font-sans"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
