'use strict';
// The original plugins keep their data in <project>/database/*.json using plain fs calls.
// With many users that folder would be shared (and wiped on every deploy), so reads/writes to it are
// redirected to the calling user's own documents (kept in memory, saved to the database in the background).
// Every other path is untouched.
const fs = require('fs');
const path = require('path');
const { current } = require('./context');

const DB_DIR = path.resolve(__dirname, '..', 'database');
const orig = {
    existsSync: fs.existsSync,
    readFileSync: fs.readFileSync,
    writeFileSync: fs.writeFileSync,
    mkdirSync: fs.mkdirSync
};

function docName(p) {
    if (typeof p !== 'string') return null;
    const r = path.resolve(p);
    if (r === DB_DIR) return '';
    return r.startsWith(DB_DIR + path.sep) ? r.slice(DB_DIR.length + 1) : null;
}

function install() {
    if (fs.__perSessionDocs) return;
    fs.__perSessionDocs = true;

    fs.existsSync = function (p) {
        const n = docName(p);
        if (n === null) return orig.existsSync.apply(fs, arguments);
        if (n === '') return true;
        const s = current()?.session;
        return s ? Object.prototype.hasOwnProperty.call(s.docs, n) : true; // outside a session: pretend it exists
    };

    fs.readFileSync = function (p, opts) {
        const n = docName(p);
        if (n === null) return orig.readFileSync.apply(fs, arguments);
        const s = current()?.session;
        const data = (s && s.docs[n]) || '{}'; // a missing document reads as an empty one
        return opts ? data : Buffer.from(data);
    };

    fs.writeFileSync = function (p, data) {
        const n = docName(p);
        if (n === null) return orig.writeFileSync.apply(fs, arguments);
        const s = current()?.session;
        if (!s || n === '') return; // outside a session nothing is stored
        s.docs[n] = Buffer.isBuffer(data) ? data.toString('utf8') : String(data);
        s.markDoc(n);
    };

    fs.mkdirSync = function (p) {
        if (docName(p) !== null) return undefined; // the folder "exists" virtually
        return orig.mkdirSync.apply(fs, arguments);
    };
}

module.exports = { install, DB_DIR };
