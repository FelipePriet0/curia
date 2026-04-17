# Curia — Setup de Ambiente para Agent CLI

## Objetivo

Definir o ambiente correto para rodar Codex, Claude CLI e a stack do projeto de forma consistente.

Este projeto vai depender de:

- codigo
- banco
- Docker
- Git
- SSH
- deploy
- operacao por terminal

Por isso, o ambiente precisa ser unico e previsivel.

## Regra principal

O ambiente oficial do projeto deve ser o `WSL`.

Nao use um agent no Windows e outro no WSL para operar o mesmo projeto.

O correto e:

- repo no WSL
- terminal no WSL
- Claude CLI no WSL
- Codex/Agent CLI no WSL
- Docker integrado ao WSL

## Arquitetura recomendada

### Sistema host

- `Windows`

### Ambiente de desenvolvimento e operacao

- `WSL 2`

### Ferramentas principais rodando dentro do WSL

- `git`
- `node`
- `npm` ou `pnpm`
- `docker`
- `docker compose`
- `ssh`
- `psql`
- `claude`
- `codex` ou agent CLI equivalente

## Por que isso importa

Se um agent roda no Windows e outro no WSL, aparecem problemas como:

- paths diferentes
- permissao inconsistente
- Docker visivel em um ambiente e ausente no outro
- `node_modules` instavel
- builds diferentes
- credenciais e env vars em lugares diferentes

Isso quebra exatamente o objetivo da stack CLI-first.

## Estrutura ideal de paths

### Nao ideal

Projeto dentro de:

`/mnt/c/Users/studi/Downloads/aiboard`

Esse caminho funciona, mas nao e o melhor para:

- Docker
- Next.js
- watchers
- performance de IO
- consistencia de permissoes

### Ideal

Mover o projeto para dentro do filesystem Linux do WSL, por exemplo:

```bash
~/projects/aiboard
```

ou

```bash
/home/felipe/projects/aiboard
```

## Setup recomendado

## 1. Confirmar WSL 2

No Windows:

```powershell
wsl -l -v
```

O distro principal deve estar em `Version 2`.

## 2. Usar Docker Desktop com integracao WSL

No Docker Desktop:

- abrir `Settings`
- abrir `Resources`
- abrir `WSL Integration`
- habilitar a integracao para a distro que voce usa

Sem isso, `docker` pode nao aparecer dentro do WSL.

## 3. Instalar ferramentas base no WSL

Dentro do WSL:

```bash
sudo apt update
sudo apt install -y git curl unzip build-essential openssh-client postgresql-client
```

Node pode vir por `nvm` ou outro metodo que voce preferir, mas precisa estar funcional dentro do WSL.

## 4. Padrao de repositorio

Criar uma pasta de trabalho Linux:

```bash
mkdir -p ~/projects
cd ~/projects
```

Clonar ou mover o projeto para la.

## 5. Git e SSH

Dentro do WSL, configurar:

- `git config`
- chave SSH
- acesso ao GitHub

Comandos de referencia:

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
ssh -T git@github.com
```

## 6. Agents no mesmo contexto

O ideal e abrir multiplas abas do mesmo terminal WSL.

Exemplo:

- aba 1: `claude`
- aba 2: `codex`
- aba 3: shell operacional do projeto

Se quiser algo mais organizado, use `tmux`.

## Fluxo de uso recomendado

### Aba 1 — Claude CLI

Usada para:

- exploracao
- implementacao
- revisao

### Aba 2 — Codex / Agent CLI

Usada para:

- implementacao
- infra
- banco
- automacao operacional

### Aba 3 — Shell do projeto

Usada para:

- `git status`
- `docker compose`
- `psql`
- `ssh`
- scripts de deploy

## Comandos que devem funcionar no WSL

Antes de considerar o ambiente pronto, estes comandos precisam funcionar:

```bash
git --version
node -v
npm -v
docker --version
docker compose version
ssh -V
psql --version
```

## Variaveis de ambiente

As credenciais do projeto devem ser pensadas para o WSL, nao para o PowerShell como ambiente principal.

Isso vale para:

- OpenAI
- Anthropic
- banco
- SMTP
- SSH
- deploy

Idealmente:

- `.env` do projeto para configs locais
- `~/.ssh` para chaves
- secrets de producao apenas no servidor ou pipeline

## Estrategia para Docker

Quando o setup estiver correto, o fluxo deve ser:

```bash
cd ~/projects/aiboard
cp .env.docker.example .env.docker
docker compose up --build -d
docker compose ps
docker compose logs -f app
```

Se `docker` nao funcionar dentro do WSL, o setup ainda nao esta pronto.

## Estrategia para deploy futuro

O deploy tambem deve nascer CLI-first.

Exemplo de fluxo alvo:

```bash
ssh user@server
git pull
docker compose pull
docker compose up -d --build
docker compose logs --tail=100 app
```

Ou por script:

```bash
./scripts/deploy.sh
```

## O que evitar

- rodar o projeto por uma IDE no Windows e os agents no WSL
- manter o repo em `Downloads` no disco Windows como ambiente definitivo
- usar Docker so no Windows terminal e nao no WSL
- ter um agent com acesso a um conjunto de secrets e o outro nao
- misturar comandos de PowerShell e bash no fluxo principal

## Estado atual deste projeto

Hoje o projeto esta em:

`/mnt/c/Users/studi/Downloads/aiboard`

Isso e aceitavel para uma fase inicial de transicao, mas nao deve ser o estado final se a meta e operar toda a stack por Agent CLI.

## Recomendacao objetiva

Antes de avancarmos muito na stack, o ideal e convergir para:

1. Docker funcionando no WSL
2. repo dentro do filesystem Linux do WSL
3. Claude e Codex rodando no mesmo ambiente
4. Git e SSH configurados no WSL

## Checklist de pronto do ambiente

- WSL 2 ativo
- Docker acessivel dentro do WSL
- repo em path Linux
- `node`, `git`, `ssh`, `docker` e `psql` funcionando
- Claude CLI funcionando no WSL
- Codex/Agent CLI funcionando no WSL

Quando isso estiver verdadeiro, a stack self-hosted com Agent CLI passa a ser viavel de ponta a ponta.
