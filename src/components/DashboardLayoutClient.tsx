"use client";

import React, { useState } from "react";
import Navbar from "./Navbar";
import MobileNav from "./MobileNav";
import RecordModal from "./RecordModal";
import { UserSession } from "@/types";
import { useRouter } from "next/navigation";

interface DashboardLayoutClientProps {
  user: UserSession;
  children: React.ReactNode;
}

export default function DashboardLayoutClient({
  user,
  children,
}: DashboardLayoutClientProps) {
  const router = useRouter();
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const handleRecordCreated = () => {
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        user={user}
        onOpenNewRecord={() => setIsRecordModalOpen(true)}
      />

      <main className="flex-1 pb-24 md:pb-12 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6">
        {children}
      </main>

      <MobileNav
        user={user}
        onOpenNewRecord={() => setIsRecordModalOpen(true)}
      />

      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSuccess={handleRecordCreated}
      />
    </div>
  );
}
