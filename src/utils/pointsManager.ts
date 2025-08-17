import { supabase } from '@/integrations/supabase/client';
import { SessionManager } from '@/utils/sessionManager';



export class PointsManager {
  // Color position mapping for bonus calculations
  private static colorPositions = [
    'Roze', 'Blauw', 'Geel', 'Oranje', 'Groen',
    'Blauw', 'Groen', 'Roze', 'Geel', 'Oranje',
    'Geel', 'Roze', 'Oranje', 'Blauw', 'Groen',
    'Oranje', 'Geel', 'Groen', 'Roze', 'Blauw',
    'Groen', 'Oranje', 'Blauw', 'Geel', 'Roze'
  ];

  /**
   * Get current points balance - SIMPLE VERSION
   * Just return what's stored in the database
   */
  static async getCurrentPoints(): Promise<number> {
    try {
      const sessionId = SessionManager.getSessionId();
      
      // Set session context for RLS security
      await supabase.rpc('set_session_context', { session_id: sessionId });
      
      // Get current balance from sessions table
      const { data: session, error } = await supabase
        .from('sessions')
        .select('points_balance')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Error getting current points:', error);
        // If column doesn't exist, fallback to recalculating from tasks
        if (error.code === '42703') {
          console.log('⚠️ points_balance column missing, calculating from tasks');
          return await this.calculateFromTasksOnly();
        }
        return 0;
      }

      // If no balance set, calculate from completed tasks
      if (session.points_balance === null || session.points_balance === undefined) {
        return await this.recalculateAndSetBalance();
      }

      return session.points_balance || 0;
    } catch (error) {
      console.error('Error getting current points:', error);
      return 0;
    }
  }

  /**
   * Fallback: Calculate points from completed tasks only (when DB column missing)
   */
  private static async calculateFromTasksOnly(): Promise<number> {
    try {
      const sessionId = SessionManager.getSessionId();
      
      // Set session context for RLS security
      await supabase.rpc('set_session_context', { session_id: sessionId });
      
      // Get ALL tasks first to get correct positions
      const { data: allTasks, error: allTasksError } = await supabase
        .from('bingo_tasks')
        .select('*')
        .eq('session_id', sessionId)
        .order('id');

      if (allTasksError) {
        console.error('Error loading all tasks:', allTasksError);
        return 0;
      }

      // Filter to completed tasks but keep their original positions
      const completedTasks = (allTasks || []).filter(task => task.completed);
      const basePoints = completedTasks.length * 20;
      const bonusPoints = this.calculateBonusPointsWithPositions(completedTasks, allTasks || []);
      const totalPoints = basePoints + bonusPoints;

      console.log(`✅ Calculated from tasks only: ${basePoints} base + ${bonusPoints} bonus = ${totalPoints} total`);
      return totalPoints;
    } catch (error) {
      console.error('Error calculating from tasks only:', error);
      return 0;
    }
  }

  /**
   * Recalculate points earned from completed tasks (base + bonuses)
   * NOTE: This function NO LONGER updates the database balance.
   * The database `points_balance` is the authoritative current budget
   * and is only changed via addPoints/subtractPoints/setPoints.
   */
  static async recalculateAndSetBalance(): Promise<number> {
    try {
      const sessionId = SessionManager.getSessionId();
      
      // Set session context for RLS security
      await supabase.rpc('set_session_context', { session_id: sessionId });
      
      // Get ALL tasks first to get correct positions
      const { data: allTasks, error: allTasksError } = await supabase
        .from('bingo_tasks')
        .select('*')
        .eq('session_id', sessionId)
        .order('id');

      if (allTasksError) {
        console.error('Error loading all tasks:', allTasksError);
        return 0;
      }

      // Filter to completed tasks but keep their original positions
      const completedTasks = (allTasks || []).filter(task => task.completed);
      const basePoints = completedTasks.length * 20;
      const bonusPoints = this.calculateBonusPointsWithPositions(completedTasks, allTasks || []);
      const totalPoints = basePoints + bonusPoints;

      console.log(`✅ Recalculated points: ${basePoints} base + ${bonusPoints} bonus = ${totalPoints} total`);
      console.log(`  - Completed tasks count: ${completedTasks.length}`);
      return totalPoints;
    } catch (error) {
      console.error('Error recalculating balance:', error);
      return 0;
    }
  }

  /**
   * Add points to balance (when completing tasks or winning)
   */
  static async addPoints(amount: number): Promise<boolean> {
    try {
      const currentBalance = await this.getCurrentPoints();
      const newBalance = Math.max(0, currentBalance + amount);
      
      const sessionId = SessionManager.getSessionId();
      
      try {
        // Set session context for RLS security
        await supabase.rpc('set_session_context', { session_id: sessionId });
        
        const { error } = await supabase
          .from('sessions')
          .update({ points_balance: newBalance })
          .eq('id', sessionId);

        if (error && error.code === '42703') {
          console.log('⚠️ Database column missing, cannot persist points changes');
          return false;
        }

        if (error) {
          console.error('Error adding points:', error);
          return false;
        }
      } catch (dbError) {
        console.log('⚠️ Database column missing, cannot persist points changes');
        return false;
      }

      console.log(`✅ Added ${amount} points. New balance: ${newBalance}`);
      return true;
    } catch (error) {
      console.error('Error adding points:', error);
      return false;
    }
  }

  /**
   * Subtract points from balance (when spending or losing)
   */
  static async subtractPoints(amount: number): Promise<boolean> {
    try {
      const currentBalance = await this.getCurrentPoints();
      
      if (currentBalance < amount) {
        console.error('Insufficient points');
        return false;
      }

      const newBalance = Math.max(0, currentBalance - amount);
      
      const sessionId = SessionManager.getSessionId();
      
      try {
        // Set session context for RLS security
        await supabase.rpc('set_session_context', { session_id: sessionId });
        
        const { error } = await supabase
          .from('sessions')
          .update({ points_balance: newBalance })
          .eq('id', sessionId);

        if (error && error.code === '42703') {
          console.log('⚠️ Database column missing, cannot persist points changes');
          return false;
        }

        if (error) {
          console.error('Error subtracting points:', error);
          return false;
        }
      } catch (dbError) {
        console.log('⚠️ Database column missing, cannot persist points changes');
        return false;
      }

      console.log(`✅ Subtracted ${amount} points. New balance: ${newBalance}`);
      return true;
    } catch (error) {
      console.error('Error subtracting points:', error);
      return false;
    }
  }

  /**
   * Set points balance directly
   */
  static async setPoints(amount: number): Promise<boolean> {
    try {
      const sessionId = SessionManager.getSessionId();
      const clamped = Math.max(0, amount);
      
      try {
        // Set session context for RLS security
        await supabase.rpc('set_session_context', { session_id: sessionId });
        
        const { error } = await supabase
          .from('sessions')
          .update({ points_balance: clamped })
          .eq('id', sessionId);

        if (error && error.code === '42703') {
          console.log('⚠️ Database column missing, cannot persist points changes');
          return false;
        }

        if (error) {
          console.error('Error setting points:', error);
          return false;
        }
      } catch (dbError) {
        console.log('⚠️ Database column missing, cannot persist points changes');
        return false;
      }

      console.log(`✅ Set points balance to: ${clamped}`);
      return true;
    } catch (error) {
      console.error('Error setting points:', error);
      return false;
    }
  }

  /**
   * Calculate bonus points from completed tasks with correct positions
   */
  private static calculateBonusPointsWithPositions(completedTasks: any[], allTasks: any[]): number {
    let bonusPoints = 0;
    
    // Map completed tasks to their correct positions in the grid (0-24)
    const tasksWithPositions = completedTasks.map(task => {
      const position = allTasks.findIndex(t => t.id === task.id);
      return { ...task, position };
    }).filter(task => task.position !== -1);
    
    // Count colors using correct positions
    const colorCounts: Record<string, number> = {};
    tasksWithPositions.forEach((task) => {
      const color = this.colorPositions[task.position];
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    });
    
    console.log(`🔍 PointsManager Debug - Color counts:`, colorCounts);
    
    // Check for color-based bonuses
    Object.values(colorCounts).forEach((count: number) => {
      if (count >= 4) bonusPoints += 30; // 4x same color = 30 bonus
      if (count >= 5) bonusPoints += 25; // 5x same color = 25 bonus
    });
    
    // Check for star bonus (5 completed stars)
    const starPositions = [2, 6, 12, 19, 24];
    const completedStars = tasksWithPositions.filter(task => starPositions.includes(task.position)).length;
    if (completedStars >= 5) bonusPoints += 50; // 5 stars = 50 bonus
    
    // Check for row/column bonuses (only first completed row/column gets the bonus)
    let rowColumnBonus = 0;
    
    // Check for completed rows (5 tasks in a row)
    for (let row = 0; row < 5; row++) {
      const rowStart = row * 5;
      const rowTasks = tasksWithPositions.filter(task => 
        task.position >= rowStart && task.position < rowStart + 5
      );
      if (rowTasks.length === 5) {
        rowColumnBonus += 35; // First completed row = 35 bonus
        break; // Only award first completed row
      }
    }
    
    // Check for completed columns (5 tasks in a column)
    for (let col = 0; col < 5; col++) {
      const colTasks = tasksWithPositions.filter(task => 
        task.position % 5 === col
      );
      if (colTasks.length === 5) {
        rowColumnBonus += 35; // First completed column = 35 bonus
        break; // Only award first completed column
      }
    }
    
    return bonusPoints + rowColumnBonus;
  }

  /**
   * Calculate bonus points from completed tasks (legacy method)
   */
  private static calculateBonusPoints(completedTasks: any[]): number {
    let bonusPoints = 0;
    
    // Map tasks to positions for color counting
    const tasksWithPositions = completedTasks.map((task, index) => ({
      ...task,
      position: index
    }));
    
    // Count colors
    const colorCounts: Record<string, number> = {};
    tasksWithPositions.forEach((task) => {
      const color = this.colorPositions[task.position];
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    });
    
    console.log(`🔍 PointsManager Debug - Color counts:`, colorCounts);
    
    // Check for color-based bonuses
    Object.values(colorCounts).forEach((count: number) => {
      if (count >= 4) bonusPoints += 30; // 4x same color = 30 bonus
      if (count >= 5) bonusPoints += 25; // 5x same color = 25 bonus
    });
    
    // Check for star bonus (5 completed stars)
    const starPositions = [2, 6, 12, 19, 24];
    const completedStars = completedTasks.filter((_, index) => starPositions.includes(index)).length;
    if (completedStars >= 5) bonusPoints += 50; // 5 stars = 50 bonus
    
    // Check for row/column bonuses (only first completed row/column gets the bonus)
    let rowColumnBonus = 0;
    
    // Check for completed rows (5 tasks in a row)
    for (let row = 0; row < 5; row++) {
      const rowStart = row * 5;
      const rowTasks = completedTasks.filter((_, index) => 
        index >= rowStart && index < rowStart + 5
      );
      if (rowTasks.length === 5) {
        rowColumnBonus += 35; // First completed row = 35 bonus
        break; // Only award first completed row
      }
    }
    
    // Check for completed columns (5 tasks in a column)
    for (let col = 0; col < 5; col++) {
      const colTasks = completedTasks.filter((_, index) => 
        index % 5 === col
      );
      if (colTasks.length === 5) {
        rowColumnBonus += 35; // First completed column = 35 bonus
        break; // Only award first completed column
      }
    }
    
    return bonusPoints + rowColumnBonus;
  }

  /**
   * Reset all points to 0
   */
  static async resetPoints(): Promise<boolean> {
    try {
      const sessionId = SessionManager.getSessionId();
      
      // Set session context for RLS security
      await supabase.rpc('set_session_context', { session_id: sessionId });
      
      const { error } = await supabase
        .from('sessions')
        .update({ points_balance: 0 })
        .eq('id', sessionId);

      if (error) {
        console.error('Error resetting points:', error);
        return false;
      }

      console.log('✅ Points reset to 0');
      return true;
    } catch (error) {
      console.error('Error resetting points:', error);
      return false;
    }
  }
} 