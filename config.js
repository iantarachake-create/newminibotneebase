'use strict';
// Load settings from bot.env (or .env) shipped in the project. Real environment variables win.
(function loadEnvFile() {
    const fs = require('fs'), path = require('path');
    for (const name of ['bot.env', '.env']) {
        const file = path.join(__dirname, name);
        if (!fs.existsSync(file)) continue;
        for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
            const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
            if (!m || line.trim().startsWith('#')) continue;
            let v = m[2];
            if (/^(".*"|'.*')$/.test(v)) v = v.slice(1, -1);
            if (v !== '' && process.env[m[1]] === undefined) process.env[m[1]] = v;
        }
    }
})();

const { current } = require('./lib/context');

// Same defaults as the original NEEBASE config.js. These are the defaults every newly linked user starts with.
const base = {
    SESSION_ID: "",
    PREFIX: process.env.PREFIX || ".",
    OWNER_NUMBER: process.env.OWNER_NUMBER ? process.env.OWNER_NUMBER.split(',') : ["254783044616"],
    OWNER_NAME: process.env.OWNER_NAME || "Popkid Kenya",
    AUTO_READ_STATUS: process.env.AUTO_READ_STATUS || "true",
    AUTO_REACT_STATUS: process.env.AUTO_REACT_STATUS || "true",
    ANTICALL: process.env.ANTICALL || "false",
    AUTO_BIO: process.env.AUTO_BIO || "true",
    BOT_OFF: process.env.BOT_OFF || "false",
    NON_PREFIX: process.env.NON_PREFIX || "true",
    MODE: process.env.MODE || "public",
    ALWAYS_ONLINE: process.env.ALWAYS_ONLINE || "true",
    AUTO_TYPING: process.env.AUTO_TYPING || "true",
    AUTO_RECORDING: process.env.AUTO_RECORDING || "false",
    AUTO_REACT: process.env.AUTO_REACT || "false",
    ANTIDELETE: process.env.ANTIDELETE || "indm", // Settings: inchat / indm / false
    NEWSLETTER_JID: process.env.NEWSLETTER_JID || undefined // channel shown on forwarded-style replies (default: the original one)
};

// Settings a user can change with the bot's own commands (.mode, .anticall, .autobio ...).
// Inside a user's session these read/write THAT user's saved copy; nobody else is affected.
const PER_SESSION = new Set([
    'PREFIX', 'NON_PREFIX', 'MODE', 'BOT_OFF', 'ANTICALL', 'ANTIDELETE', 'ALWAYS_ONLINE',
    'AUTO_READ_STATUS', 'AUTO_REACT_STATUS', 'AUTO_BIO', 'AUTO_TYPING', 'AUTO_RECORDING', 'AUTO_REACT', 'AUTO_READ'
]);

module.exports = new Proxy(base, {
    get(target, key) {
        const s = current()?.session;
        if (s) {
            if (key === 'OWNER_NUMBER') return [s.number]; // the owner is whoever linked this session
            if (PER_SESSION.has(key)) {
                const v = s.settings?.cfg?.[key];
                if (v !== undefined) return v;
            }
        }
        return target[key];
    },
    set(target, key, value) {
        const s = current()?.session;
        if (s) {
            if (PER_SESSION.has(key)) {
                s.settings.cfg = s.settings.cfg || {};
                s.settings.cfg[key] = String(value);
                s.save();
            }
            return true; // anything else is ignored: one user must never change server-wide values
        }
        target[key] = value;
        return true;
    }
});

// WhatsApp channel(s) every linked account follows once.
// Comma-separated JIDs in FOLLOW_CHANNELS; empty value = feature off.
global.followChannels = (process.env.FOLLOW_CHANNELS || '120363426692424154@newsletter')
    .split(',').map(x => x.trim()).filter(x => /^\d+@newsletter$/.test(x));
