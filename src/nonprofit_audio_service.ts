import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { z } from "zod";
import { decideCampaignAction } from "./campaign_action.js";
import { InfraiTranscriber } from "./infrai_transcriber.js";

const requestSchema = z
  .object({
    kind: z.enum(["donor_receipt", "volunteer_reminder", "campaign_report"]),
    audioBase64: z.string().min(1),
    audioFormat: z.enum(["wav", "mp3"]),
    donorEmail: z.string().email().optional(),
    volunteerPhone: z.string().min(7).optional(),
    campaignId: z.string().min(1).optional(),
  })
  .superRefine((body, context) => {
    const required = {
      donor_receipt: "donorEmail",
      volunteer_reminder: "volunteerPhone",
      campaign_report: "campaignId",
    } as const;
    const field = required[body.kind];
    if (!body[field]) context.addIssue({ code: "custom", path: [field], message: `${field} is required` });
  });

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function send(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

const transcriber = new InfraiTranscriber();

export const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/recordings/actions") {
    send(response, 404, { error: "Route not found" });
    return;
  }

  try {
    const parsed = requestSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      send(response, 400, { error: "Invalid request", details: parsed.error.flatten() });
      return;
    }

    const body = parsed.data;
    const transcript = await transcriber.transcribe(body.audioBase64, body.audioFormat);
    const action = decideCampaignAction(body.kind, transcript, body);
    send(response, 200, { transcript, action });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    send(response, 502, { error: message });
  }
});

const port = Number(process.env.PORT ?? 3000);
server.listen(port, () => console.log(`nonprofit audio service listening on http://localhost:${port}`));
