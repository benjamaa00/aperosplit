export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      fetch("https://aperosplit.onrender.com/health", {
        method: "GET",
        headers: { "User-Agent": "aperosplit-keepalive" },
      }).catch(() => {})
    );
  },
};
