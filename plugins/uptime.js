module.exports = {
    cmd: "uptime",
    alias: ["runtime", "status"],
    desc: "Check how long the bot has been active",
    category: "system", // Categorized for your new menu
    async execute(conn, m) {
        // Calculate uptime from process.uptime()
        const uptimeSeconds = process.uptime();
        
        const days = Math.floor(uptimeSeconds / (24 * 3600));
        const hours = Math.floor((uptimeSeconds % (24 * 3600)) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = Math.floor(uptimeSeconds % 60);

        const runtimeText = `🚀 *POPKID-MD UPTIME* \n\n` +
            `🔹 *Days:* ${days}d\n` +
            `🔹 *Hours:* ${hours}h\n` +
            `🔹 *Minutes:* ${minutes}m\n` +
            `🔹 *Seconds:* ${seconds}s\n\n` +
            `🕒 *Last Restart:* ${new Date(Date.now() - (uptimeSeconds * 1000)).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}\n` +
            `_Stable and Active!_`;

        await conn.sendMessage(m.from, { 
            text: runtimeText,
            contextInfo: {
                externalAdReply: {
                    title: "POPKID-MD RUNTIME STATUS",
                    body: "24/7 Deployment Active",
                    thumbnailUrl: "https://files.catbox.moe/j9ia5c.png",
                    mediaType: 1,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: m });
    }
};
