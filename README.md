# T3 OOH — Frontend

Aplicação web da **Plataforma T3 OOH**: site institucional, mapa interativo de painéis com carrinho de orçamento, área do cliente, dashboard administrativo e CRM comercial.

## Stack

- **React 19** + **Vite** + **TypeScript**
- **Tailwind CSS 3** · **Framer Motion** · **GSAP** · **OGL** (efeitos WebGL)
- **React Router 7** (rotas com lazy loading)
- **React Hook Form** + **Zod** (formulários)
- **Leaflet / React-Leaflet** (mapa)
- **Axios** (API) · **Socket.IO Client** (chat do CRM)
- **jsPDF / @react-pdf/renderer** (propostas em PDF)
- **react-helmet-async** (SEO) · **react-google-recaptcha**

## Requisitos

- Node.js 20+
- [Backend](https://github.com/T3OOH/Backend) rodando (padrão `http://localhost:3333`)

## Configuração

```bash
npm install
cp .env.example .env   # ou crie o .env com as variáveis abaixo
npm run dev            # http://localhost:3000
```

### Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `VITE_API_URL` | URL base da API (ex.: `http://localhost:3333`) |
| `VITE_RECAPTCHA_SITE_KEY` | Site key pública do Google reCAPTCHA v2 |

> Variáveis `VITE_*` ficam visíveis no navegador. Nunca coloque segredos aqui.

## Scripts

| Script | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento (porta 3000) |
| `npm run build` | Checagem de tipos + build de produção em `dist/` |
| `npm run preview` | Serve a build localmente |
| `npm run lint` | Lint com Oxlint |

## Rotas

| Área | Rotas |
| --- | --- |
| Público | `/` · `/servicos` · `/mapa` · `/solution` · `/sobre` · `/contato` · `/login` · `/cadastro` · `/atualizar-senha` |
| Cliente (logado) | `/perfil` |
| Dashboard | `/dashboard` · `/dashboard/paineis` (novo/editar) · `/dashboard/mapa` · `/dashboard/usuarios` · `/dashboard/pedidos` · `/dashboard/solution` · `/dashboard/info` |
| CRM | `/crm` · `/crm/pipeline` · `/crm/clientes` · `/crm/propostas` · `/crm/proposta/:id` · `/crm/agenda` · `/crm/cupons` |

## Estrutura

```
src/
├── App.tsx / main.tsx     # Providers e bootstrap
├── routes/                # Definição de rotas e proteção por perfil
├── layouts/               # MainLayout, DashboardLayout, CrmLayout
├── pages/                 # Páginas públicas, dashboard/ e crm/
├── components/            # UI compartilhada (Header, Footer, Button, efeitos visuais…)
├── features/map/          # Mapa interativo (Leaflet)
├── contexts/              # Auth, Cart, Theme, Toast
├── services/              # Chamadas à API por recurso
├── schemas/               # Schemas Zod dos formulários
└── lib/                   # axios, socket, utilitários
public/                    # Imagens, robots.txt, sitemap.xml, llms.txt
```

## Deploy (Vercel)

O `vercel.json` reescreve todas as rotas para `index.html` (SPA). Configure `VITE_API_URL` e `VITE_RECAPTCHA_SITE_KEY` nas variáveis de ambiente do projeto na Vercel.
