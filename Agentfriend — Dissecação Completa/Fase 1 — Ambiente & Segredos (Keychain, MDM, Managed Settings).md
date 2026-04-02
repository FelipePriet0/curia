# Fase 1 — Ambiente & Segredos (Keychain, MDM, Managed Settings)

Objetivo: orientar integrações de Keychain (macOS), MDM e Remote Managed Settings com fallback seguro, multiplataforma e sem bloquear startup.

Princípios
- Paralelizar leituras (prefetch) antes do main import, mas nunca bloquear TTI.
- Fallback por plataforma: macOS (Keychain/MDM) completo; Linux/WSL/Windows → no-op seguro.
- Defensivo: se contexto não é confiável (trust dialog), adiar leituras sensíveis.

Keychain (macOS)
- Prefetch paralelo (OAuth + legacy API key); aguardar somente quando necessário.
- Erros silenciosos com telemetria (sem PII) e retry mais tarde.
- Política: não armazenar tokens plaintext; respeitar cadeias de certificado do sistema.

MDM/Managed Settings
- `startMdmRawRead` em paralelo; `ensureMdmSettingsLoaded` antes de decisões que dependem de política.
- Remote Managed Settings: carregar em background; aplicar quando confiável.
- Killswitch: preferir “fail-closed” (negar recursos perigosos quando indeterminado).

Certificados & CA
- Detectar `NODE_EXTRA_CA_CERTS`, client cert e flags `--use-system-ca`; registrar apenas a presença (não caminhos).
- Evitar misturar stores (OpenSSL vs system) sem necessidade; documentar precedence.

Plataformas
- Windows nativo: sem sandbox POSIX; shells podem ser bloqueados por política.
- WSL/macOS/Linux: sandbox habilitável; diferenças de FS (WSL mais lento).

Checklist
- [ ] Prefetch de segredos paralelo e não-bloqueante
- [ ] Fallback seguro por SO
- [ ] Trust dialog respeitado antes de leituras sensíveis
- [ ] Killswitch “fail-closed” para políticas

