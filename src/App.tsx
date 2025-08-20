
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import MainHub from "./pages/MainHub";
import TreasureHunt from "./pages/TreasureHunt";
import PlayerApp from "./pages/PlayerApp";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCompact from "./pages/AdminCompact";
import SpectatorView from "./pages/SpectatorView";
import PhotoWall from "./pages/PhotoWall";
import SimplyWild from "./pages/SimplyWild";
import DealMakersShop from "./pages/DealMakersShop";
import NotFound from "./pages/NotFound";
import EventWizard from "./pages/EventWizard";
import EventPreview from "./pages/EventPreview";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import React, { useEffect } from "react";
import { supabase } from '@/integrations/supabase/client';
import { SessionManager } from '@/utils/sessionManager';

const queryClient = new QueryClient();

const App = () => {
  // Handle Android back button: close open dialogs/drawers before navigating back
  useEffect(() => {
    const handler = (e: PopStateEvent) => {
      const openDialogs = document.querySelectorAll('[role="dialog"]');
      const openDrawers = document.querySelectorAll('[data-state="open"][data-drawer]');
      if (openDialogs.length > 0 || openDrawers.length > 0) {
        e.preventDefault?.();
        // Try clicking the close button if present
        const closeBtn = document.querySelector('[data-close-button]') as HTMLElement | null;
        closeBtn?.click();
        // Or press escape
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        history.pushState(null, '', location.href); // cancel back
      }
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PWAInstallPrompt />
        <BrowserRouter>
          {/* Global command listener so admin controls work regardless of page */}
          <CommandListener />
          <Routes>
            {/* Main User Flow */}
            <Route path="/" element={<Home />} />
            <Route path="/info" element={<Home />} />
            <Route path="/home" element={<MainHub />} />
            <Route path="/treasure-hunt" element={<TreasureHunt />} />
            <Route path="/player/:name" element={<PlayerApp />} />
            
            {/* Spectator Views */}
            <Route path="/spectator" element={<SpectatorView />} />
            <Route path="/watch" element={<SpectatorView />} />
            
            {/* Additional Features */}
            <Route path="/photo-wall" element={<PhotoWall />} />
            <Route path="/simply-wild" element={<SimplyWild />} />
            <Route path="/deal-makers-shop" element={<DealMakersShop />} />
            
            {/* Event Management */}
            <Route path="/create-event" element={<EventWizard />} />
            <Route path="/event-preview/:slug" element={<EventPreview />} />
            
            {/* Admin Interface */}
            <Route path="/admin-dashboard-secret-2025" element={<AdminDashboard />} />
            <Route path="/admin" element={<AdminCompact />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

// Inline component to listen for admin commands across the whole app
const CommandListener = () => {
  useEffect(() => {
    (async () => {
      try {
        const sessionId = SessionManager.getSessionId();
        // Ensure RLS session context is set for live_messages polling/select
        await SessionManager.setSessionContext(sessionId);
      const channel = supabase
        .channel('live-messages-global')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_messages', filter: `session_id=eq.${sessionId}` }, (payload: any) => {
          const message: string = payload?.new?.message || '';
          if (typeof message === 'string' && message.startsWith('CMD:')) {
            const cmd = message.substring(4);
            if (cmd === 'APP_RESET') {
              const keep = localStorage.getItem('gameSessionId');
              try { localStorage.clear(); } catch {}
              if (keep) localStorage.setItem('gameSessionId', keep);
              window.location.assign('/info');
              return;
            }
            if (cmd === 'RELOAD') {
              window.location.reload();
              return;
            }
            if (cmd.startsWith('NAV:')) {
              const path = cmd.substring(4) || '/';
              window.location.assign(path);
              return;
            }
          }
        })
        .subscribe();
      // Polling fallback in case realtime is not enabled for the table
      const pollInterval = setInterval(async () => {
        try {
          // Keep RLS context fresh (harmless if already set)
          await SessionManager.setSessionContext(sessionId);
          const key = `lastCmdId:${sessionId}`;
          const lastId = parseInt(localStorage.getItem(key) || '0');
          const { data } = await supabase
            .from('live_messages')
            .select('id,message')
            .eq('session_id', sessionId)
            .order('id', { ascending: false })
            .limit(1);
          const msg = (data && data[0]) ? data[0] : null;
          if (msg && msg.id > lastId && typeof msg.message === 'string' && msg.message.startsWith('CMD:')) {
            localStorage.setItem(key, String(msg.id));
            const cmd = msg.message.substring(4);
            if (cmd === 'APP_RESET') {
              const keep = localStorage.getItem('gameSessionId');
              try { localStorage.clear(); } catch {}
              if (keep) localStorage.setItem('gameSessionId', keep);
              window.location.assign('/info');
              return;
            }
            if (cmd === 'RELOAD') {
              window.location.reload();
              return;
            }
            if (cmd.startsWith('NAV:')) {
              const path = cmd.substring(4) || '/';
              window.location.assign(path);
              return;
            }
          }
        } catch {}
      }, 2000);

        return () => { channel.unsubscribe(); clearInterval(pollInterval); };
      } catch (e) {
        console.warn('CommandListener init failed', e);
      }
    })();
  }, []);
  return null;
};
