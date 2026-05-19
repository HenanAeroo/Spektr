import { useEffect, useRef, useState } from "react";
import { getNotifications } from "../actions/getNotifications";
import { markAsRead } from "../actions/markAsRead";
import { NOTIF_LABELS, type Notification } from "../types";
import { Bell } from "lucide-react";
import { socket } from "@/shared/lib/socket";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getToken } from "@/shared/lib/auth";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function NotificationBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: !!getToken(),
  });

  const { mutate: markRead } = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  // Connect socket and listen for real-time notifications
  useEffect(() => {
    if (!socket.connected) {
      socket.auth = { token: getToken() };
      socket.connect();
    }

    socket.on("notification", (notif: Notification) => {
      queryClient.setQueryData<Notification[]>(["notifications"], (prev = []) => [notif, ...prev]);
    });

    return () => { socket.off("notification"); };
  }, [queryClient]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleOpen() {
    setOpen((v) => !v);
  }

  function handleMarkRead(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    markRead(id);
  }

  function handleMarkAllRead() {
    notifications.filter((n) => !n.read).forEach((n) => markRead(n.id));
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={handleOpen}
        title="Notifications"
        style={{
          position: "relative",
          background: open ? "rgba(35,178,164,0.15)" : "transparent",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          padding: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => !open && (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
        onMouseLeave={(e) => !open && (e.currentTarget.style.background = "transparent")}
      >
        <Bell size={18} color={open ? "#23b2a4" : "rgba(255,255,255,0.6)"} />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#ef4444",
            color: "#fff",
            fontSize: 9,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Montserrat, sans-serif",
            border: "2px solid #1d1d1e",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "fixed",
          left: 228,
          top: "auto",
          bottom: 60,
          width: 320,
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e8e8e8",
          boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
          zIndex: 500,
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13, color: "#1d1d1e" }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{ marginLeft: 8, background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 999 }}>
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "Source Sans 3, sans-serif", fontSize: 12, color: "#23b2a4", fontWeight: 600 }}
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                <p style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 13, color: "#6b7280" }}>
                  Aucune notification
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "12px 16px",
                    borderBottom: "1px solid #f8f8f8",
                    background: n.read ? "transparent" : "rgba(35,178,164,0.04)",
                    cursor: n.read ? "default" : "pointer",
                    transition: "background 0.15s",
                  }}
                  onClick={n.read ? undefined : (e) => handleMarkRead(n.id, e)}
                  onMouseEnter={(e) => !n.read && (e.currentTarget.style.background = "rgba(35,178,164,0.08)")}
                  onMouseLeave={(e) => !n.read && (e.currentTarget.style.background = "rgba(35,178,164,0.04)")}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: n.read ? "#f5f5f5" : "rgba(35,178,164,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    flexShrink: 0,
                  }}>
                    {n.type === "OBJECTIVE_CREATED" ? "🎯" : n.type === "DOCUMENT_ADDED" ? "📄" : "📋"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: n.read ? "#6b7280" : "#1d1d1e", fontWeight: n.read ? 400 : 600, lineHeight: 1.4 }}>
                      {NOTIF_LABELS[n.type] ?? n.type}
                      {n.type === "OBJECTIVE_CREATED" && typeof n.payload?.title === "string" && (
                        <span style={{ color: "#23b2a4", fontWeight: 700 }}> : {n.payload.title}</span>
                      )}
                    </div>
                    <div style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                      {timeAgo(n.created_at)}
                    </div>
                  </div>
                  {!n.read && (
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#23b2a4", flexShrink: 0, marginTop: 4 }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
