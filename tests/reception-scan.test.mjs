// Unit tests for reception-scan's pure shaping/ranking. The network (gh) lives
// behind the isMain CLI guard and is never touched here — importing the module
// only pulls in the pure functions, exactly like refresh-metadata's tests.
import test from "node:test";
import assert from "node:assert/strict";

import { rankIssues, releaseCadence, parseAdopters, buildDossier } from "../scripts/reception-scan.mjs";

test("rankIssues: most-reacted first, ties by lower number, capped, normalized", () => {
  const issues = [
    { number: 5, title: " low ", url: "u5", state: "open", reactions: 2 },
    { number: 3, title: "high", url: "u3", state: "open", reactions: 40 },
    { number: 9, title: "tie-b", url: "u9", state: "closed", reactions: 40 },
    { number: 7, title: "mid", url: "u7", state: "open", reactions: 10 },
  ];
  const ranked = rankIssues(issues, 2);
  assert.equal(ranked.length, 2, "capped at max");
  assert.deepEqual(
    ranked.map((i) => i.number),
    [3, 9],
    "equal reactions break toward the lower issue number"
  );
  assert.equal(ranked[0].title, "high", "title trimmed");
  assert.equal(rankIssues([], 5).length, 0);
  assert.equal(rankIssues(null, 5).length, 0);
});

test("releaseCadence: null when empty, count/latest for one, median gap for many", () => {
  assert.equal(releaseCadence([]), null);
  assert.equal(releaseCadence(null), null);

  assert.deepEqual(releaseCadence(["2026-01-01"]), {
    count: 1,
    latest: "2026-01-01",
    medianIntervalDays: null,
  });

  // evenly spaced 10 days apart (order-independent input)
  assert.deepEqual(releaseCadence(["2026-01-11", "2026-01-31", "2026-01-01", "2026-01-21"]), {
    count: 4,
    latest: "2026-01-31",
    medianIntervalDays: 10,
  });

  // unparseable dates are dropped
  assert.deepEqual(releaseCadence(["nope", "2026-01-01"]), {
    count: 1,
    latest: "2026-01-01",
    medianIntervalDays: null,
  });
});

test("parseAdopters: only the adopter block's links, deduped; [] without an adopter heading", () => {
  const readme = [
    "# Project",
    "Intro with [an intro link](https://example.com/intro).",
    "",
    "## Used by",
    "- [Acme](https://acme.example) and [Beta](https://beta.example)",
    "- [Acme](https://acme.example)  <!-- dup url -->",
    "",
    "## License",
    "[MIT](https://license.example)",
  ].join("\n");
  assert.deepEqual(parseAdopters(readme), [
    { name: "Acme", url: "https://acme.example" },
    { name: "Beta", url: "https://beta.example" },
  ]);

  assert.deepEqual(parseAdopters("# Project\n\nNo adopters section here.\n"), []);
  assert.deepEqual(parseAdopters(null), []);
});

test("buildDossier assembles entry metadata + ranked/derived evidence", () => {
  const entry = {
    id: "ai-agent/acme-tool",
    meta: {
      full_name: "acme/tool",
      github_url: "https://github.com/acme/tool",
      category: "ai-agent",
      stars: 1234,
      status: "active",
      last_github_push: "2026-07-06",
    },
  };
  const raw = {
    repo: { open_issues_count: 88 },
    issues: [
      { number: 12, title: "slow cold start", url: "u12", state: "open", reactions: 30 },
      { number: 4, title: "typo", url: "u4", state: "closed", reactions: 1 },
    ],
    releases: ["2026-01-01", "2026-01-11"],
    readme: "# t\n\n## Adopters\n- [Org](https://org.example)\n",
  };
  const d = buildDossier(entry, raw);
  assert.equal(d.id, "ai-agent/acme-tool");
  assert.equal(d.full_name, "acme/tool");
  assert.equal(d.open_issues, 88);
  assert.equal(d.top_issues[0].number, 12, "most-reacted issue leads");
  assert.deepEqual(d.release_cadence, { count: 2, latest: "2026-01-11", medianIntervalDays: 10 });
  assert.deepEqual(d.adopters, [{ name: "Org", url: "https://org.example" }]);
});
