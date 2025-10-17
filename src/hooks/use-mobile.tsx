import * as React from "react";

const MOBILE_BREAKPOINT = 768;

const getIsMobile = () =>
  typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : false;

export function useIsMobile() {
  // Initialize from window immediately to avoid first-render desktop -> mobile flicker
  const [isMobile, setIsMobile] = React.useState<boolean>(getIsMobile());

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(getIsMobile());

    // Sync immediately on mount
    onChange();

    // Listen to both matchMedia and resize for broader browser support
    mql.addEventListener?.("change", onChange);
    window.addEventListener("resize", onChange);

    return () => {
      mql.removeEventListener?.("change", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, []);

  return isMobile;
}

