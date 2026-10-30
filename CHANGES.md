# Changes

## 3.1.0

**New features** (all in GIP++ > Features; the ones with settings have their own tab)
- **Word Filter** (`gipwordfilter.js`, tab *Word filter*): hide, collapse (click to show) or blur messages containing words you choose; highlight other words. Highlighting uses the browser highlight feature, so message text is never rewritten.
- **Nicknames** (`gipnicknames.js`, tab *Nicknames*): rename people for yourself only. Alt+click a name in chat, or manage the list in the tab. Drawn with CSS, the real name text underneath is untouched.
- **Blur Media** (`gipimageblur.js`): pictures and videos in chat stay blurred until hover or click. Emoji, avatars and tiny images are skipped. Ctrl+Alt+B toggles it.
- **Visualizer** (`gipvisualizer.js`): Winamp-style bars that move with the voice call. The analyser is never connected to the speakers, so call audio is unchanged, and it follows per-person mute and volume.
- **Link Preview** (`giplinkpreview.js`): hover card showing the real address, fake link text, short links, look-alike (punycode) names, hidden logins, raw IPs and tracking parts, with *Copy clean link*. Risky links ask before opening. Loading the page title and picture is optional and off by default; it is fetched by the app (no cookies, never a local or private address, redirects re-checked, size limits).
- **Code Blocks** (`gipcodeblocks.js`): hover copy button and syntax colours for common languages (JS/TS, Python, C-family, Rust, Go, shell, JSON, HTML/XML, CSS, SQL and more).
- **Downloads** (`gipdownloads.js`, tab *Downloads*): a download button on hover for pictures, videos, audio and files. The app fetches the file and saves it with its real name to Downloads/GIP++ (or asks where). Programs and scripts are not saved automatically.
- **Emoji Downloader** (`gipemojidl.js`): Alt+click an emoji to save it, Alt+Shift+click to save every emoji in the same picker or list, plus a button in the Downloads tab. Saved to Downloads/GIP++/Emoji.
- **Emoji Text** (`gipemojitext.js`, tab *Emoji Text*): turns `:emoji_names:` that Yappin leaves as plain text (bios, statuses, profile cards, anywhere else) into the emoji picture. Names come from Yappin's own emoji lists as they load, from a once-a-day read-only request for your account's emoji list (option *Load Yappin's emoji list*, button in the tab), and from emoji seen on screen; they are remembered; matching ignores capitals. The original text is kept and restored when the feature is turned off. On by default.
- **Sync accounts** (`gipsync.js`, tab *Sync accounts*): publish one account's GIP++ settings and apply them in another, choosing which groups to copy. Logins and tokens are never included. New group *Learned emoji names* covers `gip.emojitext.*`.

**Final polish (3.1.0)**
- Downloads: no longer cut off after 3 minutes. The app waits 30 s for the server to start answering, then only gives up if no data arrives for 60 s (still capped at 1 GB). Yappin's cookies are now only sent to Yappin's own addresses (a precaution; other sites get a clean request).
- Link Preview: file names such as `README.md` or `setup.exe` are no longer flagged as "link says one site but goes to another", and a sub-domain of the same site (`m.example.com` for `example.com`) counts as the same place.
- Word Filter does nothing (and cleans up after itself) when no words are set, instead of scanning every message on every page change.
- Emoji Text: the automatic daily check only tries the remembered address or the two likeliest ones (the full guess list is for the manual button), and backs off for a week after a miss.
- Shared helpers added to the core (`YapPlus.util.store`, `offAll`, `isIconMedia`) replace copies of the same code in Downloads, Blur Media, Nicknames, Word Filter, Code Blocks, Link Preview, Visualizer, Navigation, Draft Saver and Emoji Text.
- Removed unused code (`getPluginCode`, an unused counter in Emoji Text).

**Safety**
- `app.js` now has a core version guard: if the downloaded copy (main.js, preload.js, client page, plugins) has an older core than the app, the whole downloaded copy is set aside (`yapplus-hot.stale`) and the bundled files run. The updater also refuses to keep an update older than the app.
- A downloaded plugin set that has no core file of its own now runs on the bundled core instead of being ignored.
- New app calls (downloads, link preview, sync) only answer to a real Yappin page.

**Plumbing**
- New helpers: `YapPlus.download(url, name, opts)`; selectors `msgText`, `msgAuthor`, `emoji` added to the shared list; new menu entries and categories.
- Code Blocks, Downloads and Emoji Downloader are on by default on first launch; everything else is off until you turn it on.

## 3.0.1 (bug-fix release)

**Fixes**
- **Health tab failed to load** (`H.stats is not a function`, `Cannot read properties of undefined (reading 'length')`). Cause: an older downloaded update copy of `plugins/0core.js` was running next to the newer plugins. `main.js` now ignores a downloaded plugin set whose core is older than the bundled one and runs the bundled plugins instead (logged in `gip-errors.log`). `plugins/giphealth.js` also detects an old core and shows a clear message with a Reset updates button, and every Health section now fails on its own instead of taking the tab down.
- `plugins/draftsave.js`: the draft was erased whenever anybody else posted in the channel (it watched incoming WebSocket messages). It now clears only when you send.
- `plugins/gipvolume.js` and Sound Packs both replaced `HTMLMediaElement.play`, and turning one off could undo the other. Both now use the patch registry.

**Moved onto the 3.0 bus and patch registry**
- Page-wide `MutationObserver`s replaced by the shared `dom` event: Folders, GIF Favorites, Keep Profile Colors, Mark All Read, Volume, Message Search, Custom voice messages and the Settings menu. New helper `YapPlus.events.watch(fn, owner, ms)` (debounced `dom`). The bus also watches `aria-expanded` now, for folders.
- Send detection moved to the `sent` event: Visual Effects (send ring) and Draft Saver.
- `plugins/gipnav.js`: follows `dom` and `channel` events; a slow 1.5s timer remains only as a safety net (it replaces the 250ms poll).
- `getUserMedia`, `RTCPeerConnection.createOffer/createAnswer` and `HTMLMediaElement.play` changes (Hi-Fi Mic, Custom voice messages, Volume) now go through `YapPlus.patches`.
- `scripts/check.js` now warns about page-wide MutationObservers in plugins and direct assignment over `getUserMedia`, `createOffer`, `createAnswer` and `play`.

**Removed / renamed**
- Streamer Mode (`plugins/gipstreamer.js`) removed, with its menu entry, selector-list entries and its saved-settings key left unused.
- "(Unofficial)" removed after the GIP++ name in the readme, NOTICE, package.json and counter-worker README. The not-affiliated notices stay.

## 3.0.0 (stability release)

**Foundation**
- `plugins/0core.js`: shared **event bus** (one page watcher for message / sent / channel / voice / dom events), one **selector list** (`YapPlus.sel`) with a health check, a **patch registry** so plugins cannot undo each other's browser-function changes, **crash isolation** (a plugin that throws is turned off, repeated handler errors turn it off, leftovers are cleaned up), plugin `requires`, a session **error log**, **settings backup/restore** with versioned migrations, and a **safe mode** banner.
- `plugins/giphealth.js` (new): the **Health** tab (feature status, start time, errors, page check, file sources, backup/restore, safe mode, Copy debug info), the **What's new** popup, and a theme panic key (Ctrl+Alt+Shift+T).
- `main.js` / `preload.js` / `html/client.html`: **safe mode** (hold Shift while the window opens, or `--safe-mode`); two failed starts in a row after an update **roll back** to the bundled files and that update is not downloaded again; the page process is **reloaded if it crashes**; **single instance** lock; errors written to `gip-errors.log`.
- `scripts/check.js` (new) runs from `push.ps1` before every push: syntax of every file, duplicate top-level names between plugins, plugins that never register, direct browser-function patches.
- Moved onto the new systems: Sound Packs, Silent Typing, No Popups, Draft Saver, Filename Disguiser.

**Features**
- Sound packs now replace Yappin's own sounds; new No Popups feature; themes can no longer restyle profile cards; hover card is smaller; the right-click menu is no longer covered by the folder sidebar; the unofficial tag removed from the window name; the Return to last DM plugin was removed.

This is **GIP++**, a fork of [salami-reborn/yapplusplus](https://github.com/salami-reborn/yapplusplus)
(Apache-2.0). As the license asks, here is what was changed. Unlisted files are unmodified upstream files.

## New
- `plugins/0core.js` (rewritten): plugin host with origin tags (GIP++ / Yap++), per-plugin options, shared native-style popup menu, prompt and confirm dialogs, accent colour, imported themes (sanitised: no @import, no remote url()) and a tab registry.
- `plugins/1menu.js` (rewritten): one GIP++ tab in Settings (Plugins, Settings, Accounts, Themes, Sounds, Voice, Search, About). Themes tab has live preview thumbnails, an accent slider and theme import/export (share code or .css). Settings tab has Reset GIP++. Everything is tagged GIP++ or Yap++.
- `plugins/gipvolume.js`: fixes Yappin's OWN volume sliders (right-click a person in voice, and the stream slider) to work 0 to 500%, no separate mixer. Streams play natively up to 100% and only use the Web Audio boost above that (fixes silent streams). Adds a per-person Direction slider (left/right/behind, TeamSpeak-style) to the person menu.
- `plugins/gipgifs.js`: Favorites tile in Yappin's GIF picker, star to save GIFs (from the picker or chat), categories (rename/delete), like Vencord's Better GIF Categories.
- `plugins/gipfolders.js`: opening a folder shows a sidebar of its servers; custom folder icons; privacy option replacing the 4 mini server icons with a folder icon.
- Window title, settings header and shortcut name are now just "GIP++" (the not-affiliated notices in the readme, NOTICE and About stay).
- `plugins/gipsounds.js`: sound packs now REPLACE Yappin's own sounds (muted while the pack plays; calls, voice chat and voice messages untouched). New switch: Replace default sounds.
- `plugins/gipnopopups.js`: No Popups. Hides pop-up nags like the "Help keep Yapin running" Plus card (hide only, reversible).
- `plugins/gipserverinfo.js`: hover a server in the rail for a card with its name and the users in voice.
- `plugins/gipprofileguard.js`: themes no longer recolour people's profile themes (profile cards, banners, name colours). `.profile-card` was also removed from every theme's override rules.
- `plugins/gipvoice.js`: confirmation when switching voice channel while in a call.
- `plugins/gipreadall.js`: one rail button that marks every server, folder and DM read (text channels only, never joins voice).
- `plugins/gipnav.js`: mouse side buttons / Alt+Arrows go back and forward through servers and channels visited.
- `plugins/gipbrand.js`: black and white / greyscale Yappin logo.
- `plugins/gipqol.js`: Text Cursor In Chat, Hi-Fi Mic (experimental stereo).
- `plugins/gipinspector.js`: dev helper, `Alt+Shift+Click` copies element info.
- `plugins/0shim.js`: startup fixes and first-run defaults. Also stops the active theme from restyling profile cards (the popup from clicking or right-clicking someone in the member list or voice): every theme selector is rewritten to skip anything inside a profile. Also keeps Yappin's own light/dark mode in step with the active theme's `color-scheme` (themes that declare one), and undoes it when the theme is switched off.
- `themes/gipco-dark.css`, `themes/gipco-light.css`: GIP & CO themes.
- `themes/gip-web2-light.css`, `themes/gip-web2-dark.css`: Web 2.0 themes (glossy gradients, glass panels, pill buttons).
- `themes/gip-frutiger-aero.css`, `themes/gip-dark-aero.css`, `themes/gip-frutiger-eco.css`, `themes/gip-time-aero.css`: Frutiger Aero family (Aero glass, glossy buttons, sky, bubbles, grass hill). Dark Aero is a night sky; Eco is greener with droplets; Time-of-day Aero changes its sky with the clock.
- `themes/gip-xp-luna.css`, `themes/gip-winamp.css`: Windows XP Luna and Winamp skins.
- All of the above except the GIP & CO themes use `--gip-h`, so the Accent slider in GIP++ > Themes recolours them.
- `plugins/gipfx.js`: Visual Effects: drifting bubbles / aurora background (toggle), time-of-day sky variables, glossy send ring, typing glow.
- Window title, settings header and shortcut name are now just "GIP++" (the not-affiliated notices in the readme, NOTICE and About stay).
- `plugins/gipsounds.js`: Sound Packs, in its own Sounds tab. Synthesised with Web Audio, no audio files.
- `plugins/gipsearch.js`: Message Search, in its own Search tab. Local index of messages seen while it is on (off by default).
- `plugins/gipvoicepresets.js`: Voice tab: edit remembered volume/direction per person, voice presets.
- `assets/GipSeal.png`, `assets/GipSealWhite.png`: the GIP & CO seal.

## Bug sweep
- `plugins/gipserverinfo.js`: hover card no longer shows on the Direct messages button or other non-server rail buttons, and no longer writes to storage every few seconds. On by default.
- `plugins/gipvolume.js`: the "NN%" label fix now edits the site's own text node, so Yappin can keep updating it.
- `plugins/gipvoicepresets.js`: volume slider and clamp raised to 500% to match the new limit.

## Steam themes
- `themes/gip-steam-classic.css`: the olive-green Steam skin from the 2003 to 2010 era (flat khaki panels, bevelled edges, gold highlights).
- `themes/gip-steam-2013.css`: the dark blue Steam client from the early 2010s. Follows the Accent slider.
- Removed `plugins/gipemoji.js` (Yappin has this built in now).

## Fixes (light/dark + Sounds tab)
- `plugins/1menu.js`: the GIP++ tab bar now wraps onto a second line, so Sounds, Voice and Search are no longer cut off.
- Window title, settings header and shortcut name are now just "GIP++" (the not-affiliated notices in the readme, NOTICE and About stay).
- `plugins/gipsounds.js`, `plugins/0core.js`: the Sounds tab registers before the plugin does, and a failing listener can no longer stop a plugin registering.
- `plugins/0shim.js`: light/dark sync is stronger. It now also checks `.app`/`#root`, switches theme keys kept in localStorage (restored when the theme is turned off), re-applies every few seconds, and sets the app's `prefers-color-scheme`.
- `main.js`, `preload.js`: new `set-native-theme` IPC (`electronAPI.setNativeTheme`) used by the above.

## Menu rework
- `plugins/1menu.js`: fixed Yappin's own settings pages showing underneath the GIP++ panel after leaving GIP++ (the panel is now removed as soon as another settings button is clicked).
- `plugins/1menu.js`: new layout with a grouped sidebar (Features, Appearance, Chat and voice, App) and a title plus one-line help on every page. Larger, higher-contrast text.
- Plugins tab is now **Features**: searchable, grouped by purpose (chat, voice, servers, look and feel...), click anywhere on a row to toggle, and each feature's options sit right under it instead of in Settings.
- Settings tab reordered and renamed in plain language; Troubleshooting (reset) is last.

## More themes (36 new, all GIP++ tagged)
- Popular palettes, each as a dark and light pair: Catppuccin Mocha/Latte, Nord/Nord Snow, Gruvbox Dark/Light, Tokyo Night/Tokyo Night Day, Rose Pine/Rose Pine Dawn, Solarized Dark/Light, Dracula/Alucard. All follow the Accent slider.
- Nostalgia: Windows 98, Mac OS X Aqua (accent slider), Mac OS 9 Platinum, MSN Messenger (accent slider), iOS 6 (linen), MySpace 2006.
- Retro computing: Amber CRT, Green Phosphor, Game Boy, Commodore 64, Amiga Workbench, Vaporwave.
- Mood: Paper, Sepia, Sepia Night, High Contrast Dark/Light, Sakura, Midnight Forest, Synthwave, Cyberpunk.
- `plugins/1menu.js`: Themes tab has All / Dark / Light filter chips; accent note updated.
- Themes only change colours, fonts, radii and decoration (no sizes or padding), like the existing GIP++ themes.

## Rebrand
- Renamed to GIP++ (window title, product name, installer, user-data folder). Existing "Yap++ GIP Edition" data is copied over once on first run so you stay logged in.
- Features that come from Yap++ carry a "Yap++" tag; features made for GIP++ carry a "GIP++" tag. "Built on Yap++" stays in About.
- `main.js`: side-button app commands go to the Back/Forward plugin first, browser history as fallback.

## Release info
- `assets/GipLogo.png` is the GIP++ logo (README banner, About tab). `assets/Icon.ico` is now the GIP & CO seal instead of the Yap++ icon.
- Updater is on and points at `le-nt/GIPPLUSPLUS` (branch `main`).
- About tab: version, disclaimers, community links (server, bug reports, GitHub). Header links in the GIP++ menu.

## Bug fixes
- **Draft Saver crashed** when enabled: `draftsave.js` calls `messagelogger.currentChannelId()` but nothing defined `messagelogger`. Now defined in `0shim.js`.
- **Themes did not survive a restart**: the saved theme was only applied after opening the Themes panel (and not even then, because the theme list loads asynchronously). Now applied at startup.
- **One broken plugin disabled all of them**: plugins were joined into one script. Each now runs separately and failures are logged.
- **Updater overwrote the fork with upstream files.** It is now off until `gip.updateRepo` is set in `package.json`.
- **Screen picker**: window titles were pasted into HTML unescaped; the capture callback could fire twice; the listener leaked.
- `forge.config.js` icon path was `./assets/icon` but the file is `Icon.ico` (fails on case-sensitive systems).
- `package.json` said MIT, the LICENSE is Apache-2.0.
- Removed empty/dead files: `plugins/updatetest.js`, `plugins/fakeverified.js`, `html/Setuppage.html` (never loaded).

## Security hardening (`main.js`)
- `get-asset` accepted `../` paths and returned any file as base64 to the page. Names are now reduced to a safe base name.
- `save-custom-plugin` accepted `../` in the file name and could write outside the plugins folder. Now validated.
- `open-external` passed any URL to the OS. Now only `http`, `https` and `mailto`.
- Trusted-site checks used `url.includes('yapin.gg')`, which `https://evil.example/?yapin.gg` passes. Now the hostname is parsed.

## New app features (`main.js`)
- Zoom: `Ctrl +`, `Ctrl -`, `Ctrl 0`, `Ctrl + mouse wheel` (remembered between launches).
- `F12` / `Ctrl+Shift+I` open DevTools, `F5` / `Ctrl+R` reload.
- Mouse back/forward side buttons (Windows).

## User Counter
- New `plugins/gipcounter.js` (on by default, toggle in the Plugins tab): sends a random install ID so the GIP++ menu can show how many people use GIP++. Disclosed in the About tab. `main.js` (`gip-count`) does the request, `preload.js` exposes `userCount`.
- `counter-worker/`: Cloudflare Worker + D1 server for it. Off until `gip.counterUrl` in `package.json` is set.

## Automatic updates
- Checks on launch (max 6 s wait) and every 6 h. Restarts once if `main.js`/`preload.js` changed. Toggle in GIP++ > Settings > Updates.
- Updater now compares git blob hashes and downloads only changed files (before: one API request per file every time, which would hit GitHub's 60/hour limit).

## Link fix
- Links and files that open in a new tab (`target="_blank"`, `window.open`) did nothing: the open-handler was on the main window, but they happen inside the webview. Now handled on the webview and sent to the default browser. The link click hook is also re-installed on every page load (it was installed once, before the page loaded).

## Cleanup
- Removed `saveCustomPlugin` / `getPlugins` from the page-visible API (nothing used them; they let page scripts write plugin code that runs on every launch).
- Draft Saver: turning it off now really stops saving (it removed the wrong listener).

## Better Alt Manager
- Each account profile is its own window with its own webview partition (separate login, theme and plugin settings), so several accounts can be open at once. The main account keeps the original `persist:yapper` partition, so nobody gets logged out.
- `main.js`: window creation moved into `openClient(profile)`; profile storage and `alts-*` IPC; per-window title; screen share picker installed per account session. `html/client.html` builds the webview from the `?profile=` id.
- `plugins/gipalts.js`: coloured frame, name tag and accent colour per account. `plugins/1menu.js`: new **Accounts** tab (add, open, rename, recolour, remove).

## Badges removed
- `plugins/badges.js` and all badge images (staff, helper, GIP++ DEV and the joke badges) were removed, along with the `staffbadge` plugin and `gipWhoIs()`. GIP++ shows no badges next to usernames.
- `plugins/funnyplugins.js` ("Im a sigma", "SIXSEVEN", which rewrote outgoing messages) was removed.

## Dev fix
- `app.js`, `main.js`: when run from source (`npm start`) the auto-updater and its "hot" copy folder are now off, so your local files are what actually runs. Before, the updater downloaded the GitHub version over them and the hot copies took priority. Packaged builds behave as before.

## Updates back on
- `app.js`, `main.js`: the auto-updater and "hot" copy folder are on again for `npm start` as well as packaged builds (reverts the earlier "Dev fix"). Set `YAPPLUS_NO_HOT=1` to run only local files with updates off. Settings > Updates still has the "Update automatically" switch (default on).
- Note: the updater downloads from `le-nt/GIPPLUSPLUS` `main`, so local edits must be pushed there or the next update replaces them.

## New About banner
- `assets/GipBanner.png` replaces `assets/GipLogo.png` (removed) in the About tab.
