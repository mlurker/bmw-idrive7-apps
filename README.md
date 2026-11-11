# bmw-idrive7-apps

Tools for the BMW iDrive 7 head unit, by mlurker, as a source for the
[mgu Store](https://github.com/robertnisipeanu/mgu-store).

| Tool | What it does |
|---|---|
| [`mlurker-hud-signals`](tools/mlurker-hud-signals) | Turn and blind spot warning signals, gear and ranges on the head-up display (HUD) |

## Install from the Store

Needs [mgu-store](https://github.com/robertnisipeanu/mgu-store) on the car (and `cluster-render`, which the Store installs
first). In the Store: Settings, Sources, add `mlurker/bmw-idrive7-apps` and pick **Releases**. It reads the release named
`catalog`.

## Publish a release

`dist/` holds the package (`mlurker-hud-signals@<version>.tgz`, built as the tool's README says). Then:

```sh
node scripts/publish_release.js --dry-run     # what it would do
node scripts/publish_release.js               # needs the gh CLI, logged in
```

It writes `catalog.json` (schema 2, the Store's catalog layout, the tool's `requires` and `mguHmi` taken from its
`component.json`), creates the `catalog` release when it is not there and uploads the package, the icon and
`catalog.json` last. Older packages stay on the release.

## License

GPL-3.0-or-later (see [LICENSE](LICENSE)). The BMW SDK is not part of this repository and is never published here.
