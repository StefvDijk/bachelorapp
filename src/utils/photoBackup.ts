import { supabase } from '@/integrations/supabase/client';

interface BackupPhoto {
  id: string;
  fileName: string;
  originalUrl: string;
  backupUrl: string;
  uploadedAt: string;
  sourceType: 'bingo' | 'treasure' | 'challenge' | 'party';
  sourceId?: number;
  uploaderName?: string;
}

export class PhotoBackup {
  private static readonly BACKUP_BUCKET = 'bachelor-party-backups';
  private static readonly EVENT_DATES = ['2025-08-16', '2025-08-17']; // Event dates: 16 and 17 August 2025

  /**
   * Automatically backup a photo when it's uploaded
   */
  static async backupPhoto(
    originalFileName: string,
    originalUrl: string,
    sourceType: 'bingo' | 'treasure' | 'challenge' | 'party',
    sourceId?: number,
    uploaderName?: string
  ): Promise<void> {
    try {
      // Check if we're on the event dates
      const today = new Date().toISOString().split('T')[0];
      const isEventDay = this.EVENT_DATES.includes(today);
      
      if (!isEventDay) {
        console.log('Not event day, skipping backup');
        return;
      }

      // Create backup filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `backup-${timestamp}-${originalFileName}`;

      // Download the original photo
      const { data: originalPhoto, error: downloadError } = await supabase.storage
        .from('bingo-photos')
        .download(originalFileName);

      if (downloadError) {
        console.error('Error downloading original photo:', downloadError);
        return;
      }

      // Upload to backup bucket
      const { error: uploadError } = await supabase.storage
        .from(this.BACKUP_BUCKET)
        .upload(backupFileName, originalPhoto, {
          contentType: originalPhoto.type,
          metadata: {
            originalFileName,
            sourceType,
            sourceId: sourceId?.toString(),
            uploaderName,
            eventDate: this.EVENT_DATES[0], // Use first event date for metadata
            backupTimestamp: timestamp
          }
        });

      if (uploadError) {
        console.error('Error uploading backup:', uploadError);
        return;
      }

      // Store backup record in localStorage for tracking
      const backupRecords = JSON.parse(localStorage.getItem('photoBackups') || '[]');
      backupRecords.push({
        originalFileName,
        backupFileName,
        originalUrl,
        sourceType,
        sourceId,
        uploaderName,
        eventDate: this.EVENT_DATES[0], // Use first event date for metadata
        backupTimestamp: timestamp
      });
      localStorage.setItem('photoBackups', JSON.stringify(backupRecords));

      console.log(`✅ Photo backed up: ${backupFileName}`);
    } catch (error) {
      console.error('Error in photo backup:', error);
    }
  }

  /**
   * Create a manual backup of all current photos
   */
  static async createManualBackup(): Promise<{ success: boolean; message: string }> {
    try {
      // Get all photos from storage
      const { data: photoFiles, error: listError } = await supabase.storage
        .from('bingo-photos')
        .list('', { limit: 1000 });

      if (listError) {
        throw new Error(`Failed to list photos: ${listError.message}`);
      }

      if (!photoFiles || photoFiles.length === 0) {
        return { success: true, message: 'No photos to backup' };
      }

      const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
      let backedUpCount = 0;

      for (const file of photoFiles) {
        try {
          // Download original
          const { data: originalPhoto, error: downloadError } = await supabase.storage
            .from('bingo-photos')
            .download(file.name);

          if (downloadError) {
            console.error(`Error downloading ${file.name}:`, downloadError);
            continue;
          }

          // Upload to backup
          const backupFileName = `manual-backup-${backupTimestamp}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from(this.BACKUP_BUCKET)
            .upload(backupFileName, originalPhoto, {
              contentType: originalPhoto.type,
              metadata: {
                originalFileName: file.name,
                manualBackup: 'true',
                backupTimestamp,
                eventDate: this.EVENT_DATES[0]
              }
            });

          if (uploadError) {
            console.error(`Error uploading backup for ${file.name}:`, uploadError);
            continue;
          }

          backedUpCount++;
        } catch (error) {
          console.error(`Error backing up ${file.name}:`, error);
        }
      }

      return { 
        success: true, 
        message: `Successfully backed up ${backedUpCount} of ${photoFiles.length} photos` 
      };
    } catch (error) {
      console.error('Error in manual backup:', error);
      return { 
        success: false, 
        message: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Get all backup photos
   */
  static async getBackupPhotos(): Promise<BackupPhoto[]> {
    try {
      const { data: backupFiles, error } = await supabase.storage
        .from(this.BACKUP_BUCKET)
        .list('', { limit: 1000 });

      if (error) {
        console.error('Error listing backup photos:', error);
        return [];
      }

      return backupFiles.map(file => ({
        id: file.id || file.name,
        fileName: file.name,
        originalUrl: '', // Would need to be constructed
        backupUrl: supabase.storage.from(this.BACKUP_BUCKET).getPublicUrl(file.name).data.publicUrl,
        uploadedAt: file.created_at || new Date().toISOString(),
        sourceType: 'bingo' as const, // Default, would need to parse from metadata
        sourceId: undefined,
        uploaderName: undefined
      }));
    } catch (error) {
      console.error('Error getting backup photos:', error);
      return [];
    }
  }

  /**
   * Check if we're on the event day
   */
  static isEventDay(): boolean {
    const today = new Date().toISOString().split('T')[0];
    return this.EVENT_DATES.includes(today);
  }

  /**
   * Get backup statistics
   */
  static async getBackupStats(): Promise<{
    totalBackups: number;
    eventDayBackups: number;
    manualBackups: number;
    lastBackup?: string;
  }> {
    try {
      const { data: backupFiles } = await supabase.storage
        .from(this.BACKUP_BUCKET)
        .list('', { limit: 1000 });

      if (!backupFiles) {
        return { totalBackups: 0, eventDayBackups: 0, manualBackups: 0 };
      }

      const eventDayBackups = backupFiles.filter(file => 
        this.EVENT_DATES.some(date => file.name.includes(date))
      ).length;

      const manualBackups = backupFiles.filter(file => 
        file.name.includes('manual-backup')
      ).length;

      const lastBackup = backupFiles.length > 0 
        ? backupFiles.sort((a, b) => 
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          )[0].created_at
        : undefined;

      return {
        totalBackups: backupFiles.length,
        eventDayBackups,
        manualBackups,
        lastBackup
      };
    } catch (error) {
      console.error('Error getting backup stats:', error);
      return { totalBackups: 0, eventDayBackups: 0, manualBackups: 0 };
    }
  }
} 