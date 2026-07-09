//! Conformance helper: run the Rust side of the dual-implemented data format
//! and dump results as JSON so `scripts/conformance.mjs` can compare them
//! against the Node implementation (`mcp-server/lib/store.js`).
//!
//! Usage:
//!   dump_entries --files <path>...          parse entry files
//!   dump_entries --slugify <string>...      store::slugify per input
//!   dump_entries --normalize-url <url>...   store::normalize_github_url per input
//!   dump_entries --compute-status <json>    github::compute_status per case; <json>
//!                                           is one array of {archived,push,today,stale_days}
//!   dump_entries --serialize <json>         frontmatter::serialize per case; <json>
//!                                           is one array of {meta,body} -> array of strings
//!
//! --files prints one object per input file:
//!   { "path": str, "ok": true,  "id": "<parent-dir>/<stem>", "meta": EntryMeta, "body": str }
//!   { "path": str, "ok": false, "error": str }
//! --slugify prints an array of strings; --normalize-url prints
//!   { "ok": true, "full_name": str, "canonical": str } | { "ok": false, "error": str }

use std::path::Path;

use serde::Deserialize;
use serde_json::{json, Value};

/// One github::compute_status input tuple, fed by scripts/conformance.mjs so the
/// dual-implemented status logic (Rust here, Node computeStatus) is cross-checked
/// over a shared corpus like slugify / normalize_url already are.
#[derive(Deserialize)]
struct ComputeStatusCase {
    archived: bool,
    push: Option<String>,
    today: String,
    stale_days: u32,
}

/// One frontmatter::serialize input, fed by conformance so the two serializers
/// (Rust here, Node serializeEntry) are proven byte-identical, not just the two
/// parsers. EntryMeta's strict deserializers accept a JSON object here.
#[derive(Deserialize)]
struct SerializeCase {
    meta: libraium_lib::models::EntryMeta,
    body: String,
}

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let (flag, rest) = match args.split_first() {
        Some((flag, rest)) if !rest.is_empty() => (flag.as_str(), rest),
        _ => usage(),
    };

    let results: Vec<Value> = match flag {
        "--files" => rest.iter().map(|p| dump_one(p)).collect(),
        "--slugify" => rest
            .iter()
            .map(|s| json!(libraium_lib::store::slugify(s)))
            .collect(),
        "--normalize-url" => rest
            .iter()
            .map(|u| match libraium_lib::store::normalize_github_url(u) {
                Ok((full_name, canonical)) => {
                    json!({ "ok": true, "full_name": full_name, "canonical": canonical })
                }
                Err(e) => json!({ "ok": false, "error": e.to_string() }),
            })
            .collect(),
        "--compute-status" => {
            let cases: Vec<ComputeStatusCase> = serde_json::from_str(&rest[0])
                .expect("--compute-status expects one JSON array of cases");
            cases
                .iter()
                .map(|c| {
                    let today = chrono::NaiveDate::parse_from_str(&c.today, "%Y-%m-%d")
                        .expect("invalid 'today' (want YYYY-MM-DD)");
                    json!(libraium_lib::github::compute_status(
                        c.archived,
                        c.push.as_deref(),
                        today,
                        c.stale_days
                    ))
                })
                .collect()
        }
        "--serialize" => {
            let cases: Vec<SerializeCase> = serde_json::from_str(&rest[0])
                .expect("--serialize expects one JSON array of cases");
            cases
                .iter()
                .map(|c| {
                    json!(libraium_lib::frontmatter::serialize(&c.meta, &c.body)
                        .expect("serialize failed"))
                })
                .collect()
        }
        _ => usage(),
    };
    println!(
        "{}",
        serde_json::to_string(&results).expect("failed to serialize results as JSON")
    );
}

fn usage() -> ! {
    eprintln!(
        "usage: dump_entries --files <path>... | --slugify <string>... | --normalize-url <url>... | --compute-status <json> | --serialize <json>"
    );
    std::process::exit(2);
}

fn dump_one(path: &str) -> Value {
    let content = match std::fs::read_to_string(path) {
        Ok(c) => c,
        Err(e) => return json!({ "path": path, "ok": false, "error": format!("read error: {e}") }),
    };
    match libraium_lib::frontmatter::parse(&content) {
        Ok((meta, body)) => {
            let p = Path::new(path);
            let stem = p.file_stem().and_then(|s| s.to_str()).unwrap_or_default();
            let parent = p
                .parent()
                .and_then(|d| d.file_name())
                .and_then(|s| s.to_str())
                .unwrap_or_default();
            json!({
                "path": path,
                "ok": true,
                "id": format!("{parent}/{stem}"),
                "meta": meta,
                "body": body,
            })
        }
        Err(e) => json!({ "path": path, "ok": false, "error": e.to_string() }),
    }
}
