import multer from "multer";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 600 * 1024 * 1024, // 600MB max
    files: 10,
  },
});
