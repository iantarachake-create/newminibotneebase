const axios = require('axios');

module.exports = {
    cmd: "movie",
    alias: ["film", "watch"],
    desc: "Search for movie details and download links",
    category: "DOWNLOAD",
    async execute(conn, m, { text }) {
        if (!text) return m.reply("🎬 *Please provide a movie name!*\n_Example: .movie Deadpool_");

        try {
            await m.react("📥");
            
            // Fetching movie data from OMDb (Simple and Reliable)
            const res = await axios.get(`http://www.omdbapi.com/?t=${text}&apikey=632bb061`);
            const data = res.data;

            if (data.Response === "False") return m.reply("❌ *Movie not found!*");

            const movieInfo = `✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐌𝐎𝐕𝐈𝐄𝐒* ✨\n` +
                              `══════════════════\n` +
                              `🎬 *ᴛɪᴛʟᴇ:* ${data.Title}\n` +
                              `🗓️ *ʏᴇᴀʀ:* ${data.Year}\n` +
                              `🌟 *ʀᴀᴛɪɴɢ:* ${data.imdbRating}\n` +
                              `🎭 *ɢᴇɴʀᴇ:* ${data.Genre}\n` +
                              `══════════════════\n\n` +
                              `📝 *ᴘʟᴏᴛ:* ${data.Plot}\n\n` +
                              `══════════════════\n` +
                              `📥 *ᴅᴏᴡɴʟᴏᴀᴅ ʟɪɴᴋ:* \n` +
                              `https://www.google.com/search?q=${text.replace(/ /g, '+')}+movie+download\n` +
                              `══════════════════\n` +
                              `> 𝖯𝗈𝗉𝗄𝗂𝖽 𝖬𝖽 𝖤𝗇𝗀𝗂𝗇𝖾 🇰🇪`;

            // Sending with the movie poster
            await conn.sendMessage(m.from, { 
                image: { url: data.Poster !== "N/A" ? data.Poster : "https://files.catbox.moe/j9ia5c.png" }, 
                caption: movieInfo 
            }, { quoted: m });

            await m.react("✅");

        } catch (e) {
            console.error(e);
            m.reply("⚠️ *Engine Error: Connection failed.*");
        }
    }
};
