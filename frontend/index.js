export default {
  async fetch(request, env, ctx) {
    try {
      const response = await env.ASSETS.fetch(request);
      if (response.status !== 404) {
        return response;
      }
    } catch (e) {
      // Fallback
    }
    return new Response("DGII Asistente online", {
      headers: { "content-type": "text/html;charset=UTF-8" },
    });
  },
};
