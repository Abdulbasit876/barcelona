'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Search, MapPin, Clock, Compass, ExternalLink, Calendar } from 'lucide-react';
import { Link } from '../../../navigation';
import { SEED_FAMOUS_PLACES } from '@barcelona/shared';

export default function FamousPlacesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations('places');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModalPlace, setSelectedModalPlace] = useState<any | null>(null);

  const locKey = (locale as 'en' | 'es' | 'fr' | 'it') || 'en';

  const categories = ['All', 'Architecture', 'Culture', 'History', 'Beaches', 'Shopping', 'Sports'];

  const filteredPlaces = SEED_FAMOUS_PLACES.filter((place) => {
    const matchesCategory =
      selectedCategory === 'All' || place.category.toLowerCase() === selectedCategory.toLowerCase();
    const name = (place.name[locKey] || place.name.en).toLowerCase();
    const address = place.address.toLowerCase();
    const query = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || name.includes(query) || address.includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pt-28 pb-16 bg-navy-950 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs uppercase tracking-widest text-gold-400 font-bold">
            Curated Barcelona Highlights
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white">
            {t('title')}
          </h1>
          <p className="text-sm sm:text-base text-ice-300">
            {t('subtitle')}
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="navy-card rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-gold-500 text-navy-950 font-bold shadow-gold'
                    : 'bg-navy-900 text-ice-200 border border-navy-700 hover:border-gold-500/40 hover:text-white'
                }`}
              >
                {cat === 'All' ? t('allCategories') : cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gold-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full bg-navy-950 border border-navy-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-ice-400 focus:outline-none focus:border-gold-400"
            />
          </div>
        </div>

        {/* Attractions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPlaces.map((place) => {
            const name = place.name[locKey] || place.name.en;
            const shortDesc = place.shortDescription[locKey] || place.shortDescription.en;

            return (
              <div
                key={place.id}
                className="navy-card rounded-2xl overflow-hidden flex flex-col justify-between group transition-all duration-300"
              >
                <div>
                  <div className="relative h-60 w-full overflow-hidden">
                    <Image
                      src={place.imageUrl}
                      alt={name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-navy-950/80 backdrop-blur-md border border-gold-500/30 text-[10px] uppercase tracking-wider font-bold text-gold-400 px-3 py-1 rounded-full">
                      {place.category}
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-serif font-bold text-white mb-2 group-hover:text-gold-300 transition-colors">
                      {name}
                    </h3>
                    <p className="text-xs sm:text-sm text-ice-300 leading-relaxed mb-4">
                      {shortDesc}
                    </p>

                    <div className="space-y-1.5 text-xs text-ice-300 border-t border-navy-800 pt-3">
                      <div className="flex items-center space-x-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                        <span className="truncate">{place.address}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                        <span>{place.recommendedDuration}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedModalPlace(place)}
                    className="w-full py-2.5 rounded-xl bg-navy-900 border border-navy-700 text-xs font-semibold text-white hover:border-gold-500/50 hover:text-gold-300 transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <Compass className="w-3.5 h-3.5 text-gold-400" />
                    <span>{t('explorePlace')}</span>
                  </button>

                  <Link
                    href={`/book?destination=${encodeURIComponent(place.address)}`}
                    className="gold-button w-full py-2.5 rounded-xl text-xs font-bold text-center flex items-center justify-center space-x-1 shadow-gold"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{t('bookTransfer')}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Modal for Place Explorer */}
        {selectedModalPlace && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="navy-card max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl relative border border-gold-500/50">
              <div className="relative h-64 w-full">
                <Image
                  src={selectedModalPlace.imageUrl}
                  alt={selectedModalPlace.name[locKey]}
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => setSelectedModalPlace(null)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-navy-950/80 border border-navy-700 text-white hover:text-gold-400 flex items-center justify-center font-bold text-lg"
                >
                  âœ•
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gold-400 px-3 py-1 rounded-full bg-navy-900 border border-gold-500/20">
                    {selectedModalPlace.category}
                  </span>
                  <span className="text-xs text-ice-300">
                    Recommended Visit: {selectedModalPlace.recommendedDuration}
                  </span>
                </div>

                <h3 className="text-2xl font-serif font-bold text-white">
                  {selectedModalPlace.name[locKey] || selectedModalPlace.name.en}
                </h3>

                <p className="text-xs sm:text-sm text-ice-200 leading-relaxed">
                  {selectedModalPlace.description[locKey] || selectedModalPlace.description.en}
                </p>

                <div className="p-3 bg-navy-950 rounded-xl border border-navy-800 text-xs text-ice-300 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gold-400 shrink-0" />
                    <span>{selectedModalPlace.address}</span>
                  </div>
                  <span className="font-mono text-gold-400 text-[11px]">
                    {selectedModalPlace.coordinates.lat.toFixed(4)}, {selectedModalPlace.coordinates.lng.toFixed(4)}
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-3">
                  <Link
                    href={`/book?destination=${encodeURIComponent(selectedModalPlace.address)}`}
                    className="gold-button px-6 py-3 rounded-xl text-xs font-bold shadow-gold"
                  >
                    Book Private Chauffeur to {selectedModalPlace.name[locKey]}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
