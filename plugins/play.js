const axios = require('axios');
const yts = require('yt-search');

module.exports = {
    cmd: "play",
    alias: ["audio", "song"],
    desc: "Download and play songs from YouTube",
    category: "download",
    async execute(conn, m, { text, args }) {
        if (!text) return m.reply("🎵 *Usage:* .iplay <song name or YouTube link>");

        const DL_API = 'https://api.qasimdev.dpdns.org/api/loaderto/download';
        const API_KEY = 'xbps-install-Syu';

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

            // 2. Send Preview Info
            await conn.sendMessage(m.from, {
                image: { url: video.thumbnail || 'https://files.catbox.moe/j9ia5c.png' },
                caption: `🎧 *POPKID-MD MUSIC PLAYER*\n\n📌 *Title:* ${video.title}\n⏱️ *Duration:* ${video.timestamp || 'N/A'}\n🔗 *Link:* ${video.url}\n\n⏳ _Converting to MP3... please wait_`
            }, { quoted: m });

            // 3. Download Logic with Retry
            const getAudio = async (url) => {
                const { data } = await axios.get(DL_API, {
                    params: { apiKey: API_KEY, format: 'mp3', url },
                    timeout: 90000,
                });
                if (data?.data?.downloadUrl) return data.data;
                throw new Error('API could not generate a download link.');
            };

            const audioData = await getAudio(video.url);

            // 4. Send Audio File
            await conn.sendMessage(m.from, {
                audio: { url: audioData.downloadUrl },
                mimetype: 'audio/mpeg',
                fileName: `${video.title}.mp3`,
                ptt: false // Set to true if you want it sent as a voice note
            }, { quoted: m });

            await m.react("✅");

        } catch (err) {
            console.error(err);
            m.reply(`❌ *Download Failed:* ${err.message || "Timeout"}`);
        }
    }
};
