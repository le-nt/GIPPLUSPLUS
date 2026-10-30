# GIP++ 3.2.1

- The menu window no longer gets squished by Yappin's own styles (fixed size and layout, buttons and headings protected), has a solid background, bigger spacing and text, an accent-coloured active tab, and a nicer header.

# GIP++ 3.2.0

## New window instead of a Settings tab
- GIP++ no longer adds a button or page to Yappin's Settings. It opens in **its own window**: click the GIP++ icon next to your name, or press **Ctrl+Shift+G**. This fixes the menu showing up in server settings and breaking the real settings page.
- The sidebar went from about 15 entries to **6**: Features, Appearance, Chat and voice, Accounts, App, About. Everything else is a collapsible section inside those pages and only loads when opened.
- **Features** page: search plus All / On / Off filter, categories you can collapse, and per-feature **Options** that stay hidden until you click them.
- *App > Menu button* lets you put the button next to your name, floating in a corner, or hide it (keyboard shortcut only).
- Fixed the origin tags (GIP++ / Yap++) rendering far too large.

## New feature
- **Keep Stream Audio When Deafened** (`gipstreamaudio.js`, on by default, under Voice). Deafen silences voice chat but the stream you are watching keeps playing. Muting or changing the stream with its own controls still works while deafened. Debug: run `gipstreamaudio.debug()` in the console.

---

# GIP++ changelog: 2.1.0 → 3.1.0

Everything that differs between the 2.1.0 and 3.1.0 packages. This covers the 3.0.0, 3.0.1 and 3.1.0 releases, plus the Emoji Text feature added on top of 3.1.0. It was checked against the actual file differences, not only the old notes.

At a glance: 3 releases · 14 new plugins · 2 new themes · 3 features removed (Emoji Source Card, Streamer Mode, Return to last DM) · most older themes touched.

---

## New features

### Chat and messages
- **Word Filter** (`gipwordfilter.js`, tab *Word filter*). Hide, collapse (click to show) or blur messages containing words you choose, and highlight other words. Highlighting uses the browser highlight feature, so message text is never rewritten.
- **Nicknames** (`gipnicknames.js`, tab *Nicknames*). Rename people for yourself only. Alt+click a name in chat, or manage the list in the tab. Drawn with CSS; the real name text underneath is untouched.
- **Link Preview** (`giplinkpreview.js`). Hover card showing the real address and warnings for fake link text, short links, look-alike (punycode) names, hidden logins, raw IP addresses and tracking parts, with *Copy clean link*. Risky links ask before opening. Loading the page title and picture is optional and **off by default**. When on, the app fetches it with no cookies, never from a local or private address, with redirects re-checked and size limits.
- **Code Blocks** (`gipcodeblocks.js`). Hover copy button and syntax colours for JS/TS, Python, C-family, Rust, Go, shell, JSON, HTML/XML, CSS, SQL and more. On by default.
- **Downloads** (`gipdownloads.js`, tab *Downloads*). A download button on hover for pictures, videos, audio and files. The app fetches the file and saves it with its real name to Downloads/GIP++ (or asks where). Programs and scripts are not saved automatically. On by default.
- **Emoji Downloader** (`gipemojidl.js`). Alt+click an emoji to save it; Alt+Shift+click saves every emoji in the same picker or list. Also a button in the Downloads tab. Saved to Downloads/GIP++/Emoji. On by default.
- **Emoji Text** (`gipemojitext.js`, tab *Emoji Text*). Turns `:emoji_names:` that Yappin leaves as plain text (bios, statuses, profile cards, anywhere else) into the emoji picture. On by default.
  - Matching ignores capitals, so `:GIP_logo:` and `:gip_LOGO:` find the same emoji.
  - Names come from three places: Yappin's own emoji lists as they load, a once-a-day read-only request for your account's emoji list (option *Load Yappin's emoji list*, plus a *Load emoji list from Yappin now* button), and any emoji seen on screen. They are remembered between sessions.
  - Unknown names are left as text. The original text is kept and restored when the feature is turned off.

### Voice
- **Visualizer** (`gipvisualizer.js`). Winamp-style bars that move with the voice call. The analyser is never connected to the speakers, so call audio is unchanged, and it follows per-person mute and volume.
- **Volume sliders now go to 500%** (was 200%). Streams play natively up to 100% and only use the Web Audio boost above that, which fixes silent streams. Voice presets were raised to match.
- **Sound packs replace Yappin's own sounds** instead of playing on top (calls, voice chat and voice messages are untouched). New switch: *Replace default sounds*.

### Look and feel
- **Two new themes:** *Steam Classic* (the olive-green 2003–2010 skin: flat khaki panels, bevelled edges, gold highlights) and *Steam 2013* (the dark blue client; follows the Accent slider).
- **Themes no longer restyle other people's profile themes** (profile cards, banners, name colours). `.profile-card` was removed from every theme's override rules, and a new `gipprofileguard.js` plus a rewrite of theme selectors in `0shim.js` keep themes out of profiles.
- **Blur Media** (`gipimageblur.js`). Pictures and videos in chat stay blurred until hover or click. Emoji, avatars and tiny images are skipped. Ctrl+Alt+B toggles it.
- **No Popups** (`gipnopopups.js`). Hides pop-up nags such as the "Help keep Yappin running" card (hide only, reversible).

### Servers and accounts
- **Server Info** (`gipserverinfo.js`). Hover a server in the rail for a card with its name and who is in voice. It ignores the Direct messages button and other non-server buttons. On by default.
- **Sync accounts** (`gipsync.js`, tab *Sync accounts*). Publish one account's GIP++ settings and apply them in another, choosing which groups to copy. Logins and tokens are never included. Includes a *Learned emoji names* group for Emoji Text.
- **Settings backup and restore**, in the Health tab (see Stability below).

---

## Stability and safety (3.0.0 → 3.1.0)

### New core (`plugins/0core.js`)
- **Event bus**: one page watcher for `message`, `sent`, `channel`, `voice` and `dom` events. A debounced helper, `YapPlus.events.watch(fn, owner, ms)`, replaces page-wide MutationObservers.
- **Selector list** (`YapPlus.sel`) with a health check, so a Yappin class rename has one place to fix. New selectors: `msgText`, `msgAuthor`, `emoji`.
- **Patch registry** (`YapPlus.patches`), so plugins cannot undo each other's changes to browser functions.
- **Crash isolation**: a plugin that throws is turned off and its leftovers cleaned up. Five handler errors in a minute also turn it off. Plugins can declare `requires`.
- **Error log**, per-plugin options helpers, and **settings backup/restore** with versioned migrations.
- **Safe mode** banner.
- New helper `YapPlus.download(url, name, opts)`.

### New Health tab (`plugins/giphealth.js`)
- Feature status, start time, errors, page check, file sources, settings backup/restore, *Copy debug info*, a **What's new** popup after each update, and a theme panic key (**Ctrl+Alt+Shift+T**).
- Detects an outdated downloaded core and offers a **Reset updates** button. Every Health section now fails on its own instead of taking the tab down.

### App and updater (`main.js`, `preload.js`, `app.js`, `html/client.html`)
- **Safe mode**: hold Shift while the window opens, or use `--safe-mode`. GIP++ loads but no feature starts.
- **Automatic rollback**: two failed starts in a row after an update return to the bundled files, and that update is not downloaded again.
- **Core version guard** (`app.js`, `main.js`): if a downloaded copy has an older core than the app, the whole copy is set aside (`yapplus-hot.stale`) and the bundled files run. The updater also refuses to keep an update older than the app. A downloaded plugin set with no core of its own runs on the bundled core.
- The page process is **reloaded if it crashes** (at most 3 times in 5 minutes).
- **Single-instance lock**: opening the app twice focuses the running window.
- Errors are written to `gip-errors.log`, with an *Open error log* action.
- New app calls for downloads, link preview and sync only answer to a real Yappin page (trusted-URL check).
- New IPC calls: `getSafeMode`, `restartSafe`, `getRunInfo`, `resetHot`, `bootResult`, `logError`, `openErrorLog`, `download`, `openDownloads`, `linkMeta`, `syncSave`, `syncList`, `syncLoad`.

### Developer tooling
- `scripts/check.js` (new), run by `push.ps1` before every push. It checks syntax of every file, duplicate top-level names between plugins, plugins that never register, direct patches of browser functions, page-wide MutationObservers, and direct assignment over `getUserMedia`, `createOffer`, `createAnswer` and `play`.
- `push.ps1` and `push.bat` added (both are git-ignored). `clean.js` removed.
- `plugins/READ-BEFORE-DEVELOPING.md` documents the new plugin API.

---

## Bug fixes
- **Health tab failed to load** (`H.stats is not a function`, `Cannot read properties of undefined`). An old downloaded copy of `0core.js` was running next to newer plugins. Fixed by the core version guard and by Health detecting an old core.
- **Draft Saver** erased your draft whenever anybody else posted in the channel. It now clears only when you send.
- **Volume and Sound Packs** both replaced `HTMLMediaElement.play`, and turning one off could undo the other. Both now use the patch registry.
- **Server Info**: the hover card no longer shows on non-server rail buttons and no longer writes to storage every few seconds.
- **Volume**: the "NN%" label fix now edits the site's own text node, so Yappin can keep updating it.
- **Folders**: the right-click menu is no longer covered by the folder sidebar. While the panel is open, menus are lifted into the browser's top layer.
- **Visual Effects (send ring)** and **Draft Saver** no longer use their own key and click listeners for send detection.
- Streams that were silent at normal volume now play correctly (see Volume above).

## Final polish before release
- Downloads: no longer cut off after 3 minutes. The app waits 30 s for the server to start answering, then only gives up if no data arrives for 60 s (still capped at 1 GB). Yappin's cookies are now only sent to Yappin's own addresses (a precaution; other sites get a clean request).
- Link Preview: file names such as `README.md` or `setup.exe` are no longer flagged as "link says one site but goes to another", and a sub-domain of the same site (`m.example.com` for `example.com`) counts as the same place.
- Word Filter does nothing (and cleans up after itself) when no words are set, instead of scanning every message on every page change.
- Emoji Text: the automatic daily check only tries the remembered address or the two likeliest ones (the full guess list is for the manual button), and backs off for a week after a miss.
- Shared helpers added to the core (`YapPlus.util.store`, `offAll`, `isIconMedia`) replace copies of the same code in Downloads, Blur Media, Nicknames, Word Filter, Code Blocks, Link Preview, Visualizer, Navigation, Draft Saver and Emoji Text.
- Removed unused code (`getPluginCode`, an unused counter in Emoji Text).

## Performance and internals
Moved onto the shared event bus (no more separate page-wide observers): Folders, GIF Favorites, Keep Profile Colors, Mark All Read, Volume, Message Search, Custom voice messages, the Settings menu, Navigation (slow 1.5 s safety timer replaces the 250 ms poll), Visual Effects, Draft Saver and Silent Typing.

Moved onto the patch registry: Hi-Fi Mic (`getUserMedia`, `createOffer`, `createAnswer`), Custom voice messages, Volume and Sound Packs.

## Removed or renamed
- **Emoji Source Card** (`gipemoji.js`) removed. Yappin has this built in now. Its readme entry is gone.
- **Streamer Mode** (`gipstreamer.js`) removed, with its menu entry and selector-list entries. Its saved-settings key is left unused.
- **Return to last DM** plugin removed (taken from the project's own 3.0.0 notes; it is not present in either package).
- **"(Unofficial)" dropped from the name** in the window title, settings header, shortcut name, readme title, NOTICE, `package.json` and the counter-worker README. The "not affiliated with Yapper Media LLC" notices stay.
- `clean.js` removed.

## Menu and settings
- Features are grouped into sections (*Chat and messages*, *Voice*, *Servers and navigation*, *Look and feel*, *Accounts and privacy*, *Fun*, *Other*) with a search box.
- First launch switches on: Code Blocks, Downloads, Emoji Downloader, Emoji Text, Volume, Text Cursor, GIF Favorites, Folders, Voice, Mark All Read, Navigation, Profile Guard, Server Info, No Popups, Brand, Counter, Alts and Visual Effects. Everything else is off until turned on. Existing choices are never overridden.
- New tabs: Health, Word filter, Nicknames, Downloads, Emoji Text, Sync accounts.

## Themes
- **54 → 56 themes** (the two Steam themes).
- Most older themes had `.profile-card` removed from their override rules.
- Six themes (`gip-aqua`, `gip-ios6`, `gip-msn`, `gip-myspace`, `gip-os9`, `squircly`) also had a small stray-comma/CSS-rule cleanup.

## Version
- `package.json`: 2.1.0 → 3.1.0. Core `YapPlus.VERSION` is 3.1.0, and Health expects 3.1.0 or newer.
- What's new popup now shows 3.1.0, 3.0.1 and 3.0.0 notes.

---

## Deprecated (after 3.1.0)

Checked against Yappin's latest official changelog (faster app, Ctrl/Cmd+K quick switcher, offline send queue with a "reconnecting" pill, masked links, mini call, mouse back/forward and Alt+Left/Right, phone fixes, small fixes). Every official item was compared with what GIP++ already does.

### Deprecated (Yappin does this now)
| GIP++ feature | Official feature | What changed |
|---|---|---|
| **Mouse Back / Forward** (`gipnav.js`) | Mouse back/forward buttons and Alt+Left/Right | Renamed *(deprecated)* and **off by default**. Removed from the first-launch defaults. A one-time settings migration (settings version 4) switches it off for existing installs so the two do not both jump. It still works if you turn it back on, and when it is on it takes the Alt+Arrow keys for itself. `main.js` no longer also steps through browser history for the mouse buttons (that would jump twice). |

### Kept, because GIP++ does more (and checked it still works with the official version)
| GIP++ feature | Official feature | Why it stays / what was checked |
|---|---|---|
| **Mini Call** (`gipminicall.js`) | Floating call card while you browse other channels | Yappin only shows the card. GIP++ lets you drag it, remembers where you put it, Alt+double-click resets it, or hides it. It only restyles the card and never replaces it. |
| **Link Preview** (`giplinkpreview.js`) | Masked links `[text](url)` with a warning before opening | GIP++ shows the real address on hover and flags look-alike names, hidden logins, raw IPs, short links and tracking parts. A masked link with plain text only gets an "info" note. A masked link whose text looks like a different website still counts as risky and asks first. |
| **Link opening** (`main.js`) | "We warn you before it opens somewhere else" | The app's outside-link hook used to open links the moment they were clicked, which would skip Yappin's warning. It now runs after the page's own handlers and does nothing for a click they already handled. Links nobody handled still go to your browser as before. |
| **GIF Favorites** (`gipgifs.js`) | "No more double GIF sends" | Yappin fixed its own picker. The Favorites list sends through its own path, so it got its own guard: a second send within 0.9 s is ignored. |

### Kept, no overlap
- **Message Search** (`gipsearch.js`) searches message text you have already read. The official quick switcher (Ctrl/Cmd+K) jumps to servers, channels and DMs, so they do different jobs. GIP++ does not use Ctrl+K anywhere, so there is no clash.
- **Draft Saver** (`draftsave.js`) keeps text you have typed but not sent. The official offline queue holds messages you have sent. It already clears only on send, so a queued message does not bring the draft back.
- **Settings menus, popups and confirm boxes** already close on Escape.
- Phone fixes (swipe to open servers, keyboard handling) are not relevant: GIP++ is a desktop client.
- Speed improvements and screen-reader fixes in Yappin need nothing from GIP++.

### Not verified
This was checked against the code and the official notes, not against the live site. `.mini-call` and the message-link selector (`.msg .msg-text a[href]`) are the two class names that Yappin could have changed. GIP++ > Health shows whether they still match.

---

### Release-by-release summary
| Release | Theme |
|---|---|
| **3.0.0** | Stability: new core (event bus, selector list, patch registry, crash isolation), Health tab, safe mode, rollback, check script; 500% volume; sound packs replace defaults; Server Info; No Popups; profile guard; Steam themes |
| **3.0.1** | Bug fixes: Health tab load failure, Draft Saver erasing drafts, Volume/Sound Pack conflict; more plugins moved to the bus; Streamer Mode removed; "(Unofficial)" dropped |
| **3.1.0** | Nine new features (Word Filter, Nicknames, Blur Media, Visualizer, Link Preview, Code Blocks, Downloads, Emoji Downloader, Sync accounts); core version guard; trusted-page checks on new app calls |
| *Added after 3.1.0* | Emoji Text, with emoji-list preloading and a Sync accounts group for it; Mouse Back / Forward deprecated (Yappin has it now); GIF double-send guard; link-open hook yields to Yappin's warning |
