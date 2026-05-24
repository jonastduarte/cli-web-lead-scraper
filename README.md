# 🚀 CLI Web Lead Scraper

> **Motor de Prospecção B2B Autônomo via Terminal** — Varre o Google Maps, diagnostica presença digital, identifica oportunidades comerciais e gera pitches de vendas por IA, tudo pelo terminal Linux.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)](https://sqlite.org)
[![Puppeteer](https://img.shields.io/badge/Puppeteer-Headless-40B5A4?logo=googlechrome&logoColor=white)](https://pptr.dev)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

---

## 📌 Índice

1. [Visão Geral](#-visão-geral)
2. [Instalação Rápida (via GitHub)](#-instalação-rápida-via-github)
3. [Instalação via curl (one-liner)](#-instalação-via-curl-one-liner)
4. [Pré-requisitos](#-pré-requisitos)
5. [Como Iniciar](#-como-iniciar)
6. [Modo de Linha Única (Parâmetros)](#-modo-de-linha-única-parâmetros)
7. [Guia do Painel de Opções](#-guia-do-painel-de-opções)
8. [Formatos de Exportação](#-formatos-de-exportação)
9. [Como Funciona](#-como-funciona)
10. [Resolução de Problemas](#-resolução-de-problemas)

---

## 🔍 Visão Geral

O **CLI Web Lead Scraper** automatiza o ciclo completo de prospecção B2B:

| Etapa | O que faz |
|---|---|
| 🗺️ **Google Maps Scraping** | Varre nichos e localidades simulando navegação humana |
| 🔬 **Brand Diagnostic** | Analisa sites: cores, SSL, mobile, redes sociais, emails |
| 🎯 **Sinais B2B** | Detecta oportunidades: sem site, sem SSL, sem WhatsApp |
| 🤖 **AI Sales Pitch** | Gera roteiros persuasivos personalizados por lead |
| 💾 **SQLite Independente** | Banco de dados local autônomo (`leads.db`) |

---

## 📥 Instalação Rápida (via GitHub)

### Método 1 — Clone direto (Recomendado)

```bash
# 1. Clone o repositório
git clone https://github.com/jonastduarte/cli-web-lead-scraper.git

# 2. Entre na pasta
cd cli-web-lead-scraper

# 3. Instale as dependências
npm install

# 4. Execute!
node cli.js
```

### Método 2 — Baixar sem git (zip)

```bash
# Baixar e extrair via curl
curl -L https://github.com/jonastduarte/cli-web-lead-scraper/archive/refs/heads/main.zip -o cli-lead-scraper.zip
unzip cli-lead-scraper.zip
cd cli-web-lead-scraper-main
npm install
node cli.js
```

---

## ⚡ Instalação via curl (one-liner)

Instale e configure tudo em um único comando no terminal Linux/WSL:

```bash
curl -fsSL https://raw.githubusercontent.com/jonastduarte/cli-web-lead-scraper/main/install.sh | bash
```

> **O que o script faz:**
> 1. Verifica se Node.js 18+ está instalado
> 2. Clona o repositório para `~/cli-web-lead-scraper`
> 3. Executa `npm install`
> 4. Instala as dependências do Chromium/Puppeteer no Linux
> 5. Inicia o app automaticamente

---

## 📋 Pré-requisitos

| Requisito | Versão | Como verificar |
|---|---|---|
| **Node.js** | 18.x ou superior | `node --version` |
| **npm** | 8.x ou superior | `npm --version` |
| **Linux/WSL** | Ubuntu 20.04+ | `lsb_release -a` |

### Instalar dependências do Chromium (Linux/WSL Ubuntu)

O Puppeteer usa um Chromium embutido. Instale as libs gráficas necessárias:

```bash
sudo apt-get update && sudo apt-get install -y \
  ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 \
  libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 \
  libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 \
  libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 \
  libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 \
  libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
  libxss1 libxtst6 lsb-release wget xdg-utils libnss3
```

---

## ⚡ Como Iniciar

### Modo Interativo (Menu Visual)

```bash
node cli.js
# ou
npm start
```

Você será recebido pelo painel Space Neon. Use **↑ ↓ para navegar** e **Enter para selecionar**.

### Modo Linha Única (Sem Menu)

```bash
# Buscar leads diretamente
node cli.js -n "Clinica Estetica" -l "Copacabana, RJ" -c 10

# Visualizar leads salvos
node cli.js --show

# Ver ajuda
node cli.js --help
```

---

## 🔧 Modo de Linha Única (Parâmetros)

Ideal para **automatização**, **agendamento via cron** e **scripts de produção**:

| Parâmetro | Alias | Descrição | Obrigatório |
|---|---|---|---|
| `--niche` | `-n` | Nicho/palavra-chave da busca | ✅ Para busca |
| `--location` | `-l` | Localidade geográfica | ❌ |
| `--limit` | `-c` | Limite de leads (0 = sem limite) | ❌ (padrão: 10) |
| `--show` | `-s` | Exibe tabela de leads no SQLite | ❌ |
| `--help` | `-h` | Tela de ajuda | ❌ |

### Exemplos

```bash
# Buscar 5 clínicas em Copacabana
node cli.js -n "Clinica Estetica" -l "Copacabana, RJ" -c 5

# Buscar hotéis em SP sem limite
node cli.js --niche "Hotel" --location "São Paulo" --limit 0

# Ver tabela de todos os leads coletados
node cli.js --show

# Agendar busca diária via cron (toda madrugada 2h)
# crontab: 0 2 * * * cd ~/cli-web-lead-scraper && node cli.js -n "Estetica" -l "RJ" -c 20
```

---

## 🎮 Guia do Painel de Opções

### `🔍 1. Iniciar Nova Busca de Leads`
Configura e aciona o robô. Perguntas: nicho, localidade e limite de leads.

- Spinner animado com logs em tempo real
- Cancele com `Ctrl+C` a qualquer momento
- Leads salvos automaticamente no `leads.db`

### `📊 2. Visualizar Leads Coletados`
Tabela formatada com ajuste dinâmico de colunas:

- 🟢 Rating ≥ 4.2 → estrelas verdes
- 🔴 `Sem Site`, `Reputação Baixa` → sinal vermelho (alto potencial)
- 🟡 `Sem SSL`, `Sem WhatsApp`, `Domínio Grátis` → sinal amarelo

### `💡 3. Gerar Pitch de Vendas por Lead`
Selecione um lead e visualize o roteiro persuasivo B2B gerado automaticamente com base nos sinais detectados. Pronto para colar no WhatsApp.

### `❌ 4. Excluir Leads (Individual / Em Massa)`
Lista com checkboxes interativos:
- **↑ ↓** para navegar
- **Espaço** para marcar/desmarcar
- **Enter** para confirmar
- Exclusão permanente do `leads.db` com confirmação

### `📥 5. Exportar Leads (CSV, JSON, MD)`
Gera arquivos na pasta do projeto:

| Formato | Arquivo | Uso |
|---|---|---|
| CSV | `leads_export.csv` | Excel, Google Sheets, CRM |
| JSON | `leads_export.json` | APIs, integrações |
| Markdown | `leads_report.md` | Relatório executivo completo |

---

## ⚙️ Como Funciona

### User-Agent Desktop
O robô emula um Chrome Windows real para evitar o modo limitado do Google Maps e garantir a extração completa de avaliações e categorias.

### Extração de Reviews (4 Estratégias)
O sistema tenta 4 estratégias em cascata para extrair o número de avaliações:
1. Container `div.F7nice` (seletor primário)
2. Atributos `aria-label` contendo informações de estrelas
3. Botões com `aria-label` de avaliação
4. Varredura de spans com padrão `(N)` ou `N avaliações`

### Mapeamento Recursivo de Serviços
O robô segue links internos em busca de páginas de serviços/tratamentos e usa um dicionário semântico para identificar especialidades (Botox, Ortodontia, Corte, Tosa, etc.).

### SQLite Independente
Cada instalação tem seu próprio banco `leads.db` isolado. Dados persistem entre sessões. Nenhum dado é enviado para nenhum servidor externo.

---

## 🛠️ Resolução de Problemas

### ❌ Erro: `Failed to launch the browser process!`

O Chromium precisa de bibliotecas gráficas. Execute:

```bash
sudo apt-get update && sudo apt-get install -y \
  libgbm1 libnss3 libatk-bridge2.0-0 libgtk-3-0 libxss1
```

### ❌ Emojis e bordas aparecem como caracteres estranhos

Use o **Windows Terminal** com fonte *Cascadia Code* ou *Fira Code*:

```
winget install Microsoft.WindowsTerminal
```

### ❌ `npm install` falha com erro de permissão

```bash
sudo chown -R $USER:$GROUP ~/.npm
npm install
```

### ❌ Leads com `reviews = 0`

O sistema já tenta 4 estratégias + fallback do card da lista. Se ainda ocorrer, pode ser que o Google Maps retornou uma versão simplificada da página. Tente rodar novamente — o sistema detecta duplicatas e re-rastreia leads com dados corrompidos automaticamente.

---

## 📁 Estrutura do Projeto

```
cli-web-lead-scraper/
├── cli.js              # App principal — menu interativo + modo parâmetros
├── scraper.js          # Motor Puppeteer — Google Maps + Website Crawler
├── pitchGenerator.js   # Gerador de Pitches B2B por IA
├── leads.db            # Banco SQLite local (gerado automaticamente)
├── package.json
└── README.md
```

---

## 📄 Licença

MIT © [jonastduarte](https://github.com/jonastduarte)
