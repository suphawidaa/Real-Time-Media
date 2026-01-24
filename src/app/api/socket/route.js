import { Server } from "socket.io";

export async function GET() {
  if (!global.io) {
    console.log("🟢 Initializing Socket.io server");

    global.io = new Server({
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: "*",
      },
    });

    global.io.on("connection", (socket) => {
      console.log("🔌 Client connected:", socket.id);

      socket.on("join-group", (groupId) => {
        socket.join(groupId);
        console.log(`📦 Socket ${socket.id} joined group ${groupId}`);
      });

      socket.on("disconnect", () => {
        console.log("❌ Client disconnected:", socket.id);
      });
    });
  }

  return new Response("Socket ready", { status: 200 });
}
