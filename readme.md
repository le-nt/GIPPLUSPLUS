

# GIP++ (Unofficial)

> **Unofficial.** GIP++ is a community client mod. It is not affiliated with, endorsed by or supported by Yapper Media LLC.

A client modification for [Yappin'](https://www.yapin.gg), made by **GIP & CO International**.
Built on [Yap++](https://github.com/salami-reborn/yapplusplus) by salami (Apache-2.0). See `CHANGES.md` for everything that differs.


**Server:** https://yapin.gg/invite/gip  |  **Report a bug:** https://github.com/le-nt/GIPPLUSPLUS/issues/new  |  **Source:** https://github.com/le-nt/GIPPLUSPLUS

## Disclaimers

- GIP++ is an unofficial client mod. It is not affiliated with, endorsed by or supported by Yapper Media LLC.
- GIP++ does not patch or redistribute the Yappin' desktop app. It is a separate client that loads the real site, and it does not automate accounts (no automatic messages, friend requests or joins).
- Using a modified client may go against the platform's terms, and site updates can break features at any time. Use it at your own risk.
- Favorites, folder icons and volume/direction settings are stored only on your computer. GIP++ does not upload them.
- Direction audio works best with headphones. Hi-Fi Mic and some other features are experimental.
- Provided "as is", without warranty of any kind (Apache License 2.0).

## What's different

- **Volume fix**: Yappin's own user and stream volume sliders now work (0 to 500%). Nothing new to learn, the controls you already have just do their job.
- **Server hover info**: hover a server in the rail to see its name and who is in voice.
- **Return to last DM**: the Direct messages button reopens the DM you were last in. **Profile colors** stay untouched by themes.
- **Voice direction**: a Direction slider in the right-click menu of a person in voice sets which side they sound like they come from (use headphones).
- **GIF Favorites + categories** in the GIF picker, **Folder sidebar + custom folder icons + privacy mode**, **Mark all as read**, **voice-switch confirmation**, **mouse back/forward**, **black and white logo**.
- Everything is tagged **GIP++** or **Yap++** in the GIP++ menu (Settings > GIP++) so you can see what came from where.
- **GIP & CO themes**: `gipco-dark` (on by default on first launch) and `gipco-light`. Black and white, halftone dots, square corners.
- **Themes**: GIP & CO (`gipco-dark`, `gipco-light`), Web 2.0 (light and dark), Frutiger Aero, Dark Aero, Frutiger Eco, Time-of-day Aero, Windows XP Luna, Winamp, Steam Classic (olive) and Steam 2013 (dark blue). Live previews, an Accent slider and import/export (share code or .css) in Settings > GIP++ > Themes. Dark and light themes also switch Yappin's own mode to match.
- **Visual Effects**: drifting bubbles or aurora behind the app (can be turned off), a glossy ring when you send, a glow while typing.
- **Sounds tab**: synthesised sound packs (Aero Glass, Luna Bells, Instant Messenger, 8-bit) for new messages, sending, and voice join/leave.
- **Voice tab**: edit the volume and direction GIP++ remembers per person, and apply presets.
- **Search tab**: search every server you have read in. Keeps a local index of messages your client displayed (off by default; it cannot see messages you never opened).
- **Reset GIP++**: Settings > Reset GIP++ puts GIP++ back to a fresh install without touching your login.
- **Zoom** (`Ctrl +` / `Ctrl -` / `Ctrl 0` / `Ctrl + wheel`), **DevTools** (`F12`), **reload** (`F5`), mouse back/forward buttons.
- **Text Cursor In Chat**, **Hi-Fi Mic** (experimental stereo), **GIP Inspector** (dev helper).
- Bug and security fixes (Draft Saver, theme persistence, updater, screen picker, file access). Details in `CHANGES.md`.

## Run it

```
npm install
npm start          # run from source
npm run make       # build an installer (Windows, NSIS)
npm run clean      # wipe saved GIP++ data if something gets stuck (close the app first)
```

If the app shows a blank page, open `html/client.html` and change the `src` of the `<webview>` between `https://yapper.website` and `https://yapin.gg`.

## Using volume and direction

Join a voice channel, right-click a person: the normal "User volume" slider goes to 500% and is remembered per person. Under it, "Direction" moves their voice left, right or behind you (double-click to centre). Stream volume works the same on the stream's own slider.
