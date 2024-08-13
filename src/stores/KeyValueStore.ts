import { Ratelimit } from "../types/types.d.ts";
import { Store } from "./AbstractStore.ts";

// Primary key prefix to store IPs in
const STORE_KEY = "ratelimit";

const getKey = (url: URL | null, ip: string): Deno.KvKey => {
  if (url) {
    return [STORE_KEY, url.toString(), ip];
  }

  return [STORE_KEY, ip];
};

export class KeyValueStore extends Store {
  private withUrl: boolean = false;
  private url: URL | null = null;

  // Default key just has the prefix
  constructor(private readonly store: Deno.Kv) {
    super();
  }

  public init(withUrl: boolean) {
    this.withUrl = withUrl;
    return;
  }

  public setUrlKey(url: URL): void {
    if (!this.withUrl) {
      console.warn("options.withUrl is false, unable to update KV key.");
      return;
    }

    this.url = url;
  }

  public async has(_ip: string): Promise<boolean> {
    const entry = await this.store.get(getKey(this.url, _ip));
    return !!entry.value;
  }

  public async get(_ip: string) {
    const entry = await this.store.get(getKey(this.url, _ip));
    return entry.value as Ratelimit;
  }

  /**
   * @throws {Error} If the ratelimit is unable to be saved
   */
  public async set(_ip: string, _ratelimit: Ratelimit): Promise<Ratelimit> {
    const result = await this.store.set(getKey(this.url, _ip), _ratelimit);

    if (result.ok) {
      return _ratelimit;
    } else {
      throw new Error("Unable to set ratelimit value");
    }
  }

  public async delete(_ip: string): Promise<void> {
    await this.store.delete(getKey(this.url, _ip));
  }
}
