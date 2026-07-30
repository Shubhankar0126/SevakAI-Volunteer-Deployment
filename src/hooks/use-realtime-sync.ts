import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { AUTH_QUERY_KEY, useAuth } from "./use-auth";
import { OPERATIONS_QUERY_KEY } from "./use-operations";
import { getSocketBaseUrl } from "@/lib/api/client";

export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const { user, role, profile } = useAuth();

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const socket = io(getSocketBaseUrl(), {
      withCredentials: true,
      transports: ["websocket"],
    });

    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: OPERATIONS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    };

    socket.on("connect", () => {
      socket.emit("presence:join", {
        userId: user.id,
        role,
        zoneId: profile?.zoneId ?? undefined,
      });
    });
    socket.on("operations:updated", invalidate);
    socket.on("notifications:updated", invalidate);
    socket.on("messages:updated", invalidate);

    return () => {
      socket.off("operations:updated", invalidate);
      socket.off("notifications:updated", invalidate);
      socket.off("messages:updated", invalidate);
      socket.disconnect();
    };
  }, [profile?.zoneId, queryClient, role, user]);
}
