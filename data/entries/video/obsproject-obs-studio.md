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

## Personal Notes

- First reach for any streaming or recording workflow: the scenes-and-sources model composites screen, camera, and browser overlays without an editor, and the virtual camera output doubles as a "better webcam" pipeline for video calls.
- obs-websocket ships built-in since OBS 28 — drive scene switches, recording, and overlays from scripts or a stream deck instead of clicking the UI.
- Record to Hybrid MP4 (OBS 31+) or MKV; legacy MP4 loses the entire file if OBS crashes mid-recording. On Linux under Wayland, screen capture only works through PipeWire, and browser sources run a bundled CEF that is the usual CPU hog.
- Feed recordings to [openai/whisper](https://github.com/openai/whisper) for transcripts and subtitles. Building from source is heavy (Qt + CEF dependencies) — stick to release binaries unless you're writing a native plugin.
