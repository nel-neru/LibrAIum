//! Conformance helper: run the Rust side of the dual-implemented data format
//! and dump results as JSON so `scripts/conformance.mjs` can compare them
//! against the Node implementation (`mcp-server/lib/store.js`).
//!
//! Usage:
//!   dump_entries --files <path>...          parse entry files
//!   dump_entries --slugify <string>...      store::slugify per input
//!   dump_entries --normalize-url <url>...   store::normalize_github_url per input
//!
//! --files prints one object per input file:
//!   { "path": str, "ok": true,  "id": "<parent-dir>/<stem>", "meta": EntryMeta, "body": str }
//!   { "path": str, "ok": false, "error": str }
//! --slugify prints an array of strings; --normalize-url prints
//!   { "ok": true, "full_name": str, "canonical": str } | { "ok": false, "error": str }

use std::path::Path;

use serde_json::{json, Value};

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
        _ => usage(),
    };
    println!(
        "{}",
        serde_json::to_string(&results).expect("failed to serialize results as JSON")
    );
}

fn usage() -> ! {
    eprintln!(
        "usage: dump_entries --files <path>... | --slugify <string>... | --normalize-url <url>..."
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
