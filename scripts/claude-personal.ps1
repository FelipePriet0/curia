param([Parameter(ValueFromRemainingArguments = $true)] [string[]]$Args)

. "$PSScriptRoot\load-dotenv.ps1" -Path (Join-Path $PSScriptRoot "..\.env.personal")

if ($Args.Length -gt 0) {
  & claude @Args
} else {
  & claude
}

