'use strict';
const { kvAuthState } = require('./kvAuthState');
const { encrypt, decrypt } = require('./crypto');

const schema = p => [
    `CREATE TABLE IF NOT EXISTS ${p}sessions (
        number text PRIMARY KEY,
        paired boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS ${p}auth (
        number text NOT NULL REFERENCES ${p}sessions(number) ON DELETE CASCADE,
        name text NOT NULL,
        value text NOT NULL,
        PRIMARY KEY (number, name)
    )`,
    `CREATE TABLE IF NOT EXISTS ${p}settings (
        number text PRIMARY KEY REFERENCES ${p}sessions(number) ON DELETE CASCADE,
        data jsonb NOT NULL DEFAULT '{}'::jsonb,
        updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS ${p}docs (
        number text NOT NULL REFERENCES ${p}sessions(number) ON DELETE CASCADE,
        name text NOT NULL,
        value text NOT NULL,
        PRIMARY KEY (number, name)
    )`
];

const FK_VIOLATION = '23503'; // session was removed while a write was in flight → just drop the write

class PgStore {
    constructor(pool, prefix = 'nee_') {
        if (!/^[a-z_][a-z0-9_]*$/.test(prefix)) throw new Error('DB_TABLE_PREFIX may only contain a-z, 0-9 and _');
        this.pool = pool;
        this.p = prefix;
        this.kind = 'postgres';
        this.queues = new Map(); // per-number write ordering
        this.kv = {
            get: (n, names) => this._kvGet(n, names),
            set: (n, entries) => this._enqueue(n, () => this._kvSet(n, entries))
        };
    }

    async init() {
        for (const sql of schema(this.p)) await this.pool.query(sql);
        // Supabase exposes the public schema over its REST API; RLS with no policies keeps these tables private.
        for (const t of ['sessions', 'auth', 'settings', 'docs']) {
            await this.pool.query(`ALTER TABLE ${this.p}${t} ENABLE ROW LEVEL SECURITY`);
        }
        await this.pool.query('SELECT 1');
    }

    _enqueue(number, fn) {
        const prev = this.queues.get(number) || Promise.resolve();
        const next = prev.catch(() => {}).then(fn);
        this.queues.set(number, next);
        next.finally(() => { if (this.queues.get(number) === next) this.queues.delete(number); }).catch(() => {});
        return next;
    }

    async _kvGet(number, names) {
        if (!names.length) return {};
        const r = await this.pool.query(
            `SELECT name, value FROM ${this.p}auth WHERE number = $1 AND name = ANY($2::text[])`, [number, names]);
        const out = {};
        for (const row of r.rows) out[row.name] = decrypt(row.value);
        return out;
    }

    async _kvSet(number, entries) {
        const up = [], del = [];
        for (const [name, value] of Object.entries(entries)) {
            if (value === null) del.push(name); else up.push([name, encrypt(value)]);
        }
        try {
            if (up.length) {
                await this.pool.query(
                    `INSERT INTO ${this.p}auth (number, name, value) SELECT $1, t.n, t.v FROM unnest($2::text[], $3::text[]) AS t(n, v) ` +
                    'ON CONFLICT (number, name) DO UPDATE SET value = EXCLUDED.value',
                    [number, up.map(x => x[0]), up.map(x => x[1])]);
            }
            if (del.length) {
                await this.pool.query(`DELETE FROM ${this.p}auth WHERE number = $1 AND name = ANY($2::text[])`, [number, del]);
            }
        } catch (err) {
            if (err.code !== FK_VIOLATION) throw err;
        }
    }

    // -------- store interface used by the session manager --------
    async begin(number) {
        await this.pool.query(`DELETE FROM ${this.p}sessions WHERE number = $1`, [number]);
        await this.pool.query(`INSERT INTO ${this.p}sessions (number, paired) VALUES ($1, false)`, [number]);
    }

    async check(number) {
        const r = await this.pool.query(`SELECT 1 FROM ${this.p}sessions WHERE number = $1`, [number]);
        return r.rows.length ? 'ok' : 'missing';
    }

    authState(number) { return kvAuthState(this.kv, number); }

    async markPaired(number) {
        await this.pool.query(`UPDATE ${this.p}sessions SET paired = true WHERE number = $1`, [number]);
    }

    async loadSettings(number) {
        const r = await this.pool.query(`SELECT data FROM ${this.p}settings WHERE number = $1`, [number]);
        return r.rows[0]?.data || {};
    }

    async saveSettings(number, settings) {
        try {
            await this.pool.query(
                `INSERT INTO ${this.p}settings (number, data) VALUES ($1, $2::jsonb) ` +
                'ON CONFLICT (number) DO UPDATE SET data = EXCLUDED.data, updated_at = now()',
                [number, JSON.stringify(settings)]);
        } catch (err) {
            if (err.code !== FK_VIOLATION) throw err;
        }
    }

    // Per-user documents (the old database/*.json files: group settings, status emojis ...)
    async loadDocs(number) {
        const r = await this.pool.query(`SELECT name, value FROM ${this.p}docs WHERE number = $1`, [number]);
        const out = {};
        for (const row of r.rows) out[row.name] = decrypt(row.value);
        return out;
    }

    async saveDoc(number, name, value) {
        try {
            await this.pool.query(
                `INSERT INTO ${this.p}docs (number, name, value) VALUES ($1, $2, $3) ` +
                'ON CONFLICT (number, name) DO UPDATE SET value = EXCLUDED.value',
                [number, name, encrypt(value)]);
        } catch (err) {
            if (err.code !== FK_VIOLATION) throw err;
        }
    }

    async remove(number) {
        await this.pool.query(`DELETE FROM ${this.p}sessions WHERE number = $1`, [number]);
    }

    async listPaired() {
        const r = await this.pool.query(`SELECT number FROM ${this.p}sessions WHERE paired = true ORDER BY created_at`);
        return r.rows.map(x => x.number);
    }

    async cleanupStale(maxAgeMs) {
        await this.pool.query(
            `DELETE FROM ${this.p}sessions WHERE paired = false AND created_at < now() - make_interval(secs => $1)`,
            [maxAgeMs / 1000]);
    }
}

function createPgStore() {
    const { Pool } = require('pg');
    const url = process.env.DATABASE_URL;
    const local = /@(localhost|127\.0\.0\.1)/.test(url);
    const ssl = process.env.DATABASE_SSL === 'false' || local ? false : { rejectUnauthorized: false };
    const pool = new Pool({
        connectionString: url,
        ssl,
        max: parseInt(process.env.DB_POOL_MAX || '10', 10),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 15000
    });
    pool.on('error', err => console.error('DB pool error:', err.message)); // never crash on idle-client errors
    return new PgStore(pool, process.env.DB_TABLE_PREFIX || 'nee_');
}

module.exports = { PgStore, createPgStore };
