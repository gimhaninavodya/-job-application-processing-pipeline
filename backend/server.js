import express from "express";
import dotenv from "dotenv";
import fileRoutes from "./routes/fileRoutes.js";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());
app.use("/api", fileRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
