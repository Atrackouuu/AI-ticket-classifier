import express from "express";
import type { Request, Response, NextFunction } from "express";
import type { IncomingTicket, WebhookResponse, ErrorResponse } from "./types.js";
import { config } from "./config.js";
import { classifyTicket } from "./classifier.js";
import { randomUUID } from "node:crypto";

const app = express();
app.use(express.json());

// ─── HEALTH CHECK ──────────────────────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── MAIN WEBHOOK ──────────────────────────────────────────────────────────────

app.post("/webhook/ticket", async (
  req: Request,
  res: Response<WebhookResponse | ErrorResponse>
) => {

  // 1. Validate incoming payload
  const { userId, message, channel, timestamp } = req.body as Partial<IncomingTicket>;

  if (!userId || !message || !channel) {
    const error: ErrorResponse = {
      success: false,
      error: "Missing required fields: userId, message, channel",
      code: "INVALID_PAYLOAD",
    };
    return res.status(400).json(error);
  }

  const ticket: IncomingTicket = {
    userId,
    message,
    channel,
    timestamp: timestamp ?? new Date().toISOString(),
  };

  console.log(`[webhook] Received ticket from user ${userId} via ${channel}`);

  // 2. Classify
  const { classification, autoReply } = await classifyTicket(ticket);

  // 3. Return structured response
  const result: WebhookResponse = {
    success: true,
    ticketId: randomUUID(),
    classification,
    autoReply,
    processedAt: new Date().toISOString(),
  };

  console.log(`[webhook] Classified as ${classification.category} (${classification.priority})`);

  return res.status(200).json(result);
});

// ─── GLOBAL ERROR HANDLER ──────────────────────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[server] Unhandled error:", err.message);

  const error: ErrorResponse = {
    success: false,
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  };

  res.status(500).json(error);
});

// ─── START ────────────────────────────────────────────────────────────────────

app.listen(config.port, () => {
  console.log(`✅ Botpress Ticket Classifier running on port ${config.port}`);
});