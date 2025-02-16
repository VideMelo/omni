<h1 align="center">
<img src="assets/omni.png" alt="" align="center">
<br>Omni Bot<br>
</h1>
<p align="center"><a href="#about">About</a> - <a href="#key-features">Key Features</a> - <a href="#get-started">Get Started</a></p>

<img src="assets/banner.png" alt="" align="center" width="auto" height="auto">

## About

Omni is a music bot for Discord that transforms the musical experience into an interactive and social journey. With features that go beyond simple song playback, Omni allows you to control your playlist directly from Discord or through the control panel, listen to public radios, create custom playlists, and share what you're currently listening to with your friends. It combines entertainment and real-time interaction, making the environment more dynamic and fun. Whether you're enjoying music alone or with friends, Omni offers everything you need for the best musical experience on Discord.

## Key Features

Omni is a powerful and versatile music bot for Discord, designed to provide a complete and interactive experience for users. With features that go beyond simple music playback, Omni offers:

1. **Full Music Control**: You can manage your music directly from Discord or through an intuitive control panel (dashboard). It’s possible to create, add, or remove songs from the queue, as well as adjust volume and audio quality, all without leaving the chat.
2. **Listen with Friends**: Omni allows you to listen to music with your friends in real-time, creating shared playlists and participating in a social music experience directly within the Discord server.
3. **Public Radios**: In addition to playlists and individual songs, Omni offers integration with public radios, allowing you to listen to radio stations of different genres directly on your server.
4. **Custom Playlists**: Users can create personalized playlists with their favorite songs or explore playlists suggested by the bot, ensuring there’s always something new to listen to.
5. **Music Activity Feed**: Omni has a feed where you can share with your friends what you’re currently listening to. This feature allows other members to see the current song, creating a more social and interactive environment with space for discussions about music.
6. **Personalized Interaction**: Omni's control interface offers customization options so that users can tailor their experience according to their preferences, whether through commands in the Discord chat or the dashboard interface.

With these features, Omni becomes more than just a music bot; it turns into a complete tool for social interaction, music discovery, and playback control within Discord.

## Get Started

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
