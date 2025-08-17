import { supabase } from '@/integrations/supabase/client';

interface SessionSnapshot {
  session_id: string;
  created_at: string;
  bingo_tasks: any[];
  treasure_hunt: any[];
}

const BUCKET = 'session-backups';

export class SessionBackup {
  static async createSnapshot(sessionId: string): Promise<{ success: boolean; fileName?: string; error?: string }> {
    try {
      // Pull session-specific data
      const [bingoRes, treasureRes] = await Promise.all([
        supabase.from('bingo_tasks').select('*').eq('session_id', sessionId).order('id'),
        supabase.from('treasure_hunt').select('*').eq('session_id', sessionId).order('id')
      ]);

      const snapshot: SessionSnapshot = {
        session_id: sessionId,
        created_at: new Date().toISOString(),
        bingo_tasks: bingoRes.data || [],
        treasure_hunt: treasureRes.data || []
      };

      const fileName = `snapshot-${sessionId}-${snapshot.created_at.replace(/[:.]/g, '-')}.json`;
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(fileName, blob);
      if (uploadError) return { success: false, error: uploadError.message };
      return { success: true, fileName };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Unknown error' };
    }
  }

  static async listSnapshots(sessionId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase.storage.from(BUCKET).list('', { limit: 1000 });
      if (error || !data) return [];
      return data
        .map((f) => f.name)
        .filter((name) => name.startsWith(`snapshot-${sessionId}-`))
        .sort((a, b) => (a > b ? -1 : 1));
    } catch {
      return [];
    }
  }

  static async restoreSnapshot(sessionId: string, fileName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: file, error: downloadError } = await supabase.storage.from(BUCKET).download(fileName);
      if (downloadError || !file) return { success: false, error: downloadError?.message || 'Download failed' };
      const text = await file.text();
      const snapshot: SessionSnapshot = JSON.parse(text);

      // Basic validation
      if (snapshot.session_id !== sessionId) {
        return { success: false, error: 'Snapshot does not match selected session' };
      }

      // Replace session data
      // 1) clear existing
      await Promise.all([
        supabase.from('bingo_tasks').delete().eq('session_id', sessionId),
        supabase.from('treasure_hunt').delete().eq('session_id', sessionId)
      ]);

      // 2) insert fresh
      if (snapshot.bingo_tasks?.length) {
        const cleaned = snapshot.bingo_tasks.map((t: any) => ({ ...t }));
        await supabase.from('bingo_tasks').insert(cleaned);
      }
      if (snapshot.treasure_hunt?.length) {
        const cleaned = snapshot.treasure_hunt.map((t: any) => ({ ...t }));
        await supabase.from('treasure_hunt').insert(cleaned);
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Unknown error' };
    }
  }
}


