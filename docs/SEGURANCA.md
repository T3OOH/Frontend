# Segurança da conta no site

O documento completo, com tokens, banco, API, e-mails e resposta a incidentes, está no backend: **`Backend/docs/SEGURANCA.md`**. Aqui fica o que é próprio do site.

## Arquivos

| Arquivo | Papel |
|---|---|
| `src/lib/session.ts` | Guarda, renova e sincroniza a sessão entre abas. Gera o `deviceId` e encerra a sessão no servidor. |
| `src/lib/axios.ts` | Coloca um token válido em cada requisição. Um 401 tenta **uma** renovação; se falhar, a sessão é limpa e a pessoa vai para `/login`. |
| `src/contexts/AuthContext.tsx` | Estado de tela (`user`, `isAuthenticated`), `signIn(resposta)`, `signOut()`, `signInWithGoogle(credential, remember)`. |
| `src/lib/socket.ts` | O chat pega um token válido a cada (re)conexão. |
| `src/pages/Login.tsx` | Checkbox **"Manter conectado"** (vem marcado). O mesmo valor vale para o botão do Google. |
| `src/pages/profile/SecurityTab.tsx` | Meu perfil → **Segurança**: aparelhos conectados, alterar senha e atividade recente. |
| `src/pages/ReportAccess.tsx` | `/seguranca/nao-fui-eu`, aberta pelo e-mail de aparelho novo. |

## Onde a sessão fica

| Chave | Armazenamento | Conteúdo |
|---|---|---|
| `@t3ooh:session` | `localStorage` com "manter conectado", senão `sessionStorage` | `{ token, refreshToken, user, persistent }` |
| `@t3:device` | `localStorage` | UUID aleatório do navegador. Serve só para reconhecer aparelhos já usados na conta. |

## Renovação

- `validToken()` devolve o token atual ou renova quando faltar **menos de 1 min** para vencer.
- `refreshSession()` faz **uma renovação por vez**:
  - na aba, com uma promessa compartilhada;
  - entre abas, com o Web Lock `t3-session-refresh`.

  Dentro do lock, a sessão é relida, porque outra aba pode ter acabado de renovar.
- Resposta **409** (outra aba renovou primeiro): o site espera 400 ms e usa o token que a outra aba gravou.
- Sem rede ou erro 5xx: a sessão é mantida para tentar de novo. Resposta 401: a sessão é limpa.
- Entrar, renovar ou sair em uma aba chega às outras pelo evento `storage`.

## Regras de interface

- **"Não fui eu" só age depois do clique.** Leitores de e-mail abrem links sozinhos para checar, e um GET não pode desconectar a conta. O token sai da barra de endereço ao abrir a página.
- Sem "manter conectado" aparece o aviso: *"Você sai ao fechar esta aba. Use em computadores compartilhados."*
- `/perfil?aba=seguranca` abre direto na aba Segurança. É o link usado no e-mail.
- `/seguranca` está fora do `robots.txt` e marcado como `noindex`.
- A Política de Privacidade (seção 1 e 5) descreve os dados de segurança e o "manter conectado".
