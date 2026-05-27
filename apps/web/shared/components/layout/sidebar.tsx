import { useAuth } from "@/features/auth/hooks/use-auth";
import { useAuthContext } from "@/shared/components/auth-provider";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  FileText,
  User,
  LogOut,
} from "lucide-react";
import NotificationBell from "@/features/notifications/components/NotificationBell";

const StudentNav = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/candidatures", label: "Candidatures", icon: CheckSquare },
  { href: "/docs", label: "Documents", icon: FileText },
  { href: "/objectifs", label: "Objectifs", icon: CheckSquare },
];

const AdminNav = [
  { page: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { page: "students", label: "Étudiants", icon: Users },
  { page: "promos", label: "Promotions", icon: Users },
  { page: "objectifs", label: "Objectifs", icon: CheckSquare },
];

function StudentNavItem({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
}) {
  const location = useRouterState({ select: (s) => s.location });
  const isActive =
    href === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(href);

  return (
    <Link
      to={href}
      className={[
        "flex items-center gap-2.5 px-5 py-2.5 transition-all no-underline border-l-[3px]",
        isActive
          ? "border-l-spektr-teal bg-spektr-teal/12"
          : "border-l-transparent hover:bg-white/[0.04]",
      ].join(" ")}
    >
      <Icon size={16} color={isActive ? "#23b2a4" : "rgba(255,255,255,0.5)"} />
      <span
        className={[
          "text-[13px]",
          isActive ? "font-semibold text-white" : "font-normal text-white/60",
        ].join(" ")}
      >
        {label}
      </span>
    </Link>
  );
}

function AdminNavItem({
  page,
  label,
  icon: Icon,
  activePage,
  onClick,
}: {
  page: string;
  label: string;
  icon: React.ElementType;
  activePage: string;
  onClick: (p: string) => void;
}) {
  const isActive =
    activePage === page ||
    (page === "students" && activePage === "student-detail");
  return (
    <button
      onClick={() => onClick(page)}
      aria-current={isActive ? "page" : undefined}
      className={[
        "flex items-center gap-2.5 px-5 py-2.5 transition-all border-l-[3px] border-none w-full text-left cursor-pointer",
        isActive
          ? "border-l-spektr-teal bg-spektr-teal/12"
          : "border-l-transparent hover:bg-white/[0.04]",
      ].join(" ")}
    >
      <Icon size={16} color={isActive ? "#23b2a4" : "rgba(255,255,255,0.5)"} />
      <span
        className={[
          "text-[13px]",
          isActive ? "font-semibold text-white" : "font-normal text-white/60",
        ].join(" ")}
      >
        {label}
      </span>
    </button>
  );
}

const Sidebar = () => {
  const { handleLogout } = useAuth();
  const { user } = useAuthContext();
  const isAdmin = user?.role === "ADMIN";
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });
  const [showUserMenu, setShowUserMenu] = useState(false);

  const adminPage =
    new URLSearchParams(location.search).get("p") ?? "dashboard";

  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() ||
      "U"
    : "U";
  const fullName = user
    ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() ||
      user.email ||
      ""
    : "";

  const handleAdminNav = (page: string) => {
    navigate({ to: "/michel", search: { p: page } });
  };

  return (
    <div
      role="navigation"
      aria-label="Menu principal"
      className="w-[220px] min-w-[220px] h-screen bg-spektr-dark flex flex-col flex-shrink-0 fixed left-0 top-0 z-[100]"
    >
      {/* Logo */}
      <div className="px-5 pt-7 pb-5 border-b border-white/[0.07]">
        <div className="font-montserrat text-2xl font-extrabold text-white tracking-tight">
          Spek<span className="text-spektr-teal">tr</span>
        </div>
        <div className="font-montserrat text-[9px] text-white/35 font-semibold tracking-[2px] uppercase mt-0.5">
          YNOV CAMPUS
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto pt-[18px] pb-2">
        <div className="font-montserrat text-[9px] text-white/30 font-bold tracking-[2px] uppercase px-5 pb-2.5">
          NAVIGATION
        </div>

        {isAdmin ? (
          <>
            {AdminNav.map((item) => (
              <AdminNavItem
                key={item.page}
                {...item}
                activePage={adminPage}
                onClick={handleAdminNav}
              />
            ))}
          </>
        ) : (
          <>
            {StudentNav.map((item) => (
              <StudentNavItem key={item.href} {...item} />
            ))}
          </>
        )}
      </nav>

      {/* Notification bell (students only) */}
      {!isAdmin && (
        <div className="px-3 py-2 border-t border-white/[0.07] flex items-center justify-between">
          <span className="font-montserrat text-[10px] text-white/30 font-bold tracking-[2px] uppercase">
            NOTIFS
          </span>
          <NotificationBell />
        </div>
      )}

      {/* User footer with dropdown */}
      <div className="relative border-t border-white/[0.07]">
        {showUserMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[99]"
              onClick={() => setShowUserMenu(false)}
            />
            {/* Dropdown menu */}
            <div
              role="menu"
              className="absolute bottom-full left-3 right-3 mb-1.5 bg-[#2a2a2b] rounded-[10px] border border-white/10 overflow-hidden z-[200] shadow-[0_-8px_24px_rgba(0,0,0,0.3)]"
            >
              <button
                role="menuitem"
                onClick={() => {
                  setShowUserMenu(false);
                  navigate({ to: "/profil" });
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-[11px] bg-transparent border-none cursor-pointer text-left hover:bg-white/[0.06]"
              >
                <User size={14} color="rgba(255,255,255,0.6)" />
                <span className="text-[13px] text-white/85 font-source-sans">
                  Mon profil
                </span>
              </button>
              <div className="h-px bg-white/[0.07]" />
              <button
                role="menuitem"
                onClick={() => {
                  setShowUserMenu(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-[11px] bg-transparent border-none cursor-pointer text-left hover:bg-red-600/[0.12]"
              >
                <LogOut size={14} color="#f87171" />
                <span className="text-[13px] text-red-400 font-source-sans">
                  Se déconnecter
                </span>
              </button>
            </div>
          </>
        )}
        <button
          aria-haspopup="menu"
          aria-expanded={showUserMenu}
          aria-label={`Menu utilisateur — ${fullName}`}
          className="w-full px-5 py-4 flex items-center gap-2.5 cursor-pointer bg-transparent border-none text-left hover:bg-white/[0.04]"
          onClick={() => setShowUserMenu((v) => !v)}
        >
          <div className="w-9 h-9 rounded-full bg-spektr-teal flex items-center justify-center text-white text-xs font-bold flex-shrink-0 font-montserrat">
            {initials}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-xs font-bold text-white truncate font-montserrat">
              {fullName}
            </div>
            <div className="text-[10px] text-white/40">
              {isAdmin ? "Chargé RE" : "Étudiant"}
            </div>
          </div>
          <LogOut size={14} color="rgba(255,255,255,0.3)" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
