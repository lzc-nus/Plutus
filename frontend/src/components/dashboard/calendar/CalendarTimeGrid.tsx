"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getCalendarEventColor } from "@/data/calendarEventColors";
import { getApiErrorMessage } from "@/lib/api/auth";
import { updateCalendarEvent } from "@/lib/api/calendar";
import {
    addDays,
    minutesSinceMidnight,
    minutesToTimeInputValue,
    snapMinutes,
    startOfDay,
    startOfWeek,
    toDateKey,
    toLocalOffsetIso,
} from "@/lib/utils/calendarDateUtils";
import type { CalendarEventRead, CalendarEventUpdate } from "@/lib/api/generated";

const HOUR_HEIGHT = 48; // px per hour
const MINUTES_IN_DAY = 24 * 60;
const DEFAULT_SCROLL_HOUR = 7;

interface CalendarTimeGridProps {
    currentDate: Date;
    view: "day" | "week";
    events: CalendarEventRead[];
    onSelectEvent: (event: CalendarEventRead, activeDateStr: string) => void;
    onSelectSlot: (dateKey: string, time: string) => void;
    onCreateRange: (dateKey: string, startTime: string, endTime: string) => void;
    onEventChanged: (updatedEvent: CalendarEventRead, originalStartAt: string) => void;
    /** Pending unsaved new-event slot (from a click or drag-create) — rendered as a
     * persistent placeholder in the grid while the create form is open. */
    draftDateKey?: string | null;
    draftStartTime?: string | null;
    draftEndTime?: string | null;
}

const DRAG_THRESHOLD_PX = 6;

interface CreationDraft {
    dateKey: string;
    clickHour: number;
    startMinutes: number;
    currentMinutes: number;
    pointerStartClientY: number;
    hasDragged: boolean;
}

interface LaidOutEvent {
    event: CalendarEventRead;
    startMinutes: number;
    endMinutes: number;
    colIndex: number;
    colCount: number;
    isDraggable: boolean;
}

interface ActiveDrag {
    event: CalendarEventRead;
    dateKey: string; // origin day — the DOM node stays parented here for the whole gesture
    mode: "move" | "resize";
    durationMinutes: number;
    originalStartMinutes: number;
    originalEndMinutes: number;
    pointerStartClientY: number;
    pointerStartClientX: number;
    latestStartMinutes: number;
    latestEndMinutes: number;
    // Cross-day move only (resize always keeps latestDateKey === dateKey):
    columnDateKeys: string[];
    originColumnIndex: number;
    latestColumnIndex: number;
    latestDateKey: string;
    baseLeftPercent: number;
    columnWidthPx: number;
}

/** The single source of truth for where a dragged/resized event renders,
 * from the moment the gesture starts until fresh server data confirms it.
 * Never touched per-pixel during the live drag (that's done imperatively
 * via the DOM ref) — only set at gesture-start and gesture-end, so it can
 * never be reverted by an unrelated re-render mid-drag or mid-save. */
interface PreviewOverride {
    eventId: string;
    dateKey: string;
    startMinutes: number;
    endMinutes: number;
}

export function CalendarTimeGrid({
    currentDate,
    view,
    events,
    onSelectEvent,
    onSelectSlot,
    onCreateRange,
    onEventChanged,
    draftDateKey = null,
    draftStartTime = null,
    draftEndTime = null,
}: CalendarTimeGridProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const gridBodyRef = useRef<HTMLDivElement>(null);
    const dayColumnRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const eventElementRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const activeDragRef = useRef<ActiveDrag | null>(null);
    const suppressClickRef = useRef(false);
    const [previewOverride, setPreviewOverride] = useState<PreviewOverride | null>(null);
    const [creationDraft, setCreationDraft] = useState<CreationDraft | null>(null);
    const creationDraftRef = useRef<CreationDraft | null>(null);
    const [isSavingDrag, setIsSavingDrag] = useState(false);
    const [actionError, setActionError] = useState("");

    const days = useMemo(() => {
        if (view === "day") return [startOfDay(currentDate)];
        const start = startOfWeek(currentDate);
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }, [currentDate, view]);

    // Scroll to a sensible default hour on mount / view change.
    useEffect(() => {
        scrollContainerRef.current?.scrollTo({ top: DEFAULT_SCROLL_HOUR * HOUR_HEIGHT, behavior: "auto" });
    }, [view, currentDate]);

    // Mounted once for the component's lifetime — never re-attached, so there is
    // no closure-staleness or effect-timing class of bug to chase. Reads/writes
    // only the plain activeDragRef and the DOM directly; no React state during move.
    useEffect(() => {
        function handlePointerMove(e: PointerEvent) {
            const active = activeDragRef.current;
            if (!active) return;

            const deltaY = e.clientY - active.pointerStartClientY;
            const deltaMinutes = snapMinutes((deltaY / HOUR_HEIGHT) * 60);
            let newStart = active.originalStartMinutes;
            let newEnd = active.originalEndMinutes;

            if (active.mode === "move") {
                newStart = Math.max(0, Math.min(MINUTES_IN_DAY - active.durationMinutes, active.originalStartMinutes + deltaMinutes));
                newEnd = newStart + active.durationMinutes;
            } else {
                newEnd = Math.max(active.originalStartMinutes + 15, Math.min(MINUTES_IN_DAY, active.originalEndMinutes + deltaMinutes));
            }

            active.latestStartMinutes = newStart;
            active.latestEndMinutes = newEnd;

            let deltaX = 0;
            if (active.mode === "move" && active.columnDateKeys.length > 1 && active.columnWidthPx > 0) {
                deltaX = e.clientX - active.pointerStartClientX;
                const snappedOffsetColumns = Math.round(deltaX / active.columnWidthPx);
                const targetIndex = Math.max(
                    0,
                    Math.min(active.columnDateKeys.length - 1, active.originColumnIndex + snappedOffsetColumns),
                );
                active.latestColumnIndex = targetIndex;
                active.latestDateKey = active.columnDateKeys[targetIndex];
            }

            const el = eventElementRefs.current[eventElementKey(active.event.id, active.dateKey)];
            if (el) {
                el.style.top = `${(newStart / 60) * HOUR_HEIGHT}px`;
                el.style.height = `${Math.max(18, ((newEnd - newStart) / 60) * HOUR_HEIGHT)}px`;

                if (active.mode === "move") {
                    el.style.left = `calc(${active.baseLeftPercent}% + ${deltaX}px)`;
                }
            }
        }

        function handlePointerUp(e: PointerEvent) {
            const active = activeDragRef.current;
            activeDragRef.current = null;
            if (!active) return;

            const moved =
                active.latestStartMinutes !== active.originalStartMinutes ||
                active.latestEndMinutes !== active.originalEndMinutes ||
                active.latestDateKey !== active.dateKey;
            if (moved) suppressClickRef.current = true;

            finalizeDrag(active);
        }

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
    }, []);

    useEffect(() => {
        if (!creationDraft) return;

        function handlePointerMove(e: PointerEvent) {
            const prev = creationDraftRef.current;
            if (!prev) return;

            const columnRect = dayColumnRefs.current[prev.dateKey]?.getBoundingClientRect();
            if (!columnRect) return;

            const rawMinutes = ((e.clientY - columnRect.top) / HOUR_HEIGHT) * 60;
            const currentMinutes = Math.max(0, Math.min(MINUTES_IN_DAY, snapMinutes(rawMinutes)));
            const hasDragged = prev.hasDragged || Math.abs(e.clientY - prev.pointerStartClientY) > DRAG_THRESHOLD_PX;

            const next = { ...prev, currentMinutes, hasDragged };
            creationDraftRef.current = next;
            setCreationDraft(next);
        }

        function handlePointerUp() {
            const finalDraft = creationDraftRef.current;
            creationDraftRef.current = null;
            setCreationDraft(null);
            if (finalDraft) finalizeCreationDraft(finalDraft);
        }

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [creationDraft !== null]);

    function finalizeCreationDraft(draft: CreationDraft) {
        if (!draft.hasDragged) {
            onSelectSlot(draft.dateKey, `${String(draft.clickHour).padStart(2, "0")}:00`);
            return;
        }

        const rangeStart = Math.min(draft.startMinutes, draft.currentMinutes);
        const rangeEnd = Math.max(draft.startMinutes, draft.currentMinutes, rangeStart + 15);
        onCreateRange(draft.dateKey, minutesToTimeInputValue(rangeStart), minutesToTimeInputValue(rangeEnd));
    }

    function finalizeDrag(active: ActiveDrag) {
        const { latestStartMinutes, latestEndMinutes, latestDateKey } = active;

        if (latestStartMinutes === active.originalStartMinutes && latestEndMinutes === active.originalEndMinutes && latestDateKey === active.dateKey) {
            setPreviewOverride(null); // No actual change — nothing to save.
            return;
        }

        // Commit the final position to state immediately and synchronously, before
        // any async work starts. From this point every render (including ones
        // triggered by isSavingDrag/actionError) reads this fixed value instead
        // of stale pre-drag data, so the block cannot revert.
        setPreviewOverride({
            eventId: active.event.id,
            dateKey: latestDateKey,
            startMinutes: latestStartMinutes,
            endMinutes: latestEndMinutes,
        });

        // Dragging a single occurrence always applies to just that occurrence —
        // no confirmation dialog. Shifting an entire recurring series' time is a
        // deliberate action left to the full edit form, not a quick drag gesture.
        const scope = active.event.is_recurring_instance ? "THIS_INSTANCE" : "ALL_SESSIONS";
        void commitTimeChange(active.event, active.dateKey, latestDateKey, latestStartMinutes, latestEndMinutes, scope);
    }

    async function commitTimeChange(
        event: CalendarEventRead,
        originDateKey: string,
        targetDateKey: string,
        startMinutes: number,
        endMinutes: number,
        scope: "THIS_INSTANCE" | "ALL_SESSIONS",
    ) {
        setActionError("");
        setIsSavingDrag(true);

        try {
            const { dateKey: startDateKey, time: startTime } = resolveMinutesToDateAndTime(targetDateKey, startMinutes);
            const { dateKey: endDateKey, time: endTime } = resolveMinutesToDateAndTime(targetDateKey, endMinutes);

            const body = {
                title: event.title,
                description: event.description ?? null,
                color: event.color,
                start_at: toLocalOffsetIso(startDateKey, startTime),
                end_at: toLocalOffsetIso(endDateKey, endTime),
                is_all_day: false,
                update_scope: scope,
                instance_original_date: scope === "THIS_INSTANCE" ? originDateKey : null,
            } satisfies CalendarEventUpdate;

            const { data, error, response } = await updateCalendarEvent(event.id, body);
            if (error || !response?.ok) {
                throw new Error(getApiErrorMessage(error, "Unable to update event time."));
            }

            // Some backends return 204 No Content on a successful PATCH — data
            // being empty is NOT a failure. Fall back to synthesizing the
            // confirmed event from what we already know we just saved.
            const confirmedEvent: CalendarEventRead = data ?? {
                ...event,
                start_at: body.start_at,
                end_at: body.end_at,
                is_all_day: body.is_all_day,
            };

            onEventChanged(confirmedEvent, event.start_at);
            setPreviewOverride(null);
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Unable to update event time.");
            setPreviewOverride(null); // Save failed — revert to the real (unchanged) position now.
        } finally {
            setIsSavingDrag(false);
        }
    }

    return (
        <div className="overflow-hidden rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] shadow-[0_24px_90px_rgba(43,34,24,0.03)]">
            {actionError ? (
                <div className="border-b border-[#d5a58b] bg-[#f2e0d8] px-4 py-2 text-xs font-semibold text-[#8f3f32]">
                    {actionError}
                </div>
            ) : null}

            <div ref={scrollContainerRef} className="max-h-[600px] overflow-y-auto">
                <div className="sticky top-0 z-30 bg-[#fbf7ef]">
                    <div className={`grid border-b border-[#d9d0c1] bg-[#f5efe4] ${gridTemplateClass(days.length)}`}>
                        <div className="border-r border-[#d9d0c1]" />
                        {days.map((day) => (
                            <button
                                key={toDateKey(day)}
                                className="flex flex-col items-center gap-0.5 border-r border-[#d9d0c1] py-2.5 text-center last:border-r-0 hover:bg-[#e9e1d0]"
                                onClick={() => onSelectSlot(toDateKey(day), "09:00")}
                                type="button"
                            >
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#696154]">
                                    {day.toLocaleDateString("en", { weekday: "short" })}
                                </span>
                                <span
                                    className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${isToday(day) ? "bg-[#1d211c] text-[#fbf7ef]" : "text-[#1d211c]"
                                        }`}
                                >
                                    {day.getDate()}
                                </span>
                            </button>
                        ))}
                    </div>

                    <AllDayStrip days={days} events={events} onSelectEvent={onSelectEvent} />
                </div>

                <div ref={gridBodyRef} className={`relative grid ${gridTemplateClass(days.length)}`}>
                    <div className="border-r border-[#d9d0c1]">
                        {Array.from({ length: 24 }, (_, hour) => (
                            <div
                                key={hour}
                                className="relative border-b border-[#eee5d4] pr-2 text-right text-[10px] font-semibold text-[#a99b82]"
                                style={{ height: HOUR_HEIGHT }}
                            >
                                <span className="absolute -top-2 right-2">{formatHourLabel(hour)}</span>
                            </div>
                        ))}
                    </div>

                    {days.map((day, dayIndex) => {
                        const dateKey = toDateKey(day);
                        const laidOutEvents = layoutDayTimedEvents(day, events);

                        return (
                            <div
                                key={dateKey}
                                ref={(el) => {
                                    dayColumnRefs.current[dateKey] = el;
                                }}
                                className="relative border-r border-[#d9d0c1] last:border-r-0"
                                style={{ height: HOUR_HEIGHT * 24 }}
                            >
                                {Array.from({ length: 24 }, (_, hour) => (
                                    <div
                                        key={hour}
                                        className="cursor-pointer border-b border-[#eee5d4] transition hover:bg-[#f5efe4]/60"
                                        style={{ height: HOUR_HEIGHT }}
                                        onPointerDown={(e) => {
                                            e.stopPropagation();
                                            (e.target as HTMLElement).setPointerCapture(e.pointerId);
                                            const columnRect = dayColumnRefs.current[dateKey]?.getBoundingClientRect();
                                            const rawMinutes = columnRect ? ((e.clientY - columnRect.top) / HOUR_HEIGHT) * 60 : hour * 60;
                                            const startMinutes = Math.max(0, Math.min(MINUTES_IN_DAY, snapMinutes(rawMinutes)));
                                            const next: CreationDraft = {
                                                dateKey,
                                                clickHour: hour,
                                                startMinutes,
                                                currentMinutes: startMinutes,
                                                pointerStartClientY: e.clientY,
                                                hasDragged: false,
                                            };
                                            creationDraftRef.current = next;
                                            setCreationDraft(next);
                                        }}
                                    />
                                ))}

                                {creationDraft?.dateKey === dateKey && creationDraft.hasDragged ? (
                                    <div
                                        className="pointer-events-none absolute inset-x-0 z-10 rounded border-2 border-dashed border-[#8f6f2d] bg-[#8f6f2d]/15"
                                        style={{
                                            top: (Math.min(creationDraft.startMinutes, creationDraft.currentMinutes) / 60) * HOUR_HEIGHT,
                                            height: Math.max(
                                                15,
                                                Math.abs(creationDraft.currentMinutes - creationDraft.startMinutes),
                                            ) / 60 * HOUR_HEIGHT,
                                        }}
                                    />
                                ) : null}

                                {draftDateKey === dateKey && draftStartTime && draftEndTime ? (
                                    <div
                                        className="pointer-events-none absolute inset-x-0 z-10 rounded border-2 border-dashed border-[#8f6f2d] bg-[#8f6f2d]/15 px-1.5 py-1 text-[11px] font-semibold text-[#6b5320]"
                                        style={{
                                            top: (parseTimeToMinutes(draftStartTime) / 60) * HOUR_HEIGHT,
                                            height: Math.max(
                                                18,
                                                ((parseTimeToMinutes(draftEndTime) - parseTimeToMinutes(draftStartTime)) / 60) * HOUR_HEIGHT,
                                            ),
                                        }}
                                    >
                                        New event
                                    </div>
                                ) : null}

                                {isToday(day) ? (
                                    <div
                                        className="pointer-events-none absolute inset-x-0 z-10 h-px bg-[#8f3f32]"
                                        style={{ top: (minutesSinceMidnight(new Date()) / 60) * HOUR_HEIGHT }}
                                    />
                                ) : null}

                                {laidOutEvents.map((laid) => {
                                    const isOverridden = previewOverride?.eventId === laid.event.id && previewOverride.dateKey === dateKey;
                                    const displayStart = isOverridden ? previewOverride.startMinutes : laid.startMinutes;
                                    const displayEnd = isOverridden ? previewOverride.endMinutes : laid.endMinutes;
                                    const color = getCalendarEventColor(laid.event.color);
                                    const widthPercent = 100 / laid.colCount;
                                    const elementKey = eventElementKey(laid.event.id, dateKey);

                                    return (
                                        <div
                                            key={elementKey}
                                            ref={(el) => {
                                                eventElementRefs.current[elementKey] = el;
                                            }}
                                            className="absolute overflow-hidden rounded border px-1.5 py-1 text-left text-[11px] font-medium shadow-sm"
                                            style={{
                                                top: (displayStart / 60) * HOUR_HEIGHT,
                                                height: Math.max(18, ((displayEnd - displayStart) / 60) * HOUR_HEIGHT),
                                                left: `${laid.colIndex * widthPercent}%`,
                                                width: `calc(${widthPercent}% - 2px)`,
                                                backgroundColor: color.background,
                                                borderColor: color.border,
                                                color: color.text,
                                                cursor: laid.isDraggable ? "grab" : "pointer",
                                                opacity: isSavingDrag && isOverridden ? 0.6 : 1,
                                                zIndex: isOverridden ? 20 : 1,
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (suppressClickRef.current) {
                                                    suppressClickRef.current = false;
                                                    return;
                                                }
                                                if (!activeDragRef.current) onSelectEvent(laid.event, dateKey);
                                            }}
                                            onPointerDown={(e) => {
                                                if (!laid.isDraggable) return;
                                                e.stopPropagation();
                                                (e.target as HTMLElement).setPointerCapture(e.pointerId);
                                                activeDragRef.current = {
                                                    event: laid.event,
                                                    dateKey,
                                                    mode: "move",
                                                    durationMinutes: laid.endMinutes - laid.startMinutes,
                                                    originalStartMinutes: laid.startMinutes,
                                                    originalEndMinutes: laid.endMinutes,
                                                    pointerStartClientY: e.clientY,
                                                    pointerStartClientX: e.clientX,
                                                    latestStartMinutes: laid.startMinutes,
                                                    latestEndMinutes: laid.endMinutes,
                                                    columnDateKeys: days.map((d) => toDateKey(d)),
                                                    originColumnIndex: dayIndex,
                                                    latestColumnIndex: dayIndex,
                                                    latestDateKey: dateKey,
                                                    baseLeftPercent: laid.colIndex * widthPercent,
                                                    columnWidthPx: dayColumnRefs.current[dateKey]?.getBoundingClientRect().width ?? 0,
                                                };
                                                setPreviewOverride({
                                                    eventId: laid.event.id,
                                                    dateKey,
                                                    startMinutes: laid.startMinutes,
                                                    endMinutes: laid.endMinutes,
                                                });
                                            }}
                                        >
                                            <span className="block truncate font-semibold">{laid.event.title}</span>
                                            <span className="block truncate text-[10px] opacity-80">
                                                {minutesToTimeInputValue(displayStart)}{"\u2013"}{minutesToTimeInputValue(displayEnd)}
                                            </span>

                                            {laid.isDraggable ? (
                                                <div
                                                    className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize"
                                                    onPointerDown={(e) => {
                                                        e.stopPropagation();
                                                        (e.target as HTMLElement).setPointerCapture(e.pointerId);
                                                        activeDragRef.current = {
                                                            event: laid.event,
                                                            dateKey,
                                                            mode: "resize",
                                                            durationMinutes: laid.endMinutes - laid.startMinutes,
                                                            originalStartMinutes: laid.startMinutes,
                                                            originalEndMinutes: laid.endMinutes,
                                                            pointerStartClientY: e.clientY,
                                                            pointerStartClientX: e.clientX,
                                                            latestStartMinutes: laid.startMinutes,
                                                            latestEndMinutes: laid.endMinutes,
                                                            columnDateKeys: [dateKey],
                                                            originColumnIndex: dayIndex,
                                                            latestColumnIndex: dayIndex,
                                                            latestDateKey: dateKey,
                                                            baseLeftPercent: laid.colIndex * widthPercent,
                                                            columnWidthPx: 0,
                                                        };
                                                        setPreviewOverride({
                                                            eventId: laid.event.id,
                                                            dateKey,
                                                            startMinutes: laid.startMinutes,
                                                            endMinutes: laid.endMinutes,
                                                        });
                                                    }}
                                                />
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

interface AllDayStripProps {
    days: Date[];
    events: CalendarEventRead[];
    onSelectEvent: (event: CalendarEventRead, activeDateStr: string) => void;
}

function AllDayStrip({ days, events, onSelectEvent }: AllDayStripProps) {
    const hasAnyAllDay = events.some((evt) => evt.is_all_day);
    if (!hasAnyAllDay) return null;

    return (
        <div className={`grid border-b border-[#d9d0c1] ${gridTemplateClass(days.length)}`}>
            <div className="border-r border-[#d9d0c1] px-2 py-1.5 text-[10px] font-bold uppercase text-[#a99b82]">
                All day
            </div>
            {days.map((day) => {
                const dateKey = toDateKey(day);
                const dailyAllDayEvents = events.filter(
                    (evt) => evt.is_all_day && new Date(evt.start_at) <= day && new Date(evt.end_at) > day,
                );

                return (
                    <div key={dateKey} className="space-y-1 border-r border-[#d9d0c1] p-1.5 last:border-r-0">
                        {dailyAllDayEvents.map((evt) => {
                            const color = getCalendarEventColor(evt.color);
                            return (
                                <button
                                    key={`${evt.id}-${dateKey}`}
                                    className="block w-full truncate rounded border px-1.5 py-0.5 text-left text-[10px] font-semibold"
                                    style={{ backgroundColor: color.background, borderColor: color.border, color: color.text }}
                                    onClick={() => onSelectEvent(evt, dateKey)}
                                    type="button"
                                >
                                    {evt.title}
                                </button>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}

function layoutDayTimedEvents(day: Date, events: CalendarEventRead[]): LaidOutEvent[] {
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const dayEnd = addDays(dayStart, 1);

    const candidates = events
        .filter((evt) => !evt.is_all_day)
        .map((evt) => {
            const evtStart = new Date(evt.start_at);
            const evtEnd = new Date(evt.end_at);
            if (evtEnd <= dayStart || evtStart >= dayEnd) return null;

            const clippedStart = evtStart < dayStart ? dayStart : evtStart;
            const clippedEnd = evtEnd > dayEnd ? dayEnd : evtEnd;
            const startMinutes = minutesSinceMidnight(clippedStart);
            const endMinutes = clippedEnd.getTime() === dayEnd.getTime() ? MINUTES_IN_DAY : minutesSinceMidnight(clippedEnd);
            const isDraggable = evtStart.getTime() === clippedStart.getTime() && evtEnd.getTime() === clippedEnd.getTime();

            return { event: evt, startMinutes, endMinutes: Math.max(endMinutes, startMinutes + 15), isDraggable };
        })
        .filter((v): v is Omit<LaidOutEvent, "colIndex" | "colCount"> => v !== null)
        .sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);

    const columnEndTimes: number[] = [];
    const withColumns = candidates.map((candidate) => {
        let colIndex = columnEndTimes.findIndex((end) => end <= candidate.startMinutes);
        if (colIndex === -1) {
            colIndex = columnEndTimes.length;
            columnEndTimes.push(candidate.endMinutes);
        } else {
            columnEndTimes[colIndex] = candidate.endMinutes;
        }
        return { ...candidate, colIndex };
    });

    const colCount = Math.max(1, columnEndTimes.length);
    return withColumns.map((item) => ({ ...item, colCount }));
}

function resolveMinutesToDateAndTime(dateKey: string, minutes: number): { dateKey: string; time: string } {
    if (minutes >= MINUTES_IN_DAY) {
        const [year, month, day] = dateKey.split("-").map(Number);
        const nextDay = addDays(new Date(year, month - 1, day), 1);
        return { dateKey: toDateKey(nextDay), time: minutesToTimeInputValue(minutes - MINUTES_IN_DAY) };
    }
    return { dateKey, time: minutesToTimeInputValue(minutes) };
}

function isToday(day: Date): boolean {
    return toDateKey(day) === toDateKey(new Date());
}

function eventElementKey(eventId: string, dateKey: string): string {
    return `${eventId}::${dateKey}`;
}

function parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

function formatHourLabel(hour: number): string {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

function gridTemplateClass(dayCount: number): string {
    return dayCount === 1 ? "grid-cols-[56px_1fr]" : "grid-cols-[56px_repeat(7,1fr)]";
}