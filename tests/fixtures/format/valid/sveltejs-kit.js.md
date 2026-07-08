---
github_url: https://github.com/sveltejs/kit.js
full_name: sveltejs/kit.js
category: fixture-dotted
tags: [web, framework]
stars: 42
status: active
source: manual
---

# kit.js

Repo name containing a dot: slugify("sveltejs/kit.js") === "sveltejs-kit.js",
so the file stem itself contains a dot and the on-disk name is
"sveltejs-kit.js.md". Dots, hyphens and underscores survive slugification;
only the owner/name slash and other characters become hyphens.

## Personal Notes

- Guards the `/[a-zA-Z0-9\-_.]/` character class shared by both slugify
  implementations (Rust and Node).
