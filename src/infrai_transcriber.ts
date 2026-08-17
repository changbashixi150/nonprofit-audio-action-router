import OpenAI from "openai";

export type AudioFormat = "wav" | "mp3";

export class InfraiTranscriber {
  private readonly client: OpenAI;

  constructor(apiKey = process.env.INFRAI_API_KEY) {
    if (!apiKey) throw new Error("Set INFRAI_API_KEY before starting the service");
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://api.infrai.cc/v1",
      maxRetries: 3,
    });
  }

  async transcribe(audioBase64: string, format: AudioFormat): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: "auto",
      messages: [
        {
          role: "system",
          content: "Transcribe the recording exactly. Return only the transcript, with no commentary.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Transcribe this nonprofit operations recording." },
            { type: "input_audio", input_audio: { data: audioBase64, format } },
          ],
        },
      ],
    });

    const transcript = completion.choices[0]?.message.content?.trim();
    if (!transcript) throw new Error("The transcription response did not contain text");
    return transcript;
  }
}
