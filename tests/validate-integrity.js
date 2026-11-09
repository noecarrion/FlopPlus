/**
 * Teste automatizado de integridade de links, arquivos e estrutura HTML.
 * Executado durante a etapa de CI (Continuous Integration).
 */
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const htmlFiles = [
  'index.html',
  path.join('HTML', 'aboutme.html'),
  path.join('HTML', 'cadastro.html'),
  path.join('HTML', 'inicio.html'),
  path.join('HTML', 'login.html')
];

let totalChecks = 0;
let errors = [];

console.log('====================================================');
console.log('  FLOP+ - TESTE DE INTEGRIDADE E VALIDAÇÃO DE ASSETS');
console.log('====================================================\n');

// 1. Verificar existencia de arquivos principais
console.log('[1/3] Verificando arquivos essenciais da aplicacao...');
const essentialFiles = [
  'index.html',
  'LICENSE',
  path.join('CSS', 'style.css'),
  path.join('IMG', 'logo.png'),
  path.join('IMG', 'background.avif'),
  ...htmlFiles
];

for (const file of essentialFiles) {
  totalChecks++;
  const fullPath = path.join(rootDir, file);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Arquivo essencial ausente: ${file}`);
  } else {
    console.log(`  ✓ ${file} encontrado.`);
  }
}

// 2. Verificar estrutura HTML basica e DOCTYPE
console.log('\n[2/3] Verificando estrutura e doctype dos arquivos HTML...');
for (const file of htmlFiles) {
  const fullPath = path.join(rootDir, file);
  if (!fs.existsSync(fullPath)) continue;

  const content = fs.readFileSync(fullPath, 'utf-8');
  totalChecks++;

  if (!content.includes('<!DOCTYPE html>') && !content.includes('<!doctype html>')) {
    errors.push(`${file}: Ausencia de <!DOCTYPE html>`);
  }
  if (!content.includes('<html')) {
    errors.push(`${file}: Ausencia da tag <html>`);
  }
  if (!content.includes('<head>') && !content.includes('<head ')) {
    errors.push(`${file}: Ausencia da tag <head>`);
  }
  if (!content.includes('<title>')) {
    errors.push(`${file}: Ausencia da tag <title>`);
  }
  if (!content.includes('<body>') && !content.includes('<body ')) {
    errors.push(`${file}: Ausencia da tag <body>`);
  }

  console.log(`  ✓ Estrutura basica de ${file} validada.`);
}

// 3. Verificar referencias de links e assets relativos
console.log('\n[3/3] Validando links (href) e assets (src)...');
const linkRegex = /(href|src)=["']([^"']+)["']/g;

for (const file of htmlFiles) {
  const fullPath = path.join(rootDir, file);
  if (!fs.existsSync(fullPath)) continue;

  const fileDir = path.dirname(fullPath);
  const content = fs.readFileSync(fullPath, 'utf-8');
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const attr = match[1];
    const target = match[2].trim();

    // Ignorar urls externas, fragmentos internos e esquemas especiais
    if (
      target.startsWith('http://') ||
      target.startsWith('https://') ||
      target.startsWith('data:') ||
      target.startsWith('#') ||
      target.startsWith('mailto:') ||
      target.startsWith('tel:') ||
      target === ''
    ) {
      continue;
    }

    totalChecks++;

    // Proibir caminhos absolutos comecando com / (incompativeis com subdiretorio do GitHub Pages)
    if (target.startsWith('/')) {
      errors.push(`${file}: Link absoluto nao portatil encontrado em ${attr}="${target}". Use caminhos relativos.`);
      continue;
    }

    // Tratar ancora com arquivo (ex: index.html#plans)
    const cleanTarget = target.split('#')[0];
    if (!cleanTarget) continue;

    const resolvedPath = path.resolve(fileDir, cleanTarget);
    if (!fs.existsSync(resolvedPath)) {
      errors.push(`${file}: Recurso referenciado nao encontrado: ${attr}="${target}" -> ${resolvedPath}`);
    }
  }
}

console.log('\n====================================================');
console.log(`TOTAL DE VERIFICACOES REALIZADAS: ${totalChecks}`);
if (errors.length > 0) {
  console.error(`ERROS ENCONTRADOS (${errors.length}):`);
  errors.forEach(err => console.error(`  ✗ ${err}`));
  console.log('====================================================\n');
  process.exit(1);
} else {
  console.log('SUCESSO: Todos os arquivos, estruturas e links estao integros!');
  console.log('====================================================\n');
  process.exit(0);
}
