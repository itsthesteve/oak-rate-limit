import type { Context, Next } from "https://deno.land/x/oak@v16.1.0/mod.ts";
import type { RatelimitOptions } from "./types/types.d.ts";
import { DefaultOptions } from "./utils/defaults.ts";

export const RateLimiter = async (options?: Partial<RatelimitOptions>) => {
  const opt = { ...DefaultOptions, ...options };

  await opt.store.init(opt.withUrl);

  if (typeof opt.onRateLimit !== "function") {
    throw "onRateLimit must be a function.";
  }

  if (typeof opt.skip !== "function") throw "skip must be a function.";

  return async (ctx: Context, next: Next) => {
    const { ip, url } = ctx.request;
    const timestamp = Date.now();

    opt.store.setUrlKey(url);

    if (await opt.skip(ctx)) return next();
    if (opt.headers) {
      ctx.response.headers.set(
        "X-RateLimit-Limit",
        await opt.max(ctx).toString()
      );
    }

    const exists = await opt.store.has(ip);

    if (exists) {
      const entry = await opt.store.get(ip);
      if (exists && timestamp - entry.lastRequestTimestamp > opt.windowMs) {
        await opt.store.delete(ip);
      }
    }

    if (!opt.store.has(ip)) {
      opt.store.set(ip, {
        remaining: await opt.max(ctx),
        lastRequestTimestamp: timestamp,
      });
    }

    if (
      (await opt.store.has(ip)) &&
      (await opt.store.get(ip)!).remaining <= 0
    ) {
      await opt.onRateLimit(ctx, next, opt);
    } else {
      await next();
      // Make sure there's a value to use, or set it
      const entry = await opt.store.get(ip);
      if (!entry) {
        await opt.store.set(ip, {
          lastRequestTimestamp: Date.now(),
          remaining: await opt.max(ctx),
        });
      }

      if (opt.headers) {
        ctx.response.headers.set(
          "X-RateLimit-Remaining",
          entry
            ? (await opt.store.get(ip)!).remaining.toString()
            : await opt.max(ctx).toString()
        );
      }
      await opt.store.set(ip, {
        remaining: (await opt.store.get(ip)!).remaining - 1,
        lastRequestTimestamp: timestamp,
      });
    }
  };
};

export const onRateLimit = async (
  ctx: Context,
  _next: Next,
  opt: RatelimitOptions
): Promise<void> => {
  await opt.store.set(ctx.request.ip, {
    remaining: 0,
    lastRequestTimestamp: Date.now(),
  });
  ctx.response.status = opt.statusCode;
  if (opt.headers) {
    ctx.response.headers.set("X-RateLimit-Remaining", "0");
  }
  ctx.response.body = { error: opt.message };
  return;
};
