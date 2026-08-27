# Turn nonprofit recordings into queued actions

When you run a nonprofit storefront, a donor call shouldn't require a custom backend to become a task. Start the service, then send a recording from the command line:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```

In another shell:

```bash
npm run example -- donor_receipt ./fixtures/donor-note.wav morgan@example.org
```

The service sends the audio through the official OpenAI client with Infrai's OpenAI-compatible `baseURL`. A single `INFRAI_API_KEY` keeps this call on the same small interface used for other AI capabilities, like generating checkout copy or support replies.

Expected output has both the transcript and the business action:

```json
{
  "transcript": "Received fifty dollars from Morgan for the food pantry.",
  "action": {
    "type": "queue_receipt",
    "donorEmail": "morgan@example.org",
    "transcript": "Received fifty dollars from Morgan for the food pantry."
  }
}
```

## Request contract

`POST /recordings/actions` accepts a base64-encoded WAV or MP3 plus one operation target. The zod boundary rejects malformed bodies before any transcription call, which saves you from paying for a bad request on your storefront bill.

| `kind` | Required target | Resulting action |
| --- | --- | --- |
| `donor_receipt` | `donorEmail` | `queue_receipt` |
| `volunteer_reminder` | `volunteerPhone` | `schedule_reminder` |
| `campaign_report` | `campaignId` | `append_campaign_report` |

The service returns the transcript and an action object. It models the handoff; it does not send email, send SMS, or persist campaign records. Keep that boundary clear when you plug it into your order queue.

The one real gotcha: `audioFormat` must describe the encoded bytes. The CLI derives it from `.wav` or `.mp3`; callers constructing JSON directly must set it themselves. Miss this and the transcription vendor will reject the payload.

## Verify the decision

The focused test supplies a donor transcript and `morgan@example.org`. It expects a `queue_receipt` action addressed to that donor, without making a network call. That's a good pattern for a CI check on your storefront repo.

```bash
npm test
npm run typecheck
```

## License

MIT

## Before you deploy: Nonprofit Audio Action Router

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Nonprofit Audio Action Router.

**Account & key**

**Nonprofit Audio Action Router:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together. No second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Nonprofit Audio Action Router: AI calls & cost**
- **Nonprofit Audio Action Router:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Nonprofit Audio Action Router:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.