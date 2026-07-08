//! Conformance helper: parse entry files with the Rust frontmatter parser and
//! dump the result as JSON so `scripts/conformance.mjs` can compare it against
//! the Node implementation (`mcp-server/lib/store.js`).
//!
//! Usage: dump_entries --files <path>...
//!
//! Prints a JSON array with one object per input file:
//!   { "path": str, "ok": true,  "id": "<parent-dir>/<stem>", "meta": EntryMeta, "body": str }
//!   { "path": str, "ok": false, "error": str }

use std::path::Path;

use serde_json::{json, Value};

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let files = match args.split_first() {
        Some((flag, rest)) if flag == "--files" && !rest.is_empty() => rest,
        _ => {
            eprintln!("usage: dump_entries --files <path>...");
            std::process::exit(2);
        }
    };

    let results: Vec<Value> = files.iter().map(|p| dump_one(p)).collect();
    println!(
        "{}",
        serde_json::to_string(&results).expect("failed to serialize results as JSON")
    );
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
