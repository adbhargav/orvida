import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, Upload, Save } from 'lucide-react';
import { api } from '../../services/api';
import {
  HOME_BRAND_STORY_DEFAULTS,
  ABOUT_PAGE_DEFAULTS,
  mergeContent,
} from '../../config/siteContentDefaults';
import { POLICIES } from '../../config/policyDefaults';

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

export default function AdminSiteContent() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [banner, setBanner] = useState(null);

  const [brandStory, setBrandStory] = useState(HOME_BRAND_STORY_DEFAULTS);
  const [about, setAbout] = useState(ABOUT_PAGE_DEFAULTS);
  const [policies, setPolicies] = useState(POLICIES);
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
      const res = await api.content.get('home_brand_story', 'about_page', ...policyKeys);
      setBrandStory(mergeContent(HOME_BRAND_STORY_DEFAULTS, res.content?.home_brand_story));
      setAbout(mergeContent(ABOUT_PAGE_DEFAULTS, res.content?.about_page));
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
        <span className="type-eyebrow text-emerald-default">Storefront copy</span>
        <h1 className="type-display text-3xl sm:text-[2.5rem] text-ink">Site content</h1>
        <p className="text-sm text-ink-soft">
          Edit the homepage brand story and the Our Story page. Saved changes go live immediately.
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

      {/* Homepage brand story */}
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

      {/* Our Story page */}
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

      {/* Policies */}
      {Object.entries(policies).map(([slug, policy]) => (
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
