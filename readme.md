## Get Started

### Prerequisites
- [Node.js v19.X](https://nodejs.org/)

### Install Packages
```sh
yarn
```
> **Note:** If you don't have `yarn` installed, install with `npm install -g yarn`

### Development Setup
Rename `.env.template` to `.env` in `./server` and configure the following settings:

```sh
# Get this in https://discord.com/developers/applications
DISCORD_TOKEN= # Your Discord Bot Token

# Get this in https://developer.spotify.com/dashboard
SPOTIFY_ID= # Your Spotify ID
SPOTIFY_SECRET= # Your Spotify Secret
```

### Run
```
yarn dev
```