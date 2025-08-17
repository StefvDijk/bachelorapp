import { supabase } from '@/integrations/supabase/client';
import { SessionManager } from './sessionManager';

export interface PointsHistoryEntry {
  transaction_type: 'earned' | 'spent';
  amount: number;
  description: string;
  created_at: string;
}

export class PointsHistoryManager {
  
  /**
   * Add a new entry to the points history
   */
  static async addEntry(
    type: 'earned' | 'spent', 
    amount: number, 
    description: string
  ): Promise<boolean> {
    try {
      const sessionId = SessionManager.getSessionId();
      
      // Set session context for RLS
      await supabase.rpc('set_session_context', {
        session_id: sessionId
      });

      const { error } = await supabase
        .from('points_history')
        .insert({
          session_id: sessionId,
          transaction_type: type,
          amount: amount,
          description: description
        });

      if (error) {
        console.error('Error adding points history entry:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in addEntry:', error);
      return false;
    }
  }

  /**
   * Get the points history for the current session
   */
  static async getHistory(): Promise<PointsHistoryEntry[]> {
    try {
      const sessionId = SessionManager.getSessionId();
      
      // Set session context for RLS
      await supabase.rpc('set_session_context', {
        session_id: sessionId
      });

      const { data, error } = await supabase
        .from('points_history')
        .select('transaction_type, amount, description, created_at')
        .order('created_at', { ascending: false })
        .limit(20) // Get last 20 entries
        .returns<PointsHistoryEntry[]>();

      if (error) {
        console.error('Error fetching points history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getHistory:', error);
      return [];
    }
  }

  /**
   * Add an earned points entry
   */
  static async addEarned(amount: number, description: string): Promise<boolean> {
    return this.addEntry('earned', amount, description);
  }

  /**
   * Add a spent points entry
   */
  static async addSpent(amount: number, description: string): Promise<boolean> {
    return this.addEntry('spent', amount, description);
  }
}