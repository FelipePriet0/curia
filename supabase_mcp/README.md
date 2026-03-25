# Supabase MCP

Coloque aqui os arquivos do MCP do seu Supabase ou um arquivo `.env` com as credenciais necessárias.

Este diretório está ignorado pelo Git (exceto `README.md` e `.example.env`) para evitar vazar segredos.

## Como usar
- Copie o arquivo `.example.env` para `.env` e preencha os valores reais. Evite colocar segredos em `.example.env` (ele é versionado). Use `.env` para segredos (ele é ignorado pelo Git).
- Opcionalmente, você pode adicionar outros arquivos de configuração do MCP aqui e me avisar o nome dos arquivos para eu ler quando precisar.

## Variáveis esperadas (exemplo)
Veja `.example.env` para o formato. Normalmente:
- `SUPABASE_URL`: URL do seu projeto Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: chave Service Role do projeto.
- `SUPABASE_ANON_KEY` (opcional): chave pública anon.

Depois de preencher o `.env`, me avise e eu leio daqui para usar nas operações necessárias.

## Carregar as variáveis no terminal
- PowerShell (dot-source): `. .\supabase_mcp\load_env.ps1` (carrega `supabase_mcp/.env`).
- Bash/WSL: `source supabase_mcp/load_env.sh` (carrega `supabase_mcp/.env`).
- Alternativa: exportar manualmente no terminal (ex.: PowerShell `\$env:SUPABASE_SERVICE_ROLE_KEY='...'`).
