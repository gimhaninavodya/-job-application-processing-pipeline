import multer from "multer";

// Multer storage setup to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

export default upload;
