import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Of het toestel gevraagd heeft om minder beweging. Animaties die alleen
 * versiering zijn worden dan overgeslagen; alles blijft wel bedienbaar.
 */
export function useBewegingBeperkt(): boolean {
  const [beperkt, setBeperkt] = useState(false);

  useEffect(() => {
    let levend = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((waarde) => {
        if (levend) setBeperkt(waarde);
      })
      .catch(() => {});
    const luisteraar = AccessibilityInfo.addEventListener('reduceMotionChanged', setBeperkt);
    return () => {
      levend = false;
      luisteraar.remove();
    };
  }, []);

  return beperkt;
}
