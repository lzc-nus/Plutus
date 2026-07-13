"use client";

import { useEffect, useRef } from "react";

interface CalendarDragScopeDialogProps {
    /** Position in pixels, relative to the nearest positioned ancestor. */
    top: number;
    left: number;
    onChoose: (scope: "THIS_INSTANCE" | "ALL_SESSIONS") => void;
    onCancel: () => void;
}

export function CalendarDragScopeDialog({ top, left, onChoose, onCancel }: CalendarDragScopeDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handlePointerDown(event: PointerEvent) {
            if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
                onCancel();
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onCancel();
            }
        }

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [onCancel]);

    return (
        <div
            ref={dialogRef}
            className="absolute z-30 w-52 rounded-md border border-[#d9d0c1] bg-[#fbf7ef] p-3 shadow-[0_18px_70px_rgba(43,34,24,0.18)]"
            style={{ top, left }}
        >
            <p className="mb-2 text-xs font-semibold text-[#353026]">Apply time change to:</p>
            <div className="grid gap-1.5">
                <button
                    className="h-8 rounded-md bg-[#1d211c] px-2 text-xs font-bold text-[#fbf7ef] transition hover:bg-[#343b32]"
                    onClick={() => onChoose("THIS_INSTANCE")}
                    type="button"
                >
                    This event
                </button>
                <button
                    className="h-8 rounded-md border border-[#d0c5b3] bg-[#fffaf2] px-2 text-xs font-bold text-[#1d211c] transition hover:border-[#1d211c]"
                    onClick={() => onChoose("ALL_SESSIONS")}
                    type="button"
                >
                    All events
                </button>
                <button
                    className="h-7 text-[11px] font-semibold text-[#696154] transition hover:text-[#1d211c]"
                    onClick={onCancel}
                    type="button"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}