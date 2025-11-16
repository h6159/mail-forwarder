export default {
  async email(message, env, ctx) {
    const from = message.from;
    const to = message.to;

    // 获取原始邮件内容（raw）
    const rawEmail = await message.raw;

    // KV 映射：先查具体地址
    let targetEmail = await env.KV_CONFIG.get(to);

    if (!targetEmail) {
      // 再查域名 catch-all 映射
      const domain = to.split("@")[1];
      targetEmail = await env.KV_CONFIG.get("@" + domain);
    }

    if (!targetEmail) {
      // 如果是路由域名但没映射 → fallback 默认邮箱
      const domainList = env.ROUTE_DOMAINS.split(",").map(d => d.trim());
      const toDomain = to.split("@")[1];
      if (domainList.includes(toDomain)) {
        targetEmail = env.DEFAULT_EMAIL;
      }
    }

    if (!targetEmail) {
      // 不属于任何映射或路由域 → 记录日志，不转发
      const logKey = `log:${Date.now()}:${to}`;
      await env.KV_LOG.put(logKey, rawEmail);
      return;
    }

    // 使用 Resend API 转发
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: targetEmail,
        subject: message.headers.get("Subject") || "(no subject)",
        html: `<pre>${rawEmail}</pre>`,   // 或者根据你想保留的格式改
        text: rawEmail
      })
    });

    if (!resp.ok) {
      console.error("Resend 转发失败:", await resp.text());
    } else {
      console.log("邮件转发成功到", targetEmail);
    }
  }
};
