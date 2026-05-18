import { cn } from "@/shared/lib/utils";
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  User,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { getUser } from "@/shared/lib/auth";
import { ModeToggle } from "../theme-toggle";
import NotificationBell from "@/features/notifications/components/NotificationBell";
import { Link } from "@tanstack/react-router";

const Sidebar = () => {
  const [collapse, setCollapse] = useState(true);

  const { handleLogout } = useAuth();

  const navLinks = [{ href: "/", label: "Dashboard", icon: LayoutDashboard }];

  const user = getUser();

  return (
    <div
      className={cn(
        "flex flex-col justify-between h-screen transition-all duration-300 bg-sidebar shrink-0",
        collapse ? "w-16" : "w-60",
      )}
      role="complementary"
      aria-label="Sidebar"
    >
      <nav className="flex flex-col gap-2 p-2">
        <button
          aria-expanded={!collapse}
          aria-label="Toggle Button"
          onClick={() => setCollapse(!collapse)}
          className="flex items-center gap-3 p-2 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 w-full"
        >
          {!collapse && <PanelLeftClose />}
          {collapse && <PanelLeftOpen />}
        </button>
        {!collapse && (
          <h2 className="whitespace-nowrap overflow-hidden px-2 text-m">
            Bonjour !
          </h2>
        )}
        {navLinks.map((link) => (
          <TooltipProvider key={link.href}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to={link.href}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-md w-full",
                    location.pathname === link.href
                      ? "text-white bg-neutral-800"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800",
                  )}
                >
                  <link.icon />
                  {!collapse && <span>{link.label}</span>}
                </Link>
              </TooltipTrigger>
              {collapse && (
                <TooltipContent side="right">{link.label}</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        ))}
      </nav>
      <footer className="flex flex-col gap-2 p-2">
        {user ? (
          <>
            <NotificationBell />
            <Link
              to="/profil"
              aria-label="Profil"
              className="flex items-center gap-3 p-2 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 w-full"
            >
              <User />
              {!collapse && <p>Profil</p>}
            </Link>
            <button
              aria-label="Déconnexion"
              onClick={() => handleLogout()}
              className="flex items-center gap-3 p-2 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 w-full"
            >
              <LogOut />
              {!collapse && <p>Déconnexion</p>}
            </button>
          </>
        ) : (
          <Link
            aria-label="Connexion"
            to="/login"
            className="flex items-center gap-3 p-2 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 w-full"
          >
            <LogIn />
            {!collapse && <p>Se connecter</p>}
          </Link>
        )}
        <ModeToggle collapse={collapse} />
      </footer>
    </div>
  );
};

export default Sidebar;
