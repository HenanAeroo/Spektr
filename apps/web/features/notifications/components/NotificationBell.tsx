import { useEffect, useState } from "react";
import { getNotifications } from "../actions/getNotifications";
import { markAsRead } from "../actions/markAsRead";
import type { Notification } from "../types";
import { Bell } from "lucide-react";
import { socket } from "@/shared/lib/socket";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function NotificationBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });

  const { mutate: markAsReadMutation } = useMutation({
    mutationFn: (id: number) => markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  useEffect(() => {
    socket.on("notification", (notif: Notification) => {
      queryClient.setQueryData<Notification[]>(
        ["notifications"],
        (prev = []) => [notif, ...prev],
      );
      toast(notif.type);
    });

    return () => {
      socket.off("notification");
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleMarkAsRead(id: number) {
    markAsReadMutation(id);
  }

  return (
    <div>
      <button onClick={() => setOpen(!open)}>
        <Bell />
        {unreadCount > 0 ? <span>{unreadCount}</span> : <></>}
      </button>

      {open && (
        <div>
          {notifications.map((n) => (
            <div key={n.id} onClick={() => handleMarkAsRead(n.id)}>
              {n.type} - {n.created_at}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
