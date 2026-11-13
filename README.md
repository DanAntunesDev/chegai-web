# chegai-web

Painel da barbearia, console administrativo e página pública de agendamento do Chegaí.

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4, componentes próprios no estilo shadcn/ui
- TanStack Query, Zod
- Tema claro e escuro, white label por barbearia

## Rodando local

Precisa da API (`chegai-server`) rodando em `http://localhost:3333`.

```bash
cp .env.example .env.local
yarn install
yarn dev
```

Abra `http://localhost:3000`.

| Rota                     | O que é                                          |
| ------------------------ | ------------------------------------------------ |
| `/login`                 | Login com etapa de 2FA                           |
| `/admin`                 | Console da plataforma (exige 2FA ativo)          |
| `/admin/barbearias/nova` | Cadastro de barbearia, unidade e convite do dono |
| `/admin/barbearias/:id`  | Dados, plano, limites, marca, cobrança e equipe  |
| `/painel`                | Números do mês da barbearia                      |
| `/painel/assinatura`     | Faturas da barbearia                             |
| `/painel/seguranca`      | Ativar 2FA                                       |
| `/b/:slug`               | Página pública com as cores da barbearia         |

## Variáveis

| Nome              | Uso                                                                  |
| ----------------- | -------------------------------------------------------------------- |
| `API_URL`         | Endereço da API. As chamadas `/v1/*` passam pelo próprio Next.       |
| `APP_HOSTS`       | Hosts do painel. Qualquer outro host é tratado como barbearia.       |
| `APP_BASE_DOMAIN` | Domínio base para subdomínios (`ze.chegai.com.br` → barbearia `ze`). |

## Segurança

- Access token só em memória; refresh em cookie httpOnly com `path=/v1/auth`, servido pelo mesmo domínio.
- Um único refresh por vez, inclusive entre abas.
- CSP, `X-Frame-Options`, `nosniff` e `Referrer-Policy` em todas as páginas.
- Redirecionamento pós-login só aceita caminhos internos.

## Scripts

```bash
yarn lint
yarn lint:comments
yarn format:check
yarn typecheck
yarn test
yarn build
```
