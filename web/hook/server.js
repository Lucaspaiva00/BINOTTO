require('dotenv').config();
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { exec, execSync } = require('child_process');

// * Define a porta do servidor
const PORT = process.env.PORT || 3011;

// * Define o segredo do webhook do github
const SECRET = process.env.WEBHOOK_SECRET;

const BRANCH = process.env.BRANCH || 'main';

// * Cria o servidor
const server = http.createServer((req, res) => {

    console.log('request', req.method, req.url);

    // * Captura a requisição POST do webhook do GitHub
    if (req.method === 'POST' && req.url === '/github-webhook') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            resolveRequest(body, req, res);
        });
    } else if (req.method === 'GET' && req.url === '/github-webhook') {
        res.end('Index');
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
    }
});

// * Inicia o servidor
server.listen(PORT, () => {
    console.log(`Servidor iniciado na porta ${PORT} e aguardando requisições`);
});

async function resolveRequest(body, req, res) {
    const sig = req.headers['x-hub-signature'];

    const verifyError = verifySignature(sig, body);
    if (verifyError) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end(verifyError);
        return;
    }

    if (!verifyGithubRef(body)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
    }

    await pullRepositoryChanges();

    buildProject();

    // await restartService();

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`OK`);
}

function verifySignature(sig, body) {
    if (!sig) {
        return 'Provide a signature';
    }

    const hmac = crypto.createHmac('sha1', SECRET);
    const digest = Buffer.from('sha1=' + hmac.update(body).digest('hex'), 'utf8');
    const checksum = Buffer.from(sig, 'utf8');

    if (checksum.length !== digest.length || !crypto.timingSafeEqual(digest, checksum)) {
        return 'Invalid signature';
    }
}

function verifyGithubRef(body) {
    if (!body) return false;

    const payload = JSON.parse(body);
    return payload && payload.ref === `refs/heads/${BRANCH}`;
}

function pullRepositoryChanges() {
    return new Promise((resolve, reject) => {
        exec(`cd ${path.join(__dirname, '..')} && git pull`, (err, stdout, stderr) => {
            if (err) {
                console.error(`Erro ao atualizar o repositório: ${err}`);
                reject(err);
            } else {
                console.log('Repositório atualizado');
                resolve(stdout);
            }
        });
    });
}

function buildProject() {
    console.log('Executando o build...');
    execSync(`cd ${path.join(__dirname, '..')} && npm run build`);
}