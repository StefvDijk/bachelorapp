import { supabase } from '@/integrations/supabase/client';

export class SessionManager {
  private static sessionId: string | null = null;

  static getSessionId(): string {
    if (this.sessionId) {
      return this.sessionId;
    }

    // Check URL params first
    const urlParams = new URLSearchParams(window.location.search);
    const sessionFromUrl = urlParams.get('session');
    
    if (sessionFromUrl) {
      this.sessionId = sessionFromUrl;
      localStorage.setItem('gameSessionId', sessionFromUrl);
      return sessionFromUrl;
    }

    // Check localStorage
    const sessionFromStorage = localStorage.getItem('gameSessionId');
    if (sessionFromStorage) {
      this.sessionId = sessionFromStorage;
      return sessionFromStorage;
    }

    // Generate new session
    const newSessionId = this.generateSessionId();
    this.sessionId = newSessionId;
    localStorage.setItem('gameSessionId', newSessionId);
    
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('session', newSessionId);
    window.history.replaceState({}, '', url.toString());
    
    return newSessionId;
  }

  static async createSession(userName?: string, eventId?: string): Promise<void> {
    const sessionId = this.getSessionId();
    
    try {
      // Use edge function to initialize session with all data
      await supabase.functions.invoke('initialize-session', {
        body: {
          session_id: sessionId,
          user_name: userName,
          event_id: eventId
        }
      });
    } catch (error) {
      console.error('Error creating session:', error);
    }
  }

  static async updateActivity(): Promise<void> {
    const sessionId = this.getSessionId();
    
    try {
      // Set session context for RLS security
      await supabase.rpc('set_session_context', { session_id: sessionId });
      
      await supabase
        .from('sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  }

  // Helper method to set session context before database operations
  static async setSessionContext(sessionId?: string): Promise<void> {
    const id = sessionId || this.getSessionId();
    try {
      await supabase.rpc('set_session_context', { session_id: id });
    } catch (error) {
      console.error('Error setting session context:', error);
    }
  }

  private static generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  static clearSession(): void {
    this.sessionId = null;
    localStorage.removeItem('gameSessionId');
    
    // Remove session from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('session');
    window.history.replaceState({}, '', url.toString());
  }
}