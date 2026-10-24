'use strict';
const fs = require('fs');
const path = require('path');

const BASE = {
    cfg: {},               // this user's changes to the bot settings (.mode, .anticall, .autobio ...); see config.js
    autoFollow: true,      // follow the bot's WhatsApp channel(s) once after linking
    channelReact: false,   // (the original bot never reacted to channel posts)
    followed: []           // channels already followed (so we never re-follow after a manual unfollow)
};

const fresh = () => JSON.parse(JSON.stringify(BASE)); // never share nested objects between users

function load(dir) {
    try {
        return { ...fresh(), ...JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8')) };
    } catch {
        return fresh();
    }
}

function save(dir, settings) {
    try {
        const file = path.join(dir, 'settings.json');
        const tmp = file + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(settings, null, 2));
        fs.renameSync(tmp, file);
    } catch (err) {
        console.error('settings save failed:', err.message);
    }
}

module.exports = { get DEFAULTS() { return fresh(); }, load, save };
