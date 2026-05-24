#!/usr/bin/env bash

# Colors for premium look
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m' # No Color

clear

echo -e "${CYAN}${BOLD}================================================================${NC}"
echo -e "${CYAN}${BOLD}     🚀 CLI Web Lead Scraper — Instalador Automatizado v1.2.0    ${NC}"
echo -e "${CYAN}${BOLD}================================================================${NC}"
echo -e ""

# 1. Verification of dependencies
echo -e "${BLUE}[1/5] Verificando dependências básicas...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Erro: Node.js não está instalado.${NC}"
    echo -e "${YELLOW}Por favor, instale o Node.js v18+ usando seu gerenciador de pacotes ou nvm e tente novamente.${NC}"
    exit 1
fi

NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VER" -lt 18 ]; then
    echo -e "${YELLOW}Aviso: A versão do seu Node.js ($(node -v)) é inferior a v18. Algumas funções podem não operar devidamente.${NC}"
fi
echo -e "${GREEN}✔ Node.js $(node -v) está instalado!${NC}"

if ! command -v git &> /dev/null; then
    echo -e "${RED}Erro: git não está instalado.${NC}"
    echo -e "${YELLOW}Por favor, instale o git (ex: sudo apt install git) e tente novamente.${NC}"
    exit 1
fi
echo -e "${GREEN}✔ git está instalado!${NC}"

# 2. Cloning the repository
echo -e ""
echo -e "${BLUE}[2/5] Clonando o repositório do CLI Web Lead Scraper...${NC}"
INSTALL_DIR="$HOME/cli-web-lead-scraper"

if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}Diretório '$INSTALL_DIR' já existe. Atualizando repositório existente...${NC}"
    cd "$INSTALL_DIR" || exit 1
    git pull
else
    git clone https://github.com/jonastduarte/cli-web-lead-scraper.git "$INSTALL_DIR"
    cd "$INSTALL_DIR" || exit 1
fi

# 3. Installing Node.js dependencies
echo -e ""
echo -e "${BLUE}[3/5] Instalando dependências do projeto (npm install)...${NC}"
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✔ Dependências do Node.js instaladas com sucesso!${NC}"
else
    echo -e "${RED}Erro ao instalar dependências. Verifique se o npm está configurado corretamente.${NC}"
    exit 1
fi

# 4. Checking system libraries for Puppeteer (WSL / Ubuntu)
echo -e ""
echo -e "${BLUE}[4/5] Verificando dependências do Puppeteer/Chromium...${NC}"
if [ -f /etc/debian_version ]; then
    echo -e "${YELLOW}Detectado sistema baseado em Debian/Ubuntu.${NC}"
    echo -e "Instalando bibliotecas do sistema necessárias para rodar o Chrome em modo headless..."
    sudo apt-get update && sudo apt-get install -y \
        ca-certificates \
        fonts-liberation \
        libasound2 \
        libatk1.0-0 \
        libc6 \
        libcairo2 \
        libcups2 \
        libdbus-1-3 \
        libexpat1 \
        libfontconfig1 \
        libgbm1 \
        libgcc1 \
        libgconf-2-4 \
        libgdk-pixbuf2.0-0 \
        libglib2.0-0 \
        libgtk-3-0 \
        libnspr4 \
        libnss3 \
        libpango-1.0-0 \
        libpangocairo-1.0-0 \
        libstdc++6 \
        libx11-6 \
        libx11-xcb1 \
        libxcb1 \
        libxcomposite1 \
        libxcursor1 \
        libxdamage1 \
        libxext6 \
        libxfixes3 \
        libxi6 \
        libxrandr2 \
        libxrender1 \
        libxss1 \
        libxtst6 \
        lsb-release \
        wget \
        xdg-utils
    echo -e "${GREEN}✔ Dependências gráficas instaladas!${NC}"
else
    echo -e "${YELLOW}Sistema operacional não baseado em Debian/Ubuntu detectado.${NC}"
    echo -e "${YELLOW}Caso o Puppeteer/Chromium apresente erro ao iniciar, consulte o README.md para instalar as bibliotecas do seu sistema manualmente.${NC}"
fi

# 5. Finished setup
echo -e ""
echo -e "${CYAN}${BOLD}================================================================${NC}"
echo -e "${GREEN}${BOLD}      🎉 CLI Web Lead Scraper instalado com sucesso!             ${NC}"
echo -e "${CYAN}${BOLD}================================================================${NC}"
echo -e ""
echo -e "Para iniciar a prospecção B2B direto no terminal:"
echo -e "  ${BOLD}cd ~/cli-web-lead-scraper && node cli.js${NC}"
echo -e ""
echo -e "Use os argumentos de linha de comando para automação direta:"
echo -e "  ${BOLD}node cli.js --keyword=\"clinica de estetica\" --location=\"Rio de Janeiro\" --limit=20${NC}"
echo -e ""
echo -e "Aproveite a sua nova ferramenta de prospecção autônoma! 🚀"
echo -e "================================================================"
