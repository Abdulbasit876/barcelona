'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, CheckCircle2, Loader2 } from 'lucide-react';

export interface PlaceSelection {
  address: string;
  lat?: number;
  lng?: number;
}

interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string, details?: PlaceSelection) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  label?: string;
  required?: boolean;
  icon?: React.ReactNode;
}

interface SuggestionItem {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category?: string;
}

export default function PlacesAutocomplete({
  value,
  onChange,
  placeholder = 'Search address...',
  className = '',
  id,
  label,
  required = false,
  icon,
}: PlacesAutocompleteProps) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<SuggestionItem | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync internal query when value prop changes externally
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search places via Photon (OpenStreetMap real-time geocoder filtered to Catalonia/Spain)
  const fetchSuggestions = async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      // Prioritize Barcelona area coordinates: lat 41.3879, lon 2.1699
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&lat=41.3879&lon=2.1699&limit=7`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Geocoding error');
      const data = await res.json();

      const items: SuggestionItem[] = (data.features || [])
        .map((f: any, idx: number) => {
          const props = f.properties || {};
          const coords = f.geometry?.coordinates || [2.1699, 41.3879]; // [lon, lat]
          const name = props.name || props.street || '';
          const parts = [
            props.name,
            props.street ? (props.housenumber ? `${props.street} ${props.housenumber}` : props.street) : null,
            props.district || props.locality,
            props.city || props.county || 'Barcelona',
            props.country || 'Spain',
          ].filter(Boolean);

          const fullAddress = Array.from(new Set(parts)).join(', ');

          return {
            id: `${props.osm_id || idx}-${idx}`,
            name: name || fullAddress,
            address: fullAddress,
            lat: coords[1],
            lng: coords[0],
            category: props.type || props.osm_value,
          };
        })
        .filter((item: SuggestionItem) => Boolean(item.address));

      setSuggestions(items);
      setIsOpen(items.length > 0);
    } catch (err) {
      console.warn('Real-time geocoding fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setQuery(newVal);
    onChange(newVal); // trigger text change
    setSelectedPlace(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newVal);
    }, 250);
  };

  const handleSelect = (item: SuggestionItem) => {
    setQuery(item.address);
    setSelectedPlace(item);
    setIsOpen(false);
    onChange(item.address, {
      address: item.address,
      lat: item.lat,
      lng: item.lng,
    });
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold uppercase tracking-wider text-gold-400 mb-2"
        >
          {label}
          {required && <span className="text-rose-400 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-400/70 pointer-events-none">
          {icon || <MapPin className="w-4 h-4" />}
        </div>

        <input
          id={id}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
            else if (query.trim().length >= 2) fetchSuggestions(query);
          }}
          placeholder={placeholder}
          required={required}
          className={`w-full pl-10 pr-9 py-3 bg-navy-900/90 border border-navy-700 rounded-xl text-sm text-white placeholder-ice-400/50 focus:outline-none focus:border-gold-500 transition-colors ${className}`}
          autoComplete="off"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading ? (
            <Loader2 className="w-4 h-4 text-gold-400 animate-spin" />
          ) : selectedPlace ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : null}
        </div>
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center justify-between">
            <span>Verified Address Suggestions</span>
            <span className="text-emerald-700 font-extrabold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Route Coordinates
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-sky-50/70 transition flex items-start gap-2.5 group"
              >
                <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-gold-50 text-slate-500 group-hover:text-gold-700 mt-0.5 shrink-0 transition">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 group-hover:text-navy-900 truncate">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {item.address}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                    Lat: {item.lat.toFixed(4)}, Lng: {item.lng.toFixed(4)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
