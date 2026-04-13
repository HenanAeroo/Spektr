"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/utils";
import ProfileSection from "./sections/profile-section";
import SecuritySection from "./sections/security-section";
import DangerSection from "./sections/danger-section";

type Section = "profile" | "security" | "danger";

const nav: { id: Section; label: string }[] = [
  { id: "profile", label: "Profil" },
  { id: "security", label: "Sécurité" },
  { id: "danger", label: "Danger Zone" },
];

export default function ProfilePage() {
  const [active, setActive] = useState<Section>("profile");

  return (
    <div className="flex h-full">
      <aside className="w-56 shrink-0 border-r p-4 flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground px-2 mb-2 uppercase tracking-wider">
          Paramètres
        </p>
        {nav.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
              active === id
                ? "bg-neutral-800 text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-neutral-800/50",
              id === "danger" && active === id && "bg-destructive/20 text-destructive",
              id === "danger" && active !== id && "text-destructive/70 hover:text-destructive hover:bg-destructive/10",
            )}
          >
            {label}
          </button>
        ))}
      </aside>

      <main className="flex-1 overflow-auto p-8 max-w-2xl">
        {active === "profile" && <ProfileSection />}
        {active === "security" && <SecuritySection />}
        {active === "danger" && <DangerSection />}
      </main>
    </div>
  );
}
