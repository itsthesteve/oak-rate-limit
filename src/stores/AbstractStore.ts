import type { Ratelimit } from "../types/types.d.ts";

export abstract class Store {
  public init(_withUrl: boolean): Promise<void> | void {
    throw "Not implemented";
  }

  public get(_ip: string): Promise<Ratelimit> | Ratelimit | undefined {
    throw "Not implemented";
  }

  public setUrlKey(_url: URL): void {
    throw "No implemented";
  }

  public set(
    _ip: string,
    _ratelimit: Ratelimit
  ): Promise<Ratelimit> | Map<string, Ratelimit> {
    throw "Not implemented";
  }

  public delete(_ip: string): Promise<boolean | void> | boolean {
    throw "Not implemented";
  }

  public has(_ip: string): Promise<boolean> | boolean {
    throw "Not implemented";
  }
}
