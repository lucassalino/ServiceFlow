# WIS — Services (repo: ServiceFlow)

PWA de gestão de escalas de ministérios de igreja. Em produção em
**wis-services.com**.

> **App mobile (Expo):** se estiveres a trabalhar no cliente Expo, lê primeiro
> os docs versionados em https://docs.expo.dev/versions/v56.0.0/ — a API mudou.

---

## Stack

Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind v4 ·
Supabase (Postgres + Auth + Storage + RLS) · TanStack Query · Zustand ·
react-hook-form + zod · sonner · Serwist (PWA) ·
deploy em **Cloudflare Workers** via `@opennextjs/cloudflare`.

Projeto Supabase: `ikhxbczktmwkeglomgrv`

---

## Deploy — LEIA ISTO ANTES DE MEXER

São **dois Workers**, cada um ligado ao repositório com a sua própria config:

| Worker | Domínio | Branch de produção |
|---|---|---|
| `serviceflow` | **wis-services.com** | `prd` |
| `serviceflow-dev` | `serviceflow-dev…workers.dev` | `dev` |

- Não existe `serviceflow-prd`. O `--env prd` no Deploy command **não** muda o
  Worker de destino — o Workers Builds publica sempre no Worker a que está
  ligado. Não "corrijas" esse comando a pensar que está errado.
- **Armadilha que já nos mordeu:** no Worker de produção, "Builds for
  non-production branches" estava **Enabled** com o Version command
  `npx wrangler deploy`. Como `deploy` assume 100% do tráfego, **pushes para
  `dev` iam ao ar em wis-services.com**. Se voltar a acontecer: desliga essa
  opção, ou troca o Version command por `npx wrangler versions upload`.
- **As duas branches `dev` e `prd` devem estar alinhadas** salvo quando há
  trabalho por validar. Confirma antes de assumir separação real:
  `git log origin/prd..origin/dev`

### Secrets
Lidos por **`process.env.X`** — é o padrão do repo.
**`getCloudflareContext()` NÃO é usado em lado nenhum**; não introduzas um
segundo padrão. O OpenNext popula `process.env` a partir dos Secrets do Worker.

| Variável | Onde vive |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` | `wrangler.jsonc` (são públicas) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** no painel — NUNCA no `wrangler.jsonc` |
| `RESEND_API_KEY` | **Secret** no painel (opcional; sem ela os emails são ignorados) |
| `STRIPE_SECRET_KEY` | **Secret** no painel — modo teste (`sk_test_`) em dev, live (`sk_live_`) só em `prd` |
| `STRIPE_WEBHOOK_SECRET` | **Secret** no painel — `whsec_...` do endpoint de webhook; teste e live têm segredos diferentes |

### Armadilhas de build já sofridas (não repetir)
1. **Nunca regeneres o `package-lock.json` sem necessidade.** Já partiu o build
   duas vezes. O lock TEM de conter os binários de **todas as plataformas**
   (`@esbuild/darwin-*`, `@next/swc-win32-*`, `@img/sharp-*`…). Gerar com
   `--package-lock-only` produz um lock incompleto que o `npm ci` rejeita.
   Se tiveres mesmo de o refazer: apaga-o e corre `npm install` completo, depois
   valida com `npm ci --dry-run` num diretório limpo.
2. `ajv@^8.17.1` está declarado na raiz **de propósito** — força a árvore certa
   (ajv 8 no topo para `@hookform/resolvers`, ajv 6 aninhado sob o eslint).
   Não o removas.
3. O erro do `npm ci` no painel aparece truncado: as linhas úteis estão logo a
   seguir a `npm error code EUSAGE`, no **início** do bloco.

---

## Regras de ouro do código

### Server Actions não podem lançar erros com informação
O Next **apaga as mensagens de `Error` em produção**. Se o cliente precisa de
distinguir o motivo da falha, a action tem de **devolver** um objeto tipado.
Ver `src/lib/plan-limits.ts` (`PlanGuarded`, `unwrapPlanGuarded`): a action
devolve, o **hook** converte em `PlanLimitError` no cliente.

### Middleware
`src/lib/supabase/middleware.ts` protege tudo por omissão. Rotas que têm de
ser públicas (feed de calendário, páginas legais) precisam de ser abertas lá
explicitamente — senão são redirecionadas para `/login` sem aviso.

### Escritas idempotentes
`ministry_members` tem `unique(ministry_id, user_id)`. Usa sempre
**dedup + `upsert` com `onConflict`**, nunca `insert` puro — já causou 500s em
produção.

### Tipos gerados do Supabase
Estão desatualizados face às migrações recentes. Para tabelas/RPCs novas,
faz cast local (`supabase.rpc.bind(supabase) as any`) com comentário a apontar
a migração. Não desligues o strict mode.

---

## Modelo de dados (essencial)

```
organizations ─┬─ organization_members (role: admin|leader|member)
               ├─ ministries ── ministry_members
               ├─ events ─ event_ministries ─ event_schedules
               │                            └─ event_setlists / event_timeline_items
               ├─ songs (→ catalog_songs, catálogo global partilhado)
               ├─ member_unavailability
               ├─ org_subscriptions (→ plans)
               └─ calendar_feed_tokens
```

**RLS:** 61 políticas, quase todas via 3 helpers — `is_org_member`,
`is_org_admin`, `is_org_admin_or_leader`. Mexer neles afeta a app inteira.

**Enforcement de limites** vive em Server Actions com service-role, **não em
RLS**. É dívida técnica conhecida.

---

## Planos (Fase 1 + 1.5 concluídas)

| Plano | €/mês | Pessoas | Min. | Admin | Líderes |
|---|---|---|---|---|---|
| Semente | 0 | 10 | 1 | 1 | 0 |
| Broto | 9,99 | 25 | 5 | 1 | 0 |
| Colheita | 19,99 | 60 | ∞ | 1 | 3 |
| Celeiro | 39,99 | ∞ | ∞ | 1 | ∞ |

- **Admin é sempre 1**, em qualquer plano — quem varia por plano é o número
  de líderes (migração 030, `plans.max_leaders`). Semente/Broto não incluem
  líderes de todo (só o admin gere a organização).
- **Limites por quantidade:** RPC `check_plan_limit(org, resource)` — recursos
  `people` | `ministry` | `admin` | `leader`.
- **Funcionalidades:** coluna `plans.features` + RPC `org_has_feature`
- **Cortesia:** `org_subscriptions.source = 'manual'` → plano pago sem custo.
  AMN-Vizela e MyChurch estão assim. Mostra selo "Cortesia" na UI.
- Mudar preços/limites/features é um **UPDATE**, não um deploy.

---

## Decisões de produto a respeitar

- **Não existem "faltas".** A app regista a *resposta* à escala
  (`confirmed` true/false/**null = nunca respondeu**), não a *presença*.
  Nos dados reais, 16 de 22 escalações estão sem resposta — chamar-lhes faltas
  seria falso. Os relatórios dizem "sem resposta".
- **Multi-campus está em standby.** Uma igreja com vários campus cria uma
  organização (e assinatura) por campus. Não anunciar multi-campus nos planos.
- **Notificações são manuais**, não automáticas ao publicar. Há 3 canais
  independentes com escolha de destinatários: app (sino), WhatsApp, email.
- **Emails:** cliente próprio com `fetch` (sem SDK, para poupar bundle).
  Nunca lança — falha de email não impede publicar a escala. Respeita opt-out,
  deduplica por evento e trava aos 90 envios/dia.

---

## Contactos (Cloudflare Email Routing → Gmail)

`support@` (ajuda) · `contact@` (RGPD) · `notifications@` (remetente app) ·
`accounts@` (remetente auth). Só **recebem**; o envio é via Resend.

---

## Por fazer

- Chave do Resend (Secret `RESEND_API_KEY`) — sem ela os emails não saem
- Job agendado de lembretes (decidir: Cloudflare Cron Triggers)
- Pagamento real (Stripe) — Setup, Checkout, Billing Portal, Webhooks e a
  decisão de downgrade (voltar ao Semente, `downgraded_locked` se ficar acima
  dos limites, ecrã "escolher o que fica ativo") feitos (dev). **Falta**: a
  aplicação real do "só leitura" nas telas de escala/ministérios/membros —
  hoje `organizations.active_ministry_ids/active_member_ids` são guardados
  mas ainda não são lidos para bloquear edição dos recursos não escolhidos.
  Falta também configurar o endpoint de webhook + `STRIPE_WEBHOOK_SECRET` no
  Cloudflare quando for para produção (ver Fase 2 em curso)
- Validar em produção: feed de calendário (colar no Google Calendar)
