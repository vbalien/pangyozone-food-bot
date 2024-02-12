export type GusigResponse =
  | {
      etag: string | null;
      filename: string;
      buffer: ArrayBuffer;
    }
  | undefined;

async function fetchFilename(postId: string): Promise<string> {
  const url = `https://pangyozone.or.kr/result/showBoardAction.php?board_key=${postId}&board_id=notice`;
  const response = await fetch(url);
  const data = await response.json();
  const filename = data.map["BOARD_FILE"][0].file;
  return filename;
}

export async function fetchGusig(
  postId: string,
  cachedEtag?: string,
): Promise<GusigResponse> {
  const filename = await fetchFilename(postId);
  const fileUrl = `https://pangyozone.or.kr/dataCenter/board/${filename}`;
  const response = await fetch(fileUrl, {
    headers: cachedEtag
      ? {
          "If-None-Match": cachedEtag,
        }
      : undefined,
  });

  if (response.status == 304) {
    return;
  }

  const data = await response.blob();
  const buffer = await data.arrayBuffer();

  return {
    etag: response.headers.get("ETag"),
    filename,
    buffer,
  };
}
