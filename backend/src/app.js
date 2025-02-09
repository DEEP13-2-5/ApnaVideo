import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";
import userRoute from "./routes/users.routes.js";
import connectToSocket from "./controllers/socketManager.js"; // Ensure the filename matches exactly

const app = express();
const server = createServer(app);
const io = connectToSocket(server); // This should be correctly exported from socketManager.js

app.set("port", process.env.PORT || 8000);

app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));
app.use("/api/v1/users", userRoute);

const start = async () => {
    try {
        // Remove app.set("mongo_user") — it does nothing
        const connectionDb = await mongoose.connect(
            "mongodb+srv://harshabodani461:T4GMSXIZV1N4ckqL@videocluster.b34yc.mongodb.net/?retryWrites=true&w=majority&appName=VideoCluster"
        );
        console.log(`MongoDB connected: ${connectionDb.connection.host}`);

        server.listen(app.get("port"), () => {
            console.log(`LISTENING ON PORT ${app.get("port")}`);
        });
    } catch (error) {
        console.error("Database connection failed", error);
        process.exit(1);
    }
};

start();
