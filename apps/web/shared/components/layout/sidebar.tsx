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
  Settings,
  LogOut,
  Bell,
} from "lucide-react";

const StudentNav = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/candidatures", label: "Candidatures", icon: CheckSquare },
  { href: "/docs", label: "Documents", icon: FileText },
  { href: "/objectifs", label: "Objectifs", icon: Bell },
];

const AdminNav = [
  { page: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { page: "students",  label: "Étudiants",        icon: Users },
  { page: "promos",    label: "Promotions",        icon: Users },
  { page: "objectifs", label: "Objectifs",         icon: CheckSquare },
  { page: "profil",    label: "Profil",            icon: User },
];

function StudentNavItem({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  const location = useRouterState({ select: (s) => s.location });
  const isActive =
    href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);

  return (
    <Link
      to={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 20px",
        cursor: "pointer",
        transition: "all 0.15s",
        textDecoration: "none",
        borderLeft: isActive ? "3px solid #23b2a4" : "3px solid transparent",
        background: isActive ? "rgba(35,178,164,0.12)" : "transparent",
      }}
      onMouseEnter={(e) => !isActive && (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
      onMouseLeave={(e) => !isActive && (e.currentTarget.style.background = "transparent")}
    >
      <Icon size={16} color={isActive ? "#23b2a4" : "rgba(255,255,255,0.5)"} />
      <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? "#fff" : "rgba(255,255,255,0.6)" }}>
        {label}
      </span>
    </Link>
  );
}

function AdminNavItem({ page, label, icon: Icon, activePage, onClick }: {
  page: string;
  label: string;
  icon: React.ElementType;
  activePage: string;
  onClick: (p: string) => void;
}) {
  // student-detail is a sub-page of students
  const isActive = activePage === page || (page === "students" && activePage === "student-detail");
  return (
    <button
      onClick={() => onClick(page)}
      aria-current={isActive ? "page" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 20px",
        cursor: "pointer",
        transition: "all 0.15s",
        background: isActive ? "rgba(35,178,164,0.12)" : "transparent",
        borderLeft: isActive ? "3px solid #23b2a4" : "3px solid transparent",
        border: "none",
        width: "100%",
        textAlign: "left",
      }}
      onMouseEnter={(e) => !isActive && (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
      onMouseLeave={(e) => !isActive && (e.currentTarget.style.background = "transparent")}
    >
      <Icon size={16} color={isActive ? "#23b2a4" : "rgba(255,255,255,0.5)"} />
      <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? "#fff" : "rgba(255,255,255,0.6)" }}>
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

  // For admin, reactively read active page from URL search params
  const adminPage = new URLSearchParams(location.search).get("p") ?? "dashboard";

  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "U"
    : "U";
  const fullName = user
    ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email || ""
    : "";

  const handleAdminNav = (page: string) => {
    navigate({ to: "/michel", search: { p: page } });
  };

  return (
    <div
      role="navigation"
      aria-label="Menu principal"
      style={{ width: 220, minWidth: 220, height: "100vh", background: "#1d1d1e", display: "flex", flexDirection: "column", flexShrink: 0, position: "fixed", left: 0, top: 0, zIndex: 100 }}
    >
      {/* Logo */}
      <div style={{ padding: "28px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: -0.5, fontFamily: "Montserrat, sans-serif" }}>
          Spek<span style={{ color: "#23b2a4" }}>tr</span>
        </div>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: 2, marginTop: 2, textTransform: "uppercase", fontFamily: "Montserrat, sans-serif" }}>
          YNOV CAMPUS
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", paddingTop: 18, paddingBottom: 8 }}>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: 2, padding: "0 20px 10px", textTransform: "uppercase", fontFamily: "Montserrat, sans-serif" }}>
          NAVIGATION
        </div>

        {isAdmin ? (
          <>
            {AdminNav.map((item) => (
              <AdminNavItem key={item.page} {...item} activePage={adminPage} onClick={handleAdminNav} />
            ))}
          </>
        ) : (
          <>
            {StudentNav.map((item) => (
              <StudentNavItem key={item.href} {...item} />
            ))}
            <div style={{ margin: "14px 20px", height: 1, background: "rgba(255,255,255,0.08)" }} />
            <StudentNavItem href="/profil" label="Mon profil" icon={User} />
            <StudentNavItem href="/profil" label="Paramètres" icon={Settings} />
          </>
        )}
      </nav>

      {/* User footer with dropdown */}
      <div style={{ position: "relative", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        {showUserMenu && (
          <>
            {/* Backdrop */}
            <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setShowUserMenu(false)} />
            {/* Dropdown menu */}
            <div
              role="menu"
              style={{ position: "absolute", bottom: "100%", left: 12, right: 12, marginBottom: 6, background: "#2a2a2b", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", zIndex: 200, boxShadow: "0 -8px 24px rgba(0,0,0,0.3)" }}
            >
              <button
                role="menuitem"
                onClick={() => { setShowUserMenu(false); navigate({ to: "/profil" }); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <User size={14} color="rgba(255,255,255,0.6)" />
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontFamily: "Source Sans 3, sans-serif" }}>Mon profil</span>
              </button>
              <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />
              <button
                role="menuitem"
                onClick={() => { setShowUserMenu(false); handleLogout(); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(220,38,38,0.12)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <LogOut size={14} color="#f87171" />
                <span style={{ fontSize: 13, color: "#f87171", fontFamily: "Source Sans 3, sans-serif" }}>Se déconnecter</span>
              </button>
            </div>
          </>
        )}
        <button
          aria-haspopup="menu"
          aria-expanded={showUserMenu}
          aria-label={`Menu utilisateur — ${fullName}`}
          style={{ width: "100%", padding: "16px 20px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: "transparent", border: "none", textAlign: "left" }}
          onClick={() => setShowUserMenu((v) => !v)}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#23b2a4", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0, fontFamily: "Montserrat, sans-serif" }}>
            {initials}
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "Montserrat, sans-serif" }}>
              {fullName}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
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
