export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: { retries?: number; initialDelayMs?: number; maxDelayMs?: number; jitter?: boolean }
): Promise<T> {
  const retries = options?.retries ?? 5;
  const initialDelayMs = options?.initialDelayMs ?? 500;
  const maxDelayMs = options?.maxDelayMs ?? 8000;
  const jitter = options?.jitter ?? true;

  let attempt = 0;
  let delay = initialDelayMs;
  let lastError: any;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (e: any) {
      lastError = e;
      if (attempt === retries) break;
      const sleepMs = jitter ? Math.min(maxDelayMs, delay * (1 + Math.random())) : Math.min(maxDelayMs, delay);
      await new Promise((r) => setTimeout(r, sleepMs));
      delay = Math.min(maxDelayMs, delay * 2);
      attempt++;
    }
  }
  throw lastError;
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs = 10000, message = 'Operation timed out'): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}


