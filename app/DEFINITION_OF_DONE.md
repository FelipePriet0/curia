# Definition of Done — Curia

**Antes de qualquer deploy para produção, todos os itens abaixo devem estar ✅.**

---

## 1. Testes Automatizados

```bash
npm run test:e2e
```

- [ ] Todos os testes passando (0 falhas)
- [ ] Nenhum teste marcado como `skip` sem justificativa documentada

---

## 2. Checklist Manual — Auth (abrir aba anônima para cada item)

### Signup
- [ ] Signup email/senha com email novo → tela de confirmação **ou** vai para `/board`
- [ ] Signup email/senha com email existente → mensagem de erro clara em português

### Login
- [ ] Login email/senha correto → vai para `/board`
- [ ] Login email/senha errado → mensagem de erro, não crasha

---

## 3. Checklist Manual — Fluxo Completo como Novo Usuário

Abrir aba anônima e percorrer o caminho exato de um usuário real:

- [ ] Acessa `/` → landing page carrega sem erro
- [ ] Vai para `/signup` → formulário renderiza corretamente
- [ ] Cria conta com email e senha → cai em `/onboarding`
- [ ] Preenche todo o onboarding → clica "Entrar no Board" → vai para `/board`
- [ ] Back button → **NÃO** volta para `/onboarding`
- [ ] Reload em `/board` → permanece em `/board`
- [ ] Faz logout → vai para `/login`
- [ ] Tenta acessar `/board` sem sessão → redireciona para `/login`

---

## 4. Checklist Manual — Recuperação de Senha

- [ ] Recuperação de senha via Clerk inicia corretamente a partir de `/login`
- [ ] Link/fluxo de recuperação retorna ao app sem erro
- [ ] Nova senha salva com sucesso → consegue logar com nova senha

---

## 5. Checklist Manual — Compartilhamento

- [ ] No board, compartilhar uma conversa → link gerado
- [ ] Acessar `/share/[token]` em aba anônima → conversa visível sem auth

---

## 6. Sanidade Geral

- [ ] App roda em `npm run build` sem erros de TypeScript
- [ ] Sem `console.error` visíveis no browser durante os fluxos acima
- [ ] Versão mobile: abrir no celular e testar o fluxo completo
- [ ] Variáveis de ambiente de produção revisadas (não há `.env.local` com segredos expostos)
- [ ] `./scripts/deploy.sh` executa sem ajuste manual fora de `.env.vps`

---

## Quando esses checks falham

**Não fazer deploy.** Abrir uma issue descrevendo:
1. O que foi testado
2. O comportamento esperado
3. O comportamento atual
4. Screenshot/vídeo se possível

Os testes E2E geram screenshots e vídeos automaticamente em falha, em `/test-results/`.
