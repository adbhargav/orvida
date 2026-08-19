import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { ABOUT_PAGE_DEFAULTS, mergeContent } from '../config/siteContentDefaults';
import usePageMeta from '../hooks/usePageMeta';

// The whole page is editable from Admin → Site Content; the defaults render
// until (and wherever) an admin has saved their own copy.
export default function About() {
  const [content, setContent] = useState(ABOUT_PAGE_DEFAULTS);

  useEffect(() => {
    let cancelled = false;
    api.content
      .get('about_page')
      .then((res) => {
        if (!cancelled) setContent(mergeContent(ABOUT_PAGE_DEFAULTS, res.content?.about_page));
      })
      .catch(() => {
        /* defaults already rendered */
      });
    return () => { cancelled = true; };
  }, []);

  usePageMeta({
    title: 'Our Story | ORIVIDA',
    description: content.heroIntro,
    image: content.heroImage,
    path: '/about',
    type: 'article',
  });

  return (
    <div className="bg-canvas">
      {/* Hero */}
      <section className="relative bg-emerald-darker text-white">
        {content.heroImage && (
          <img
            src={content.heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
        )}
        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-24 sm:py-32">
          <div className="max-w-2xl space-y-5">
            <span className="type-eyebrow text-gold-light block">{content.heroEyebrow}</span>
            <h1 className="type-display text-4xl sm:text-[3.5rem]">
              {content.heroTitle} <span className="italic">{content.heroAccent}</span>
            </h1>
            <p className="text-emerald-light/80 text-lg leading-relaxed">{content.heroIntro}</p>
          </div>
        </div>
      </section>

      {/* Pillars */}
      {(content.pillars || []).length > 0 && (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-20 sm:py-28">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {content.pillars.map((pillar, idx) => (
              <div key={idx} className="space-y-4">
                <span className="type-price text-2xl text-emerald-default">0{idx + 1}</span>
                <h2 className="type-heading text-xl text-ink">{pillar.title}</h2>
                <p className="text-ink-soft leading-relaxed">{pillar.copy}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Craft */}
      <section className="border-y border-line bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-20 sm:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="aspect-[4/3] overflow-hidden bg-emerald-subtle order-2 lg:order-1">
            {content.craftImage && (
              <img
                src={content.craftImage}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
          </div>

          <div className="space-y-6 order-1 lg:order-2">
            <span className="type-eyebrow text-emerald-default block">{content.craftEyebrow}</span>
            <h2 className="type-display text-3xl sm:text-[2.5rem] text-ink">{content.craftHeading}</h2>
            <div className="space-y-4 text-ink-soft leading-relaxed max-w-prose">
              <p>{content.craftParagraph1}</p>
              {content.craftParagraph2 && <p>{content.craftParagraph2}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Milestones */}
      {(content.milestones || []).length > 0 && (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-20 sm:py-24">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
            {content.milestones.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <p className="type-price text-4xl text-emerald-default">{item.value}</p>
                <p className="type-eyebrow text-ink-soft">{item.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-emerald-default text-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-16 sm:py-20 text-center space-y-6">
          <h2 className="type-display text-3xl sm:text-[2.5rem]">{content.ctaTitle}</h2>
          <p className="text-emerald-light/80 max-w-xl mx-auto leading-relaxed">{content.ctaSubtitle}</p>
          <Link
            to="/category/plants"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-emerald-deep hover:bg-emerald-light text-[11px] uppercase tracking-[0.16em] transition-colors"
          >
            Explore the collection <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
