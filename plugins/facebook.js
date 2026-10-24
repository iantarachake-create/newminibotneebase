const axios = require('axios');

module.exports = {
    cmd: "facebook",
    alias: ["fb", "fbdl"],
    desc: "Download Facebook videos using Qasim API",
    category: "DOWNLOAD",
    async execute(conn, m, { text }) {
        const url = text;

        if (!url) {
            return m.reply("📘 *ᴘᴏᴘᴋɪᴅ-ᴍᴅ ꜰʙ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n*Usage:* .fb <facebook link>");
        }

        try {
            await m.react("📥");

            // Updated Endpoint and parameters based on your successful test
            const apiUrl = `https://gtech-api-xtp1.onrender.com/api/video/fb?apikey=APIKEY&url=${encodeURIComponent(url)}`;
            
            const res = await axios.get(apiUrl, { timeout: 60000 });

            // Targeting the correct JSON path: res.data.result.media
            const media = res?.data?.result?.media;

            if (!res.data.status || !media) {
                throw new Error("Video not found or link is private.");
            }

            // Pick HD if available, otherwise SD
            const videoUrl = media.video_url_hd || media.video_url_sd;
            const title = media.title || "Facebook Video";

            if (!videoUrl) throw new Error("Could not extract video URL.");

            const caption = `📘 *ꜰᴀᴄᴇʙᴏᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n` +
                            `🎬 *Title:* ${title}\n` +
                            `🎞 *Quality:* ${media.video_url_hd ? 'HD High' : 'SD Standard'}\n\n` +
                            `> 𝖯𝗈𝗉𝗄𝗂𝖽 𝖬𝖽 𝖤𝗇𝗀ɪɴ𝖾 𝟤𝟢𝟤𝟨 🇰🇪`;

            await m.react("✅");

            return await conn.sendMessage(m.from, { 
                video: { url: videoUrl }, 
                mimetype: 'video/mp4', 
                caption: caption 
            }, { quoted: m });

        } catch (err) {
            console.error('FB DL Error:', err);
            await m.react("❌");
            return m.reply(`❌ *ᴅᴏᴡɴʟᴏᴀᴅ ꜰᴀɪʟᴇᴅ:*\n${err.message}`);
        }
    }
};
