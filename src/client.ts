/**
 * Pays for one cacho throw from a funded wallet and prints the result.
 * Usage: PAYER_MNEMONIC="25 words..." npx tsx src/client.ts https://your-host/roll [count]
 */
import "dotenv/config";
import algosdk from "algosdk";
import { wrapFetchWithPayment } from "@x402-avm/fetch";
import { x402Client } from "@x402-avm/core/client";
import { toClientAvmSigner } from "@x402-avm/avm";
import { registerExactAvmScheme } from "@x402-avm/avm/exact/client";

const url = process.argv[2] ?? process.env.ROLL_URL ?? "http://localhost:4021/roll";
const count = Number(process.argv[3] ?? 1);
const mnemonic = process.env.PAYER_MNEMONIC;
if (!mnemonic) throw new Error("Set PAYER_MNEMONIC (payer wallet with USDC, not the payTo wallet)");

const { sk, addr } = algosdk.mnemonicToSecretKey(mnemonic.trim());
const signer = toClientAvmSigner(Buffer.from(sk).toString("base64"));

const client = new x402Client();
registerExactAvmScheme(client, {
  signer,
  // Without this the client builds transactions with TestNet params and the
  // facilitator rejects them ("genesis hash does not match expected network").
  algodConfig: { algodUrl: process.env.ALGOD_URL ?? "https://mainnet-api.algonode.cloud" },
});
const payFetch = wrapFetchWithPayment(fetch, client);

console.log(`payer=${addr.toString()} url=${url}`);
for (let i = 0; i < count; i++) {
  const res = await payFetch(url);
  const body = await res.text();
  console.log(`#${i + 1} HTTP ${res.status}`, body);
  if (res.status !== 200) {
    const pr = res.headers.get("payment-required");
    if (pr) {
      const decoded = JSON.parse(Buffer.from(pr, "base64").toString());
      console.log("rejection reason:", decoded.error ?? "(none)");
      console.log("payment-required:", JSON.stringify(decoded, null, 2));
    }
    for (const [k, v] of res.headers) if (/payment|x402|error/i.test(k)) console.log(`${k}: ${v}`);
  }
  const receipt = res.headers.get("payment-response") ?? res.headers.get("x-payment-response");
  if (receipt) console.log("settlement:", Buffer.from(receipt, "base64").toString());
}
