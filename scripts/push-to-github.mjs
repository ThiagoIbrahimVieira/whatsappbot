import fs from 'node:fs/promises';
import path from 'node:path';

const TOKEN = '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';
const OWNER = 'ThiagoIbrahimVieira';
const REPO = 'whatsappbot';
const SOURCE_DIR = 'c:/Users/thiag/.gemini/antigravity-ide/scratch/whatsapp-auto-sticker';

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'User-Agent': 'Node-GitHub-Uploader',
  Accept: 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
};

async function apiRequest(endpoint, method = 'GET', body = null) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}${endpoint}`;
  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`API Error [${res.status}] ${endpoint}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function getAllFiles(dir, base = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === 'auth' ||
        entry.name === 'data' ||
        entry.name === 'tmp' ||
        entry.name === '.system_generated'
      ) {
        continue;
      }
      files = files.concat(await getAllFiles(fullPath, relPath));
    } else {
      if (
        entry.name === '.env' ||
        entry.name === 'bot.pid' ||
        entry.name === 'bot.log' ||
        entry.name === 'qrcode.html' ||
        entry.name === 'qrcode.png' ||
        entry.name.endsWith('.zip')
      ) {
        continue;
      }
      files.push({ fullPath, relPath: relPath.replace(/\\/g, '/') });
    }
  }
  return files;
}

async function upload() {
  console.log('🚀 Iniciando envio dos arquivos para o GitHub...');
  console.log(`Repositório: ${OWNER}/${REPO}`);

  const files = await getAllFiles(SOURCE_DIR);
  console.log(`Encontrados ${files.length} arquivos para upload.`);

  const treeItems = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const buffer = await fs.readFile(file.fullPath);
    const contentBase64 = buffer.toString('base64');

    console.log(`[${i + 1}/${files.length}] Enviando blob: ${file.relPath}`);

    const blobData = await apiRequest('/git/blobs', 'POST', {
      content: contentBase64,
      encoding: 'base64',
    });

    const isScript = file.relPath.endsWith('.sh');

    treeItems.push({
      path: file.relPath,
      mode: isScript ? '100755' : '100644',
      type: 'blob',
      sha: blobData.sha,
    });
  }

  console.log('🌳 Criando nova Git Tree...');
  const treeData = await apiRequest('/git/trees', 'POST', {
    tree: treeItems,
  });

  const refData = await apiRequest('/git/refs/heads/main');
  const parentCommitSha = refData.object.sha;

  console.log('📦 Criando novo Git Commit...');
  const commitData = await apiRequest('/git/commits', 'POST', {
    message: 'fix: auto limpeza de credenciais desconectadas e script reset-auth para novo codigo',
    tree: treeData.sha,
    parents: [parentCommitSha],
  });

  console.log('📌 Atualizando branch main...');
  await apiRequest('/git/refs/heads/main', 'PATCH', {
    sha: commitData.sha,
    force: true,
  });

  console.log('🎉 SUCESSO! Código atualizado no GitHub.');
  console.log(`Commit SHA: ${commitData.sha}`);
}

upload().catch((err) => {
  console.error('❌ Erro no envio:', err);
  process.exit(1);
});
