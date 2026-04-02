 # FileEditTool — Edição Segura e Diffs

 Objetivo: aplicar edições em arquivos com máxima segurança, explicabilidade e integração com permissões.

 Pilares
 - Input schema: diffs/patches ou `new_string` com path; validação estrita antes de tocar disco.
 - Segurança:
   - Validação de paths (deny escapes, symlinks perigosos, repos protegidos).
   - Dry-run e geração de preview (quando disponível) para transcript.
   - Rejeitar edições grandes sem confirmação explícita; integrar com hooks de permissão.
 - Resultados:
   - Mensagens de progresso (aplicando patch, linhas afetadas), renderização compacta vs transcript detalhado.
   - Marcação de arquivos alterados para orquestração (fileHistory, attribution), úteis para pós‑compact reidratar referências.
 - Permissão: regra/tool‑specific `checkPermissions` (e.g., paths sensíveis), além do pipeline geral.

 Padrões
 - Caminhos sempre resolvidos com implementação de FS segura (`getFsImplementation`, `safeResolvePath`).
 - Feedback claro em caso de conflitos/erros; nunca “silenciar” falhas de escrita.
 - Emitir anexos de diff quando aplicável para melhor revisão pelo usuário.

