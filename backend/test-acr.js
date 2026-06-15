import { recognizeHummingWithAcrCloud } from './src/services/acrCloudHumming.js';
process.env.ACRCLOUD_HOST='identify-ap-southeast-1.acrcloud.com';
process.env.ACRCLOUD_ACCESS_KEY='90a59038a02975e134c6a2430cae4859';
process.env.ACRCLOUD_ACCESS_SECRET='76ZQAdsoUGJf3cV2TbC5cnGUixPArJHvVIojfHIX';
recognizeHummingWithAcrCloud({buffer: Buffer.alloc(100), filename:'test.webm', mimetype:'audio/webm'})
  .then(console.log)
  .catch(console.error);