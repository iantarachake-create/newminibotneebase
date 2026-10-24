const axios = require('axios');

module.exports = {
    cmd: "tiktok",
    alias: ["tt", "ttdl"],
    desc: "Download TikTok videos without watermark",
    category: "download",
    async execute(conn, m, { text, args }) {
        if (!text) return m.reply("🔗 *Please provide a TikTok link!*\nUsage: .tiktok <url>");

        const API_URL = 'https://api.qasimdev.dpdns.org/api/tiktok/download';
        const API_KEY = 'xbps-install-Syu';

        try {
            await m.react("⏳");
            await m.reply("🚀 *POPKID-MD:* Fetching your video...");

            // 1. Fetch data from the API
            const { data: res } = await axios.get(API_URL, {
                params: {
                    url: text.trim(),
                    apiKey: API_KEY
                }
            });

            if (!res.success || !res.data) {
                return m.reply("❌ *Error:* Could not find the video. Make sure the link is valid.");
            }

            const videoData = res.data;
            // Select the HD no-watermark link or fall back to standard no-watermark
            const videoUrl = videoData.data.find(v => v.type === "nowatermark_hd")?.url || 
                             videoData.data.find(v => v.type === "nowatermark")?.url;

            if (!videoUrl) return m.reply("❌ *Error:* No download link available.");

            // 2. Prepare the caption with stats
            let caption = `🎬 *TIKTOK DOWNLOADER*\n\n`;
            caption += `📝 *Title:* ${videoData.title || "No Title"}\n`;
            caption += `👤 *Author:* ${videoData.author.nickname}\n`;
            caption += `⏱️ *Duration:* ${videoData.duration}\n\n`;
            caption += `📊 *Stats:* \n`;
            caption += `👁️ Views: ${videoData.stats.views}\n`;
            caption += `❤️ Likes: ${videoData.stats.likes}\n\n`;
            caption += `*POPKID-MD MASTER ENGINE* 🇰🇪`;

            // 3. Send the Video
            await conn.sendMessage(m.from, {
                video: { url: videoUrl },
                caption: caption,
                mimetype: 'video/mp4',
                fileName: `tiktok_${videoData.id}.mp4`
            }, { quoted: m });

            await m.react("✅");

        } catch (err) {
            console.error("TikTok Plugin Error:", err.message);
            await m.react("❌");
            m.reply("⚠️ *TikTok Error:* API is currently busy or link is private.");
        }
    }
};
