import { useEffect, useState } from "react";

/**
 * Tracks which section id is currently in view using IntersectionObserver,
 * with debounced state updates for smooth, flicker-free highlighting.
 */
export function useActiveSection(ids: string[], offset = 96, debounceMs = 80) {
  const [active, setActive] = useState<string>(ids[0] ?? "");
  const key = ids.join(",");

  useEffect(() => {
    if (typeof window === "undefined" || ids.length === 0) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let frame = 0;
    let cancelled = false;

    /**
     * Geometry is read at resolve time (never cached from observer entries),
     * so fast scrolling and layout shifts can never leave stale positions.
     */
    const resolve = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      // Anchor line: sits below the sticky header, ~a third down the viewport.
      const line = Math.max(offset, window.innerHeight * 0.33);
      // Bottom of the page always highlights the last section.
      if (scrollTop + window.innerHeight >= doc.scrollHeight - 2) {
        for (let i = ids.length - 1; i >= 0; i--) {
          if (isVisible(ids[i]!)) return ids[i]!;
        }
      }

      let current = "";
      let firstBelow = "";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el || !isVisible(id)) continue;
        const rect = el.getBoundingClientRect();
        // The section crossing the anchor line wins outright.
        if (rect.top <= line && rect.bottom > line) return id;
        if (rect.top <= line) current = id;
        else if (!firstBelow) firstBelow = id;
      }
      // Above every section: highlight the first upcoming one.
      return current || firstBelow || "";
    };

    const isVisible = (id: string) => {
      const el = document.getElementById(id);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 || r.height > 0;
    };

    const apply = () => {
      if (cancelled) return;
      const next = resolve();
      if (next) setActive((prev) => (prev === next ? prev : next));
    };

    // Debounce with a trailing timeout, then settle on the next frame so the
    // read happens after any pending layout work.
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(apply);
      }, debounceMs);
    };

    const observer = new IntersectionObserver(schedule, {
      rootMargin: `-${offset}px 0px -25% 0px`,
      threshold: [0, 0.25, 0.5, 0.75, 1],
    });

    // Re-resolve when sections change size (fonts, images, expanded content).
    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : undefined;

    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      observer.observe(el);
      resizeObserver?.observe(el);
    }
    resizeObserver?.observe(document.body);

    apply();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [key, offset, debounceMs]);

  return active;
}