import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const PILLARS = [
  {
    title: 'Eighteen months of care',
    copy: 'Every variegated specimen is nurtured in our temperature-controlled Coorg nursery until its fenestrations mature and its aerial root architecture is established.',
  },
  {
    title: 'Four thousand years of craft',
    copy: 'Our arts collection is cast by Bastar bell metal families in Chhattisgarh using the lost-wax Dhokra method, and thrown by ceramic artists in Jaipur.',
  },
  {
    title: 'Delivered as living things',
    copy: 'White-glove, temperature-controlled transport with a seven-day health guarantee. If a plant does not settle, we replace it.',
  },
];

const MILESTONES = [
  { value: '15,000+', label: 'Botanicals hand-nurtured' },
  { value: '120+', label: 'Artisan families supported' },
  { value: '18 mo', label: 'Average nursery maturation' },
];

export default function About() {
  return (
    <div className="bg-canvas">
      {/* Hero */}
      <section className="relative bg-emerald-darker text-white">
        <img
          src="https://images.unsplash.com/photo-1470058869958-2a77ade41c02?auto=format&fit=crop&w=2000&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-24 sm:py-32">
          <div className="max-w-2xl space-y-5">
            <span className="type-eyebrow text-gold-light block">Our story</span>
            <h1 className="type-display text-4xl sm:text-[3.5rem]">
              Our passion, <span className="italic">ur luxury</span>
            </h1>
            <p className="text-emerald-light/80 text-lg leading-relaxed">
              ORIVIDA exists for people who treat living things as heirlooms — rare botanicals raised slowly, and
              craft made by hands that learned it from the generation before.
            </p>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-20 sm:py-28">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          {PILLARS.map((pillar, idx) => (
            <div key={pillar.title} className="space-y-4">
              <span className="type-price text-2xl text-emerald-default">0{idx + 1}</span>
              <h2 className="type-heading text-xl text-ink">{pillar.title}</h2>
              <p className="text-ink-soft leading-relaxed">{pillar.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Craft */}
      <section className="border-y border-line bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-20 sm:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="aspect-[4/3] overflow-hidden bg-emerald-subtle order-2 lg:order-1">
            <img
              src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=80"
              alt="A Dhokra artisan finishing a bell metal casting"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="space-y-6 order-1 lg:order-2">
            <span className="type-eyebrow text-emerald-default block">The Bastar workshops</span>
            <h2 className="type-display text-3xl sm:text-[2.5rem] text-ink">
              Craft that predates the wheel it is cast on
            </h2>
            <div className="space-y-4 text-ink-soft leading-relaxed max-w-prose">
              <p>
                Dhokra casting has been practised in central India for roughly four thousand years. A beeswax model is
                sheathed in clay, fired until the wax runs out, and the void filled with molten bell metal. The mould is
                broken to release the piece, so no two are ever identical.
              </p>
              <p>
                We commission directly from the families who hold this knowledge, and every piece ships with a signed
                lineage certificate naming the artisan who made it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-20 sm:py-24">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
          {MILESTONES.map((item) => (
            <div key={item.label} className="space-y-2">
              <p className="type-price text-4xl text-emerald-default">{item.value}</p>
              <p className="type-eyebrow text-ink-soft">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-emerald-default text-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-16 sm:py-20 text-center space-y-6">
          <h2 className="type-display text-3xl sm:text-[2.5rem]">Begin your collection</h2>
          <p className="text-emerald-light/80 max-w-xl mx-auto leading-relaxed">
            Rare specimens, artisan planters and heritage craft — curated and delivered with care.
          </p>
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
