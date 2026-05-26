/**
 * Простой backend для синхронизации профиля Radio.
 *
 * 1. Создайте KV namespace PROFILES в Cloudflare Workers.
 * 2. Задеплойте worker и укажите URL в sync/config.json репозитория.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);

    if (parts.length !== 3 || parts[0] !== "v1" || parts[1] !== "profiles") {
      return new Response("Not found", { status: 404 });
    }

    const syncCode = parts[2].replace(/[^a-z0-9]/gi, "").toLowerCase();
    if (syncCode.length < 8) {
      return new Response("Invalid sync code", { status: 400 });
    }

    if (request.method === "GET") {
      const data = await env.PROFILES.get(syncCode);
      if (!data) {
        return new Response("Not found", { status: 404 });
      }
      return new Response(data, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    if (request.method === "PUT") {
      const body = await request.text();
      if (!body) {
        return new Response("Empty body", { status: 400 });
      }
      await env.PROFILES.put(syncCode, body);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }

    return new Response("Method not allowed", { status: 405 });
  },
};
