import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { SEO_DEFAULTS, mergeContent } from '../config/siteContentDefaults';
import { generateOrganizationSchema, generateWebsiteSchema } from '../lib/seo';
import { useSiteSeo } from '../hooks/usePageMeta';

const SeoContext = createContext(SEO_DEFAULTS);

/**
 * Global SEO settings, fetched once per session.
 *
 * Pages read these to resolve their own metadata (title template, default
 * description, default OG image); this provider also owns the site-wide
 * concerns — Organization and WebSite structured data, Search Console
 * verification and analytics — so no page has to repeat them.
 */
export function SeoProvider({ children }) {
  const [settings, setSettings] = useState(SEO_DEFAULTS);

  useEffect(() => {
    let cancelled = false;
    api.content
      .get('seo_settings')
      .then((res) => {
        if (!cancelled) setSettings(mergeContent(SEO_DEFAULTS, res.content?.seo_settings));
      })
      .catch(() => {
        /* defaults already applied */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const siteSeo = useMemo(
    () => ({
      googleSiteVerification: settings.googleSiteVerification,
      googleAnalyticsId: settings.googleAnalyticsId,
      googleTagManagerId: settings.googleTagManagerId,
      organizationSchema: generateOrganizationSchema(settings),
      websiteSchema: generateWebsiteSchema(settings),
    }),
    [settings]
  );

  useSiteSeo(siteSeo);

  return <SeoContext.Provider value={settings}>{children}</SeoContext.Provider>;
}

/** Global SEO settings, already merged over the built-in defaults. */
export const useSeoSettings = () => useContext(SeoContext);

export default SeoContext;
