# Deployment — ServiceFlow

A app corre em **Cloudflare Workers** (via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare)) em dois ambientes:

| Ambiente | Branch | Worker no Cloudflare | Trigger |
|----------|--------|----------------------|---------|
| **DEV**  | `dev`  | `serviceflow-dev`    | push para `dev` |
| **PRD**  | `prd`  | `serviceflow-prd`    | push para `prd` |

> **Nota:** O GitHub Pages **não** é usado — só serve ficheiros estáticos e não suporta
> o middleware de autenticação nem os Server Components deste projeto. Ambos os ambientes
> correm no Cloudflare com SSR completo.

---

## Fluxo de trabalho

```
feature branch → PR → dev  (deploy automático para serviceflow-dev)
dev  → PR → prd            (deploy automático para serviceflow-prd)
```

Cada `git push` para `dev` ou `prd` dispara o workflow correspondente em
`.github/workflows/` que faz build com OpenNext e deploy com Wrangler.

---

## Configuração inicial (uma só vez)

### 1. Conta Cloudflare
1. Cria conta em https://dash.cloudflare.com
2. Vai a **Workers & Pages** para confirmar que Workers está ativo.
3. Copia o **Account ID** (barra lateral direita em Workers & Pages).

### 2. API Token do Cloudflare
1. https://dash.cloudflare.com/profile/api-tokens → **Create Token**
2. Usa o template **"Edit Cloudflare Workers"**
3. Cria e copia o token (só é mostrado uma vez).

### 3. Secrets no GitHub
No repositório: **Settings → Secrets and variables → Actions → New repository secret**.
Adiciona os quatro:

| Secret | Valor |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | o token criado no passo 2 |
| `CLOUDFLARE_ACCOUNT_ID` | o Account ID do passo 1 |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ikhxbczktmwkeglomgrv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | a anon key do Supabase |

> As variáveis `NEXT_PUBLIC_*` são embutidas no build, por isso têm de estar
> disponíveis no passo de build do workflow (já configurado nos YAML).

### 4. (Opcional) GitHub Environments
Em **Settings → Environments** cria `development` e `production`.
No `production` podes ativar **Required reviewers** para exigir aprovação
manual antes de cada deploy de PRD.

---

## Deploy manual (a partir do teu computador)

```bash
npm install

# Preview local no runtime do Workers
npm run cf:preview

# Deploy manual
npm run cf:deploy:dev   # → serviceflow-dev
npm run cf:deploy:prd   # → serviceflow-prd
```

Para deploy manual precisas de estar autenticado:
```bash
npx wrangler login
```

---

## Domínios personalizados

No dashboard Cloudflare, em cada Worker (**serviceflow-dev** / **serviceflow-prd**):
**Settings → Domains & Routes → Add** → liga o subdomínio pretendido
(ex.: `dev.servi​ceflow.app` e `app.serviceflow.app`).

---

## Ficheiros relevantes

- `wrangler.jsonc` — config do Worker e dos dois ambientes (`env.dev`, `env.prd`)
- `open-next.config.ts` — adaptador OpenNext → Cloudflare
- `.github/workflows/deploy-dev.yml` — CI/CD do DEV
- `.github/workflows/deploy-prd.yml` — CI/CD do PRD
