import { supabase } from '@/integrations/supabase/client';
import { retryWithBackoff, withTimeout } from './retry';

// Optional event prefixing helper
const withEventPrefix = (path: string) => {
  try {
    const eventId = localStorage.getItem('currentEventId');
    if (eventId && !path.startsWith(eventId + '/')) {
      return `${eventId}/${path}`;
    }
  } catch {}
  return path;
};

export const SafeStorage = {
  async upload(bucket: string, path: string, body: Blob | File) {
    const fullPath = withEventPrefix(path);
    return retryWithBackoff(() => withTimeout(
      supabase.storage.from(bucket).upload(fullPath, body),
      20000,
      'Upload timed out'
    ));
  },
  async remove(bucket: string, paths: string[]) {
    const prefixed = paths.map(p => withEventPrefix(p));
    return retryWithBackoff(() => withTimeout(
      supabase.storage.from(bucket).remove(prefixed),
      15000,
      'Remove timed out'
    ));
  },
  getPublicUrl(bucket: string, path: string) {
    const fullPath = withEventPrefix(path);
    return supabase.storage.from(bucket).getPublicUrl(fullPath).data.publicUrl;
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


