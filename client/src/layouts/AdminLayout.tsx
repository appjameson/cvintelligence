// client/src/layouts/AdminLayout.tsx

import AdminHeader from "@/components/AdminHeader";
import React from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader />
      <main>
        {children}
      </main>
    </div>
  );
}