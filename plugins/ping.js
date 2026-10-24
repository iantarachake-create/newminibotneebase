const { performance } = require('perf_hooks');

module.exports = {
    cmd: "ping",
    alias: ["p", "fast"],
    desc: "Check bot speed",
    category: "MAIN",
    async execute(conn, m) {
        const start = performance.now();
        const end = performance.now();
        const speed = (end - start).toFixed(4);

        await m.react("⚡");
        await m.reply(`*ᴘᴏɴɢ!* 🚀 ${speed} ᴍꜱ`);
    }
};
