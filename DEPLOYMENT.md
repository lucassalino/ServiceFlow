# Deployment — ServiceFlow

A app corre em **Cloudflare Workers** (via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare))
usando a **integração nativa Git do Cloudflare** (Workers Builds). Cada push a uma branch
faz deploy automático — não são precisos GitHub Actions nem secrets no GitHub.

| Ambiente | Branch | Worker no Cloudflare |
|----------|--------|----------------------|
| **DEV**  | `dev`  | `serviceflow-dev`    |
| **PRD**  | `prd`  | `serviceflow-prd`    |

> **Nota:** O GitHub Pages **não** é usado — só serve ficheiros estáticos e não suporta
> o middleware de autenticação nem os Server Components deste projeto.

---

## Configuração no Cloudflare (uma só vez, por ambiente)

No dashboard (**dash.cloudflare.com → Workers & Pages → Create → Continue with GitHub**):

1. Autoriza o Cloudflare a aceder ao repositório `lucassalino/ServiceFlow`.
2. Escolhe a **branch de produção** (`prd` para o Worker de produção, `dev` para o de dev).
3. Define os comandos:
   - **Build command:** `npx opennextjs-cloudflare build`
   - **Deploy command:** `npx wrangler deploy --env prd` (ou `--env dev`)
4. Adiciona as **variáveis de ambiente** (Build + Runtime):
   | Variável | Valor |
   |----------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://ikhxbczktmwkeglomgrv.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | a anon key do Supabase |
5. Guarda e faz o primeiro deploy.

Repete para o segundo ambiente ligando a branch `dev` a um Worker `serviceflow-dev`.

---

## Deploy manual (a partir do teu computador)

```bash
npm install
npx wrangler login

npm run cf:preview      # preview local no runtime do Workers
npm run cf:deploy:dev   # → serviceflow-dev
npm run cf:deploy:prd   # → serviceflow-prd
```

---

## Ficheiros relevantes

- `wrangler.jsonc` — config do Worker e dos dois ambientes (`env.dev`, `env.prd`)
- `open-next.config.ts` — adaptador OpenNext → Cloudflare
- `package.json` — scripts `cf:*`
