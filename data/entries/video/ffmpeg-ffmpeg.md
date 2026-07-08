---
github_url: https://github.com/FFmpeg/FFmpeg
full_name: FFmpeg/FFmpeg
category: video
tags: [transcoding, cli, cross-platform, c]
stars: 61854
language: C
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# FFmpeg

The canonical toolkit for decoding, encoding, transcoding, muxing, filtering, and streaming audio/video — the `ffmpeg`/`ffprobe`/`ffplay` CLIs plus the libav* C libraries nearly every media application builds on. This GitHub repo is a read-only mirror of git.ffmpeg.org: development happens on the ffmpeg-devel mailing list, so PRs and issues filed here go nowhere.

## Personal Notes

- The default answer to any batch media task — remux, transcode, extract audio, cut clips, generate thumbnails — and `ffprobe -print_format json` makes metadata scripting trivial. Also the mandatory preprocessing step for [openai/whisper](https://github.com/openai/whisper), which expects `ffmpeg` on PATH.
- Sharp edge: CLI options are positional and bind to the *next* input/output. The classic trap is `-ss` — before `-i` it seeks the input (fast, but snaps to keyframes under `-c copy`); after `-i` it decodes up to the timestamp (frame-accurate, slow).
- No two `ffmpeg` binaries are alike: features follow configure flags, so check `ffmpeg -buildconf` before assuming an encoder exists. Licensing follows the flags too — `--enable-gpl` (libx264/x265) makes the whole binary GPL and `--enable-nonfree` (FDK-AAC) makes it unredistributable, which bites when shipping ffmpeg inside a product. Distro packages also lag releases by years.
- Hardware encoders (VideoToolbox, NVENC, QSV, VAAPI) run real-time but lose quality-per-bitrate to libx264/libx265 — use hardware for live/preview paths, software for archival encodes.
