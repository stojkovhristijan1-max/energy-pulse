// Retry utility with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  description: string = 'Operation'
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 ${description} - Attempt ${attempt}/${maxRetries}`);
      const result = await fn();
      
      if (attempt > 1) {
        console.log(`✅ ${description} succeeded on attempt ${attempt}`);
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      console.log(`❌ ${description} failed on attempt ${attempt}:`, error instanceof Error ? error.message : error);
      
      if (attempt === maxRetries) {
        console.log(`🚫 ${description} failed after ${maxRetries} attempts`);
        throw lastError;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`⏳ Retrying ${description} in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}
