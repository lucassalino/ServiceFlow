# WIS — Worship In Sync
### Resumo da aplicação + Prompt de recriação (funcionalidades e estilos)
Branch analisada: `full-features-2026-07` · App em produção: Cloudflare Workers

---

## PARTE A — RESUMO DA APP

**O que é:** PWA (web app instalável) de **gestão de ministérios e escalas para igrejas**. Uma igreja = uma *organização*. Gere membros, ministérios (Louvor, Sonoplastia, Multimédia…), eventos/cultos, escalas de pessoas por função, repertório de músicas (setlist), roteiro do culto e notificações — com confirmação de presença.

**Quem usa e o que pode fazer (papéis):**
- **Admin** — vê tudo (inclui rascunhos), gere membros e cargos, convida, cria/edita/elimina eventos, edita a organização, vê emails, publica & notifica escalas.
- **Líder / Membro** — vê só eventos **publicados** + onde está escalado; não cria eventos; não vê emails de outros; só confirma a **sua** presença.

**Pilares:**
- **Multi-organização** — um utilizador pertence a várias igrejas e alterna entre elas; entra direto na última usada.
- **Escala + confirmação** — escalar pessoas por ministério/função e cada um confirma presença (✅/❌).
- **Publicar & Notificar** — publica a escala e gera mensagens de **WhatsApp** prontas (com hora de chegada) para os escalados.
- **Repertório com catálogo global** — biblioteca de músicas por igreja, ligada a um **catálogo partilhado** entre todas as igrejas (autocomplete preenche letra, cifra, YouTube, Spotify, BPM).
- **PWA offline** — instalável no telemóvel, funciona sem rede (Serwist/service worker).

**Stack:** Next.js 15 (App Router, React 19, Server Actions) · TypeScript strict · Tailwind CSS v4 + CSS-in-JS · Radix UI · lucide-react · TanStack Query v5 · Zustand · react-hook-form + zod · Supabase (Postgres + Auth + Storage) · Serwist (PWA) · deploy Cloudflare Workers via `@opennextjs/cloudflare`.

**Módulos/páginas:** Dashboard · Eventos (+ detalhe + wizard) · Escala · Repertório (+ Ranking) · Ministérios · Pessoas · Calendário · Disponibilidade · Definições · Notificações · Impressão/PDF do evento.

**Funcionalidades avançadas já implementadas (jul/2026):** calendário geral (vista mês), sincronização com calendário externo (`.ics` Google/Apple/Outlook), ranking de músicas mais tocadas, roteiro do evento (timeline hora+título), exportar escala/roteiro em PDF, histórico pessoal do voluntário, disponibilidade (pontual + recorrente) com aviso ao escalar, convites por nome+email (magic link / email), aniversários no dashboard, upload+recorte de imagens (avatar, logo, capa).

---

## PARTE B — PROMPT DE RECRIAÇÃO (copia e usa)

> Constrói uma aplicação chamada **WIS — Worship In Sync**, um **PWA de gestão de ministérios e escalas para igrejas**, com **Next.js 15 (App Router) + TypeScript strict**. Segue exatamente a stack, o modelo de dados, os ecrãs, as regras de negócio e os estilos abaixo.

### 1. Stack obrigatória
- **Next.js 15** App Router, **React 19**, **Server Components + Server Actions**.
- **TypeScript** strict (`noUnusedLocals`, `noUnusedParameters`), alias `@/* → ./src/*`.
- **Tailwind CSS v4** — `@import "tailwindcss"` + bloco `@theme inline {}` (NÃO usar `tailwind.config.js`). Complementado com **CSS-in-JS inline** para os ecrãs de tema escuro.
- **Radix UI** (dialog, alert-dialog, select, popover, checkbox, switch, tabs, avatar, dropdown, scroll-area, label, separator, tooltip, toast) — componentes shadcn/ui construídos à mão.
- **lucide-react** (ícones) · **TanStack Query v5** (server state) · **Zustand v5** (`authStore`, `orgStore`) · **react-hook-form + zod** · **sonner** (toasts) · **date-fns** · **recharts** (gráficos) · **react-easy-crop** (recorte de imagem) · **next-themes** (tema escuro forçado).
- **Serwist** (`@serwist/next`) para PWA: precache, página `/offline`, runtime caching, precache de ícones da marca.
- **Supabase**: `@supabase/supabase-js` (browser, singleton tipado com `Database`) + `@supabase/ssr` (server/middleware). Postgres + Auth + Storage (buckets `avatars` e `events`). Server Actions usam a **service role key** (`getAdmin()`) para escritas que contornam RLS.
- **Deploy:** Cloudflare Workers via **@opennextjs/cloudflare** + **wrangler** (integração nativa Git). Build: `npx opennextjs-cloudflare build`; deploy: `npx wrangler deploy`.

### 2. Arquitetura
- `src/actions/*` — Server Actions (events, invites, members, ministries, notifications, organizations, profile, schedule, songs, availability).
- `src/hooks/*` — wrappers TanStack Query sobre as actions (useEvents, useInvites, useMembers, useMinistries, useNotifications, useOrganizations, useProfile, useSchedule, useSongs, useAvailability).
- `src/stores/*` — Zustand: `authStore` (user), `orgStore` (`activeOrg`, `activeMembership`, `setActiveOrg`).
- **MutationCache global** — após qualquer mutação bem-sucedida, invalida TODAS as queries (todas as telas recarregam).
- **Middleware** de auth (Supabase SSR) protege rotas privadas; públicas: `/login`, `/register`, `/forgot-password`, `/auth/*`, `/definir-password`, estáticos.
- **Última organização** guardada em cookie (`sf_last_org`) para entrar direto.

### 3. Modelo de dados (Postgres/Supabase)
- **profiles** — id (=auth user), email, full_name, avatar_url, phone, birthday.
- **organizations** — id, name, logo_url, invite_code (único).
- **organization_members** — org_id, user_id, role (admin/leader/member), is_active, joined_at.
- **organization_invites** — org_id, email, name, role, created_by, accepted_at (único por org+email).
- **ministries** — org_id, name, icon, color, functions (text[]), is_active.
- **ministry_members** — ministry_id, user_id, functions (text[]), is_active.
- **events** — org_id, name, date, time, arrival_time, location, color, description, observations, cover_image_url, is_published, created_by.
- **event_ministries** — event_id, ministry_id.
- **event_schedules** — event_ministry_id, user_id, functions (text[]), confirmed (bool nullable: null=pendente / true=vai / false=não vai).
- **event_setlists** — event_id, song_id, order_index, musical_key (**Tom por evento**).
- **event_timeline_items** — event_id, time, title, order_index (**roteiro do culto**).
- **songs** — biblioteca por org: org_id, ministry_id, name, artist, musical_key, bpm, lyrics, chords, youtube_url, spotify_url, catalog_song_id.
- **catalog_songs** — catálogo GLOBAL partilhado entre igrejas, único por (lower(name), lower(artist)).
- **member_unavailability** — user_id, org_id, tipo pontual (data de/até) ou recorrente (dia da semana + período), motivo.
- **notifications** — user_id, event_id, message, is_read, sent_at.

**Regras de dados:** período do dia automático pela hora (Manhã 05–12h 🌅 / Tarde 12–18h ☀️ / Noite 18–05h 🌙); Tom guardado por evento; catálogo global contribui só campos vazios (nunca sobrescreve nem duplica).

### 4. Ecrãs e funcionalidades
**Auth:** Login (email/password, ver password, esqueci) · Registo (nome, email, password + confirmar, ecrã "confirma o email") · Recuperar password · Definir password.
**Onboarding:** Seleção de organização (logo/nome/cargo, criar, entrar por código, logout) · Criar organização · Entrar por código.
**App (sidebar desktop / bottom-nav + header mobile):**
- **Dashboard** — saudação, data, próximos eventos (badges Publicado/Rascunho + período), aniversários, "Criar evento" só admin.
- **Eventos** — filtros (Todos/Publicados/Rascunhos); **wizard** de criar/editar com passos (1 Informação: nome, data, hora, hora de chegada, local, descrição, observações, capa+recorte, publicado · 2 Ministérios · 3 Integrantes: só membros do ministério + funções da pessoa, com aviso de indisponibilidade · 4 Setlist: músicas + Tom por evento · 5 Roteiro: itens hora+título) e um só botão Gravar; **detalhe** com abas Equipa / Setlist / Roteiro, playlist YouTube, botão confirmar presença + "Adicionar ao calendário" (`.ics`).
- **Escala** — lista de eventos → ministérios/slots → adicionar ministério, adicionar pessoas (só membros + funções, aviso de indisponibilidade), confirmar presença (só a própria); **Publicar & Notificar** (multi-seleção de contactos + mensagens WhatsApp `wa.me` prontas com hora de chegada); abre evento via `?event=<id>` de notificação.
- **Repertório** — pesquisa + filtro por ministério; toggle **Lista / Ranking** (mais tocadas); criar/editar música com **autocomplete do catálogo global** (preenche artista, letra, cifra, YouTube, Spotify, BPM); detalhe da música.
- **Ministérios** — lista (ícone, cor, nº membros); criar/editar (nome, ícone, cor, funções com emoji, formato `custom␟<emoji>␟<label>`); gerir membros e funções.
- **Pessoas** — lista (avatar, nome, cargo; **email só admin**); mudar cargo; remover; convidar (nome+email → email/magic link); convites pendentes; detalhe do membro.
- **Calendário** — vista de mês + lista do dia selecionado (todos veem, herda visibilidade dos eventos).
- **Disponibilidade** — "A minha disponibilidade": pontual (data de/até + motivo) e recorrente (dia + período + motivo). Só avisa ao escalar, não bloqueia.
- **Definições** — Perfil (foto+recorte, nome, telefone, aniversário, **"O meu histórico"** de serviço) · Organização (nome, logo upload) · Código de convite (copiar/partilhar nativo) · Logout · Sair/eliminar organização · Eliminar conta.
- **Notificações** — sino com contador, popover, marcar lidas, clicar abre o evento na Escala.
- **Impressão/PDF** — `/[orgId]/events/[eventId]/print`: roteiro + escala por ministério + setlist em folha clara imprimível (`window.print()`).

### 5. Regras de negócio / permissões
- Admin: acesso total. Líder/Membro: só eventos publicados + onde está escalado; sem "criar evento"; sem emails de outros; só confirma a própria presença.
- Único admin não pode sair sem passar o cargo; última pessoa pode **eliminar** a organização (e todos os dados).
- Convite: pessoa com conta → magic link (entra e é adicionada automaticamente); sem conta → email de definir password.
- Após qualquer gravação, recarregar tudo (invalidação global). Barra de atividade global no topo durante gravações.

### 6. Identidade visual (Brand Kit WIS)
- **Nome:** WIS — Worship In Sync (curto: **WIS**). **Símbolo:** "o adorador" — um W cujas curvas formam uma pessoa de braços erguidos.
- **Tema escuro forçado**, fundo preto/navy. Realces: **índigo `#a5b4fc`** e **verde `#6ee7b7`**.
- **Degradê da marca:** `linear-gradient(135deg, #0D3B66 0%, #0F5C6E 100%)`; realce do ícone `#1B7A8C`.
- **Tipografia:** Poppins Bold (WIS) · Poppins Light uppercase espaçado (WORSHIP IN SYNC).
- Cartões escuros translúcidos (`rgba(22,22,26,0.85)`, borda `rgba(255,255,255,0.08)`, raio ~0.875rem, sombra suave); badges de cargo (admin índigo, líder azul, membro cinza).
- **PWA:** favicon, icon-192/512 (any), maskable-192/512, apple-touch-icon, icon.svg, og-image 1200×630, splash.
- **Feedback:** toasts (sonner), barra de progresso no topo em mudanças de página, indicadores de loading claros ao gravar.

### 7. Integrações
- **WhatsApp:** links `wa.me` com mensagem pré-preenchida (sem API).
- **YouTube:** playlist `watch_videos` a partir dos links do setlist.
- **Calendário externo:** ficheiro `.ics` gerado no cliente (Google/Apple/Outlook, funciona offline).
- **Pesquisa de músicas:** no catálogo global `catalog_songs`.
- **Partilha/cópia:** Web Share API + Clipboard API.
- **Email:** Supabase + SMTP (Gmail App Password).

---

*Nota: os 5 planos de assinatura (Semente/Crescimento/Comunhão/Expansão/Ilimitado) estão desenhados em `docs/roadmap-planos-assinatura.md` mas ainda NÃO estão implementados — as funcionalidades existem todas ativas, sem enforcement de limites.*
