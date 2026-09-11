import { useId, useMemo } from "react";

export function useStagger(visible: boolean, count: number, baseDelay = 0.05) {
  const uid = useId();
  return useMemo(() => {
    if (!visible) return Array.from({ length: count }, () => "opacity-0");
    return Array.from({ length: count }, (_, i) => ({
      animation: `fadeInUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${baseDelay * i}s forwards`,
      style: { animationDelay: `${baseDelay * i}s` } as Record<string, string>,
    }));
  }, [visible, count, baseDelay, uid]);
}
