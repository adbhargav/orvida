import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';

/**
 * Sends a visitor on to the current location's replacement, if one exists.
 *
 * When a product or category slug is edited the server records a 301, so a
 * bookmarked or indexed old URL should still land on the right page instead
 * of a dead end. This runs only once the page has actually failed to find
 * its content, so a normal page view never pays for the lookup.
 *
 * @param {boolean} active  Only check once the page knows it has nothing to show
 * @returns {boolean} true while a redirect is being resolved
 */
export default function useRedirectFallback(active) {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!active) return undefined;

    let cancelled = false;
    setChecking(true);

    api.seo
      .resolveRedirect(location.pathname)
      .then((res) => {
        if (cancelled) return;
        const destination = res?.redirect?.destination;
        // Never bounce to the page we are already on.
        if (destination && destination !== location.pathname) {
          navigate(destination, { replace: true });
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [active, location.pathname, navigate]);

  return checking;
}
