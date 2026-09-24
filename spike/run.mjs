// Spike: can Jev rank English public-apis rows from Thai queries?
// Two requests per query (see Framework Skills wiki: confidence-gated-composition):
//   1. Choice over the 51 categories  -> keep top K categories
//   2. Choice over the APIs in those categories (<= 255) + Nouls for "no match" / "no key"
// Usage: TYPESAFE_API_KEY=... node spike/run.mjs [--limit N] [--k 3] [--model jev-latest]
import { readFileSync, writeFileSync } from "node:fs";

const args = Object.fromEntries(
  process.argv.slice(2).map((a, i, all) => (a.startsWith("--") ? [a.slice(2), all[i + 1] ?? true] : [])).filter((x) => x.length),
);
const K = Number(args.k ?? 3);
const LIMIT = args.limit ? Number(args.limit) : Infinity;
const MODEL = args.model ?? "jev-latest";
const MAX_OPTIONS = 255; // Choice hard limit (docs, 2026-09-23)

const key = process.env.TYPESAFE_API_KEY;
if (!key) throw new Error("TYPESAFE_API_KEY is not set");

const apis = JSON.parse(readFileSync(new URL("./data/apis.json", import.meta.url), "utf8"));
const categories = JSON.parse(readFileSync(new URL("./data/categories.json", import.meta.url), "utf8"));
const queries = JSON.parse(readFileSync(new URL("./queries.json", import.meta.url), "utf8")).filter((q) => q.q);

const slug = (s) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const catBySlug = Object.fromEntries(categories.map((c) => [slug(c), c]));

async function systemOne(body) {
  const started = performance.now();
  const res = await fetch("https://api.typesafe.ai/v1/systemone", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, ...body }),
  });
  const ms = Math.round(performance.now() - started);
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} after ${ms}ms: ${text.slice(0, 500)}`);
  return { ...JSON.parse(text), ms };
}

function topN(probabilities, n) {
  return Object.entries(probabilities).sort((a, b) => b[1] - a[1]).slice(0, n);
}

async function runQuery({ q, expect }) {
  // Request 1: which category?
  const r1 = await systemOne({
    state: { query: q },
    questions: {
      category: {
        type: "choice",
        instructions:
          "Which category of public API best serves the need described in `query`? The query may be written in Thai. Judge by what the user wants to obtain or do.",
        criteria: Object.fromEntries(categories.map((c) => [slug(c), c])),
      },
    },
  });
  const cat = r1.answers.category;
  // Keep top-K categories, but never let the candidate set pass the 255-option limit:
  // add categories in probability order and stop before the one that would overflow.
  const chosenCats = [];
  let candidates = [];
  for (const [s] of topN(cat.probabilities, K)) {
    const rows = apis.filter((a) => a.category === catBySlug[s]);
    if (candidates.length && candidates.length + rows.length > MAX_OPTIONS) break;
    chosenCats.push(catBySlug[s]);
    candidates = candidates.concat(rows).slice(0, MAX_OPTIONS);
  }

  // Request 2: which API within those categories?
  const r2 = await systemOne({
    state: {
      query: q,
      candidates: candidates.map((a) => ({ id: `api_${a.id}`, name: a.name, description: a.description, auth: a.auth })),
    },
    questions: {
      pick: {
        type: "choice",
        instructions:
          "Which entry in `candidates` best satisfies the need described in `query`? The query may be written in Thai. Compare the need against each candidate's name and description.",
        criteria: Object.fromEntries(candidates.map((a) => [`api_${a.id}`, `${a.name} — ${a.description} (auth: ${a.auth})`])),
      },
      no_match: {
        type: "noul",
        instructions: "None of the entries in `candidates` provides what `query` asks for.",
        criteria: { true: "No candidate provides the requested data or capability", false: "At least one candidate clearly provides it" },
      },
      wants_no_key: {
        type: "noul",
        instructions: "`query` explicitly asks for an API that can be used without an API key or sign-up.",
      },
    },
  });
  const pick = r2.answers.pick;
  const ranked = topN(pick.probabilities, candidates.length).map(([id]) => candidates.find((a) => `api_${a.id}` === id));
  const expLower = (expect ?? "").toLowerCase();
  const rank = expLower ? ranked.findIndex((a) => a.name.toLowerCase().includes(expLower)) + 1 : 0;
  const expectInCandidates = expLower ? candidates.some((a) => a.name.toLowerCase().includes(expLower)) : null;
  return {
    q,
    expect,
    categories: chosenCats,
    categoryConfidence: cat.confidence,
    expectInCandidates,
    candidates: candidates.length,
    top5: ranked.slice(0, 5).map((a) => a.name),
    rank,
    hitTop5: rank > 0 && rank <= 5,
    pickConfidence: pick.confidence,
    noMatch: r2.answers.no_match.noul,
    wantsNoKey: r2.answers.wants_no_key.noul,
    tokens: r1.usage.input_tokens + r2.usage.input_tokens,
    ms: r1.ms + r2.ms,
    model: r2.model,
  };
}

const results = [];
for (const item of queries.slice(0, LIMIT)) {
  try {
    const r = await runQuery(item);
    results.push(r);
    console.log(
      `${r.hitTop5 ? "✅" : r.expect ? "❌" : "·"} rank=${r.rank || "-"} conf=${r.pickConfidence.toFixed(2)} noMatch=${r.noMatch.toFixed(2)} ` +
        `cats=[${r.categories.join(" | ")}] cand=${r.candidates} ${r.ms}ms\n   q: ${r.q}\n   top5: ${r.top5.join(" · ")}`,
    );
  } catch (e) {
    console.error(`💥 ${item.q}\n   ${e.message}`);
    results.push({ q: item.q, expect: item.expect, error: e.message });
  }
}
const scored = results.filter((r) => r.expect && !r.error);
const hits = scored.filter((r) => r.hitTop5).length;
const missingFromCandidates = scored.filter((r) => r.expectInCandidates === false).length;
console.log(`\n== top-5 hits: ${hits}/${scored.length}  (pass mark ≥ 15/20) · expected API absent from candidate set: ${missingFromCandidates} · model: ${results.find((r) => r.model)?.model}`);
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
writeFileSync(new URL(`./results-${stamp}.json`, import.meta.url), JSON.stringify(results, null, 2));
console.log(`saved spike/results-${stamp}.json`);
