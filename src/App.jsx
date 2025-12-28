import React, { useState, useEffect, useRef } from 'react';
import ComplaintForm from './components/ComplaintForm';
import AdminPage from './components/AdminPage';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

function App() {
  // view: 'form' | 'payment' | 'admin'
  const [view, setView] = useState('form');
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      // If user logs in, we can optionally auto-switch to admin view if desired,
      // or just wait for them to click "Login" again which will now be "Admin Dashboard".
      if (currentUser && showLogin) {
        setView('admin');
        setShowLogin(false);
      }
    });
    return () => unsubscribe();
  }, [showLogin]);

  // Secret Triple Shift Trigger
  useEffect(() => {
    let shiftCount = 0;
    let lastPressTime = 0;

    const handleKeyDown = (e) => {
      if (e.repeat) return; // Prevent triggering on key hold
      if (e.key === 'Shift') {
        const currentTime = Date.now();
        if (currentTime - lastPressTime < 500) {
          shiftCount++;
        } else {
          shiftCount = 1;
        }
        lastPressTime = currentTime;

        if (shiftCount === 3) {
          if (user) {
            setView('admin');
          } else {
            setShowLogin(true);
          }
          shiftCount = 0; // Reset after trigger
        }
      } else {
        // Reset if any other key is pressed
        shiftCount = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user]);

  // Security: Disable Right Click & Inspect
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    const handleInspectKey = (e) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.keyCode === 123 ||
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) ||
        (e.ctrlKey && e.keyCode === 85)
      ) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleInspectKey);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleInspectKey);
    };
  }, []);



  //   const handleAdminClick = () => {
  //     if (user) {
  //       setView('admin');
  //     } else {
  //       setShowLogin(true);
  //     }
  //   };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView('form');
      alert("Logged out successfully");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Secret Tap Trigger references
  const tapCountRef = useRef(0);
  const lastTapTimeRef = useRef(0);

  const handleHeaderClick = () => {
    const currentTime = Date.now();
    if (currentTime - lastTapTimeRef.current < 500) {
      tapCountRef.current++;
    } else {
      tapCountRef.current = 1;
    }
    lastTapTimeRef.current = currentTime;

    if (tapCountRef.current === 5) {
      if (user) {
        setView('admin');
      } else {
        setShowLogin(true);
      }
      tapCountRef.current = 0;
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Header onSecretClick={handleHeaderClick} />

      <main className="flex-grow flex items-center justify-center p-4 sm:p-8 relative">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-100 to-slate-100"></div>

        <div className="relative z-10 w-full max-w-7xl flex justify-center">
          {view === 'admin' ? (
            // Protect Admin Route just in case
            user ? (
              <AdminPage onBack={() => setView('form')} onLogout={handleLogout} />
            ) : (
              <div className="text-center p-10">Access Denied. Please Login.</div>
            )
          ) : (
            <ComplaintForm onSuccess={() => console.log("Success")} />
          )}
        </div>
      </main>

      {/* Admin / Login Hidden Trigger (Triple Shift) */}
      {view === 'form' && (
        <>
          {/* Login Modal */}
          {showLogin && !user && (
            <LoginPage
              onSuccess={() => {
                setShowLogin(false);
                setView('admin');
              }}
              onCancel={() => setShowLogin(false)}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
