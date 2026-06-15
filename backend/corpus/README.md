# MelodyClaim Corpus Imports

The built-in database contains the small demo/case-study corpus. To extend the
matcher toward 100 songs, add authorized references here and run:

```sh
npm run seed
```

## Option 1: JSON Signatures

Add entries to `authorized-songs.json`.

```json
[
  {
    "songName": "Example Song",
    "artist": "Example Artist",
    "year": 2026,
    "startNote": 60,
    "intervals": [2, 2, -1, 3, 0, -2, 4]
  }
]
```

You can provide `notes` instead of `intervals`:

```json
[
  {
    "songName": "Example Song",
    "artist": "Example Artist",
    "year": 2026,
    "notes": [60, 62, 64, 63, 66, 66, 64, 68]
  }
]
```

Each entry needs at least 8 notes or 7 intervals because the threshold filter
rejects shorter matches.

## Option 2: MIDI Files

Place licensed or otherwise authorized `.mid` / `.midi` files in `midi/`, then
add them to `midi-manifest.json`.

```json
[
  {
    "songName": "Example Song",
    "artist": "Example Artist",
    "year": 2026,
    "midiFile": "midi/example-song.mid"
  }
]
```

The seeder extracts the densest non-percussion melodic track and stores its
signed semitone interval sequence in `corpus.db`.
