import express from "express";
import {createServer} from "node:http";
import {Server} from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import userRoute from "./routes/users.routes.js"
import connectToSocket from "./controllers/socketManager.js";
const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port",(process.env.PORT||8000 ));

app.use(cors());
app.use(express.json({limit:"40kb"}));
app.use(express.urlencoded({limit:"40kb",extended:true}));
app.use("/api/v1/users",userRoute)

const start = async() =>{
    app.set("mongo_user")
    const connectionDb=await mongoose.connect("mongodb+srv://harshabodani461:T4GMSXIZV1N4ckqL@videocluster.b34yc.mongodb.net/?retryWrites=true&w=majority&appName=VideoCluster");
    console.log(`Mongodb connected host:${connectionDb.connection.host}`)
    server.listen(app.get("port"),() =>{
        console.log("LISTENING ON THE PORT 8000")
    });

}
start();