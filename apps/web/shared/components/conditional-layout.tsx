"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./layout/sidebar";

const ConditionalLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const publicRoutes = ["/login", "/register", "/oauth/callback"];

  const isPublic = publicRoutes.includes(pathname);

  if (isPublic) {
    return <>{children}</>;
  } else {
    return (
      <div className="flex flex-col md:flex-row h-screen">
        <Sidebar />
        <div className="flex flex-col flex-1">
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    );
  }
};

export default ConditionalLayout;
