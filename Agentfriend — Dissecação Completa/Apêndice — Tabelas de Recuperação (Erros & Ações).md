# Apêndice — Tabelas de Recuperação (Erros & Ações)

Objetivo: árvore de decisão por classe de erro com ações e limites de tentativas, para comportamento previsível e audível.

Erros de Modelo
- 413 prompt-too-long: micro→auto-compact; se persistir, collapse; falhando, erro amigável.
- max_output_tokens: escalonar limite uma vez; senão, "resume directly" por N tentativas; por fim, erro claro.
- 408/504 timeout: retry com jitter e limpeza de buffers transitórios.
- 429 rate limit: backoff exponencial com jitter; reduzir paralelismo de tools.
- 5xx serviço: retry curto (1–2) + fallback de modelo se configurado.

Erros de Tools
- Validate/parse falhou: deny/ask conservador; nunca fail-open.
- FS denied: sugerir regra/ajuste; nunca burlar `.git/**`, secrets, symlinks perigosos.
- Shell timeout: abort subprocess tree; registrar comandos parciais; sugerir read-only ou split.

Transport/Bridge
- WS fechado: reconectar com backoff; replays dos frames; limites de tentativas.
- Batching drop: registrar e reemitir se possível; ao exceder limite, erro e instrução.

Tabela (exemplo)
- Classe: 413 → Ação: micro→auto→collapse → Limite: 1 ciclo completo → Resultado: erro amigável.
- Classe: 429 → Ação: backoff 1s/2s/4s → Limite: 3 → Resultado: abort e sugestão.
- Classe: Shell timeout → Ação: kill tree → Limite: 1 → Resultado: relatório parcial.

Checklist
- [ ] Mensagens consistentes e rastreáveis
- [ ] Limites de tentativas declarados
- [ ] Telemetria associada por classe

