import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Always starts `false` — reading `window.innerWidth` here would return
  // a different answer during SSR (no window, forced false) than during
  // client hydration (real viewport, evaluated the instant this function
  // re-runs to hydrate) whenever the real device IS under the breakpoint,
  // producing a guaranteed hydration mismatch on every mobile/narrow-
  // viewport load rather than an occasional one. Detecting the real
  // viewport only happens in the effect below, which never runs during
  // SSR or hydration — only after mount — so the first client render
  // always matches the server's, and this corrects itself one render
  // later if the real device is actually mobile.
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    onChange()
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
