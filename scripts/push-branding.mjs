import fs from 'fs';
import path from 'path';

const TOKEN = process.env.GITHUB_TOKEN || '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';
const OWNER = 'ThiagoIbrahimVieira';
const REPO = 'whatsappbot';
const BRANCH = 'main';

async function ghFetch(endpoint, options = {}) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `token ${TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Node-Auto-Sticker-Pusher',
      ...(options.headers || {})
    }
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status} on ${endpoint}: ${JSON.stringify(json)}`);
  }
  return json;
}

function getAllFiles(dir, fileList = [], rootDir = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

    // Ignora pastas desnecessárias / dados sensíveis
    if (
      entry.name === 'node_modules' ||
      entry.name === 'auth' ||
      entry.name === 'tmp' ||
      entry.name === '.git' ||
      entry.name === '.env' ||
      entry.name === 'qrcode.png' ||
      entry.name === 'qrcode.html' ||
      entry.name === 'whatsapp-auto-sticker.zip'
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      getAllFiles(fullPath, fileList, rootDir);
    } else {
      fileList.push({ fullPath, relPath });
    }
  }
  return fileList;
}

async function main() {
  console.log('🔍 Consultando estado atual do repositório no GitHub...');
  const refData = await ghFetch(`/git/ref/heads/${BRANCH}`);
  const latestCommitSha = refData.object.sha;
  console.log(`📌 Último commit no GitHub: ${latestCommitSha}`);

  const commitData = await ghFetch(`/git/commits/${latestCommitSha}`);
  const baseTreeSha = commitData.tree.sha;
  console.log(`🌲 Árvore base: ${baseTreeSha}`);

  const files = getAllFiles(process.cwd());
  console.log(`📦 Preparando ${files.length} arquivos para sincronização...`);

  const treeItems = [];

  for (const file of files) {
    const contentBuffer = fs.readFileSync(file.fullPath);
    const base64Content = contentBuffer.toString('base64');

    const blobData = await ghFetch('/git/blobs', {
      method: 'POST',
      body: JSON.stringify({
        content: base64Content,
        encoding: 'base64'
      })
    });

    const isExecutable = file.relPath.endsWith('.sh');

    treeItems.push({
      path: file.relPath,
      mode: isExecutable ? '100755' : '100644',
      type: 'blob',
      sha: blobData.sha
    });
    process.stdout.write(`  ✓ ${file.relPath}\n`);
  }

  console.log('\n🌳 Criando nova árvore no Git...');
  const newTreeData = await ghFetch('/git/trees', {
    method: 'POST',
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: treeItems
    })
  });
  console.log(`✅ Nova árvore criada: ${newTreeData.sha}`);

  console.log('📝 Criando commit com marca do Thiago Ibrahim...');
  const commitMessage = 'feat: atualizar marca do bot e metadados de figurinhas para Thiago Ibrahim (@thiago_player890)';
  const newCommitData = await ghFetch('/git/commits', {
    method: 'POST',
    body: JSON.stringify({
      message: commitMessage,
      tree: newTreeData.sha,
      parents: [latestCommitSha]
    })
  });
  console.log(`✅ Novo commit criado: ${newCommitData.sha}`);

  console.log(`🚀 Atualizando branch ${BRANCH}...`);
  await ghFetch(`/git/refs/heads/${BRANCH}`, {
    method: 'PATCH',
    body: JSON.stringify({
      sha: newCommitData.sha,
      force: false
    })
  });

  console.log('\n🎉 SUCESSO! Código enviado para o repositório no GitHub com sucesso!');
}

main().catch((err) => {
  console.error('❌ Falha na sincronização:', err);
  process.exit(1);
});
