export type RecordingKind = "donor_receipt" | "volunteer_reminder" | "campaign_report";

export type CampaignAction =
  | { type: "queue_receipt"; donorEmail: string; transcript: string }
  | { type: "schedule_reminder"; volunteerPhone: string; transcript: string }
  | { type: "append_campaign_report"; campaignId: string; transcript: string };

export type ActionContext = {
  donorEmail?: string;
  volunteerPhone?: string;
  campaignId?: string;
};

export function decideCampaignAction(
  kind: RecordingKind,
  transcript: string,
  context: ActionContext,
): CampaignAction {
  if (kind === "donor_receipt") {
    if (!context.donorEmail) throw new Error("donorEmail is required for a donor receipt");
    return { type: "queue_receipt", donorEmail: context.donorEmail, transcript };
  }

  if (kind === "volunteer_reminder") {
    if (!context.volunteerPhone) throw new Error("volunteerPhone is required for a volunteer reminder");
    return { type: "schedule_reminder", volunteerPhone: context.volunteerPhone, transcript };
  }

  if (!context.campaignId) throw new Error("campaignId is required for a campaign report");
  return { type: "append_campaign_report", campaignId: context.campaignId, transcript };
}
