const axios = require('axios');
const { performance } = require('perf_hooks');

module.exports = {
    cmd: "repo",
    alias: ["git", "script", "sc"],
    desc: "Get repository information",
    category: "MAIN",
    async execute(conn, m) {
        const start = performance.now();
        const repoUrl = "https://api.github.com/repos/popkidc/AUTO-MD";
        
        try {
            const response = await axios.get(repoUrl);
            const { stargazers_count, forks_count, open_issues, owner, name } = response.data;
            
            const end = performance.now();
            const fetchSpeed = (end - start).toFixed(2);

            const repoMsg = `
╭──────────────
│ 🤖 *ʙᴏᴛ:* ${name.replace(/-/g, ' ')}
│ 👤 *ᴏᴡɴᴇʀ:* ${owner.login}
│ ⭐ *sᴛᴀʀs:* ${stargazers_count}
│ 🍴 *ғᴏʀᴋs:* ${forks_count}
│ 🛠️ *ɪssᴜᴇs:* ${open_issues}
│ 🚀 *sᴘᴇᴇᴅ:* ${fetchSpeed} ᴍꜱ
╰──────────────
🔗 *ʟɪɴᴋ:* https://github.com/popkidc/AUTO-MD
            `.trim();

            await m.react("📂");
            await m.reply(repoMsg);
        } catch (e) {
            await m.reply("❌ Error fetching repository data. Please try again later.");
            console.error(e);
        }
    }
};
