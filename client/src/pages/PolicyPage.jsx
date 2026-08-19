import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { api } from '../services/api';
import { POLICIES } from '../config/policyDefaults';

/**
 * Renders one policy (/policies/:slug). Copy comes from the site_content
 * block `policy_<slug>` when an admin has edited it, else the built-in
 * default. Body text: "## " lines are headings, "- " lines are list items,
 * blank lines separate paragraphs.
 */
export default function PolicyPage() {
  const { slug } = useParams();
  const fallback = POLICIES[slug];
  const [policy, setPolicy] = useState(fallback);

  useEffect(() => {
    if (!fallback) return;
    setPolicy(fallback);
    let cancelled = false;
    api.content
      .get(`policy_${slug}`)
      .then((res) => {
        const saved = res.content?.[`policy_${slug}`];
        if (!cancelled && saved?.body) {
          setPolicy({ title: saved.title || fallback.title, body: saved.body });
        }
      })
      .catch(() => { /* defaults already rendered */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (!fallback) return <Navigate to="/" replace />;

  // Group consecutive "- " lines into lists, "## " into headings.
  const blocks = [];
  for (const rawLine of policy.body.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('## ')) {
      blocks.push({ type: 'heading', text: line.slice(3) });
    } else if (line.startsWith('- ')) {
      const prev = blocks[blocks.length - 1];
      if (prev?.type === 'list') prev.items.push(line.slice(2));
      else blocks.push({ type: 'list', items: [line.slice(2)] });
    } else {
      blocks.push({ type: 'paragraph', text: line });
    }
  }

  return (
    <div className="bg-canvas min-h-[60vh]">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
        <header className="space-y-2 border-b border-line pb-8 mb-10">
          <span className="type-eyebrow text-emerald-default block">ORIVIDA policies</span>
          <h1 className="type-display text-3xl sm:text-[2.75rem] text-ink">{policy.title}</h1>
        </header>

        <div className="space-y-5">
          {blocks.map((block, idx) => {
            if (block.type === 'heading') {
              return (
                <h2 key={idx} className="type-heading text-xl text-ink pt-4">
                  {block.text}
                </h2>
              );
            }
            if (block.type === 'list') {
              return (
                <ul key={idx} className="list-disc pl-5 space-y-2 text-ink-soft leading-relaxed">
                  {block.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={idx} className="text-ink-soft leading-relaxed">
                {block.text}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}
