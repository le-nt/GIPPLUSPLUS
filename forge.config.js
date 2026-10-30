const { MakerNsis } = require("electron-forge-maker-nsis");

// Windows installer via NSIS (Squirrel was dropped upstream).

module.exports = {
  packagerConfig: {
    name: 'GIP++',
    icon: './assets/Icon',
    asar: false,
    ignore: [
      /^\/\.git/,
      /^\/out/,
      /^\/build/,
      /^\/node_modules/,
      /^\/\.vscode/
    ].map(regex => (path) => regex.test(path) ? true : false),
  },
  rebuildConfig: {},
  makers: [
    new MakerNsis({
      oneClick: false,     
      perMachine: false,           
      allowToChangeInstallationDirectory: false,
      createDesktopShortcut: true,
      createStartMenuShortcut: true,
      shortcutName: "GIP++"
    }),
  ]
};