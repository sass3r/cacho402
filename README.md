# Cacho402

Cacho, the Bolivian dice game, as a pay-per-roll [x402](https://x402.org) API on **Algorand mainnet**.
Every throw is one USDC micropayment settled through the GoPlausible facilitator. No accounts, no API keys.

Built for the Algorand Foundation **Global x402 Challenge** (`x402-global-challenge`).

## Endpoints

| Route | Price | Returns |
|---|---|---|
| `GET /` | free | Service index |
| `GET /health` | free | Health check |
| `GET /roll` | $0.01 USDC | Five dice, best category and all scoring options |

```json
{ "game": "cacho", "dice": [5,5,5,2,2], "best": { "category": "full", "points": 35 },
  "options": [...], "grandeServida": false, "rolledAt": "..." }
```

Categories: `grande` (5 of a kind), `poker` (4), `full`, `escalera` (1-5, 2-6 or 3-4-5-6-1), and numbers `balas`..`seis`. A combination on the first throw is *servida* (+5).

## How payment works

1. Agent calls `GET /roll` and gets **HTTP 402** with payment requirements (network `algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=`, asset USDC `31566704`, tag `x402-global-challenge`).
2. Agent signs a USDC transfer to `payTo` and retries with the payment header.
3. GoPlausible verifies and settles on mainnet; the server returns the throw.

The route declares the Bazaar discovery extension so agents can find and call it from the catalog alone.

## Run

```bash
npm install
cp .env.example .env   # set PAY_TO
npm start
```

Pay for a throw from another wallet:

```bash
PAYER_MNEMONIC="..." npm run pay -- https://YOUR_HOST/roll 3
```

## Roadmap

- Verifiable throws via commit-reveal (server seed hash + client seed).
- Full multi-turn games between agents, with holds and rerolls priced per throw.
