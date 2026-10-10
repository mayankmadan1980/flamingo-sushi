// Live race: who is playing right now. Each open game checks in every few seconds;
// anyone silent for 9 seconds drops off the list.
// POST /api/race { id, name, score, state, ms, mode }  or  { id, leave: true }
//   -> { racers: [{ id, name, score, state, ms, mode }] }
import { getStore } from "@netlify/blobs";

const STALE_MS = 9000;
const MAX_RACERS = 30;
const STATES = ["ready", "playing", "won"];

const cleanName = (s) => String(s ?? "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 16);
const json = (data, status = 200) =>
  Response.json(data, { status, headers: { "cache-control": "no-store" } });

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  let body;
  try { body = await req.json(); } catch { return json({ error: "Send JSON." }, 400); }

  const store = getStore({ name: "flamingo-race", consistency: "strong" });
  const race = (await store.get("now", { type: "json" })) || {};
  const now = Date.now();
  const id = String(body.id ?? "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 40);

  if (id.length >= 8) {
    const name = cleanName(body.name);
    if (body.leave || !name) {
      delete race[id];
    } else {
      race[id] = {
        name,
        score: Math.max(0, Math.min(100, Math.round(Number(body.score) || 0))),
        state: STATES.includes(body.state) ? body.state : "ready",
        ms: Number.isFinite(body.ms) ? Math.round(body.ms) : null,
        mode: body.mode === "adult" ? "adult" : "kid",
        t: now,
      };
    }
  }

  for (const k of Object.keys(race)) if (now - race[k].t > STALE_MS) delete race[k];
  const ids = Object.keys(race).sort((a, b) => race[b].t - race[a].t).slice(0, MAX_RACERS);
  const kept = Object.fromEntries(ids.map((k) => [k, race[k]]));
  await store.setJSON("now", kept);

  return json({ racers: ids.map((k) => { const { t, ...r } = kept[k]; return { id: k, ...r }; }) });
};

export const config = { path: "/api/race" };
