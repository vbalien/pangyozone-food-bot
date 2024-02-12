import sharp from "sharp";
import { pdf2image } from "./utils/pdf2buffer.js";
import { fetchGusig } from "./utils/fetchGusig.js";
import fs from "fs/promises";

const API_KEY = process.env.API_KEY ?? "";
const CHANNEL = process.env.CHANNEL ?? "";
const POST_ID = process.env.POST_ID ?? "";
const INITIAL_ETAG = process.env.INITIAL_ETAG ?? "";

async function start() {
  let etag: string | undefined = undefined;
  try {
    etag = await fs.readFile("data/cache.txt", "utf8");
  } catch {}

  const res = await fetchGusig(POST_ID, etag ?? INITIAL_ETAG);

  if (res !== undefined) {
    const image = await pdf2image(res.buffer, 2.5);
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

    const formData = new FormData();
    formData.append(
      "file",
      new Blob([postProcessedImage]),
      res.filename + ".webp",
    );
    formData.append("channels", CHANNEL);

    const response = await fetch("https://slack.com/api/files.upload", {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    await fs.writeFile("data/cache.txt", res.etag ?? "");

    const result = await response.json();
    if (result.ok) {
      console.log("OK");
    } else {
      console.log("ERROR");
    }
  } else {
    console.log("PASS");
  }
}

start().catch((err) => {
  console.log(err);
});
