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

## Personal Notes

- The default CI gate: `trivy image --exit-code 1 --severity HIGH,CRITICAL` plus the official trivy-action covers most pipelines. Grype is the leaner vuln-only alternative; Trivy earns the default slot by folding misconfig, secrets, and license checks into the same binary.
- Biggest operational sharp edge is DB distribution: the vuln DB and the separate Java DB are pulled as OCI artifacts, and community-wide GHCR rate limits have broken CI at scale (`TOOMANYREQUESTS`, discussions #7668/#8009). Cache the DB between runs (`--download-db-only` once, then `--skip-db-update`); recent versions fall back through mirror.gcr.io → ghcr.io, and `--db-repository public.ecr.aws/aquasecurity/trivy-db` is the escape hatch.
- Secret scanning is on by default and can dominate scan time on large images/filesystems — pass `--scanners vuln` when you only want CVEs. Suppress accepted findings with `.trivyignore` or VEX rather than dropping the severity gate.
- Scope check: cloud-account scanning (`trivy aws`) moved out of core into the trivy-aws plugin. For continuous in-cluster scanning on [kubernetes/kubernetes](https://github.com/kubernetes/kubernetes), run trivy-operator instead of cron-ing the CLI.
