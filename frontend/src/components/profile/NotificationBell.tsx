"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getUnreadCount } from "@/lib/api/notifications";
import { NotificationPanel } from "@/components/profile/NotificationPanel";

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount((res.data as number) ?? 0);
    } catch {
      // silently fail (bell just shows no badge)
    }
  }, []);

  // poll unread count every 30 seconds
  useEffect(() => {
    loadUnreadCount();
    
    const interval = setInterval(loadUnreadCount, 30_000);
    
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  // close panel on outside click
  useEffect(() => {
    if (!panelOpen) {
      return;
    }

    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleOutsideClick);
    
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [panelOpen]);

  // close on Esc
  useEffect(() => {
    if (!panelOpen) {
      return;
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setPanelOpen(false);
    }

    window.addEventListener("keydown", handleKey);
    
    return () => window.removeEventListener("keydown", handleKey);
  }, [panelOpen]);

  function handleToggle() {
    setPanelOpen((v) => !v);
  }

  function handleAllRead() {
    setUnreadCount(0);
  }

  return (
    <div ref={containerRef} className="relative">
      
      {/* Bell button */}
      <button
        onClick={() => setPanelOpen(open => !open)}
        aria-label={`Notifications${
          unreadCount > 0 ? ` (${unreadCount} unread)` : ""
        }`}
        aria-expanded={panelOpen}
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#d7c6a3]/55 bg-[#fbf7ef] text-[#6b6252] transition hover:border-[#d8bd75]/55 hover:bg-white hover:text-[#1c2018]"
      >
        <BellIcon />

        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#d8bd75] text-[9px] font-bold text-[#1c2018]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {panelOpen && (
        <div className="absolute right-0 top-11 z-50 w-80">
          <NotificationPanel
            onClose={() => setPanelOpen(false)}
            onAllRead={handleAllRead}
          />
        </div>
      )}
    </div>
  );
}

// ICON

function BellIcon() {
  return (
    <svg 
      className="h-4 w-4" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      aria-hidden
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}