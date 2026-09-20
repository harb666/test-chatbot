const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";
const GENERATION_TIMEOUT_MS = 60_000;

export class ImageGenerationError extends Error {}

/**
 * Pollinations.ai serves image generation over a plain HTTP GET with no API
 * key and no rate-limit account — it's free to use as-is. A random seed is
 * added on every call so repeated identical prompts don't hit a cached image.
 */
export async function generateImage(
  prompt: string,
  size: number
): Promise<Buffer> {
  const seed = Math.floor(Math.random() * 1_000_000_000);
  const url =
    `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}` +
    `?width=${size}&height=${size}&seed=${seed}&nologo=true`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new ImageGenerationError(
        `Image provider returned HTTP ${response.status}`
      );
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      throw new ImageGenerationError("Image provider did not return an image");
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    if (err instanceof ImageGenerationError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new ImageGenerationError(
        "Image generation timed out, try again in a moment"
      );
    }
    throw new ImageGenerationError(
      `Failed to reach image provider: ${(err as Error).message}`
    );
  } finally {
    clearTimeout(timeout);
  }
}
