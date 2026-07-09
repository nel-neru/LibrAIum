---
github_url: https://github.com/obsproject/obs-studio
full_name: obsproject/obs-studio
category: video
tags: [live-streaming, screen-recording, cross-platform, cpp]
stars: 73733
language: C
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# obs-studio

The de facto standard open-source suite for live streaming and screen recording on Windows/macOS/Linux — capture, composite, encode, and push to RTMP or WebRTC (WHIP, since OBS 30) from one app. C/C++ core with a Qt UI, extensible via a large native-plugin ecosystem plus Lua/Python scripting.

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- The virtual camera is the dominant theme on the tracker: the single most-reacted issue by a wide margin was the bounty to implement it cross-platform ([obsproject/obs-studio#2568](https://github.com/obsproject/obs-studio/issues/2568), 393👍, since closed), trailed by a cluster of virtual-camera complaints — won't restart until reboot ([#4808](https://github.com/obsproject/obs-studio/issues/4808), 37👍), incompatibility with OpenCV consumers ([#3635](https://github.com/obsproject/obs-studio/issues/3635), 20👍), and Linux v4l2 loopback conflicts still open ([#3929](https://github.com/obsproject/obs-studio/issues/3929), 18👍).
- Apple Silicon has been a recurring pain point — a missing VideoToolbox H264 hardware encoder on M1 ([#4170](https://github.com/obsproject/obs-studio/issues/4170), 23👍) and erratic/out-of-focus hotkeys ([#4126](https://github.com/obsproject/obs-studio/issues/4126), 15👍), both since closed.
- Linux/Wayland friction remains live: a crash with explicit sync on Wayland ([#11022](https://github.com/obsproject/obs-studio/issues/11022), 19👍) is among the top open issues.
- Actively maintained with a fast release cadence (20 releases tracked, median ~14 days apart, latest 2026-07-03) against a large backlog (~1113 open issues incl. PRs).
