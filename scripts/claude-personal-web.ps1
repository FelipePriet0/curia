]param([Parameter(ValueFromRemainingArguments = $true)] [string[]]$Args)

# Isola diretórios de configuração/dados para esta conta
$env:XDG_CONFIG_HOME = (Join-Path $PSScriptRoot "..\.claude-config-personal")
$env:XDG_DATA_HOME   = (Join-Path $PSScriptRoot "..\.claude-data-personal")
$env:APPDATA         = (Join-Path $PSScriptRoot "..\.claude-appdata-personal")
$env:LOCALAPPDATA    = (Join-Path $PSScriptRoot "..\.claude-localdata-personal")

# Garante que não há API key (evita conflito/billing)
$env:ANTHROPIC_API_KEY = $null

if ($Args -and $Args[0] -eq "/login") {
  & claude /logout | Out-Null
  & claude /login
  return
}

if ($Args.Length -gt 0) { & claude @Args } else { & claude }
