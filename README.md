# Workers 邮件转发器

## 部署步骤
1. 安装 Wrangler: npm install -g wrangler
2. 登录 Cloudflare: wrangler login
3. 创建 KV 命名空间:
   wrangler kv:namespace create "KV_CONFIG"
   wrangler kv:namespace create "KV_LOG"
4. 设置 Resend API Key:
   wrangler secret put RESEND_API_KEY
5. 修改 wrangler.toml:
   - KV namespace ID
   - CONFIG_URL
   - DEFAULT_EMAIL
6. 部署 Workers: wrangler publish
7. 配置 Cloudflare Route 指向 Workers URL

## 环境变量说明
| 变量名 | 类型 | 用途 |
|--------|------|------|
| RESEND_API_KEY | Secret | Resend 邮件 API Key |
| CONFIG_URL | Var | GitHub 原始配置 JSON URL |
| DEFAULT_EMAIL | Var | 默认收件邮箱 |
| KV_CONFIG | KV | 存储配置 JSON |
| KV_LOG | KV | 存储邮件日志 |
