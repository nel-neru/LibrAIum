---
github_url: https://github.com/aquasecurity/trivy
full_name: aquasecurity/trivy
category: security
tags: [security-scanner, containers, iac, sbom, go]
stars: 36804
language: Go
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# trivy

All-in-one security scanner from Aqua — one Go binary checks container images, filesystems, git repos, VM images, and Kubernetes clusters for CVEs, IaC misconfigurations, secrets, and licenses, and generates/scans SBOMs (CycloneDX, SPDX). Absorbed tfsec, so it doubles as the Terraform/Kubernetes-manifest misconfig linter.

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- Scan performance was the single loudest complaint on the tracker — image scans timing out drew the most reactions by a margin ([aquasecurity/trivy#3421](https://github.com/aquasecurity/trivy/issues/3421), 94👍) — and it has since been resolved (issue closed).
- Output flexibility was a recurring, well-supported ask: emitting multiple outputs in one run ([#3243](https://github.com/aquasecurity/trivy/issues/3243), 74👍), a Markdown format template ([#3201](https://github.com/aquasecurity/trivy/issues/3201), 56👍), and multiple report options ([#720](https://github.com/aquasecurity/trivy/issues/720), 28👍) — all now closed.
- The top-reacted *open* request is bundling the Java vulnerability DB into server mode ([#3560](https://github.com/aquasecurity/trivy/issues/3560), 63👍), a pain point for air-gapped/offline server deployments; distro coverage also lingers, e.g. Fedora support ([#121](https://github.com/aquasecurity/trivy/issues/121), 30👍, open).
- Very actively maintained: 20 recent releases at a ~5-day median cadence (latest 2026-06-30), against a working backlog of ~230 open issues and PRs.
