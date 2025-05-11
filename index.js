const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

let accessToken = 'YOUR_MANUAL_ACCESS_TOKEN'; // Replace with actual token or implement OAuth

async function getTopTracks() {
  const res = await axios.get('https://api.spotify.com/v1/me/top/tracks?limit=10', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return res.data.items.map(track => ({
    name: track.name,
    uri: track.uri,
    artists: track.artists.map(a => a.name),
    preview_url: track.preview_url
  }));
}

async function getNowPlaying() {
  const res = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return res.data?.item
    ? {
        name: res.data.item.name,
        artists: res.data.item.artists.map(a => a.name),
        uri: res.data.item.uri
      }
    : null;
}

async function getFollowedArtists() {
  const res = await axios.get('https://api.spotify.com/v1/me/following?type=artist&limit=50', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return res.data.artists.items.map(artist => artist.name);
}

async function playTrack(uri) {
  await axios.put(
    'https://api.spotify.com/v1/me/player/play',
    { uris: [uri] },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
}

async function pausePlayback() {
  await axios.put('https://api.spotify.com/v1/me/player/pause', {}, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
}

app.get('/spotify', async (req, res) => {
  try {
    const [topTracks, nowPlaying, followedArtists] = await Promise.all([
      getTopTracks(),
      getNowPlaying(),
      getFollowedArtists()
    ]);

    res.json({ nowPlaying, topTracks, followedArtists });
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

app.post('/spotify/play', async (req, res) => {
  try {
    const { uri } = req.body;
    await playTrack(uri);
    res.json({ message: 'Playback started' });
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

app.post('/spotify/pause', async (req, res) => {
  try {
    await pausePlayback();
    res.json({ message: 'Playback paused' });
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})