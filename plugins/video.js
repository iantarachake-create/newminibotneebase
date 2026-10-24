const axios = require('axios');
const yts = require('yt-search');

const DL_API = 'https://api.qasimdev.dpdns.org/api/loaderto/download';
const API_KEY = 'xbps-install-Syu';

// Helper for retry logic
const wait = (ms) => new Promise(r => setTimeout(r, ms));

const downloadWithRetry = async (url, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const { data } = await axios.get(DL_API, {
                params: { apiKey: API_KEY, format: '360', url }, // '360' is more stable for APIs
                timeout: 90000
            });
            if (data?.data?.downloadUrl) return data.data;
            throw new Error('No download URL');
        } catch (err) {
            if (i === retries - 1) throw err;
            await wait(5000); // Wait 5s before retrying
        }
    }
    throw new Error('All download attempts failed');
};

module.exports = {
    cmd: "video",
    alias: ["ytmp4", "vid"],
    desc: "Download YouTube videos with retry logic",
    category: "DOWNLOAD",
    async execute(conn, m, { text }) {
        if (!text) return m.reply("🎬 *ᴜꜱᴀɢᴇ:* .video <song name or YouTube link>");

        try {
            let videoUrl, videoTitle, videoThumbnail;
            const query = text.trim();

            // 1. Search / URL Logic
            if (query.startsWith('http')) {
                videoUrl = query;
            } else {
                await m.react("🔍");
                const { videos } = await yts(query);
                if (!videos?.length) return m.reply("❌ *ɴᴏ ʀᴇꜱᴜʟᴛꜱ ꜰᴏᴜɴᴅ!*");
                videoUrl = videos[0].url;
                videoTitle = videos[0].title;
                videoThumbnail = videos[0].thumbnail;
            }

            // 2. Send Preview Card
            const preview = `🎬 *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐕𝐈𝐃𝐄𝐎* 🎬\n` +
                            `══════════════════\n` +
                            `📌 *ᴛɪᴛʟᴇ:* ${videoTitle || 'ʏᴛ ᴠɪᴅᴇᴏ'}\n` +
                            `⏳ _ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ... ᴘʟᴇᴀꜱᴇ ᴡᴀɪᴛ_ \n` +
                            `══════════════════\n` +
                            `> ᴘʀᴏᴄᴇꜱꜱɪɴɢ ᴡɪᴛʜ ʀᴇᴛʀʏ ᴇɴɢɪɴᴇ ⚙️`;

            await conn.sendMessage(m.from, {
                image: { url: videoThumbnail || 'https://files.catbox.moe/j9ia5c.png' },
                caption: preview
            }, { quoted: m });

            // 3. Execute Download with Retry Engine
            const videoData = await downloadWithRetry(videoUrl);

            // 4. Send Video File
            await conn.sendMessage(m.from, {
                video: { url: videoData.downloadUrl },
                mimetype: 'video/mp4',
                fileName: `${videoData.title || 'video'}.mp4`,
                caption: `✅ *${videoData.title || 'ꜱᴜᴄᴄᴇꜱꜱ'}*\n\n> 𝖯𝗈𝗉𝗄𝗂𝖽 𝖬𝖽 𝖤𝗇𝗀ɪɴ𝖾 🇰🇪`
            }, { quoted: m });

            await m.react("✅");

        } catch (err) {
            console.error(err);
            m.reply(`❌ *ᴅᴏᴡɴʟᴏᴀᴅ ꜰᴀɪʟᴇᴅ:* ᴀᴘɪ ɪꜱ ᴄᴜʀʀᴇɴᴛʟʏ ᴏᴠᴇʀʟᴏᴀᴅᴇᴅ. ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.`);
        }
    }
};
