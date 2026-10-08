"use client";

import * as React from "react";

/**
 * useScrollSpy — returns the id of the section currently in view.
 * @param ids list of section ids to observe
 * @param rootMargin IntersectionObserver rootMargin (default top offset)
 */
export function useScrollSpy(ids: string[], rootMargin = "-45% 0px -50% 0px") {
  const [active, setActive] = React.useState<string>(ids[0] ?? "");

  React.useEffect(() => {
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (els.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin, threshold: [0, 0.25, 0.5, 1] }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [ids.join(","), rootMargin]);

  return active;
}
