---
github_url: https://github.com/kubernetes/kubernetes
full_name: kubernetes/kubernetes
category: devops-infra
tags: [container-orchestration, containers, go]
stars: 123488
language: Go
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# kubernetes

Container orchestrator that schedules, scales, and self-heals containerized workloads across clusters of machines through declarative APIs. Grew out of Google's Borg, CNCF-hosted, and the substrate virtually all modern deployment tooling targets.

## Personal Notes

- Reach for it when a team runs many services across multiple nodes; for a single app or small team, Docker Compose or a managed PaaS is dramatically less operational burden — a cluster is a product you have to staff.
- Consume it through a managed control plane (EKS/GKE/AKS) or a light distribution (k3s; kind/minikube for local dev) — you almost never build or deploy from this repo directly. Its day-to-day value is as the source of truth for API types and CHANGELOGs; feature design lives in kubernetes/enhancements (KEPs).
- Upgrade treadmill: three minor releases a year, each supported ~14 months (1.34–1.36 in support as of this check) — fall a year behind and you are out of support, and per-release API removals can break old manifests.
- Raw manifest YAML sprawls fast; adopt kustomize (built into kubectl) or Helm early. Self-hosted stacks like [langgenius/dify](https://github.com/langgenius/dify) typically graduate from compose to a Helm chart here once they need multi-node scale.
