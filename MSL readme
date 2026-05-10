# 🎮 MSL — Mondial Steam Library (Mobile PWA)

Application web progressive installable sur iPad/iPhone.

## 🚀 Déploiement en 3 étapes

### Étape 1 — Serveur Railway (base de données)

1. Va sur [railway.app](https://railway.app) et connecte-toi avec GitHub
1. Clique **“New Project”** → **“Deploy from GitHub repo”**
1. Sélectionne ce repo **LeoGB-tech/msl-mobile**
1. Railway détecte automatiquement le `package.json` et démarre le serveur
1. Va dans l’onglet **Settings** → **Networking** → **Generate Domain**
1. Copie l’URL générée (ex: `https://msl-server-production.up.railway.app`)

### Étape 2 — Mettre l’URL Railway dans la PWA

Dans `index.html`, ligne ~340, remplace :

```js
const RAILWAY_URL = 'https://msl-server-production.up.railway.app';
```

par ton URL Railway réelle, puis commit & push.

### Étape 3 — GitHub Pages (interface)

1. Va dans **Settings** de ce repo → **Pages**
1. Source : **Deploy from a branch** → branche `main`, dossier `/ (root)`
1. Clique **Save**
1. Ton app est disponible sur : `https://LeoGB-tech.github.io/msl-mobile`

## 📱 Installer sur iPad/iPhone

1. Ouvre **Safari** sur ton iPad
1. Va sur `https://LeoGB-tech.github.io/msl-mobile`
1. Appuie sur **Partager** (↑) → **“Sur l’écran d’accueil”**
1. L’icône MSL apparaît comme une vraie app !

## 📁 Structure

```
msl-mobile/
├── index.html      ← PWA (interface mobile)
├── manifest.json   ← Config app installable
├── sw.js           ← Service Worker (offline)
├── server.js       ← Serveur Railway (DB)
├── package.json    ← Config Node.js
└── README.md
```
