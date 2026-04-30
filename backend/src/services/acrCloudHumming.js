import crypto from 'crypto';

const HTTP_METHOD = 'POST';
const HTTP_URI = '/v1/identify';
const DATA_TYPE = 'audio';
const SIGNATURE_VERSION = '1';

function getConfig() {
  const host = process.env.ACRCLOUD_HOST;
  const accessKey = process.env.ACRCLOUD_ACCESS_KEY;
  const accessSecret = process.env.ACRCLOUD_ACCESS_SECRET;

  if (!host || !accessKey || !accessSecret) {
    return null;
  }

  return {
    host: host.replace(/^https?:\/\//, '').replace(/\/$/, ''),
    accessKey,
    accessSecret,
  };
}

function signRequest({ accessKey, accessSecret, timestamp }) {
  const stringToSign = [
    HTTP_METHOD,
    HTTP_URI,
    accessKey,
    DATA_TYPE,
    SIGNATURE_VERSION,
    timestamp,
  ].join('\n');

  return crypto
    .createHmac('sha1', accessSecret)
    .update(stringToSign)
    .digest('base64');
}

function pickBestTrack(metadata = {}) {
  const candidates = metadata.humming || metadata.music || [];
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }

  return [...candidates].sort((a, b) => Number(b.score || 0) - Number(a.score || 0))[0];
}

function normalizeTrack(track) {
  if (!track) return null;

  const artist = Array.isArray(track.artists)
    ? track.artists.map(item => item.name).filter(Boolean).join(', ')
    : '';

  return {
    songName: track.title || 'Unknown title',
    artist: artist || 'Unknown artist',
    album: track.album?.name || '',
    score: Number(track.score || 0),
    acrid: track.acrid || '',
    externalMetadata: track.external_metadata || {},
  };
}

export async function recognizeHummingWithAcrCloud({ buffer, filename, mimetype }) {
  const config = getConfig();
  if (!config) {
    return {
      configured: false,
      match: null,
      raw: null,
    };
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = signRequest({
    accessKey: config.accessKey,
    accessSecret: config.accessSecret,
    timestamp,
  });

  const formData = new FormData();
  formData.append('access_key', config.accessKey);
  formData.append('sample_bytes', String(buffer.length));
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('data_type', DATA_TYPE);
  formData.append('signature_version', SIGNATURE_VERSION);
  formData.append(
    'sample',
    new Blob([buffer], { type: mimetype || 'audio/webm' }),
    filename || 'humming.webm'
  );

  const response = await fetch(`https://${config.host}${HTTP_URI}`, {
    method: HTTP_METHOD,
    body: formData,
  });

  const raw = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(raw?.status?.msg || `ACRCloud request failed: ${response.status}`);
  }

  const bestTrack = pickBestTrack(raw?.metadata);

  return {
    configured: true,
    match: normalizeTrack(bestTrack),
    raw,
  };
}
