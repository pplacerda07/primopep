# Primo Peptídeos

Landing page do Primo Peptídeos: intermediação comercial entre o comprador e um fornecedor internacional parceiro, com fechamento pelo WhatsApp.

Feita com Next.js 16, React 19, Tailwind CSS 4 e motion.

## Rodar no computador

Requisitos: Node.js 20 ou mais novo.

```bash
npx pnpm install
npx pnpm dev
```

Abra http://localhost:3000.

## Onde editar

| O quê | Arquivo |
|---|---|
| Número do WhatsApp, contatos, frete e prazo | `lib/site.ts` |
| Todos os textos do site | `lib/content.ts` |
| Produtos, apresentações, preços (USD) e destaques | `lib/catalog.ts` |
| Fotos e vídeos do fornecedor (sem rostos, máximo 14) | `lib/media.ts` + `public/fonte/` |
| Regras de copy e posicionamento | `docs/PRIMO_BRIEFING.md` |

## Publicar na Vercel

1. Em vercel.com, clique em **Add New → Project** e importe este repositório.
2. **Root Directory:** deixe `./` (a raiz do repositório já é o projeto Next.js).
3. **Framework Preset:** Next.js (detectado sozinho). Build, install e output ficam no padrão. A Vercel usa o pnpm por causa do `pnpm-lock.yaml`.
4. Opcional: em **Environment Variables**, defina `NEXT_PUBLIC_SITE_URL` com o domínio final (ex.: `https://primopeptideos.com.br`). Sem ela, o site usa o domínio da Vercel.
5. Clique em **Deploy**. Cada `git push` na branch `main` publica de novo.
