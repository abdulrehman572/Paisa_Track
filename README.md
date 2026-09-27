# PaisaTrack

PaisaTrack is a local-first personal finance and budget manager. App data is stored in the browser on your device.

## Development

Prerequisites: Node.js 22 or later and npm.

```sh
npm ci
npm run dev
```

Vite prints the local development URL when it starts.

## Checks

```sh
npm run lint
npm run build
```

The lint script runs the TypeScript compiler without emitting files. Production output is written to `dist/`.

## Data and privacy

PaisaTrack stores finance data in browser `localStorage`; it is not automatically synced to a server. Clearing site data in the browser can remove the data, so use the app's available export or backup features before clearing it.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the local checks and pull request process. Please report security concerns privately as described in [SECURITY.md](SECURITY.md).
