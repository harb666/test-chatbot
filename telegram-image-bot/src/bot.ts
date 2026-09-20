import { Bot, Context, InputFile } from "grammy";
import { config } from "./config.js";
import { generateImage, ImageGenerationError } from "./imageProvider.js";
import { RateLimiter } from "./rateLimiter.js";

const MAX_PROMPT_LENGTH = 500;

export function createBot(): Bot {
  const bot = new Bot(config.botToken);
  const rateLimiter = new RateLimiter(config.cooldownSeconds * 1000);

  bot.use(async (ctx, next) => {
    const userId = ctx.from?.id;
    if (
      config.allowedUserIds &&
      (userId === undefined || !config.allowedUserIds.has(userId))
    ) {
      await ctx.reply("Sorry, you're not authorized to use this bot.");
      return;
    }
    await next();
  });

  bot.command("start", async (ctx) => {
    await ctx.reply(
      "Hi! I generate images for free.\n\n" +
        "Send /imagine followed by a description, or just send me any text " +
        "and I'll turn it into an image.\n\n" +
        "Example: /imagine a corgi surfing at sunset, watercolor style"
    );
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(
      "Commands:\n" +
        "/imagine <description> — generate an image\n" +
        "/help — show this message\n\n" +
        `You can also just type a description directly. There's a ` +
        `${config.cooldownSeconds}s cooldown between requests per user.`
    );
  });

  bot.command("imagine", async (ctx) => {
    const prompt = ctx.match?.toString().trim();
    await handleImageRequest(ctx, prompt);
  });

  bot.on("message:text", async (ctx) => {
    if (ctx.message.text.startsWith("/")) return; // unknown command, ignore
    await handleImageRequest(ctx, ctx.message.text.trim());
  });

  async function handleImageRequest(
    ctx: Context,
    prompt: string | undefined
  ) {
    const userId = ctx.from?.id;
    if (!userId) return;

    if (!prompt) {
      await ctx.reply("Tell me what to draw, e.g. /imagine a red panda in a spacesuit");
      return;
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      await ctx.reply(`Please keep prompts under ${MAX_PROMPT_LENGTH} characters.`);
      return;
    }

    const waitSeconds = rateLimiter.check(userId);
    if (waitSeconds > 0) {
      await ctx.reply(`Please wait ${waitSeconds}s before generating another image.`);
      return;
    }

    await ctx.replyWithChatAction("upload_photo");
    const keepTyping = setInterval(() => {
      ctx.replyWithChatAction("upload_photo").catch(() => {});
    }, 4000);

    try {
      const image = await generateImage(prompt, config.imageSize);
      await ctx.replyWithPhoto(new InputFile(image, "image.jpg"), {
        caption: prompt.slice(0, 1024),
      });
    } catch (err) {
      const message =
        err instanceof ImageGenerationError
          ? err.message
          : "Something went wrong generating that image.";
      await ctx.reply(`⚠️ ${message}. Please try again.`);
      console.error("Image generation failed:", err);
    } finally {
      clearInterval(keepTyping);
    }
  }

  bot.catch((err) => {
    console.error("Unhandled bot error:", err.error);
  });

  return bot;
}
