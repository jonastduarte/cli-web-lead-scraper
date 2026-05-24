# 🚀 Manual do Usuário - CLI WEB Lead Scraper v1.0.0

Bem-vindo ao **CLI WEB Lead Scraper v1.0.0**! Este é um motor avançado de prospecção comercial B2B, diagnóstico de presença digital e geração de abordagens comerciais por IA, rodando diretamente no seu terminal de comando Linux WSL.

Este manual contém instruções completas para instalação, uso, exportação e resolução de problemas da sua nova ferramenta CLI.

---

## 📌 Índice
1. [Visão Geral](#-visão-geral)
2. [Pré-requisitos e Dependências](#-pré-requisitos-e-dependências)
3. [Instalação](#-instalação)
4. [Como Iniciar a Aplicação](#-como-iniciar-a-aplicação)
5. [Guia Detalhado do Painel de Opções](#-guia-detalhado-do-painel-de-opções)
6. [Formatos de Exportação](#-formatos-de-exportação)
7. [Como Funciona por Baixo dos Panos](#-como-funciona-por-baixo-dos-panos)
8. [Resolução de Problemas (Troubleshooting)](#-resolução-de-problemas-troubleshooting)

---

## 🔍 Visão Geral

O **CLI WEB Lead Scraper** foi projetado para atuar como uma central autônoma de inteligência B2B. Ele automatiza as seguintes etapas de prospecção:
1. **Varredura no Google Maps**: Busca leads em qualquer nicho e localidade usando técnicas que simulam a navegação humana.
2. **Diagnóstico Estético e Técnico**: Acessa os sites oficiais dos leads e mapeia redes sociais, emails, paletas de cores da marca, responsividade de layout e **recursivamente varre páginas internas de serviços**.
3. **Mapeamento de Sinais de Oportunidades**: Identifica falhas graves (como falta de site, falta de segurança SSL, falta de link para WhatsApp e baixa reputação).
4. **Criação de Propostas Persuasivas**: Gera roteiros comerciais personalizados (Pitches) com base nas fraquezas encontradas, prontos para envio.

---

## 📋 Pré-requisitos e Dependências

Para rodar a ferramenta sob o Linux WSL, você precisará de:
* **Node.js**: Versão 18.x ou superior recomendada.
* **NPM**: Gerenciador de pacotes nativo do Node.
* **Chromium/Chrome Dependencies**: Como o Puppeteer baixa e executa um navegador Chromium interno sob o Linux de modo headless, o seu sistema Linux precisa das bibliotecas gráficas básicas instaladas (mesmo sem monitor).

---

## 📥 Instalação

A aplicação já está devidamente configurada no seu diretório `/home/jonas/projetos/cli-web-lead-scraper`. 

Caso precise reinstalar em outra máquina, execute os seguintes passos no terminal Linux:
```bash
# 1. Navegar até a pasta do projeto
cd /home/jonas/projetos/cli-web-lead-scraper

# 2. Instalar todas as dependências declaradas
npm install
```

---

## ⚡ Como Iniciar a Aplicação

A aplicação suporta dois modos de operação extremamente flexíveis: o **Modo Interativo (Menu)** e o **Modo Comando (Linha Única)**.

### 1. Modo Interativo (Menu Guiado)
Para rodar a central de prospecção de forma visual e guiada pelo menu interativo, certifique-se de que está na pasta do projeto e execute:
```bash
npm start
# ou
node cli.js
```
Você será recebido por uma tela de boas-vindas neon e o menu principal. **Use as setas do teclado (↑ / ↓) para navegar e a tecla `Enter` para selecionar a sua opção.**

### 2. Modo Comando (Parâmetros em Linha Única)
Se você deseja automatizar buscas em scripts, agendar tarefas (via Cron) ou rodar pesquisas de forma direta em apenas um comando no terminal (sem navegar por menus), utilize os parâmetros na chamada do comando:
```bash
node cli.js -n "[Nicho]" -l "[Localidade]" -c [Limite]
```

**Parâmetros disponíveis:**
* `-n`, `--niche`      : Nicho comercial a buscar (**Obrigatório** para busca). Ex: `-n "Serralheria"`.
* `-l`, `--location`   : Localidade geográfica (**Opcional**). Ex: `-l "Leblon, RJ"`.
* `-c`, `--limit`      : Limite de leads a extrair (**Opcional**, padrão: 10, use 0 para ilimitado).
* `-s`, `--show`       : Exibe a tabela de leads já cadastrados no SQLite e encerra diretamente (Sem Menu).
* `-h`, `--help`       : Exibe a tela de ajuda com as instruções operacionais de parâmetros.

**Exemplos de execução:**
```bash
# Exemplo 1: Buscar 5 clínicas de estética em Copacabana
node cli.js -n "Clinica Estetica" -l "Copacabana, RJ" -c 5

# Exemplo 2: Buscar hotéis em São Paulo de forma ilimitada
node cli.js --niche "Hotel" --location "Sao Paulo" --limit 0

# Exemplo 3: Exibir a tabela de todos os leads cadastrados no SQLite local
node cli.js --show
# ou
node cli.js -s

# Exemplo 4: Solicitar tela de ajuda com parâmetros
node cli.js --help
```
*Nota: No Modo Comando, o robô executa a extração em lote, salva todos os leads e pitches resultantes diretamente no banco relacional SQLite independente (`leads.db`) e encerra o processo de forma limpa.*

---

## 🎮 Guia Detalhado do Painel de Opções

### 1. `🔍 1. Iniciar Nova Busca de Leads`
Esta opção aciona o robô autônomo. Você passará por três perguntas simples de configuração:
* **Nicho/Palavra-chave**: O segmento que deseja extrair (ex: `Clinica de Estetica`, `Dentista`, `Serralheria`).
* **Localidade (opcional)**: O local da busca (ex: `Leblon, Rio de Janeiro`). Se preferir uma busca global/ampla, deixe em branco e aperte `Enter`.
* **Limite de Leads**: Quantos resultados deseja capturar antes de encerrar. Digite `0` para que o robô procure até o fim da lista do Google Maps.

**Durante a Execução**:
* Um spinner circular animado mostrará o status detalhado da operação.
* Quando um lead é capturado, suas especialidades e pitch são gerados, os dados são salvos localmente no arquivo `leads.json` e uma notificação de sucesso verde com a classificação do lead (ex: `★ 4.9 (105 reviews)`) é impressa na tela.
* **Como Cancelar**: Se desejar interromper a busca a qualquer momento, basta apertar **`Ctrl + C`**. O robô concluirá com segurança a gravação do lead atual, fechará o navegador de fundo e retornará você de forma limpa ao Menu Principal.

---

### 2. `📊 2. Visualizar Leads Coletados`
Exibe os dados armazenados de forma estruturada em uma tabela elegante com ajuste dinâmico de largura:
* **Classificação por Cores**: ratings acima de `4.2` aparecem com estrelas verdes, estimulando focar em reputações consolidadas.
* **Destaque nos Sinais B2B**: Oportunidades críticas aparecem coloridas para facilitar a escaneabilidade visual:
  * Red (`🚫 Sem Site`, `📉 Reputação`): Alvos de altíssima conversão.
  * Yellow (`⚠️ Sem SSL`, `💬 Falta WA`, `🆓 Dom. Grátis`, `📱 Redes`): Falhas de profissionalismo fáceis de resolver.

---

### 3. `💡 3. Gerar Pitch de Vendas por Lead`
Selecione um lead específico a partir de uma lista interativa. A CLI buscará a análise da IA e imprimirá na tela o roteiro persuasivo formatado com quebras de linha ideais dentro de uma caixa com bordas duplas em magenta.
* **Como Usar**: Basta selecionar o texto gerado com o mouse no seu terminal WSL, copiar e enviar diretamente para o cliente via WhatsApp ou cold-mail.

---

### 4. `❌ 4. Excluir Leads (Individual / Em Massa)`
Permite manter a sua base de dados organizada e limpa de forma altamente eficiente. Ao selecionar esta opção:
* A aplicação exibirá uma lista de todos os leads cadastrados no banco de dados SQLite com uma caixa de seleção à esquerda.
* **Como Navegar e Selecionar**: Use as setas do teclado (`↑` e `↓`) para navegar, a **tecla `Espaço`** para marcar ou desmarcar cada lead e a tecla **`Enter`** para confirmar a sua escolha.
* Você pode selecionar **um único lead** ou **múltiplos leads de uma só vez**.
* O sistema solicitará uma confirmação geral informando a quantidade total de leads que serão excluídos permanentemente do banco `leads.db`.

---

### 5. `📥 5. Exportar Leads (CSV, JSON, MD)`
Menu flexível para extração externa de inteligência B2B. Ele gera os arquivos diretamente na pasta do projeto:
* **Opção 1. Planilha Excel/CSV (`leads_export.csv`)**: Gera um arquivo separado por vírgulas formatado com aspas de segurança. Perfeito para importar em sistemas de CRM, planilhas do Google ou Excel.
* **Opção 2. Banco de Dados JSON (`leads_export.json`)**: Cópia integral limpa da estrutura para desenvolvedores ou integração com APIs.
* **Opção 3. Relatório Executivo Markdown (`leads_report.md`)**: Gera um relatório completo em markdown (`.md`), contendo estatísticas da busca, uma tabela MD formatada de leads com links diretos, e seções individuais para cada negócio contendo dados de contato, email, especialidades mapeadas e o pitch IA em formato de citação para fácil cópia.

---

## ⚙️ Como Funciona por Baixo dos Panos

### Injeção de User-Agent Desktop
Para evitar bloqueios e contornar a limitação de recursos do headless Chromium em ambientes Linux (WSL), o robô emula um navegador Windows desktop legítimo. Isso impede que o Google Maps force a "Visualização Limitada" (que remove o número de avaliações do DOM), garantindo a extração 100% precisa das classificações reais dos prospectos.

### Mapeamento Recursivo de Serviços
Se o lead tiver um site customizado, o robô buscará em seu código de origem por links internos para páginas de serviços ou tratamentos. Ao encontrar, ele carrega essa subpágina em segundo plano e usa um dicionário semântico inteligente para mapear especialidades (como *Botox*, *Coloração*, *Divórcio*, *Tosa*), gerando pitches comerciais cirúrgicos.

---

## 🛠️ Resolução de Problemas (Troubleshooting)

### 1. O Puppeteer falha com erro "Failed to launch the browser process!" ou falta de bibliotecas (`libnss3.so`, etc.)
Este é o erro mais comum em instalações WSL Ubuntu limpas, pois o Linux WSL não vem com dependências de janelas gráficas instaladas por padrão.
* **Solução**: Execute o comando abaixo no terminal WSL para instalar todas as bibliotecas necessárias para rodar o navegador Chromium interno:
```bash
sudo apt-get update && sudo apt-get install -y ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils libnss3
```

### 2. O terminal exibe caracteres estranhos nas bordas e ícones
Algumas fontes de console do Windows (como a antiga Consolas ou Courier New) não suportam caracteres Unicode modernos e emojis.
* **Solução**: Recomendamos utilizar o **Windows Terminal** (disponível gratuitamente na Microsoft Store) com uma fonte moderna habilitada (como *Cascadia Code*, *Fira Code* ou *Inter*), que renderizará todas as bordas e tabelas perfeitamente!
