import { Server as NetServer } from "http";
import { Server as ServerIO, Socket } from "socket.io";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_progitpaie";

export interface SocketUser {
  id: string;
  email: string;
  role: "admin" | "employee";
  companyId?: string;
}

export interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

let ioServer: ServerIO | null = null;

export const initSocketServer = (httpServer: NetServer): ServerIO => {
  if (ioServer) return ioServer;

  ioServer = new ServerIO(httpServer, {
    path: "/api/socket/io",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Authentification JWT par Middleware Socket.io
  ioServer.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as SocketUser;
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error("Invalid authentication token"));
    }
  });

  ioServer.on("connection", (socket: AuthenticatedSocket) => {
    const user = socket.user;
    if (!user) return;

    console.log(`⚡ [SOCKET.IO] Utilisateur connecté: ${user.email} (${user.role})`);

    // Rejoindre son salon privé utilisateur et salon entreprise
    socket.join(`user:${user.id}`);
    if (user.companyId) {
      socket.join(`company:${user.companyId}`);
    }

    // Événement : Pointage Géolocalisé GPS en temps réel
    socket.on("attendance:checkin", (data) => {
      if (user.companyId) {
        ioServer?.to(`company:${user.companyId}`).emit("attendance:updated", {
          type: "CHECK_IN",
          user: { id: user.id, name: user.email },
          timestamp: new Date().toISOString(),
          location: data.location,
        });
      }
    });

    // Événement : Demande ou validation de congé
    socket.on("leave:request", (data) => {
      if (user.companyId) {
        ioServer?.to(`company:${user.companyId}`).emit("leave:updated", {
          type: "NEW_LEAVE_REQUEST",
          leaveId: data.leaveId,
          employeeName: data.employeeName,
          timestamp: new Date().toISOString(),
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 [SOCKET.IO] Déconnexion: ${user.email}`);
    });
  });

  return ioServer;
};

export const getSocketServer = (): ServerIO | null => ioServer;
