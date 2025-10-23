import express from 'express';
import "dotenv/config";
import cors from 'cors';
import http from 'http';
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import { Server } from 'socket.io';

// Creating express app using http server
const app = express();
const server = http.createServer(app);

// Initialized socket.io server
export const io = new Server(server, {
    cors : {origin: "*"}
})

// Store online users
export const userSocketMap = {}; // {userId : socketId}

// Socket.io connection handler
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("User Connected", userId);

    if(userId) userSocketMap[userId] = socket.id;

    // Emit online users to all available clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    
    socket.on("disconnect", ()=>{
        console.log("User disconnected", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    })
})


// Middleware Setup
app.use(express.json({ limit: '5mb' }));
app.use(cors());


// Routes setup
app.use("/api/status", (req,res) => {
    res.send("Server is Live!");
})
app.use("/api/auth", userRouter)
app.use("/api/messages", messageRouter)



// Connect to DB
await connectDB();

// Starting the server
const Port = process.env.port || 5000;
server.listen(Port, () => {
    console.log("Server is running on Port : "+ Port);
})