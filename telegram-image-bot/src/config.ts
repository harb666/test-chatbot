import "dotenv/config";

function parseAllowedUsers(raw: string | undefined): Set<number> | null {
  if (!raw || raw.trim() === "") return null;
  const ids = raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n));
  return new Set(ids);
}

export const config = {
  botToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  allowedUserIds: parseAllowedUsers(process.env.ALLOWED_USER_IDS),
  cooldownSeconds: Number(process.env.COOLDOWN_SECONDS ?? 10),
  imageSize: Number(process.env.IMAGE_SIZE ?? 1024),
};

if (!config.botToken) {
  throw new Error(
    "TELEGRAM_BOT_TOKEN is not set. Copy .env.example to .env and fill it in."
  );
}
