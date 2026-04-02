# RemoteTrigger & ScheduleCron — Disparo Remoto e Tarefas Agendadas

Objetivo: documentar como o sistema dispara comandos remotamente e agenda execuções recorrentes.

RemoteTriggerTool
- Uso: executa um gatilho remoto (ex.: webhook/comando) com validação e mensagens de progresso; integra com UI para confirmar destino/ação.
- Segurança: valida entrada e canal; mensagens claras em caso de falha remota.

ScheduleCronTool (CronCreateTool, CronListTool, CronDeleteTool)
- CronCreateTool: cria agendamentos com expressão cron, comando/ação alvo e metadados (descrição); valida expressão e conflito.
- CronListTool: lista agendamentos ativos, com IDs/cron/descrições; read‑only.
- CronDeleteTool: remove agendamento por ID com confirmação e feedback.
- Integração: UI para CRUD com prompts e resumos (getToolUseSummary, render*).

Padrões
- Confirmar alvos remotos (URI/canal) e exibir efeitos previstos.
- Para cron, sempre validar expressão e informar timezone/next run.
- Manter IDs estáveis para permitir automação de list/delete.

