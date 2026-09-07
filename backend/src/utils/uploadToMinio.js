const minioClient = require("../config/minio");

module.exports = async function uploadToMinio(buffer, fileName) {
  await minioClient.putObject(
    process.env.MINIO_BUCKET,
    fileName,
    buffer
  );
};
