import "dotenv/config";
import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402-avm/express";
import { registerExactAvmScheme } from "@x402-avm/avm/exact/server";
import { HTTPFacilitatorClient } from "@x402-avm/core/server";
import { ALGORAND_MAINNET_CAIP2, USDC_MAINNET_ASA_ID } from "@x402-avm/avm";
import {
  bazaarResourceServerExtension,
  declareDiscoveryExtension,
} from "@x402-avm/extensions/bazaar";
import { throwCacho } from "./cacho.js";

const PAY_TO = process.env.PAY_TO;
if (!PAY_TO || PAY_TO.length !== 58) {
  throw new Error("PAY_TO must be a 58-char Algorand address opted in to USDC");
}
const PORT = Number(process.env.PORT ?? 4021);
const PRICE = process.env.PRICE ?? "$0.01";
const FACILITATOR_URL =
  process.env.FACILITATOR_URL ?? "https://facilitator.goplausible.xyz";
const PUBLIC_URL = process.env.PUBLIC_URL ?? "";

const facilitator = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
const server = new x402ResourceServer(facilitator);
registerExactAvmScheme(server);
server.registerExtension(bazaarResourceServerExtension);

const exampleOutput = {
  game: "cacho",
  dice: [5, 5, 5, 2, 2],
  best: { category: "full", points: 35 },
  options: [
    { category: "full", points: 35 },
    { category: "cinco", points: 15 },
    { category: "tontos", points: 4 },
  ],
  grandeServida: false,
  rolledAt: "2026-09-29T00:00:00.000Z",
};

const routes = {
  "GET /roll": {
    accepts: {
      scheme: "exact",
      network: ALGORAND_MAINNET_CAIP2,
      payTo: PAY_TO,
      price: PRICE,
      extra: {
        asset: USDC_MAINNET_ASA_ID,
        tag: "x402-global-challenge",
      },
    },
    resource: PUBLIC_URL ? `${PUBLIC_URL}/roll` : undefined,
    description:
      "Cacho (Bolivian dice game): one paid throw of five dice. Returns the dice, the best scoring category (grande, poker, full, escalera or number) with points, and all scoring options.",
    mimeType: "application/json",
    extensions: {
      ...declareDiscoveryExtension({
        input: {},
        inputSchema: { type: "object", properties: {} },
        output: {
          example: exampleOutput,
          schema: {
            type: "object",
            properties: {
              game: { type: "string" },
              dice: { type: "array", items: { type: "integer", minimum: 1, maximum: 6 } },
              best: {
                type: "object",
                properties: { category: { type: "string" }, points: { type: "integer" } },
              },
              options: { type: "array" },
              grandeServida: { type: "boolean" },
              rolledAt: { type: "string" },
            },
          },
        },
      }),
    },
  },
};

const app = express();

// Free, public routes: health and a human/agent-readable index.
app.get("/", (_req, res) => {
  res.json({
    name: "Cacho402",
    description: "Cacho, the Bolivian dice game, as a pay-per-roll x402 API on Algorand.",
    endpoints: { roll: `GET /roll (${PRICE} USDC on Algorand mainnet)` },
    network: ALGORAND_MAINNET_CAIP2,
    asset: USDC_MAINNET_ASA_ID,
    facilitator: FACILITATOR_URL,
  });
});
app.get("/health", (_req, res) => res.json({ status: "ok", uptime: process.uptime() }));

app.use(paymentMiddleware(routes as any, server));

app.get("/roll", (_req, res) => {
  res.json({ game: "cacho", ...throwCacho(), rolledAt: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Cacho402 listening on :${PORT}`);
  console.log(`payTo=${PAY_TO} price=${PRICE} facilitator=${FACILITATOR_URL}`);
});
