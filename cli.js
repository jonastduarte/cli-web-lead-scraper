// CLI WEB Lead Scraper - Terminal CLI Version with SQLite
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import inquirer from 'inquirer';
import Table from 'cli-table3';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { runScrape } from './scraper.js';
import { generateSalesPitch } from './pitchGenerator.js';

const leadsFilePath = './leads.json';
const dbFilePath = './leads.db';

let db = null;

// --- DATA PERSISTENCE HANDLERS (AUTO-HEAL) ---
const sanitizeLead = (lead) => {
  let modified = false;
  if (lead.category) {
    const cleanCat = lead.category.replace(/^[0-9.,()\s·]+/, '').trim();
    if (cleanCat !== lead.category) {
      lead.category = cleanCat;
      modified = true;
    }
  }
  if (lead.opportunities && lead.rating !== null) {
    const ratingNum = parseFloat(lead.rating);
    if (ratingNum >= 4.2) {
      const filtered = lead.opportunities.filter(opp => opp !== 'REPUTACAO_BAIXA');
      if (filtered.length !== lead.opportunities.length) {
        lead.opportunities = filtered;
        modified = true;
      }
    }
  }
  // Auto-heal corrupted reviewsCount (rating * 10 bug)
  if (lead.rating !== null && lead.reviewsCount !== null) {
    const ratingX10 = Math.round(parseFloat(lead.rating) * 10);
    if (lead.reviewsCount === ratingX10 && ratingX10 > 0) {
      lead.reviewsCount = 0;
      modified = true;
    }
  }
  return { lead, modified };
};

// --- SQLITE DATABASE MANAGER & AUTO-MIGRATION ---
const initDatabase = async () => {
  try {
    db = await open({
      filename: dbFilePath,
      driver: sqlite3.Database
    });

    // Create the leads table if not exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        websiteType TEXT,
        address TEXT,
        rating REAL,
        reviewsCount INTEGER,
        latitude REAL,
        longitude REAL,
        mapsUrl TEXT,
        imageUrl TEXT,
        photos TEXT,         -- Serialized JSON array
        brandColors TEXT,    -- Serialized JSON array
        styleEsthetic TEXT,
        services TEXT,       -- Serialized JSON array
        hasSSL INTEGER,      -- Boolean (0 or 1)
        hasCustomDomain INTEGER, -- Boolean (0 or 1)
        hasWhatsapp INTEGER, -- Boolean (0 or 1)
        opportunities TEXT,  -- Serialized JSON array
        salesPitch TEXT,
        timestamp INTEGER
      )
    `);

    // Run migration from JSON if it exists
    await migrateFromJson();
  } catch (err) {
    console.error(chalk.red("Erro crítico na inicialização do banco SQLite CLI:"), err.message);
    process.exit(1);
  }
};

const migrateFromJson = async () => {
  try {
    if (fs.existsSync(leadsFilePath) && !fs.lstatSync(leadsFilePath).isSymbolicLink()) {
      console.log(chalk.bold.yellow("\n[Migration] Detectado leads.json histórico. Importando para SQLite local..."));
      const data = fs.readFileSync(leadsFilePath, 'utf8');
      const leads = JSON.parse(data || '[]');
      
      let count = 0;
      for (const lead of leads) {
        const { lead: cleanLead } = sanitizeLead(lead);
        await saveLeadToDb(cleanLead);
        count++;
      }
      
      console.log(chalk.bold.green(`[Migration] Importação concluída! ${count} leads importados para leads.db`));
      
      // Rename file to prevent re-migration
      const backupPath = './leads_backup.json';
      fs.renameSync(leadsFilePath, backupPath);
      console.log(chalk.grey(`[Migration] Arquivo leads.json renomeado para ${backupPath} como backup.`));
      await new Promise(r => setTimeout(r, 1500));
    }
  } catch (err) {
    console.error(chalk.red("[Migration] Falha durante a importação dos dados JSON:"), err.message);
  }
};

const saveLeadToDb = async (lead) => {
  const { lead: cleanLead } = sanitizeLead(lead);
  await db.run(`
    INSERT OR REPLACE INTO leads (
      id, name, category, phone, email, website, websiteType, address, 
      rating, reviewsCount, latitude, longitude, mapsUrl, imageUrl, 
      photos, brandColors, styleEsthetic, services, hasSSL, 
      hasCustomDomain, hasWhatsapp, opportunities, salesPitch, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    cleanLead.id,
    cleanLead.name,
    cleanLead.category || '',
    cleanLead.phone || '',
    cleanLead.email || '',
    cleanLead.website || '',
    cleanLead.websiteType || 'SEM_SITE',
    cleanLead.address || '',
    cleanLead.rating,
    cleanLead.reviewsCount,
    cleanLead.latitude,
    cleanLead.longitude,
    cleanLead.mapsUrl || '',
    cleanLead.imageUrl || '',
    JSON.stringify(cleanLead.photos || []),
    JSON.stringify(cleanLead.brandColors || []),
    cleanLead.styleEsthetic || 'Sem Website',
    JSON.stringify(cleanLead.services || []),
    cleanLead.hasSSL ? 1 : 0,
    cleanLead.hasCustomDomain ? 1 : 0,
    cleanLead.hasWhatsapp ? 1 : 0,
    JSON.stringify(cleanLead.opportunities || []),
    cleanLead.salesPitch || '',
    cleanLead.timestamp || Date.now()
  ]);
};

const getAllLeads = async () => {
  const rows = await db.all(`SELECT * FROM leads ORDER BY timestamp DESC`);
  return rows.map(row => {
    const lead = {
      id: row.id,
      name: row.name,
      category: row.category,
      phone: row.phone,
      email: row.email,
      website: row.website,
      websiteType: row.websiteType,
      address: row.address,
      rating: row.rating,
      reviewsCount: row.reviewsCount,
      latitude: row.latitude,
      longitude: row.longitude,
      mapsUrl: row.mapsUrl,
      imageUrl: row.imageUrl,
      photos: JSON.parse(row.photos || '[]'),
      brandColors: JSON.parse(row.brandColors || '[]'),
      styleEsthetic: row.styleEsthetic,
      services: JSON.parse(row.services || '[]'),
      hasSSL: !!row.hasSSL,
      hasCustomDomain: !!row.hasCustomDomain,
      hasWhatsapp: !!row.hasWhatsapp,
      opportunities: JSON.parse(row.opportunities || '[]'),
      salesPitch: row.salesPitch,
      timestamp: row.timestamp
    };
    const { lead: cleanLead } = sanitizeLead(lead);
    return cleanLead;
  });
};

const deleteLeadFromDb = async (leadId) => {
  await db.run(`DELETE FROM leads WHERE id = ?`, [leadId]);
};

// --- TERMINAL RENDERERS ---
const showHeader = () => {
  console.clear();
  console.log(boxen(
    chalk.bold.magenta("🚀 CLI WEB Lead Scraper v1.0.0") + "\n" +
    chalk.cyan("Motor de Prospecção & Diagnóstico B2B Avançado (Term-CLI)"),
    {
      padding: 1,
      margin: { top: 0, bottom: 1, left: 0, right: 0 },
      borderStyle: 'double',
      borderColor: 'cyan',
      titleAlignment: 'center'
    }
  ));
};

const renderLeadsTable = (leads) => {
  const table = new Table({
    head: [
      chalk.bold.magenta('Nome'), 
      chalk.bold.magenta('Categoria'), 
      chalk.bold.magenta('Telefone'), 
      chalk.bold.magenta('Site'), 
      chalk.bold.magenta('Avaliação'), 
      chalk.bold.magenta('Sinais B2B')
    ],
    colWidths: [26, 16, 18, 22, 12, 18],
    wordWrap: true
  });

  leads.forEach(lead => {
    // Styling rating
    let ratingStr = chalk.grey('Sem nota');
    if (lead.rating !== null) {
      const star = lead.rating >= 4.2 ? chalk.green('★') : chalk.yellow('★');
      const rateVal = lead.rating >= 4.2 ? chalk.bold.green(lead.rating.toFixed(1)) : chalk.yellow(lead.rating.toFixed(1));
      ratingStr = `${star} ${rateVal} (${lead.reviewsCount || 0})`;
    }

    // Styling signals B2B
    let signalsStr = chalk.green('Sem Oportunidades');
    if (lead.opportunities && lead.opportunities.length > 0) {
      signalsStr = lead.opportunities.map(opp => {
        if (opp === 'SEM_SITE') return chalk.red('🚫 Sem Site');
        if (opp === 'SEM_SSL') return chalk.yellow('⚠️ Sem SSL');
        if (opp === 'REPUTACAO_BAIXA') return chalk.red('📉 Reputação');
        if (opp === 'FALTA_WHATSAPP') return chalk.yellow('💬 Falta WA');
        if (opp === 'DOMINIO_GRATUITO') return chalk.yellow('🆓 Dom. Grátis');
        if (opp === 'WHATSAPP_LINK_COMO_SITE') return chalk.yellow('🔗 Link WA');
        if (opp === 'REDE_SOCIAL_COMO_SITE') return chalk.yellow('📱 Redes');
        return opp;
      }).join('\n');
    }

    table.push([
      chalk.bold.white(lead.name),
      lead.category || chalk.grey('N/A'),
      lead.phone || chalk.grey('Sem Fone'),
      lead.website ? chalk.cyan(lead.website) : chalk.grey('N/A'),
      ratingStr,
      signalsStr
    ]);
  });

  console.log(table.toString());
};

// --- EXPORT SCRIPTS ---
const exportCSV = (leads) => {
  const headers = [
    'ID', 'Nome', 'Categoria', 'Telefone', 'Email', 'Site', 'Tipo de Site', 
    'Avaliação', 'Qtd de Avaliações', 'Latitude', 'Longitude', 'Possui WhatsApp', 'Sinais de Oportunidades', 'Pitch'
  ];
  
  const rows = leads.map(lead => {
    const opps = lead.opportunities ? lead.opportunities.join('; ') : '';
    const phone = lead.phone ? lead.phone.replace(/[\u200B-\u200D\uFEFF]/g, '').trim() : '';
    const name = lead.name ? lead.name.replace(/"/g, '""') : '';
    const cat = lead.category ? lead.category.replace(/"/g, '""') : '';
    const email = lead.email ? lead.email : '';
    const site = lead.website ? lead.website : '';
    const pitch = lead.salesPitch ? lead.salesPitch.replace(/"/g, '""') : '';
    
    return [
      `"${lead.id}"`,
      `"${name}"`,
      `"${cat}"`,
      `"${phone}"`,
      `"${email}"`,
      `"${site}"`,
      `"${lead.websiteType}"`,
      lead.rating !== null ? lead.rating : '',
      lead.reviewsCount !== null ? lead.reviewsCount : '',
      lead.latitude !== null ? lead.latitude : '',
      lead.longitude !== null ? lead.longitude : '',
      lead.hasWhatsapp ? 'Sim' : 'Não',
      `"${opps}"`,
      `"${pitch}"`
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  fs.writeFileSync('./leads_export.csv', csvContent, 'utf8');
  console.log(chalk.bold.green('\n📥 Exportado com sucesso: ') + chalk.cyan('./leads_export.csv'));
};

const exportJSON = (leads) => {
  fs.writeFileSync('./leads_export.json', JSON.stringify(leads, null, 2), 'utf8');
  console.log(chalk.bold.green('\n📥 Exportado com sucesso: ') + chalk.cyan('./leads_export.json'));
};

const exportMarkdown = (leads) => {
  let md = `# Relatório Executivo - CLI WEB Lead Scraper\n\n`;
  md += `Mapeamento comercial B2B estruturado gerado em: ${new Date().toLocaleString('pt-BR')}\n\n`;
  md += `Total de Leads Mapeados: **${leads.length}**\n\n`;
  
  // 1. Table
  md += `## 📊 Visão Geral dos Leads\n\n`;
  md += `| Nome | Categoria | Telefone | Site | Avaliação | Sinais de Oportunidades |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
  
  leads.forEach(l => {
    const opps = l.opportunities && l.opportunities.length > 0 ? l.opportunities.join(', ') : 'Nenhuma';
    const rate = l.rating !== null ? `${l.rating.toFixed(1)} (${l.reviewsCount || 0})` : 'Sem avaliação';
    const phone = l.phone ? l.phone.replace(/[^\d()\-+ ]/g, '').trim() : 'Sem telefone';
    const site = l.website ? `[Acessar](${l.website})` : 'N/A';
    md += `| **${l.name}** | ${l.category || 'N/A'} | ${phone} | ${site} | ${rate} | ${opps} |\n`;
  });
  
  md += `\n---\n\n`;
  
  // 2. Details and pitches
  md += `## 💡 Diagnósticos e Propostas de Abordagem (Outreach)\n\n`;
  leads.forEach((l, idx) => {
    md += `### ${idx + 1}. ${l.name}\n`;
    md += `* **Categoria**: ${l.category || 'N/A'}\n`;
    md += `* **Telefone**: ${l.phone ? l.phone.replace(/[^\d()\-+ ]/g, '').trim() : 'Sem telefone'}\n`;
    md += `* **Email**: ${l.email || 'Não encontrado'}\n`;
    md += `* **Website**: ${l.website || 'N/A'} (${l.websiteType})\n`;
    md += `* **Avaliação**: ${l.rating !== null ? `${l.rating} ★ (${l.reviewsCount} reviews)` : 'N/A'}\n`;
    md += `* **Oportunidades**: ${l.opportunities ? l.opportunities.join(', ') : 'Nenhuma'}\n`;
    
    if (l.services && l.services.length > 0) {
      md += `* **Especialidades Mapeadas**: ${l.services.join(', ')}\n`;
    }
    
    if (l.salesPitch) {
      md += `\n> **Roteiro Persuasivo de Vendas (Cold Pitch)**:\n`;
      md += `> \n`;
      md += l.salesPitch.split('\n').map(line => `> ${line}`).join('\n') + `\n`;
    }
    md += `\n---\n\n`;
  });

  fs.writeFileSync('./leads_report.md', md, 'utf8');
  console.log(chalk.bold.green('\n📥 Exportado com sucesso: ') + chalk.cyan('./leads_report.md'));
};

// --- MENU CONTROLLERS ---
const executeSearch = async (niche, location, limitNum, isInteractive = true) => {
  showHeader();
  console.log(chalk.yellow(`[CLI] Inicializando busca por "${niche}" em "${location || 'global'}" (limite: ${limitNum || 'sem limite'})...\n`));

  const spinner = ora('Inicializando o motor de busca Puppeteer...').start();
  
  try {
    const existingLeads = await getAllLeads();
    const existingIds = new Set(
      existingLeads
        .filter(l => !(l.rating > 0 && l.reviewsCount === 0))
        .map(l => l.id)
    );

    let isAborted = false;

    // Listen to manual Ctrl+C clean exit if needed
    const abortHandler = () => {
      isAborted = true;
      spinner.warn(chalk.yellow("Interrupção solicitada pelo usuário. Concluindo lead atual e encerrando..."));
    };
    process.once('SIGINT', abortHandler);

    await runScrape(
      niche,
      location,
      limitNum,
      (progressMsg) => {
        // Stream logs inside the spinner nicely
        if (progressMsg.includes('[Erro')) {
          spinner.fail(chalk.red(progressMsg));
          spinner.start('Retomando busca...');
        } else {
          spinner.text = chalk.cyan(progressMsg);
        }
      },
      async (lead) => {
        // AI Cold Pitch generation
        lead.salesPitch = generateSalesPitch(lead);
        // SQLite storage
        await saveLeadToDb(lead);
        
        spinner.succeed(
          chalk.green(`Lead Coletado: `) + 
          chalk.bold.white(lead.name) + 
          chalk.yellow(` | ${lead.rating !== null ? lead.rating + '★' : 'Sem avaliações'} (${lead.reviewsCount || 0} reviews)`)
        );
        spinner.start('Aguardando próximo lead da fila...');
      },
      existingIds,
      () => isAborted
    );

    process.off('SIGINT', abortHandler);
    spinner.succeed(chalk.bold.green("Busca finalizada com sucesso!"));
    
  } catch (err) {
    spinner.fail(chalk.bold.red(`Ocorreu uma falha na raspagem: ${err.message}`));
  }

  if (isInteractive) {
    console.log(chalk.bold.cyan("\nPressione qualquer tecla para retornar ao Menu Principal..."));
    await inquirer.prompt([{ type: 'input', name: 'continue', message: '' }]);
  } else {
    console.log(chalk.bold.green("\n✨ Resultados de busca salvos com sucesso no banco de dados SQLite."));
    process.exit(0);
  }
};

const handleSearch = async () => {
  showHeader();
  console.log(chalk.bold.cyan("🔍 Configuração da Busca de Leads\n"));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'niche',
      message: 'Qual é o nicho/palavra-chave? (ex: Clinica de Estetica):',
      validate: input => input.trim() !== '' ? true : 'Por favor, digite o nicho da busca!'
    },
    {
      type: 'input',
      name: 'location',
      message: 'Qual é a localidade? (ex: Leblon, Rio de Janeiro - opcional):'
    },
    {
      type: 'input',
      name: 'limit',
      message: 'Qual é o limite de leads a coletar? (0 para sem limites):',
      default: '10',
      validate: input => {
        const num = parseInt(input);
        return !isNaN(num) && num >= 0 ? true : 'Digite um número válido igual ou superior a 0!';
      }
    }
  ]);

  const limitNum = parseInt(answers.limit) || 0;
  await executeSearch(answers.niche, answers.location, limitNum, true);
};

const handleViewLeads = async () => {
  showHeader();
  const leads = await getAllLeads();

  if (leads.length === 0) {
    console.log(chalk.bold.yellow("📊 Banco de Dados Local SQLite Vazio."));
    console.log(chalk.grey("Use a opção 'Iniciar Nova Busca' para extrair prospectos.\n"));
  } else {
    console.log(chalk.bold.cyan(`📊 Leads no SQLite Independente (${leads.length} leads)\n`));
    renderLeadsTable(leads);
  }

  console.log(chalk.bold.cyan("\nPressione qualquer tecla para retornar ao Menu Principal..."));
  await inquirer.prompt([{ type: 'input', name: 'continue', message: '' }]);
};

const handleGeneratePitch = async () => {
  showHeader();
  const leads = await getAllLeads();

  if (leads.length === 0) {
    console.log(chalk.bold.yellow("💡 Sem leads para propostas no momento.\n"));
  } else {
    const listAnswers = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedId',
        message: 'Selecione o lead para visualizar o Pitch de Vendas por IA:',
        choices: leads.map(l => ({ name: `${l.name} (${l.rating || 'N/A'}★) - ${l.category || 'Sem Categoria'}`, value: l.id }))
      }
    ]);

    const lead = leads.find(l => l.id === listAnswers.selectedId);
    
    showHeader();
    console.log(chalk.bold.cyan(`💡 Pitch de Prospecção Comercial IA para:\n`) + chalk.bold.white(lead.name) + "\n");
    
    // Aesthetic double neon box borders
    console.log(boxen(
      chalk.white(lead.salesPitch),
      {
        title: chalk.bold.magenta('📢 Abordagem Persuasiva B2B'),
        titleAlignment: 'center',
        padding: 1,
        borderStyle: 'double',
        borderColor: 'magenta',
        maxWidth: 80
      }
    ));
  }

  console.log(chalk.bold.cyan("\nPressione qualquer tecla para retornar ao Menu Principal..."));
  await inquirer.prompt([{ type: 'input', name: 'continue', message: '' }]);
};

const handleDeleteLead = async () => {
  showHeader();
  const leads = await getAllLeads();

  if (leads.length === 0) {
    console.log(chalk.bold.yellow("❌ Sem leads cadastrados no momento.\n"));
  } else {
    const listAnswers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedIds',
        message: 'Selecione o(s) lead(s) que deseja EXCLUIR (aperte [Espaço] para marcar, [Enter] para confirmar):',
        choices: leads.map(l => ({ name: `${l.name} (${l.rating || 'N/A'}★) - ${l.category || 'Sem Categoria'}`, value: l.id }))
      }
    ]);

    if (listAnswers.selectedIds.length === 0) {
      console.log(chalk.bold.yellow('\n⚠️ Nenhum lead selecionado para exclusão.'));
    } else {
      const confirmAnswer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: chalk.red(`Você tem certeza que deseja deletar permanentemente os ${listAnswers.selectedIds.length} lead(s) selecionado(s) do banco SQLite?`),
          default: false
        }
      ]);

      if (confirmAnswer.confirm) {
        const placeholders = listAnswers.selectedIds.map(() => '?').join(',');
        await db.run(`DELETE FROM leads WHERE id IN (${placeholders})`, listAnswers.selectedIds);
        console.log(chalk.bold.green(`\n✅ ${listAnswers.selectedIds.length} lead(s) deletado(s) com sucesso do banco de dados!`));
      } else {
        console.log(chalk.bold.yellow('\n❌ Operação cancelada pelo usuário.'));
      }
    }
  }

  console.log(chalk.bold.cyan("\nPressione qualquer tecla para retornar ao Menu Principal..."));
  await inquirer.prompt([{ type: 'input', name: 'continue', message: '' }]);
};

const handleExport = async () => {
  showHeader();
  const leads = await getAllLeads();

  if (leads.length === 0) {
    console.log(chalk.bold.yellow("📥 Sem leads no banco SQLite local para exportar.\n"));
  } else {
    const exportAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'format',
        message: 'Selecione o formato de exportação de dados:',
        choices: [
          { name: '1. Planilha Excel/CSV (.csv)', value: 'CSV' },
          { name: '2. Banco de Dados JSON (.json)', value: 'JSON' },
          { name: '3. Relatório Executivo Markdown (.md)', value: 'MD' }
        ]
      }
    ]);

    if (exportAnswer.format === 'CSV') {
      exportCSV(leads);
    } else if (exportAnswer.format === 'JSON') {
      exportJSON(leads);
    } else if (exportAnswer.format === 'MD') {
      exportMarkdown(leads);
    }
  }

  console.log(chalk.bold.cyan("\nPressione qualquer tecla para retornar ao Menu Principal..."));
  await inquirer.prompt([{ type: 'input', name: 'continue', message: '' }]);
};

// --- RUN ENGINE ---
const mainLoop = async () => {
  let running = true;
  
  while (running) {
    showHeader();
    
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'menuOption',
        message: chalk.bold.cyan('Selecione uma opção do painel B2B:'),
        choices: [
          { name: '🔍 1. Iniciar Nova Busca de Leads', value: 'SEARCH' },
          { name: '📊 2. Visualizar Leads Coletados', value: 'VIEW' },
          { name: '💡 3. Gerar Pitch de Vendas por Lead', value: 'PITCH' },
          { name: '❌ 4. Excluir Leads (Individual / Em Massa)', value: 'DELETE' },
          { name: '📥 5. Exportar Leads (CSV, JSON, MD)', value: 'EXPORT' },
          { name: '🚪 6. Sair', value: 'EXIT' }
        ]
      }
    ]);

    if (answer.menuOption === 'SEARCH') {
      await handleSearch();
    } else if (answer.menuOption === 'VIEW') {
      await handleViewLeads();
    } else if (answer.menuOption === 'PITCH') {
      await handleGeneratePitch();
    } else if (answer.menuOption === 'DELETE') {
      await handleDeleteLead();
    } else if (answer.menuOption === 'EXPORT') {
      await handleExport();
    } else if (answer.menuOption === 'EXIT') {
      running = false;
      showHeader();
      console.log(boxen(
        chalk.bold.green("👋 Obrigado por utilizar o CLI WEB Lead Scraper!") + "\n" +
        chalk.cyan("Suas prospecções B2B foram gravadas no banco de dados SQLite independente."),
        {
          padding: 1,
          borderStyle: 'round',
          borderColor: 'green'
        }
      ));
    }
  }
};

const startApp = async () => {
  // Initialize the database on CLI startup
  await initDatabase();

  // Parse command line arguments
  const args = process.argv.slice(2);
  let isArgSearch = false;
  let isShowArg = false;
  let nicheArg = '';
  let locationArg = '';
  let limitArg = 10; // Default limit for quick command line usage

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    let key = arg;
    let val = '';
    let hasEquals = false;

    if (arg.includes('=')) {
      const idx = arg.indexOf('=');
      key = arg.slice(0, idx);
      val = arg.slice(idx + 1);
      hasEquals = true;
    }

    if (key === '--niche' || key === '--keyword' || key === '-n' || key === '-k') {
      nicheArg = hasEquals ? val : (args[i + 1] || '');
      isArgSearch = true;
      if (!hasEquals) i++;
    } else if (key === '--location' || key === '-l') {
      locationArg = hasEquals ? val : (args[i + 1] || '');
      isArgSearch = true;
      if (!hasEquals) i++;
    } else if (key === '--limit' || key === '-c') {
      const limitVal = hasEquals ? val : (args[i + 1] || '10');
      limitArg = parseInt(limitVal) || 0;
      isArgSearch = true;
      if (!hasEquals) i++;
    } else if (key === '--show' || key === '-s') {
      isShowArg = true;
    } else if (key === '--help' || key === '-h') {
      console.clear();
      console.log(boxen(
        chalk.bold.magenta("🚀 CLI WEB Lead Scraper v1.0.0") + "\n" +
        chalk.cyan("Uso do modo de comando de linha única:") + "\n\n" +
        chalk.white("Parâmetros disponíveis:") + "\n" +
        chalk.green("  --keyword, --niche, -n  ") + chalk.white("Nicho comercial a buscar (Ex: \"Clinica Estetica\")") + "\n" +
        chalk.green("  --location, -l          ") + chalk.white("Localidade geográfica da busca (Ex: \"Leblon, RJ\")") + "\n" +
        chalk.green("  --limit, -c             ") + chalk.white("Limite de leads a coletar (0 para sem limite)") + "\n" +
        chalk.green("  --show, -s              ") + chalk.white("Exibir a tabela de leads já cadastrados no SQLite") + "\n" +
        chalk.green("  --help, -h              ") + chalk.white("Exibir esta tela de ajuda") + "\n\n" +
        chalk.cyan("Exemplos de comando:") + "\n" +
        chalk.yellow("  node cli.js --keyword=\"Clinica Estetica\" --location=\"Rio de Janeiro\" --limit=20") + "\n" +
        chalk.yellow("  node cli.js -n \"Estetica\" -l \"Copacabana\" -c 5") + "\n" +
        chalk.yellow("  node cli.js --show"),
        { padding: 1, borderStyle: 'double', borderColor: 'cyan' }
      ));
      process.exit(0);
    }
  }


  if (isShowArg) {
    showHeader();
    const leads = await getAllLeads();
    if (leads.length === 0) {
      console.log(chalk.bold.yellow("📊 Banco de Dados Local SQLite Vazio."));
      console.log(chalk.grey("Use a opção de busca para extrair prospectos.\n"));
    } else {
      console.log(chalk.bold.cyan(`📊 Leads no SQLite Independente (${leads.length} leads)\n`));
      renderLeadsTable(leads);
    }
    process.exit(0);
  } else if (isArgSearch) {
    if (!nicheArg.trim()) {
      console.log(chalk.bold.red("\n❌ Erro: O nicho da busca (--niche ou -n) é obrigatório no modo de comando de linha única."));
      console.log(chalk.grey("Use 'node cli.js --help' para ver as instruções."));
      process.exit(1);
    }
    // Execute search directly and exit
    await executeSearch(nicheArg, locationArg, limitArg, false);
  } else {
    // Start interactive main menu loop
    await mainLoop();
  }
};

startApp();
