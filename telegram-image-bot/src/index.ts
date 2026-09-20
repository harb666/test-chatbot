import { createBot } from "./bot.js";

const bot = createBot();

bot.start({
  onStart: (botInfo) => {
    console.log(`Bot @${botInfo.username} is running (long polling)...`);
  },
});

process.once("SIGINT", () => bot.stop());
process.once("SIGTERM", () => bot.stop());
