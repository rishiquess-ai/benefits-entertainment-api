// In-memory cache that keeps values until the app restarts. It stores
// promises, so concurrent callers for the same key share one load. Failed
// loads are not cached.
export class PromiseCache<T> {
  private readonly entries = new Map<string, Promise<T>>();

  get(key: string, load: () => Promise<T>): Promise<T> {
    const cached = this.entries.get(key);
    if (cached) {
      return cached;
    }

    const value = load();
    this.entries.set(key, value);
    value.catch(() => {
      if (this.entries.get(key) === value) {
        this.entries.delete(key);
      }
    });
    return value;
  }
}
