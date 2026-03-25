param(
  [string]$Path = ".env"
)

function Load-DotEnv {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    Write-Error "Env file not found: $Path"
    return
  }

  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq "" -or $line.StartsWith("#")) { return }
    $pair = $line -split "=", 2
    if ($pair.Count -lt 2) { return }
    $key = $pair[0].Trim()
    $val = $pair[1].Trim()
    if ($val.StartsWith('"') -and $val.EndsWith('"')) {
      $val = $val.Substring(1, $val.Length - 2)
    }
    Set-Item -Path ("Env:" + $key) -Value $val
  }
}

# Export when invoked directly
if ($PSCommandPath) {
  Load-DotEnv -Path $Path
}

