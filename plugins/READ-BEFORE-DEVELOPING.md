Make sure to have `window.PluginHost.register(yourpluginfunc);` at the end of every plugin!

READ THE RULES IN README.MD BEFORE CONTRIBUTING. IF YOU BREAK ANY OF THOSE RULES, THEN YOU WILL BE BANNED IN ALL GUILDS REGARDING YAP++ IN EVERY SOCIAL PLATFORM,

---

## GIP++ 3.0 plugin API (0core.js)

Run `node scripts/check.js` before pushing. It catches syntax errors, two plugins declaring the same top-level name, and plugins that change browser functions directly.

- **Event bus.** Do not run your own MutationObserver for messages, sending, channel changes or voice. Subscribe:
  `const off = YapPlus.events.on('message', ({ids, els}) => {...}, 'yourPluginId');` and call `off()` in `stop()`.
  Events: `message`, `sent`, `channel`, `voice`, `dom`. To save a web file with its real name use `YapPlus.download(url, name, { subdir, ask, reveal })`. For "redo something after the page changed" use `YapPlus.events.watch(fn, 'yourPluginId', 100)` (debounced `dom`); it returns an unsubscribe function too. A handler that throws is caught; five errors in a minute turn your plugin off.
- **Selector list.** Look page parts up with `YapPlus.sel.q('composer')` / `.qa('msg')` / `.css('rail')` instead of writing class names. Add new ones with `YapPlus.sel.define(name, css, when, usedBy)`. GIP++ > Health checks them all, so when Yappin renames something there is one place to fix.
- **Patch registry.** Never assign over `WebSocket.prototype.send`, `fetch`, `Notification` etc. Use
  `YapPlus.patches.add('yourPluginId', target, 'prop', (next) => function (...args) { return next.apply(this, args); })` and `YapPlus.patches.removeOwner('yourPluginId')` in `stop()`.
- **Crash isolation.** If `start()` throws, the plugin is turned off and the user is told. Whatever you forgot to undo (bus subscriptions, patches) is cleaned up after you.
- **Dependencies.** `requires: ['otherPluginId']` delays your `start()` until that plugin has loaded.
- **Errors.** `YapPlus.report('yourPluginId', 'where', err)` adds to the Health tab, the debug report and the error log file.
- **Settings.** Keys starting with `gip.` or `yapplus.` are included in settings backups. To change how something is stored, add a step to `YapPlus.settings.migrations`.
- **Settings tab.** `YapPlus.registerTab(id, label, (ui) => element)` adds a tab. `ui` has `el`, `sw` (switch) and `group`.
