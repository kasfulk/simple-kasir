export async function getJSON<T>(url: string): Promise<T | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const text = await res.text();
        if (text) return JSON.parse(text) as T;
      }
    } catch {
      // retry sekali: race restart/recompile dev server
    }
    if (attempt === 0) {
      const { promise, resolve } = Promise.withResolvers<void>();
      setTimeout(resolve, 600);
      await promise;
    }
  }
  return null;
}