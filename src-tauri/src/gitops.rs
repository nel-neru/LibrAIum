//! Git layer.
//!
//! Design note: the design document suggests libgit2 (git2-rs); we deliberately
//! wrap the system `git` CLI instead so that push/pull inherit the user's
//! existing credential helpers and SSH agent configuration with zero setup.

use std::path::Path;
use std::process::Command;

use serde::Serialize;

use crate::error::{AppError, Result};

fn run_git(dir: &Path, args: &[&str]) -> Result<String> {
    let out = Command::new("git")
        .arg("-C")
        .arg(dir)
        .args(args)
        .output()
        .map_err(|e| AppError::Git(format!("failed to run git: {e}")))?;
    if out.status.success() {
        Ok(String::from_utf8_lossy(&out.stdout).to_string())
    } else {
        let err = String::from_utf8_lossy(&out.stderr);
        Err(AppError::Git(format!(
            "git {} failed: {}",
            args.first().unwrap_or(&""),
            err.trim()
        )))
    }
}

pub fn is_repo(dir: &Path) -> bool {
    dir.join(".git").exists()
}

/// Initialize a repository (with an initial commit) if one doesn't exist.
pub fn ensure_repo(dir: &Path) -> Result<()> {
    if is_repo(dir) {
        return Ok(());
    }
    run_git(dir, &["init", "-b", "main"])?;
    run_git(dir, &["add", "-A"])?;
    // Committing may fail if user.name is unset globally; surface that clearly.
    run_git(dir, &["commit", "-m", "chore: initialize LibrAIum data repository", "--allow-empty"])
        .map_err(|e| AppError::Git(format!("{e}. Hint: configure git user.name / user.email")))?;
    Ok(())
}

#[derive(Debug, Clone, Serialize)]
pub struct FileChange {
    pub status: String,
    pub path: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct GitStatus {
    pub is_repo: bool,
    pub branch: String,
    pub changes: Vec<FileChange>,
    pub has_remote: bool,
    pub ahead: u32,
}

pub fn status(dir: &Path) -> Result<GitStatus> {
    if !is_repo(dir) {
        return Ok(GitStatus {
            is_repo: false,
            branch: String::new(),
            changes: Vec::new(),
            has_remote: false,
            ahead: 0,
        });
    }
    let branch = run_git(dir, &["rev-parse", "--abbrev-ref", "HEAD"])?.trim().to_string();
    let porcelain = run_git(dir, &["status", "--porcelain"])?;
    let changes = porcelain
        .lines()
        .filter(|l| l.len() > 3)
        .map(|l| FileChange {
            status: l[..2].trim().to_string(),
            path: l[3..].to_string(),
        })
        .collect();
    let has_remote = !run_git(dir, &["remote"])?.trim().is_empty();
    let ahead = if has_remote {
        run_git(dir, &["rev-list", "--count", "@{u}..HEAD"])
            .map(|s| s.trim().parse().unwrap_or(0))
            .unwrap_or(0) // no upstream configured for this branch
    } else {
        0
    };
    Ok(GitStatus { is_repo: true, branch, changes, has_remote, ahead })
}

pub fn commit_all(dir: &Path, message: &str) -> Result<String> {
    let message = message.trim();
    if message.is_empty() {
        return Err(AppError::Git("commit message must not be empty".into()));
    }
    run_git(dir, &["add", "-A"])?;
    run_git(dir, &["commit", "-m", message])?;
    Ok(run_git(dir, &["rev-parse", "--short", "HEAD"])?.trim().to_string())
}

pub fn push(dir: &Path) -> Result<String> {
    run_git(dir, &["push"]).map(|_| "pushed".to_string())
}

#[derive(Debug, Clone, Serialize)]
pub struct LogItem {
    pub hash: String,
    pub date: String,
    pub message: String,
}

pub fn log(dir: &Path, n: usize) -> Result<Vec<LogItem>> {
    if !is_repo(dir) {
        return Ok(Vec::new());
    }
    let out = run_git(dir, &["log", &format!("-{n}"), "--pretty=format:%h%x09%as%x09%s"])?;
    Ok(out
        .lines()
        .filter_map(|l| {
            let mut parts = l.splitn(3, '\t');
            Some(LogItem {
                hash: parts.next()?.to_string(),
                date: parts.next()?.to_string(),
                message: parts.next().unwrap_or("").to_string(),
            })
        })
        .collect())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn init_status_commit_log() {
        let dir = std::env::temp_dir().join(format!("libraium-git-test-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();

        // isolate from global git config
        std::env::set_var("GIT_AUTHOR_NAME", "test");
        std::env::set_var("GIT_AUTHOR_EMAIL", "t@t");
        std::env::set_var("GIT_COMMITTER_NAME", "test");
        std::env::set_var("GIT_COMMITTER_EMAIL", "t@t");

        ensure_repo(&dir).unwrap();
        assert!(is_repo(&dir));

        fs::write(dir.join("x.md"), "hello").unwrap();
        let st = status(&dir).unwrap();
        assert_eq!(st.changes.len(), 1);
        assert_eq!(st.changes[0].path, "x.md");

        commit_all(&dir, "add x").unwrap();
        assert!(status(&dir).unwrap().changes.is_empty());
        let log = log(&dir, 5).unwrap();
        assert_eq!(log[0].message, "add x");

        assert!(commit_all(&dir, "  ").is_err());
        let _ = fs::remove_dir_all(&dir);
    }
}
