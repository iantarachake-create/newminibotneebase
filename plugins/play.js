const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const exec = promisify(execFile);

const MAX_SECONDS = 1200;            // 20 min cap
const MAX_BYTES = 16 * 1024 * 1024;  // WhatsApp audio size limit
const BIN_DIR = path.join(__dirname, '..', 'tmp');
const wait = (ms) => new Promise(r => setTimeout(r, ms));

// ffmpeg: env var, then the bundled @ffmpeg-installer binary, then whatever is on PATH
const FFMPEG = (() => {
    if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
    try { return require('@ffmpeg-installer/ffmpeg').path; } catch { return 'ffmpeg'; }
})();

// ---------- yt-dlp (downloaded automatically the first time if the host doesn't have it) ----------
let ytdlpReady = null;
const ensureYtdlp = () => {
    if (ytdlpReady) return ytdlpReady;
    ytdlpReady = (async () => {
        if (process.env.YTDLP_PATH) return process.env.YTDLP_PATH;
        try { await exec('yt-dlp', ['--version']); return 'yt-dlp'; } catch { /* not installed */ }

        const isWin = process.platform === 'win32';
        const local = path.join(BIN_DIR, isWin ? 'yt-dlp.exe' : 'yt-dlp');
        try { await exec(local, ['--version']); return local; } catch { /* not downloaded yet */ }

        const asset = isWin ? 'yt-dlp.exe'
            : process.platform === 'darwin' ? 'yt-dlp_macos'
            : process.arch === 'arm64' ? 'yt-dlp_linux_aarch64' : 'yt-dlp_linux';
        fs.mkdirSync(BIN_DIR, { recursive: true });
        const { data } = await axios.get(`https://github.com/yt-dlp/yt-dlp/releases/latest/download/${asset}`, {
            responseType: 'arraybuffer', timeout: 120000, maxRedirects: 5
        });
        fs.writeFileSync(local, Buffer.from(data));
        fs.chmodSync(local, 0o755);
        await exec(local, ['--version']);
        return local;
    })().catch((e) => { ytdlpReady = null; throw e; });
    return ytdlpReady;
};

const encode = (input, output, bitrate) => exec(FFMPEG, [
    '-y', '-i', input, '-vn', '-t', String(MAX_SECONDS),
    '-c:a', 'libmp3lame', '-b:a', bitrate, '-ac', '2', '-ar', '44100', output
], { timeout: 180000, maxBuffer: 8 * 1024 * 1024 });

// Download the audio with yt-dlp and convert it to mp3 (under the WhatsApp size limit)
const downloadLocal = async (url) => {
    const bin = await ensureYtdlp();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'popkid-play-'));
    const cleanup = () => fs.rmSync(dir, { recursive: true, force: true });

    try {
        const args = [
            '--no-playlist', '--no-warnings', '--no-progress', '--print-json',
            '-f', 'bestaudio/best',
            '-x', '--audio-format', 'mp3', '--audio-quality', '128K',
            '--max-filesize', '120M',
            '--match-filter', `duration<=${MAX_SECONDS}`,
            '-o', path.join(dir, 'src.%(ext)s'),
        ];
        if (FFMPEG !== 'ffmpeg') args.push('--ffmpeg-location', FFMPEG);
        // Optional: a cookies.txt file helps when YouTube blocks the server's IP
        if (process.env.YTDLP_COOKIES && fs.existsSync(process.env.YTDLP_COOKIES)) args.push('--cookies', process.env.YTDLP_COOKIES);
        args.push(url);

        let res;
        try {
            res = await exec(bin, args, { timeout: 300000, maxBuffer: 8 * 1024 * 1024 });
        } catch (err) {
            const msg = String(err?.stderr || err?.message || '');
            console.error('yt-dlp error:', msg.slice(0, 600));
            const e = new Error(/does not pass filter/i.test(msg) ? 'Song is longer than 20 minutes.'
                : /Video unavailable|Private video/i.test(msg) ? 'Track unavailable on YouTube.'
                : 'yt-dlp could not download this track.');
            e.raw = msg;
            throw e;
        }

        const file = fs.readdirSync(dir).find(f => f.endsWith('.mp3'));
        if (!file) throw new Error('No audio file was produced.');
        const raw = path.join(dir, file);

        let size = fs.statSync(raw).size;
        for (const rate of ['96k', '64k']) {
            if (size <= MAX_BYTES) break;
            const out = path.join(dir, `out_${rate}.mp3`);
            await encode(raw, out, rate);
            fs.renameSync(out, raw);
            size = fs.statSync(raw).size;
        }
        if (size > MAX_BYTES) throw new Error('File is too big even after compression.');

        let info = {};
        try { info = JSON.parse(String(res.stdout).trim().split('\n').filter(Boolean).pop() || '{}'); } catch { info = {}; }

        return { buffer: fs.readFileSync(raw), title: info.track || info.title, cleanup };
    } catch (err) {
        cleanup();
        throw err;
    }
};

// yt-dlp breaks whenever YouTube changes; update it once and retry if that looks like the cause
let updated = false;
const localAudio = async (url) => {
    try {
        return await downloadLocal(url);
    } catch (err) {
        if (!updated && /Sign in|HTTP Error 4\d\d|Unable to extract|nsig|player/i.test(err.raw || '')) {
            updated = true;
            try { await exec(await ensureYtdlp(), ['-U'], { timeout: 120000 }); } catch { /* ignore */ }
            return await downloadLocal(url);
        }
        throw err;
    }
};

// ---------- fallback: download APIs (used only if yt-dlp fails) ----------
const pickLink = (d) => d?.downloadUrl || d?.download_url || d?.url || d?.link
    || d?.result?.download_url || d?.result?.url || d?.file?.url || null;

const PROVIDERS = [
    {
        // Vevioz REST API v1: create a job, then poll it until the link is ready
        name: 'vevioz',
        get: async (url) => {
            const API = 'https://api.vevioz.com/api/v1/jobs';
            const created = await axios.post(API, { url, format: 'mp3' }, { timeout: 30000 });
            const first = created.data?.data || created.data;
            if (pickLink(first)) return first;

            const id = first?.job_id || first?.id;
            const token = first?.token || first?.access_token;
            if (!id) throw new Error('Vevioz did not return a job id.');

            for (let i = 0; i < 20; i++) {
                await wait(3000);
                const { data } = await axios.get(`${API}/${id}`, { params: { token }, timeout: 30000 });
                const job = data?.data || data;
                if (pickLink(job)) return job;
                if (['failed', 'error', 'cancelled'].includes(String(job?.status || '').toLowerCase())) {
                    throw new Error(job?.error || job?.message || 'Vevioz job failed.');
                }
            }
            throw new Error('Vevioz job timed out.');
        }
    },
    {
        name: 'qasimdev',
        get: async (url) => {
            const { data } = await axios.get('https://api.qasimdev.dpdns.org/api/loaderto/download', {
                params: { apiKey: 'xbps-install-Syu', format: 'mp3', url },
                timeout: 90000,
            });
            return data?.data;
        }
    },
];

const apiAudio = async (url) => {
    let lastErr;
    for (const provider of PROVIDERS) {
        try {
            const d = await provider.get(url);
            let link = pickLink(d);
            if (link && link.startsWith('/')) link = 'https://api.vevioz.com' + link;
            if (link) return { link, title: d?.title };
            throw new Error('API could not generate a download link.');
        } catch (e) {
            console.error(`Play provider failed [${provider.name}]:`, e.message);
            lastErr = e;
        }
    }
    throw lastErr || new Error('All download sources failed.');
};

module.exports = {
    cmd: "play",
    alias: ["audio", "song"],
    desc: "Download and play songs from YouTube",
    category: "download",
    async execute(conn, m, { text, args }) {
        if (!text) return m.reply("🎵 *Usage:* .play <song name or YouTube link>");

        let local;
        try {
            let video;
            const query = text.trim();

            // 1. Search Logic
            if (query.includes('youtube.com') || query.includes('youtu.be')) {
                video = { url: query, title: "YouTube Audio" };
            } else {
                await m.reply('🔍 *Searching for your song...*');
                const search = await yts(query);
                video = search.videos[0];
            }

            if (!video) return m.reply("❌ No results found!");
            if (video.seconds && video.seconds > MAX_SECONDS) return m.reply("❌ *Song is longer than 20 minutes.*");

            // 2. Send Preview Info
            await conn.sendMessage(m.from, {
                image: { url: video.thumbnail || 'https://files.catbox.moe/j9ia5c.png' },
                caption: `🎧 *POPKID-MD MUSIC PLAYER*\n\n📌 *Title:* ${video.title}\n⏱️ *Duration:* ${video.timestamp || 'N/A'}\n🔗 *Link:* ${video.url}\n\n⏳ _Converting to MP3... please wait_`
            }, { quoted: m });

            // 3. Download Logic: yt-dlp first, download APIs as backup
            let audio, title = video.title;
            try {
                local = await localAudio(video.url);
                audio = local.buffer;
                if (title === "YouTube Audio" && local.title) title = local.title;
            } catch (e) {
                console.error('Local download failed, trying APIs:', e.message);
                if (/longer than 20 minutes/.test(e.message)) return m.reply(`❌ *${e.message}*`);
                const api = await apiAudio(video.url);
                audio = { url: api.link };
                if (title === "YouTube Audio" && api.title) title = api.title;
            }

            // 4. Send Audio File
            await conn.sendMessage(m.from, {
                audio,
                mimetype: 'audio/mpeg',
                fileName: `${String(title).replace(/[\\/:*?"<>|]/g, '')}.mp3`,
                ptt: false // Set to true if you want it sent as a voice note
            }, { quoted: m });

            await m.react("✅");

        } catch (err) {
            console.error(err);
            m.reply(`❌ *Download Failed:* ${err.message || "Timeout"}`);
        } finally {
            if (local) local.cleanup();
        }
    }
};
