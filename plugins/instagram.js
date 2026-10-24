const axios = require('axios');

module.exports = {
    cmd: "instagram",
    alias: ["ig", "igdl"],
    desc: "Download Instagram Reels, Videos, or Photos",
    category: "download",
    async execute(conn, m, { text }) {
        if (!text) return m.reply("🔗 *Please provide an Instagram link!*\nUsage: .ig <url>");

        // Using your preferred Qasim API structure
        const API_URL = 'https://gtech-api-xtp1.onrender.com/api/download/igdl';
        const API_KEY = 'APIKEY'; // Replace with your actual key if needed

        try {
            await m.react("⏳");
            await m.reply("🚀 *POPKID-MD:* Fetching your Instagram media...");

            // 1. Fetch data from the API
            const { data: res } = await axios.get(API_URL, {
                params: {
                    url: text.trim(),
                    apikey: API_KEY
                }
            });

            // Path based on your previously successful JSON test: res.result.data
            const mediaList = res?.result?.data;

            if (!res.status || !mediaList || mediaList.length === 0) {
                return m.reply("❌ *Error:* Could not find the media. Make sure the link is valid and public.");
            }

            await m.react("✅");

            // 2. Process and Send Media (TikTok Style)
            for (let i = 0; i < mediaList.length; i++) {
                const mediaUrl = mediaList[i].url;
                const isVideo = mediaUrl.includes('.mp4') || mediaUrl.includes('video');

                let caption = `📸 *INSTAGRAM DOWNLOADER*\n\n`;
                caption += `✨ *Type:* ${isVideo ? 'Video' : 'Image'}\n`;
                caption += `📦 *Item:* ${i + 1}/${mediaList.length}\n\n`;
                caption += `*POPKID-MD MASTER ENGINE* 🇰🇪`;

                if (isVideo) {
                    await conn.sendMessage(m.from, {
                        video: { url: mediaUrl },
                        caption: caption,
                        mimetype: 'video/mp4'
                    }, { quoted: m });
                } else {
                    await conn.sendMessage(m.from, {
                        image: { url: mediaUrl },
                        caption: caption
                    }, { quoted: m });
                }

                // Slight delay for carousels to prevent rate-limiting
                if (mediaList.length > 1) await new Promise(resolve => setTimeout(resolve, 1500));
            }

        } catch (err) {
            console.error("Instagram Plugin Error:", err.message);
            await m.react("❌");
            m.reply("⚠️ *Instagram Error:* API is currently busy or the link is private.");
        }
    }
};
