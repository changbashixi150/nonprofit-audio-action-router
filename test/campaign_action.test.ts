import assert from "node:assert/strict";
import test from "node:test";
import { decideCampaignAction } from "../src/campaign_action.js";

test("a donor recording becomes a receipt job for the named donor", () => {
  const action = decideCampaignAction(
    "donor_receipt",
    "Received fifty dollars from Morgan for the food pantry.",
    { donorEmail: "morgan@example.org" },
  );

  assert.deepEqual(action, {
    type: "queue_receipt",
    donorEmail: "morgan@example.org",
    transcript: "Received fifty dollars from Morgan for the food pantry.",
  });
});

test("a campaign update is attached to the selected campaign", () => {
  const action = decideCampaignAction("campaign_report", "We packed 240 meal kits today.", {
    campaignId: "summer-meals",
  });

  assert.equal(action.type, "append_campaign_report");
  assert.equal(action.campaignId, "summer-meals");
});
