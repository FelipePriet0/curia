# Mapa de Fluxos Críticos — Curia

Documentação de todos os caminhos que um usuário pode percorrer.
Usado como referência para testes e para o checklist de Definition of Done.

---

## 1. Proteção de Rotas (Middleware)

| Situação                              | Rota acessada   | Resultado esperado       | Teste E2E |
|---------------------------------------|-----------------|--------------------------|-----------|
| Não logado                            | `/board`        | → `/login`               | ✅ auto   |
| Não logado                            | `/onboarding`   | → `/login`               | ✅ auto   |
| Logado, onboarding NÃO feito          | `/board`        | → `/onboarding`          | ✅ auto   |
| Logado, onboarding feito              | `/onboarding`   | → `/board`               | ✅ auto   |
| Logado, onboarding feito              | `/board`        | permanece em `/board`    | ✅ auto   |

---

## 2. Rotas Públicas

| Rota              | Resultado esperado                   | Teste E2E |
|-------------------|--------------------------------------|-----------|
| `/`               | Landing page carrega                 | ✅ auto   |
| `/login`          | Formulário de login visível          | ✅ auto   |
| `/signup`         | Formulário de cadastro visível       | ✅ auto   |
| `/forgot-password`| Formulário de recuperação visível    | ✅ auto   |
| `/terms`          | Página de termos carrega             | manual    |
| `/privacy`        | Política de privacidade carrega      | manual    |
| `/share/[token]`  | Conversa compartilhada carrega       | manual    |

---

## 3. Autenticação — Login

| Cenário                                     | Resultado esperado                       | Teste E2E |
|---------------------------------------------|------------------------------------------|-----------|
| Email + senha válidos, onboarding feito      | → `/board`                               | ✅ auto   |
| Email + senha válidos, onboarding NÃO feito  | → `/onboarding`                          | ✅ auto   |
| Email + senha inválidos                      | Mensagem de erro em português            | ✅ auto   |
| Email com formato inválido                   | Bloqueado pelo browser (HTML5)           | ✅ auto   |
| Login com Google (conta existente)           | → `/board` (onboarding feito)            | ⚠️ manual |
| Login com Google (nova conta)                | → `/onboarding`                          | ⚠️ manual |

> **Por que Google é manual?** OAuth requer interação com janela do Google, não pode ser automatizado sem mocking.
> Testar manualmente: abrir aba anônima, ir em /login, clicar "Continuar com Google".

---

## 4. Autenticação — Signup

| Cenário                                          | Resultado esperado                          | Teste E2E |
|--------------------------------------------------|---------------------------------------------|-----------|
| Email novo + senha forte + termos aceitos         | Tela de confirmação de email **OU** → `/board` (se email confirm off) | ✅ auto   |
| Email já cadastrado                               | Mensagem "já está cadastrado"               | ✅ auto   |
| Senhas que não coincidem                          | Mensagem "senhas não coincidem"             | ✅ auto   |
| Sem aceitar os termos                             | Mensagem "aceite os termos"                 | ✅ auto   |
| Google sem aceitar termos                         | Mensagem "aceite os termos", sem redirect   | ✅ auto   |
| Google com termos aceitos (conta nova)            | → OAuth Google → `/onboarding`             | ⚠️ manual |
| Google com termos aceitos (conta já existe)       | → OAuth Google → `/board`                  | ⚠️ manual |
| Senha fraca                                       | Bloqueado com mensagem de senha fraca       | ✅ auto   |

---

## 5. Onboarding

| Cenário                                         | Resultado esperado                         | Teste E2E |
|-------------------------------------------------|--------------------------------------------|-----------|
| Usuário sem onboarding acessa `/onboarding`     | Primeira pergunta visível                  | ✅ auto   |
| Usuário com onboarding acessa `/onboarding`     | → `/board`                                 | ✅ auto   |
| Completar todas as perguntas → clicar "Entrar"  | → `/board` (sem `/onboarding` no histórico)| ⚠️ manual |
| Back button de `/board` após onboarding         | NÃO volta para `/onboarding`               | ✅ auto   |

---

## 6. Board — Funcionalidades

| Cenário                                         | Resultado esperado                          | Teste E2E |
|-------------------------------------------------|---------------------------------------------|-----------|
| Acesso com sessão válida                        | Interface carrega, sem redirect             | ✅ auto   |
| Reload da página                                | Permanece em `/board`                       | ✅ auto   |
| Sidebar de conversas visível                    | Lista renderizada                           | ✅ auto   |
| Input de consulta visível                       | Campo de texto disponível                   | ✅ auto   |
| Criar nova conversa                             | Conversa aparece na sidebar                 | manual    |
| Enviar mensagem                                 | Resposta do conselho aparece (streaming)    | manual    |
| Compartilhar conversa → link gerado             | Link copiado, `/share/[token]` funciona     | manual    |

---

## 7. Recuperação de Senha

| Cenário                          | Resultado esperado             | Teste E2E |
|----------------------------------|--------------------------------|-----------|
| Email existente → formulário     | Email de recuperação enviado   | manual    |
| Email inexistente → formulário   | Mesma mensagem (sem vazar info)| manual    |
| Link de reset válido             | → `/reset-password`            | manual    |
| Nova senha definida com sucesso  | → `/login` ou `/board`         | manual    |

---

## Legenda

- ✅ auto → coberto por teste E2E (`npm run test:e2e`)
- ⚠️ manual → executar manualmente antes de cada deploy (ver DEFINITION_OF_DONE.md)
