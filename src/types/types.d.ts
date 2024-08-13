import { Context } from "https://deno.land/x/oak@v16.1.0/context.ts";
import { Store } from "../stores/AbstractStore.ts";

export interface Ratelimit {
  remaining: number;
  lastRequestTimestamp: number;
}

export interface RatelimitOptions {
  windowMs: number;
  max: (ctx: Context) => Promise<number> | number;
  withUrl: boolean;
  store: Store;
  headers: boolean;
  message: string;
  statusCode: number;
  skip: (ctx: Context) => Promise<boolean> | boolean;
  onRateLimit: (
    ctx: Context,
    next: () => Promise<unknown>,
    opt: RatelimitOptions
  ) => unknown;
}
