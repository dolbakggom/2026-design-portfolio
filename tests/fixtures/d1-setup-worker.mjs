export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
    await env.DB.prepare(await request.text()).run();
    return new Response("ok");
  }
};
