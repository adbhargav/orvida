import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, Upload, Save } from 'lucide-react';
import { api } from '../../services/api';
import {
  ANNOUNCEMENTS_DEFAULTS,
  HOME_BRAND_STORY_DEFAULTS,
  ABOUT_PAGE_DEFAULTS,
  SEO_DEFAULTS,
  mergeContent,
} from '../../config/siteContentDefaults';
import { POLICIES } from '../../config/policyDefaults';
import { GooglePreview, SocialPreview } from '../../components/admin/SeoFields';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-md border border-line bg-white text-sm text-ink placeholder:text-ink-faint ' +
  'focus:outline-none focus:border-emerald-default focus:ring-1 focus:ring-emerald-default/30 transition';

const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft';

function Field({ label, value, onChange, textarea = false, placeholder = '' }) {
  return (
    <div className="space-y-1.5">
      <label className={labelClass}>{label}</label>
      {textarea ? (
        <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} className={`${inputClass} resize-y`} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} className={inputClass} />
      )}
    </div>
  );
}

function ImageField({ label, value, onChange, aspect = 'aspect-[4/3]', hint }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputId = `content-img-${label.replace(/\W+/g, '-').toLowerCase()}`;

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;
    setUploading(true);
    setError('');
    try {
      const res = await api.uploads.images([files[0]]);
      if (res.urls?.[0]) onChange(res.urls[0]);
    } catch (err) {
      setError(err.message || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className={labelClass}>{label}</label>
      <div className="border border-dashed border-line-strong rounded-md p-4 text-center hover:border-emerald-default transition">
        <input type="file" accept="image/*" id={inputId} onChange={handleUpload} className="hidden" disabled={uploading} />
        <label htmlFor={inputId} className="cursor-pointer block space-y-1">
          {uploading ? <Loader2 className="w-4 h-4 text-emerald-default mx-auto animate-spin" />
                     : <Upload className="w-4 h-4 text-emerald-default mx-auto" />}
          <p className="text-sm font-medium text-ink">{uploading ? 'Uploading…' : value ? 'Replace image' : 'Click to upload'}</p>
          {hint && <p className="text-xs text-ink-faint">{hint}</p>}
        </label>
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      {value && (
        <div className={`${aspect} rounded-md overflow-hidden border border-line`}>
          <img src={value} alt="" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}

function SectionCard({ title, description, children, onSave, saving, savedAt }) {
  return (
    <section className="surface-card rounded-lg p-6 sm:p-8 space-y-5">
      <div className="flex flex-wrap justify-between items-start gap-4 border-b border-line pb-4">
        <div className="space-y-1">
          <h2 className="type-heading text-xl text-ink">{title}</h2>
          <p className="text-sm text-ink-soft">{description}</p>
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-emerald-default text-white text-sm font-medium hover:bg-emerald-deep disabled:opacity-50 transition"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {savedAt ? 'Saved ✓' : 'Save section'}
        </button>
      </div>
      {children}
    </section>
  );
}

export default function AdminSiteContent({ only = null }) {
  // `only="seo"` mounts just the SEO settings under SEO Management, so the
  // same component serves both tabs instead of being copied.
  const shows = (section) => !only || only === section;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [banner, setBanner] = useState(null);

  const [brandStory, setBrandStory] = useState(HOME_BRAND_STORY_DEFAULTS);
  const [about, setAbout] = useState(ABOUT_PAGE_DEFAULTS);
  const [policies, setPolicies] = useState(POLICIES);
  const [seo, setSeo] = useState(SEO_DEFAULTS);
  // Edited as one message per line.
  const [announcementsText, setAnnouncementsText] = useState(ANNOUNCEMENTS_DEFAULTS.messages.join('\n'));
  const [savingKey, setSavingKey] = useState(null);
  const [savedKey, setSavedKey] = useState(null);

  const notify = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const policyKeys = Object.keys(POLICIES).map((slug) => `policy_${slug}`);
      const res = await api.content.get('home_brand_story', 'about_page', 'announcements', 'seo_settings', ...policyKeys);
      setBrandStory(mergeContent(HOME_BRAND_STORY_DEFAULTS, res.content?.home_brand_story));
      setAbout(mergeContent(ABOUT_PAGE_DEFAULTS, res.content?.about_page));
      setSeo(mergeContent(SEO_DEFAULTS, res.content?.seo_settings));
      const savedMessages = res.content?.announcements?.messages;
      if (Array.isArray(savedMessages) && savedMessages.length > 0) {
        setAnnouncementsText(savedMessages.join('\n'));
      }
      setPolicies(
        Object.fromEntries(
          Object.entries(POLICIES).map(([slug, def]) => [
            slug,
            mergeContent(def, res.content?.[`policy_${slug}`]),
          ])
        )
      );
    } catch (err) {
      setLoadError(err.message || 'Could not load site content.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (key, content) => {
    setSavingKey(key);
    setSavedKey(null);
    try {
      await api.content.update(key, content);
      setSavedKey(key);
      notify('success', 'Content published — the storefront shows it immediately.');
      setTimeout(() => setSavedKey(null), 3000);
    } catch (err) {
      notify('error', err.message || 'Could not save this section.');
    } finally {
      setSavingKey(null);
    }
  };

  const setPillar = (idx, field, value) => {
    setAbout((prev) => ({
      ...prev,
      pillars: prev.pillars.map((p, i) => (i === idx ? { ...p, [field]: value } : p)),
    }));
  };

  const setMilestone = (idx, field, value) => {
    setAbout((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m, i) => (i === idx ? { ...m, [field]: value } : m)),
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas p-10 flex flex-col items-center justify-center gap-3 text-ink-soft">
        <Loader2 className="w-5 h-5 animate-spin" />
        <p className="text-sm">Loading site content…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas p-6 sm:p-10 space-y-8">
      <header className="space-y-1.5 border-b border-line pb-6">
        <span className="type-eyebrow text-emerald-default">
          {only === 'seo' ? 'Search defaults' : 'Storefront copy'}
        </span>
        <h1 className="type-display text-3xl sm:text-[2.5rem] text-ink">
          {only === 'seo' ? 'SEO settings' : 'Site content'}
        </h1>
        <p className="text-sm text-ink-soft">
          {only === 'seo'
            ? 'Defaults every page falls back to when it has no SEO values of its own.'
            : 'Edit the homepage brand story and the Our Story page. Saved changes go live immediately.'}
        </p>
      </header>

      {banner && (
        <div role="status" className={`flex items-center gap-2.5 px-4 py-3 rounded-md border text-sm ${
          banner.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-light border-emerald-default/25 text-emerald-deep'
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          {banner.text}
        </div>
      )}

      {loadError && (
        <div className="surface-card rounded-lg p-10 text-center space-y-3">
          <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
          <p className="text-sm text-ink font-medium">{loadError}</p>
          <button onClick={load} className="text-sm text-emerald-default link-underline">Try again</button>
        </div>
      )}

      {shows('seo') && (
      <SectionCard
        title="SEO — search & social"
        description="Global search settings: how the homepage appears in Google, what a shared link looks like, your business details for rich results, and Google integrations."
        onSave={() => save('seo_settings', seo)}
        saving={savingKey === 'seo_settings'}
        savedAt={savedKey === 'seo_settings'}
      >
        <div className="space-y-8">
          {/* General */}
          <div className="space-y-4">
            <p className="type-eyebrow text-emerald-default">General</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Site name" value={seo.siteName}
                onChange={(v) => setSeo({ ...seo, siteName: v })} placeholder="ORIVIDA" />
              <div className="space-y-1.5">
                <label className={labelClass}>Title template</label>
                <input type="text" value={seo.titleTemplate}
                  onChange={(e) => setSeo({ ...seo, titleTemplate: e.target.value })}
                  className={inputClass} placeholder="%title% | %siteName%" />
                <p className="text-xs text-ink-faint">
                  %title% is the page or product name, %siteName% is your brand.
                </p>
              </div>
            </div>
          </div>

          {/* Homepage */}
          <div className="space-y-4 pt-6 border-t border-line">
            <p className="type-eyebrow text-emerald-default">Homepage</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Homepage SEO title</label>
                  <input type="text" value={seo.metaTitle}
                    onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })} className={inputClass} />
                  <p className={`text-xs ${seo.metaTitle.length > 60 ? 'text-amber-700' : 'text-ink-faint'}`}>
                    {seo.metaTitle.length}/60 characters — recommended 50–60.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Homepage meta description</label>
                  <textarea rows={3} value={seo.metaDescription}
                    onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })}
                    className={`${inputClass} resize-y`} />
                  <p className={`text-xs ${seo.metaDescription.length > 160 ? 'text-amber-700' : 'text-ink-faint'}`}>
                    {seo.metaDescription.length}/160 characters — recommended 140–160.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <GooglePreview title={seo.metaTitle} description={seo.metaDescription} path="/" settings={seo} />
                <p className="text-xs text-ink-faint leading-relaxed">
                  Product and collection pages build their own titles and descriptions from the catalogue,
                  and each can be overridden in its own SEO section.
                </p>
              </div>
            </div>
          </div>

          {/* Social sharing */}
          <div className="space-y-4 pt-6 border-t border-line">
            <p className="type-eyebrow text-emerald-default">Social sharing</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <ImageField label="Default share image" value={seo.ogImage} aspect="aspect-[1200/630]"
                  hint="Used when a page has no image of its own — 1200×630"
                  onChange={(v) => setSeo({ ...seo, ogImage: v })} />
                <div className="space-y-1.5">
                  <label className={labelClass}>Twitter/X card type</label>
                  <select value={seo.twitterCardType}
                    onChange={(e) => setSeo({ ...seo, twitterCardType: e.target.value })} className={inputClass}>
                    <option value="summary_large_image">Large image (recommended)</option>
                    <option value="summary">Small summary</option>
                  </select>
                </div>
              </div>
              <SocialPreview title={seo.metaTitle} description={seo.metaDescription} image={seo.ogImage} settings={seo} />
            </div>
          </div>

          {/* Organisation — powers Organization structured data */}
          <div className="space-y-4 pt-6 border-t border-line">
            <p className="type-eyebrow text-emerald-default">Organisation</p>
            <p className="text-xs text-ink-faint">
              Feeds the business information Google can show alongside your results.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Organisation name" value={seo.organizationName}
                onChange={(v) => setSeo({ ...seo, organizationName: v })} />
              <ImageField label="Logo" value={seo.organizationLogo} aspect="aspect-square"
                onChange={(v) => setSeo({ ...seo, organizationLogo: v })} />
              <div className="sm:col-span-2">
                <Field label="Description" textarea value={seo.organizationDescription}
                  onChange={(v) => setSeo({ ...seo, organizationDescription: v })} />
              </div>
              <Field label="Phone" value={seo.organizationPhone}
                onChange={(v) => setSeo({ ...seo, organizationPhone: v })} />
              <Field label="Email" value={seo.organizationEmail}
                onChange={(v) => setSeo({ ...seo, organizationEmail: v })} />
              <div className="sm:col-span-2">
                <Field label="Address" value={seo.organizationAddress}
                  onChange={(v) => setSeo({ ...seo, organizationAddress: v })} />
              </div>
              <div className="sm:col-span-2">
                <Field label="Social profiles" textarea value={seo.organizationSocialLinks}
                  onChange={(v) => setSeo({ ...seo, organizationSocialLinks: v })}
                  placeholder="One full URL per line — Instagram, Facebook, X…" />
              </div>
            </div>
          </div>

          {/* Google integrations */}
          <div className="space-y-4 pt-6 border-t border-line">
            <p className="type-eyebrow text-emerald-default">Google integrations</p>
            <p className="text-xs text-ink-faint">
              Left blank, nothing is loaded — no tracking scripts reach your visitors.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Search Console verification</label>
                <input type="text" value={seo.googleSiteVerification}
                  onChange={(e) => setSeo({ ...seo, googleSiteVerification: e.target.value })}
                  className={inputClass} placeholder="Verification content value" />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Google Analytics 4 ID</label>
                <input type="text" value={seo.googleAnalyticsId}
                  onChange={(e) => setSeo({ ...seo, googleAnalyticsId: e.target.value })}
                  className={inputClass} placeholder="G-XXXXXXXXXX" />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Tag Manager ID</label>
                <input type="text" value={seo.googleTagManagerId}
                  onChange={(e) => setSeo({ ...seo, googleTagManagerId: e.target.value })}
                  className={inputClass} placeholder="GTM-XXXXXXX" />
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      )}

      {shows('content') && (
      <SectionCard
        title="Announcement bar"
        description="The rotating messages in the green strip at the very top of the store. One message per line; they rotate every few seconds."
        onSave={() => {
          const messages = announcementsText.split('\n').map((m) => m.trim()).filter(Boolean);
          if (messages.length === 0) return notify('error', 'Add at least one announcement message.');
          save('announcements', { messages });
        }}
        saving={savingKey === 'announcements'}
        savedAt={savedKey === 'announcements'}
      >
        <div className="space-y-1.5">
          <label className={labelClass}>Messages (one per line)</label>
          <textarea
            rows={4}
            value={announcementsText}
            onChange={(e) => setAnnouncementsText(e.target.value)}
            className={`${inputClass} resize-y`}
            placeholder={'Complimentary shipping on orders above ₹1,999\nAny 4 plants at ₹999 — limited botanical offer'}
          />
        </div>
      </SectionCard>

      )}

      {shows('content') && (
      <SectionCard
        title="Homepage — Brand story"
        description="The “Where botanical passion…” section with its side image."
        onSave={() => save('home_brand_story', brandStory)}
        saving={savingKey === 'home_brand_story'}
        savedAt={savedKey === 'home_brand_story'}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Field label="Eyebrow" value={brandStory.eyebrow}
              onChange={(v) => setBrandStory({ ...brandStory, eyebrow: v })} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Heading" value={brandStory.heading}
                onChange={(v) => setBrandStory({ ...brandStory, heading: v })} />
              <Field label="Heading accent (italic)" value={brandStory.headingAccent}
                onChange={(v) => setBrandStory({ ...brandStory, headingAccent: v })} />
            </div>
            <Field label="First paragraph" textarea value={brandStory.paragraph1}
              onChange={(v) => setBrandStory({ ...brandStory, paragraph1: v })} />
            <Field label="Second paragraph" textarea value={brandStory.paragraph2}
              onChange={(v) => setBrandStory({ ...brandStory, paragraph2: v })} />
            <Field label="Button text" value={brandStory.buttonText}
              onChange={(v) => setBrandStory({ ...brandStory, buttonText: v })} />
          </div>
          <ImageField label="Side image" value={brandStory.image} hint="Shown beside the text — 4:3 works best"
            onChange={(v) => setBrandStory({ ...brandStory, image: v })} />
        </div>
      </SectionCard>

      )}

      {shows('content') && (
      <SectionCard
        title="Our Story page"
        description="Everything on /about — hero, pillars, craft section, milestones and the closing call-to-action."
        onSave={() => save('about_page', about)}
        saving={savingKey === 'about_page'}
        savedAt={savedKey === 'about_page'}
      >
        <div className="space-y-8">
          {/* Hero */}
          <div className="space-y-4">
            <p className="type-eyebrow text-emerald-default">Hero</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Field label="Eyebrow" value={about.heroEyebrow}
                  onChange={(v) => setAbout({ ...about, heroEyebrow: v })} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Title" value={about.heroTitle}
                    onChange={(v) => setAbout({ ...about, heroTitle: v })} />
                  <Field label="Title accent (italic)" value={about.heroAccent}
                    onChange={(v) => setAbout({ ...about, heroAccent: v })} />
                </div>
                <Field label="Intro paragraph" textarea value={about.heroIntro}
                  onChange={(v) => setAbout({ ...about, heroIntro: v })} />
              </div>
              <ImageField label="Hero background image" value={about.heroImage} aspect="aspect-[21/9]"
                hint="Rendered dark behind the title — wide images work best"
                onChange={(v) => setAbout({ ...about, heroImage: v })} />
            </div>
          </div>

          {/* Pillars */}
          <div className="space-y-4 pt-6 border-t border-line">
            <p className="type-eyebrow text-emerald-default">Three pillars</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {about.pillars.map((pillar, idx) => (
                <div key={idx} className="space-y-3 p-4 rounded-md border border-line">
                  <Field label={`Pillar ${idx + 1} title`} value={pillar.title}
                    onChange={(v) => setPillar(idx, 'title', v)} />
                  <Field label="Copy" textarea value={pillar.copy}
                    onChange={(v) => setPillar(idx, 'copy', v)} />
                </div>
              ))}
            </div>
          </div>

          {/* Craft */}
          <div className="space-y-4 pt-6 border-t border-line">
            <p className="type-eyebrow text-emerald-default">Craft section</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Field label="Eyebrow" value={about.craftEyebrow}
                  onChange={(v) => setAbout({ ...about, craftEyebrow: v })} />
                <Field label="Heading" value={about.craftHeading}
                  onChange={(v) => setAbout({ ...about, craftHeading: v })} />
                <Field label="First paragraph" textarea value={about.craftParagraph1}
                  onChange={(v) => setAbout({ ...about, craftParagraph1: v })} />
                <Field label="Second paragraph" textarea value={about.craftParagraph2}
                  onChange={(v) => setAbout({ ...about, craftParagraph2: v })} />
              </div>
              <ImageField label="Craft image" value={about.craftImage}
                onChange={(v) => setAbout({ ...about, craftImage: v })} />
            </div>
          </div>

          {/* Milestones */}
          <div className="space-y-4 pt-6 border-t border-line">
            <p className="type-eyebrow text-emerald-default">Milestones</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {about.milestones.map((item, idx) => (
                <div key={idx} className="space-y-3 p-4 rounded-md border border-line">
                  <Field label={`Value (e.g. 15,000+)`} value={item.value}
                    onChange={(v) => setMilestone(idx, 'value', v)} />
                  <Field label="Label" value={item.label}
                    onChange={(v) => setMilestone(idx, 'label', v)} />
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-4 pt-6 border-t border-line">
            <p className="type-eyebrow text-emerald-default">Closing call-to-action</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Title" value={about.ctaTitle}
                onChange={(v) => setAbout({ ...about, ctaTitle: v })} />
              <Field label="Subtitle" value={about.ctaSubtitle}
                onChange={(v) => setAbout({ ...about, ctaSubtitle: v })} />
            </div>
          </div>
        </div>
      </SectionCard>

      )}

      {shows('content') && Object.entries(policies).map(([slug, policy]) => (
        <SectionCard
          key={slug}
          title={policy.title}
          description={`Shown at /policies/${slug} — linked from the footer. Lines starting “## ” become headings, “- ” become bullet points.`}
          onSave={() => save(`policy_${slug}`, policy)}
          saving={savingKey === `policy_${slug}`}
          savedAt={savedKey === `policy_${slug}`}
        >
          <div className="space-y-4">
            <Field label="Page title" value={policy.title}
              onChange={(v) => setPolicies({ ...policies, [slug]: { ...policy, title: v } })} />
            <div className="space-y-1.5">
              <label className={labelClass}>Content</label>
              <textarea
                rows={14}
                value={policy.body}
                onChange={(e) => setPolicies({ ...policies, [slug]: { ...policy, body: e.target.value } })}
                className={`${inputClass} resize-y font-mono text-[13px] leading-relaxed`}
              />
            </div>
          </div>
        </SectionCard>
      ))}
    </div>
  );
}
