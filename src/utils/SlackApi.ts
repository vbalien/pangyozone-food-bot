export type UsersConversationsResponse = {
  channels?: Channel[];
  error?: string;
  ok?: boolean;
};
export interface Channel {
  id?: string;
}

const BASE_URL = "https://slack.com/api";

function isString(str: string | undefined): str is string {
  return typeof str === "string";
}

export class SlackApi {
  constructor(private apiKey: string) {}

  private async fetchChannels(): Promise<string> {
    const response = await fetch(`${BASE_URL}/users.conversations`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });
    const data: UsersConversationsResponse = await response.json();

    if (data.ok && data.channels) {
      return data.channels
        .map((x) => x.id)
        .filter(isString)
        .join(",");
    } else {
      throw Error(data.error);
    }
  }

  public async uploadFile(
    fileBuffer: Buffer,
    filename: string,
  ): Promise<Response> {
    const channels = await this.fetchChannels();
    const formData = new FormData();
    formData.append("file", new Blob([fileBuffer]), filename);
    formData.append("channels", channels);

    const response = await fetch(`${BASE_URL}/files.upload`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    return response;
  }
}
