use std::fs;
use std::path::{Path, PathBuf};

use crate::error::{AppError, Result};
use crate::models::{Category, CategoryFile};

pub fn categories_path(data_dir: &Path) -> PathBuf {
    data_dir.join("master").join("categories.yaml")
}

pub fn load(data_dir: &Path) -> Result<Vec<Category>> {
    let path = categories_path(data_dir);
    if !path.exists() {
        return Ok(Vec::new());
    }
    let content = fs::read_to_string(&path)?;
    let file: CategoryFile = serde_yaml::from_str(&content)?;
    let mut cats = file.categories;
    cats.sort_by_key(|c| c.order);
    Ok(cats)
}

pub fn save(data_dir: &Path, categories: &[Category]) -> Result<()> {
    // Reject duplicate ids — they would merge two entry directories.
    let mut ids: Vec<&str> = categories.iter().map(|c| c.id.as_str()).collect();
    ids.sort_unstable();
    for pair in ids.windows(2) {
        if pair[0] == pair[1] {
            return Err(AppError::msg(format!("duplicate category id: {}", pair[0])));
        }
    }
    let path = categories_path(data_dir);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let file = CategoryFile {
        categories: categories.to_vec(),
    };
    fs::write(&path, serde_yaml::to_string(&file)?)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn save_load_roundtrip_and_dup_rejection() {
        let dir = std::env::temp_dir().join(format!("libraium-cat-test-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();

        let cats = vec![
            Category {
                id: "b".into(),
                name: "B".into(),
                color: "#123".into(),
                icon: "📘".into(),
                description: String::new(),
                order: 2,
            },
            Category {
                id: "a".into(),
                name: "A".into(),
                color: "#456".into(),
                icon: "📗".into(),
                description: String::new(),
                order: 1,
            },
        ];
        save(&dir, &cats).unwrap();
        let loaded = load(&dir).unwrap();
        assert_eq!(loaded.len(), 2);
        assert_eq!(loaded[0].id, "a", "must be sorted by order");

        let dup = vec![cats[0].clone(), cats[0].clone()];
        assert!(save(&dir, &dup).is_err());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn strict_scalars_rejected_like_node() {
        let dir = std::env::temp_dir().join(format!(
            "libraium-cat-strict-{}-{:?}",
            std::process::id(),
            std::thread::current().id()
        ));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(dir.join("master")).unwrap();
        let write =
            |yaml: &str| fs::write(dir.join("master").join("categories.yaml"), yaml).unwrap();

        // bare numeric id must be rejected, never coerced into "2048"
        // (mirrors Node loadCategories; serde_yaml would otherwise coerce)
        write("categories:\n  - id: 2048\n    name: X\n");
        assert!(load(&dir).is_err());

        // quoted numeric order must be rejected (i64 field)
        write("categories:\n  - id: x\n    name: X\n    order: \"3\"\n");
        assert!(load(&dir).is_err());

        // present-but-non-string optional scalar must be rejected
        write("categories:\n  - id: x\n    name: X\n    color: 123\n");
        assert!(load(&dir).is_err());

        // valid minimal file still loads with defaults
        write("categories:\n  - id: x\n    name: X\n");
        let cats = load(&dir).unwrap();
        assert_eq!(cats[0].id, "x");
        assert_eq!(cats[0].order, 0);
        let _ = fs::remove_dir_all(&dir);
    }
}
