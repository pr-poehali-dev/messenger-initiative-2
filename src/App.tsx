
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import func2url from "../backend/func2url.json";

const queryClient = new QueryClient();
const AUTH_URL = func2url.auth;

interface User {
  name: string;
  avatar: string;
  contact: string;
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pulse_token');
    if (!token) { setChecking(false); return; }
    fetch(`${AUTH_URL}?action=me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.user) setUser({ name: data.user.name, avatar: data.user.avatar || '🚀', contact: data.user.contact });
        else localStorage.removeItem('pulse_token');
      })
      .catch(() => localStorage.removeItem('pulse_token'))
      .finally(() => setChecking(false));
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem('pulse_token');
    if (token) {
      await fetch(`${AUTH_URL}?action=logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      localStorage.removeItem('pulse_token');
    }
    setUser(null);
  };

  if (checking) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-lg"
            style={{ background: 'linear-gradient(135deg, hsl(265,85%,65%), hsl(185,90%,55%))' }}>P</div>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <span key={i} className="w-2 h-2 rounded-full"
                style={{ background: 'hsl(265,85%,65%)', animation: `wave 1.2s ease-in-out infinite`, animationDelay: `${i*0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                user
                  ? <Index user={user} onLogout={handleLogout} />
                  : <Auth onAuth={(u) => setUser(u)} />
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;