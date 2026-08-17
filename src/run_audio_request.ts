import { readFile } from "node:fs/promises";

const [kind, audioPath, destination] = process.argv.slice(2);
if (!kind || !audioPath || !destination) {
  console.error("usage: npm run example -- <donor_receipt|volunteer_reminder|campaign_report> <audio.wav> <destination>");
  process.exit(2);
}

const destinationFields: Record<string, string> = {
  donor_receipt: "donorEmail",
  volunteer_reminder: "volunteerPhone",
  campaign_report: "campaignId",
};
const destinationField = destinationFields[kind];
if (!destinationField) throw new Error("Unknown recording kind");

const audio = await readFile(audioPath);
const response = await fetch("http://localhost:3000/recordings/actions", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    kind,
    audioBase64: audio.toString("base64"),
    audioFormat: audioPath.endsWith(".mp3") ? "mp3" : "wav",
    [destinationField]: destination,
  }),
});
const result: unknown = await response.json();
console.log(JSON.stringify(result, null, 2));
if (!response.ok) process.exitCode = 1;
