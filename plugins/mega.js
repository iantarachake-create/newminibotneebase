const { File } = require('megajs');
const path = require('path');

/**
 * 🛠️ HELPER FUNCTIONS
 */
const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const generateBar = (percentage) => {
    const totalBars = 10;
    const filledBars = Math.floor((percentage / 100) * totalBars);
    return '█'.repeat(filledBars) + '░'.repeat(totalBars - filledBars);
};

const MIME_TYPES = {
    '.mp4': 'video/mp4',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.apk': 'application/vnd.android.package-archive',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.mp3': 'audio/mpeg',
    '.mkv': 'video/x-matroska'
};

/**
 * 🚀 COMMAND EXPORT
 */
module.exports = {
    cmd: "mega",
    alias: ["megadl", "mfiles"],
    desc: "Download files from MEGA.nz with progress",
    category: "download",
    async execute(conn, m, { text }) {
        if (!text) return m.reply("✨ *Usage:* .mega <mega-url>\nExample: .mega https://mega.nz/file/xxx#xxx");

        try {
            const file = File.fromURL(text);
            await file.loadAttributes();

            // Set a safe limit (e.g., 300MB) to prevent crashing small VPS servers
            if (file.size >= 300 * 1024 * 1024) {
                return m.reply("❌ *Error:* File too large (Limit: 300MB for stability)");
            }

            // --- Send Initial Progress Message ---
            let { key } = await conn.sendMessage(m.from, {
                text: `✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐌𝐄𝐆𝐀* ✨\n\n▢ *File:* ${file.name}\n▢ *Size:* ${formatBytes(file.size)}\n\n*Progress:* 0% [░░░░░░░░░░]\n\n> *Status:* Preparing download... 📥`
            }, { quoted: m });

            const stream = file.download();
            let chunks = [];
            let lastUpdate = Date.now();

            stream.on('progress', async (info) => {
                const { bytesLoaded, bytesTotal } = info;
                const percentage = Math.floor((bytesLoaded / bytesTotal) * 100);

                // Update only every 3 seconds to avoid WhatsApp rate limits
                if (Date.now() - lastUpdate > 3000 || percentage === 100) {
                    const bar = generateBar(percentage);
                    await conn.sendMessage(m.from, {
                        text: `✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐌𝐄𝐆𝐀* ✨\n\n▢ *File:* ${file.name}\n▢ *Size:* ${formatBytes(bytesTotal)}\n\n*Progress:* ${percentage}% [${bar}]\n\n> *Status:* Downloading... 📥`,
                        edit: key
                    });
                    lastUpdate = Date.now();
                }
            });

            stream.on('data', (chunk) => chunks.push(chunk));

            stream.on('end', async () => {
                const buffer = Buffer.concat(chunks);
                const ext = path.extname(file.name || '').toLowerCase();
                
                await conn.sendMessage(m.from, {
                    document: buffer,
                    fileName: file.name,
                    mimetype: MIME_TYPES[ext] || 'application/octet-stream',
                    caption: `✅ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐔𝐏𝐃𝐀𝐓𝐄*\n\n▢ *File:* ${file.name}\n▢ *Size:* ${formatBytes(file.size)}\n\n> *Mission Completed* 🛡️`
                }, { quoted: m });

                await m.react("✅");
            });

            stream.on('error', (err) => {
                console.error("Mega Stream Error:", err);
                m.reply("❌ *Download Failed:* Check your link or internet connection.");
            });

        } catch (e) {
            console.error("Mega Logic Error:", e);
            m.reply("❌ *Error:* Invalid MEGA link or file was deleted.");
        }
    }
};
