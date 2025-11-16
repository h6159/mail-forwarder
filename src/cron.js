export default {
  async fetch(request, env) {
    const now = Date.now();
    const expireTime = 180 * 24 * 60 * 60 * 1000;
    const KV_LOG = env.KV_LOG;

    let cursor;
    do {
      const list = await KV_LOG.list({ cursor, limit: 1000 });
      for (const key of list.keys) {
        const ts = parseInt(key.name.split(':')[1], 10);
        if (now - ts > expireTime) await KV_LOG.delete(key.name);
      }
      cursor = list.cursor;
    } while (cursor);

    return new Response('Old logs cleared', { status: 200 });
  }
};
