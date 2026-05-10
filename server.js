// ═══════════════════════════════════════════════
//  MSL Server — Railway deployment
//  DB stockée en mémoire + persistée via fichier
// ═══════════════════════════════════════════════
const http = require(‘http’);
const fs   = require(‘fs’);
const path = require(‘path’);

const PORT   = process.env.PORT || 4242;
const DB_FILE = path.join(__dirname, ‘db.json’);

const resetCodes = {};

// ── DB ─────────────────────────────────────────
function initDb() {
if (fs.existsSync(DB_FILE)) {
try { return JSON.parse(fs.readFileSync(DB_FILE, ‘utf8’)); } catch(e) {}
}
const db = {
users: [{
id: ‘admin-1’,
prenom: ‘Léo’, nom: ‘Garcia Bourhis’,
pays: ‘France’, langue: ‘fr’,
email: ‘lgarciabourhis@icloud.com’,
pass: ‘Leo.23062012’,
role: ‘admin’,
steamLinked: false, steamName: ‘’, steamAvatar: ‘’,
gamesAdded: 0, online: false, lastSeen: Date.now(),
createdAt: Date.now()
}],
games: [{
appid: ‘730’, name: ‘Counter-Strike 2’,
img: ‘https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/header.jpg’,
genres: [‘Action’, ‘FPS’], developer: ‘Valve’, publisher: ‘Valve’,
releaseDate: ‘21 août 2012’, pegi: ‘18’,
addedBy: ‘Léo Garcia Bourhis’, addedAt: Date.now(),
ratings: [], avgRating: 0
}],
reports: [], chat: {}, theme: ‘default’
};
fs.writeFileSync(DB_FILE, JSON.stringify(db));
return db;
}

let db = initDb();

function saveDb() {
try { fs.writeFileSync(DB_FILE, JSON.stringify(db)); } catch(e) {}
}

// ── Helpers ────────────────────────────────────
const CORS = {
‘Access-Control-Allow-Origin’: ‘*’,
‘Access-Control-Allow-Headers’: ‘Content-Type,Authorization’,
‘Access-Control-Allow-Methods’: ‘GET,POST,OPTIONS’
};

function json(res, data, status = 200) {
res.writeHead(status, { …CORS, ‘Content-Type’: ‘application/json’ });
res.end(JSON.stringify(data));
}

function body(req) {
return new Promise(r => {
let b = ‘’;
req.on(‘data’, c => b += c);
req.on(‘end’, () => { try { r(JSON.parse(b)); } catch { r({}); } });
});
}

// ── Server ─────────────────────────────────────
const server = http.createServer(async (req, res) => {
if (req.method === ‘OPTIONS’) {
res.writeHead(204, CORS); res.end(); return;
}

```
const url = req.url.split('?')[0];

// Health check
if (url === '/health') return json(res, { ok: true, users: db.users.length, games: db.games.length });

// GET /db
if (req.method === 'GET' && url === '/db') return json(res, db);

// POST /db
if (req.method === 'POST' && url === '/db') {
    const data = await body(req);
    if (!data || !data.users) return json(res, { error: 'invalid' }, 400);
    db = data; saveDb();
    return json(res, { success: true });
}

// POST /auth
if (req.method === 'POST' && url === '/auth') {
    const { type, email, pass, prenom, nom, pays, langue } = await body(req);
    if (!email || !pass) return json(res, { success: false, msg: 'Email et mot de passe requis.' });

    if (type === 'login') {
        const u = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.pass === pass);
        if (!u) return json(res, { success: false, msg: 'Email ou mot de passe incorrect.' });
        if (u.banned) return json(res, { success: false, msg: 'Compte suspendu.' });
        const idx = db.users.findIndex(x => x.email === u.email);
        db.users[idx].online = true;
        db.users[idx].lastSeen = Date.now();
        saveDb();
        return json(res, { success: true, user: db.users[idx] });
    }

    if (type === 'signup') {
        if (!prenom || !nom) return json(res, { success: false, msg: 'Prénom et nom requis.' });
        if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase()))
            return json(res, { success: false, msg: 'Email déjà utilisé.' });
        const newUser = {
            id: 'u-' + Date.now(),
            prenom, nom, pays: pays || 'France', langue: langue || 'fr',
            email, pass, role: 'user',
            steamLinked: false, steamName: '', steamAvatar: '',
            gamesAdded: 0, online: true, lastSeen: Date.now(), createdAt: Date.now()
        };
        db.users.push(newUser); saveDb();
        return json(res, { success: true, user: newUser });
    }

    return json(res, { success: false, msg: 'Type inconnu.' }, 400);
}

// POST /reset-code
if (req.method === 'POST' && url === '/reset-code') {
    const { email } = await body(req);
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return json(res, { success: false, msg: 'Aucun compte avec cet email.' });
    const code = String(Math.floor(1000 + Math.random() * 9000));
    resetCodes[email.toLowerCase()] = { code, expires: Date.now() + 10 * 60 * 1000, attempts: 0 };
    console.log(`[RESET] ${email} → ${code}`);
    // TODO: brancher nodemailer ici avec ICLOUD_APP_PASSWORD
    return json(res, { success: true, devMode: true, code });
}

// POST /verify-code
if (req.method === 'POST' && url === '/verify-code') {
    const { email, code } = await body(req);
    const entry = resetCodes[email.toLowerCase()];
    if (!entry) return json(res, { success: false, msg: 'Aucun code envoyé.' });
    if (Date.now() > entry.expires) return json(res, { success: false, msg: 'Code expiré.' });
    entry.attempts++;
    if (entry.attempts > 3) return json(res, { success: false, msg: 'Trop de tentatives. Attendez 3 minutes.', locked: true });
    if (entry.code !== code) return json(res, { success: false, msg: `Code incorrect. ${3 - entry.attempts} essai(s) restant(s).` });
    return json(res, { success: true });
}

// POST /reset-password
if (req.method === 'POST' && url === '/reset-password') {
    const { email, code, newPass } = await body(req);
    const entry = resetCodes[email.toLowerCase()];
    if (!entry || entry.code !== code || Date.now() > entry.expires)
        return json(res, { success: false, msg: 'Code invalide ou expiré.' });
    const idx = db.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return json(res, { success: false, msg: 'Utilisateur introuvable.' });
    db.users[idx].pass = newPass; saveDb();
    delete resetCodes[email.toLowerCase()];
    return json(res, { success: true });
}

// GET /chat?pays=France
if (req.method === 'GET' && url === '/chat') {
    const pays = new URL('http://x' + req.url).searchParams.get('pays') || 'France';
    return json(res, ((db.chat || {})[pays] || []).slice(-100));
}

// POST /chat
if (req.method === 'POST' && url === '/chat') {
    const { pays, msg } = await body(req);
    if (!db.chat) db.chat = {};
    if (!db.chat[pays]) db.chat[pays] = [];
    db.chat[pays].push(msg);
    if (db.chat[pays].length > 200) db.chat[pays] = db.chat[pays].slice(-200);
    saveDb();
    return json(res, { success: true });
}

// POST /offline
if (req.method === 'POST' && url === '/offline') {
    const { email } = await body(req);
    const idx = db.users.findIndex(u => u.email === email);
    if (idx !== -1) { db.users[idx].online = false; db.users[idx].lastSeen = Date.now(); saveDb(); }
    return json(res, { success: true });
}

res.writeHead(404, CORS); res.end('Not found');
```

});

server.listen(PORT, () => console.log(`MSL Server running on port ${PORT}`));
