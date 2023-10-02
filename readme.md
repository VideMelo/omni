## Get Started

### Prerequisites

-  [Node.js v19.4.X](https://nodejs.org/)

### Install Packages

```sh
yarn
```

> **Note:** If you don't have `yarn` installed, install with `npm install -g yarn`

### Development Setup

#### Server

Rename `.env.template` to `.env` in `./server` and set the following settings:

```sh
# Get this in https://discord.com/developers/applications
DISCORD_TOKEN= # Discord Bot Token
DISCORD_ID= # Discord Bot ID
DISCORD_SECRET= # Discord Bot Secret
DISCORD_REDIRECT= # Discord Redirect URL Callback

# Get this in https://developer.spotify.com/dashboard
SPOTIFY_ID= # Spotify ID
SPOTIFY_SECRET= # Spotify Secret
```

#### Client

Rename `.env.template` to `.env` in `./client` and set the following settings:

```sh
# Get this in https://discord.com/developers/applications
VITE_DISCORD_ID= # Discord Bot ID

VITE_API_URL=http://localhost:8080/api # Your API URL Domain
VITE_SERVER_URL=http://localhost:8443 # Your Server Url Domain
```

### Run

```
yarn dev
```
