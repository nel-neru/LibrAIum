use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("yaml error: {0}")]
    Yaml(#[from] serde_norway::Error),
    #[error("{0}")]
    Message(String),
    #[error("entry not found: {0}")]
    NotFound(String),
    #[error("duplicate entry: {0} already exists")]
    Duplicate(String),
    #[error("github api error: {0}")]
    GitHub(String),
    /// 403/429 from the GitHub API — callers iterating many repos should
    /// stop instead of burning the remaining quota on identical failures.
    #[error("github rate limit: {0}")]
    RateLimited(String),
    #[error("git error: {0}")]
    Git(String),
}

impl AppError {
    pub fn msg(s: impl Into<String>) -> Self {
        AppError::Message(s.into())
    }
}

pub type Result<T> = std::result::Result<T, AppError>;
