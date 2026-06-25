import React from "react";
import SidebarNav from "./SidebarNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111111] border-r border-[#222222] flex flex-col fixed h-full z-30">
        {/* Logo / Brand */}
        <div className="p-6 border-b border-[#222222] flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#f5b731] flex items-center justify-center text-black font-black text-sm">
            UG
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-wider text-white">QR GYM</h1>
            <p className="text-[10px] text-gray-500 font-bold leading-none mt-0.5">RECEPTIONIST</p>
          </div>
        </div>

        <SidebarNav />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 border-b border-[#222222] bg-[#0d0d0d] px-8 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md bg-opacity-80">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-gray-400 font-semibold tracking-wider">UNSRI Fitness Center Hub</span>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-bold text-gray-400 bg-[#161616] border border-[#222222] px-4 py-1.5 rounded-xl">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-8 bg-[#0a0a0a]">{children}</main>
      </div>
    </div>
  );
}

