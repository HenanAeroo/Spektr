import { useEffect, useRef, useState } from "react";
import { getNotifications } from "../actions/getNotifications";
import { markAsRead } from "../actions/markAsRead";
import { NOTIF_LABELS, type Notification } from "../types";
import { Bell } from "lucide-react";
import { socket } from "@/shared/lib/socket";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getToken } from "@/shared/lib/auth";
import { markAllRead } from "../actions/markAllRead";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function NotificationBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: !!getToken(),
    staleTime: 30 * 1000,
  });

  const { mutate: markRead } = useMutation({
    mutationFn: markAsRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const { mutate: triggerMarkAllRead } = useMutation({
    mutationFn: markAllRead,
    onSuccess: () =>
      queryClient.setQueryData<Notification[]>(["notifications"], (old) => {
        if (old === undefined) {
          return [];
        } else {
          return old.map((notification) => {
            return { ...notification, read: true };
          });
        }
      }),
  });

  useEffect(() => {
    if (!socket.connected) {
      socket.auth = { token: getToken() };
      socket.connect();
    }

    const handleNotification = (notif: Notification) => {
      queryClient.setQueryData<Notification[]>(
        ["notifications"],
        (prev = []) => [notif, ...prev],
      );
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [queryClient]);

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
    triggerMarkAllRead();
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        title="Notifications"
        className={[
          "relative border-none rounded-lg cursor-pointer p-2 flex items-center justify-center transition-colors",
          open ? "bg-spektr-teal/15" : "bg-transparent hover:bg-white/[0.08]",
        ].join(" ")}
      >
        <Bell size={18} color={open ? "#23b2a4" : "rgba(255,255,255,0.6)"} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center font-montserrat border-2 border-spektr-dark">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-[228px] bottom-[60px] w-80 bg-white rounded-xl border border-spektr-border shadow-[0_8px_32px_rgba(0,0,0,0.16)] z-[500] overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-[#f0f0f0] flex items-center justify-between">
            <span className="font-montserrat font-bold text-[13px] text-spektr-dark">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-px rounded-full">
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="bg-transparent border-none cursor-pointer font-source-sans text-xs text-spektr-teal-accessible font-semibold"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 px-5 text-center">
                <div className="text-[28px] mb-2">🔔</div>
                <p className="font-montserrat font-semibold text-[13px] text-gray-500">
                  Aucune notification
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={[
                    "flex items-start gap-3 px-4 py-3 border-b border-[#f8f8f8] transition-colors",
                    n.read
                      ? "bg-transparent cursor-default"
                      : "bg-spektr-teal/[0.04] cursor-pointer hover:bg-spektr-teal/[0.08]",
                  ].join(" ")}
                  onClick={n.read ? undefined : (e) => handleMarkRead(n.id, e)}
                >
                  <div
                    className={[
                      "w-8 h-8 rounded-lg flex items-center justify-center text-[14px] flex-shrink-0",
                      n.read ? "bg-spektr-bg" : "bg-spektr-teal/12",
                    ].join(" ")}
                  >
                    {n.type === "OBJECTIVE_CREATED"
                      ? "🎯"
                      : n.type === "DOCUMENT_ADDED"
                        ? "📄"
                        : n.type === "DOCUMENT_REVIEW"
                          ? n.payload?.status === "VALIDATED"
                            ? "✅"
                            : "⚠️"
                          : "📋"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={[
                        "font-source-sans text-[13px] leading-snug",
                        n.read
                          ? "text-gray-500 font-normal"
                          : "text-spektr-dark font-semibold",
                      ].join(" ")}
                    >
                      {n.type === "DOCUMENT_REVIEW"
                        ? n.payload?.status === "VALIDATED"
                          ? `${n.payload?.docType === "CV" ? "CV" : n.payload?.docType === "LM" ? "Lettre de motivation" : "Document"} validé ✅`
                          : `${n.payload?.docType === "CV" ? "CV" : n.payload?.docType === "LM" ? "Lettre de motivation" : "Document"} à corriger ⚠️`
                        : NOTIF_LABELS[n.type] ?? n.type}
                      {n.type === "OBJECTIVE_CREATED" &&
                        typeof n.payload?.title === "string" && (
                          <span className="text-spektr-teal-accessible font-bold">
                            {" "}
                            : {n.payload.title}
                          </span>
                        )}
                    </div>
                    <div className="font-source-sans text-[11px] text-gray-500 mt-0.5">
                      {timeAgo(n.created_at)}
                    </div>
                  </div>
                  {!n.read && (
                    <div className="w-[7px] h-[7px] rounded-full bg-spektr-teal flex-shrink-0 mt-1" />
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
