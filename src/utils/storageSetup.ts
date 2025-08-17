import { supabase } from '@/integrations/supabase/client';
import { SafeStorage } from './safeSupabase';
import { retryWithBackoff } from './retry';

export class StorageSetup {
  static async ensureStorageBuckets(): Promise<boolean> {
    try {
      console.log('🗄️ Checking storage buckets...');
      
      // Since the listing API doesn't work properly, we'll assume buckets exist
      // and test them directly with upload
      console.log('📋 Assuming buckets exist (listing API has issues)');
      
      // Test upload to bingo-photos bucket to verify it works
      const testData = new Blob(['test'], { type: 'text/plain' });
      const testFileName = `test-${Date.now()}.txt`;

      console.log('🧪 Testing bingo-photos bucket with upload...');
      
      const { data, error } = await SafeStorage.upload('bingo-photos', testFileName, testData);

      if (error) {
        console.error('❌ bingo-photos bucket test failed:', error);
        return false;
      }

      console.log('✅ bingo-photos bucket works!');

      // Clean up test file
      await SafeStorage.remove('bingo-photos', [testFileName]);

      console.log('✅ Test file cleaned up');
      console.log('🎯 Storage buckets are ready!');

      return true;

    } catch (error) {
      console.error('Error in storage setup:', error);
      return false;
    }
  }

  static async testStorageUpload(): Promise<boolean> {
    try {
      // Test upload a small text file
      const testData = new Blob(['test'], { type: 'text/plain' });
      const testFileName = `test-${Date.now()}.txt`;

      const { data, error } = await SafeStorage.upload('bingo-photos', `test/${testFileName}`, testData);

      if (error) {
        console.error('Storage test upload failed:', error);
        return false;
      }

      console.log('✅ Storage test upload successful:', data);

      // Clean up test file
      await SafeStorage.remove('bingo-photos', [`test/${testFileName}`]);

      return true;
    } catch (error) {
      console.error('Error in storage test:', error);
      return false;
    }
  }

  static async initializeStorage(): Promise<boolean> {
    console.log('🚀 Initializing Supabase Pro storage...');
    
    const bucketsReady = await this.ensureStorageBuckets();
    
    if (bucketsReady) {
      const testPassed = await this.testStorageUpload();
      if (testPassed) {
        console.log('🎉 Storage initialization complete!');
        return true;
      }
    }

    console.warn('⚠️ Storage initialization failed - using fallback mode');
    return false;
  }
} 

/**
 * Offline Backup Manager - Only activates when internet is down
 * Provides backup functionality for critical operations
 */
export class OfflineManager {
  private static pendingActions: Array<{
    id: string;
    type: 'photo_upload' | 'task_completion' | 'points_update' | 'treasure_found';
    data: any;
    timestamp: number;
  }> = [];

  static async initialize() {
    console.log('🔄 Initializing Offline Manager...');
    
    // Load pending actions from localStorage
    const stored = localStorage.getItem('offlinePendingActions');
    if (stored) {
      this.pendingActions = JSON.parse(stored);
      console.log(`📦 Loaded ${this.pendingActions.length} pending actions`);
    }

    // Setup connectivity listeners
    this.setupConnectivityListener();
    
    // Try to sync any pending actions
    if (navigator.onLine) {
      await this.syncPendingActions();
    }
  }

  static setupConnectivityListener() {
    window.addEventListener('online', () => {
      console.log('🌐 Internet connection restored - syncing pending actions');
      this.syncPendingActions();
    });

    window.addEventListener('offline', () => {
      console.log('📴 App is offline - actions will be queued');
    });
  }

  static async queueAction(type: "photo_upload" | "task_completion" | "points_update" | "treasure_found", data: any) {
    const action = {
      id: Math.random().toString(36).substring(7),
      type,
      data,
      timestamp: Date.now()
    };

    this.pendingActions.push(action);
    this.savePendingActions();

    console.log(`📝 Queued ${type} action for later sync`);

    // Try to sync immediately if online
    if (navigator.onLine) {
      await this.syncPendingActions();
    }
  }

  static async syncPendingActions() {
    if (!navigator.onLine || this.pendingActions.length === 0) return;

    console.log(`🔄 Syncing ${this.pendingActions.length} pending actions...`);

    for (const action of [...this.pendingActions]) {
      try {
        switch (action.type) {
          case 'photo_upload':
            await this.syncPhotoUpload(action.data);
            break;
          case 'task_completion':
            await this.syncTaskCompletion(action.data);
            break;
          case 'points_update':
            await this.syncPointsUpdate(action.data);
            break;
          case 'treasure_found':
            await this.syncTreasureFound(action.data);
            break;
        }

        // Remove successful action
        this.pendingActions = this.pendingActions.filter(a => a.id !== action.id);
        this.savePendingActions();
        console.log(`✅ Synced ${action.type} action`);
      } catch (error) {
        console.error(`❌ Failed to sync ${action.type} action:`, error);
        // Keep action in queue for retry
      }
    }
  }

  private static async syncPhotoUpload(data: any) {
    // Upload photo to Supabase
    const { data: uploadData, error } = await SafeStorage.upload('bingo-photos', data.fileName, data.file);

    if (error) throw error;

    // Update task with photo URL
    const publicUrl = SafeStorage.getPublicUrl('bingo-photos', data.fileName);

    // Set session context for RLS security
    await supabase.rpc('set_session_context', { session_id: data.sessionId });
    
    await supabase
      .from('bingo_tasks')
      .update({ photo_url: publicUrl })
      .eq('id', data.taskId);

    // Auto-backup photo on event day
    try {
      const { PhotoBackup } = await import('./photoBackup');
      await PhotoBackup.backupPhoto(
        data.fileName,
        publicUrl,
        'bingo',
        data.taskId
      );
    } catch (error) {
      console.error('Error backing up photo:', error);
      // Don't throw error - backup failure shouldn't break upload
    }
  }

  private static async syncTaskCompletion(data: any) {
    // Set session context for RLS security
    await supabase.rpc('set_session_context', { session_id: data.sessionId });
    
    await supabase
      .from('bingo_tasks')
      .update({ 
        completed: true, 
        completed_at: new Date().toISOString() 
      })
      .eq('id', data.taskId);
  }

  private static async syncPointsUpdate(data: any) {
    // Set session context for RLS security
    await supabase.rpc('set_session_context', { session_id: data.sessionId });
    
    await supabase
      .from('sessions')
      .update({ points_balance: data.points })
      .eq('id', data.sessionId);
  }

  private static async syncTreasureFound(data: any) {
    // Set session context for RLS security
    await supabase.rpc('set_session_context', { session_id: data.sessionId });
    
    await supabase
      .from('treasure_hunt')
      .update({ 
        found: true, 
        found_at: new Date().toISOString() 
      })
      .eq('id', data.locationId);
  }

  private static savePendingActions() {
    localStorage.setItem('offlinePendingActions', JSON.stringify(this.pendingActions));
  }

  static getPendingActionsCount() {
    return this.pendingActions.length;
  }

  static isOnline() {
    return navigator.onLine;
  }

  static getOfflineStatus() {
    return {
      isOnline: navigator.onLine,
      pendingActions: this.pendingActions.length,
      lastSync: localStorage.getItem('lastOfflineSync')
    };
  }
} 