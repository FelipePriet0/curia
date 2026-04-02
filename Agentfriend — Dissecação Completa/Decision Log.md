# Decision Log

- Executor streaming (RO paralelo / RW serial): escolhido por latência e segurança; alternativas (fila única) rejeitadas por throughput.
- StructuredIO com outbound único: ordenação garantida e deduplicação; mensageria paralela descartada por corrida.
- HybridTransport (POST batelado): reduz colisão backend; WS puro rejeitado por backpressure fraco.
- Fail‑closed em permissões: evita exfiltração; fail‑open rejeitado por risco.
- Windows nativo: shells negados por política, incentivar WSL.

