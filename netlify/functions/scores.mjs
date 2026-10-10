// Leaderboard: each player's best time per mode, stored in Netlify Blobs.
// GET  /api/scores  -> { kid: [{name, ms}], adult: [...] }
// POST /api/scores  { device, name, ms, mode } -> { result: "best" | "kept", boards }
import { getStore } from "@netlify/blobs";

const MODES = ["kid", "adult"];
const MIN_MS = 8000;          // nobody can honestly feed 100 points faster than this
const MAX_MS = 60 * 60 * 1000;
const BOARD_SIZE = 50;

const cleanName = (s) => String(s ?? "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 16);
const keyOf = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 24);
const json = (data, status = 200) =>
  Response.json(data, { status, headers: { "cache-control": "no-store" } });

async function readBoards(store) {
  const out = {};
  for (const m of MODES) out[m] = (await store.get(`board/${m}`, { type: "json" })) || [];
  return out;
}

async function rebuildBoard(store, mode) {
  const { blobs } = await store.list({ prefix: `run/${mode}/` });
  const rows = (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" }))))
    .filter((v) => v && typeof v.ms === "number" && typeof v.name === "string")
    .map((v) => ({ name: v.name, ms: v.ms }))
    .sort((a, b) => a.ms - b.ms)
    .slice(0, BOARD_SIZE);
  await store.setJSON(`board/${mode}`, rows);
}

export default async (req) => {
  const store = getStore({ name: "flamingo-scores", consistency: "strong" });

  if (req.method === "GET") return json(await readBoards(store));
  if (req.method !== "POST") return json({ error: "Use GET or POST." }, 405);

  let body;
  try { body = await req.json(); } catch { return json({ error: "Send JSON." }, 400); }

  const mode = MODES.includes(body.mode) ? body.mode : null;
  const name = cleanName(body.name);
  const device = String(body.device ?? "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 32);
  const ms = Math.round(Number(body.ms));
  if (!mode || !name || !keyOf(name) || device.length < 8 || !(ms >= MIN_MS && ms <= MAX_MS)) {
    return json({ error: "That score doesn't look right." }, 400);
  }

  const key = `run/${mode}/${device}-${keyOf(name)}`;
  const prev = await store.get(key, { type: "json" });
  let result = "kept";
  if (!prev || ms < prev.ms) {
    await store.setJSON(key, { name, ms, mode, at: Date.now() });
    await rebuildBoard(store, mode);
    result = "best";
  }
  return json({ result, boards: await readBoards(store) });
};

export const config = { path: "/api/scores" };
