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

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- ConfigMap rollout/management is by far the loudest open request on the tracker — the top-reacted issue asks for first-class ConfigMap rollout handling ([kubernetes/kubernetes#22368](https://github.com/kubernetes/kubernetes/issues/22368), 1888👍) and remains open years on; a request for port ranges / whole IPs in Services is another still-open networking gap ([#23864](https://github.com/kubernetes/kubernetes/issues/23864), 380👍).
- Several early high-demand asks have since shipped (issues closed): sidecar containers in batch Jobs ([#25908](https://github.com/kubernetes/kubernetes/issues/25908), 498👍), forcing a re-pull without changing the image tag ([#33664](https://github.com/kubernetes/kubernetes/issues/33664), 440👍), a `--user` flag for `kubectl exec` ([#30656](https://github.com/kubernetes/kubernetes/issues/30656), 426👍), `port-forward` to a Service ([#15180](https://github.com/kubernetes/kubernetes/issues/15180), 403👍), GPU sharing across containers ([#52757](https://github.com/kubernetes/kubernetes/issues/52757), 384👍), and multi-host Ingress ([#43633](https://github.com/kubernetes/kubernetes/issues/43633), 376👍).
- Maintenance signal is strong: 20 recent releases at a ~1-day median interval (latest 2026-07-08), reflecting concurrent patch releases across supported minor branches, against a very large ~2,693 open issues-and-PRs backlog.
- The README points to a general case-studies page ([User Case Studies](https://kubernetes.io/case-studies/)) rather than naming individual adopters inline.
