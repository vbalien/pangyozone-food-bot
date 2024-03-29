import sharp from "sharp";
import { pdf2image } from "./utils/pdf2image.js";
import { fetchGusig } from "./utils/fetchGusig.js";
import fs from "fs/promises";
import { SlackApi } from "./utils/SlackApi.js";

const CACHE_FILE = "data/cache.txt";
const API_KEY = process.env.API_KEY ?? "";
const POST_ID = process.env.POST_ID ?? "";
const INITIAL_ETAG = process.env.INITIAL_ETAG ?? "";

async function start() {
  let etag: string | undefined = undefined;
  try {
    etag = await fs.readFile(CACHE_FILE, "utf8");
  } catch {}

  const slack = new SlackApi(API_KEY);
  const gusigResponse = await fetchGusig(POST_ID, etag ?? INITIAL_ETAG);

  if (gusigResponse.ok) {
    const image = gusigResponse.isPdf
      ? await pdf2image(gusigResponse.buffer, 2.5)
      : gusigResponse.buffer;
    const postProcessedImage = await sharp(image)
      .trim({
        background: "#ffffff",
        threshold: 100,
      })
      .extend({
        top: 40,
        bottom: 40,
        left: 20,
        right: 20,
        background: "#ffffff",
      })
      .webp()
      .toBuffer();

    const uploadResponse = await slack.uploadFile(
      postProcessedImage,
      gusigResponse.filename + ".webp",
    );

    await fs.writeFile(CACHE_FILE, gusigResponse.etag ?? "");

    const result = await uploadResponse.json();
    if (result.ok) {
      console.log("OK");
    } else {
      console.log(result.error);
    }
  } else {
    console.log("PASS");
  }
}

start().catch((err) => {
  console.log(err);
});
