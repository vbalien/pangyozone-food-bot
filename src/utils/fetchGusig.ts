import path from "node:path";

export type GusigResponse =
  | {
      ok: true;
      etag: string | null;
      filename: string;
      buffer: ArrayBuffer;
      isPdf: boolean;
    }
  | {
      ok: false;
    };

async function fetchFilename(postId: string): Promise<string> {
  const url = `https://pangyozone.or.kr/result/showBoardAction.php?board_key=${postId}&board_id=notice`;
  const response = await fetch(url);
  const data = await response.json();
  let filename = data.map["BOARD_FILE"][0]?.file;
  if (
    filename &&
    [".pdf", ".png", ".jpg", ".jpeg"].includes(path.extname(filename))
  ) {
    return `board/${filename}`;
  }

  const content: string = data.map["BOARD_CONTENT"];
  const re = /src="\/dataCenter\/ckeditor\/(.*?)"/gi;
  filename = re.exec(content)?.at(1);
  return `ckeditor/${filename}`;
}

export async function fetchGusig(
  postId: string,
  cachedEtag?: string,
): Promise<GusigResponse> {
  const filename = await fetchFilename(postId);
  const fileUrl = `https://pangyozone.or.kr/dataCenter/${filename}`;
  const response = await fetch(fileUrl, {
    headers: cachedEtag
      ? {
          "If-None-Match": cachedEtag,
        }
      : undefined,
  });

  if (response.status == 304) {
    return { ok: false };
  }

  const data = await response.blob();
  const buffer = await data.arrayBuffer();

  return {
    ok: true,
    etag: response.headers.get("ETag"),
    filename,
    buffer,
    isPdf: filename.toLowerCase().endsWith(".pdf"),
  };
}
