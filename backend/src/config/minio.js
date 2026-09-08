const Minio = require("minio");

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: 443,
  useSSL: true,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

module.exports = minioClient;
