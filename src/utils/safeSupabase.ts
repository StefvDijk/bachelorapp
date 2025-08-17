import { supabase } from '@/integrations/supabase/client';
import { retryWithBackoff, withTimeout } from './retry';

export const SafeStorage = {
  async upload(bucket: string, path: string, body: Blob | File) {
    return retryWithBackoff(() => withTimeout(
      supabase.storage.from(bucket).upload(path, body),
      20000,
      'Upload timed out'
    ));
  },
  async remove(bucket: string, paths: string[]) {
    return retryWithBackoff(() => withTimeout(
      supabase.storage.from(bucket).remove(paths),
      15000,
      'Remove timed out'
    ));
  },
  getPublicUrl(bucket: string, path: string) {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
};

export const SafeDb = {
  async update(table: string, values: any, match: Record<string, any>) {
    return retryWithBackoff(async () => {
      const response = await supabase.from(table as any).update(values).match(match);
      if (response.error) throw response.error;
      return response;
    });
  },
  async insert(table: string, rows: any[]) {
    return retryWithBackoff(async () => {
      const response = await supabase.from(table as any).insert(rows);
      if (response.error) throw response.error;
      return response;
    });
  },
  async select(table: string, query: string, filters?: (q: any) => any) {
    return retryWithBackoff(async () => {
      let q = supabase.from(table as any).select(query);
      if (filters) q = filters(q);
      const response = await q;
      if (response.error) throw response.error;
      return response;
    });
  }
};


