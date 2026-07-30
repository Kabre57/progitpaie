"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Search, Navigation, CheckCircle2, Shield, RefreshCw } from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";

interface GeolocationConfigProps {
  initialLat?: number;
  initialLng?: number;
  initialRadius?: number;
  onSave?: (data: { latitude: number; longitude: number; radiusMeters: number }) => void;
}

export default function GeolocationConfig({
  initialLat = 5.3484,
  initialLng = -4.0305,
  initialRadius = 100,
  onSave,
}: GeolocationConfigProps) {
  const [lat, setLat] = useState<number>(initialLat);
  const [lng, setLng] = useState<number>(initialLng);
  const [radius, setRadius] = useState<number>(initialRadius);
  const [addressSearch, setAddressSearch] = useState<string>("");
  const [detectedAddress, setDetectedAddress] = useState<string>("Abidjan Plateau, Côte d'Ivoire");
  const [searching, setSearching] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<Array<{ name: string; lat: number; lng: number }>>([]);

  // Geocoding Inverse (Met à jour le texte d'adresse à partir des coordonnées Lat/Lng)
  const fetchAddressForCoords = async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(`/api/geocode/search?lat=${latitude}&lng=${longitude}`);
      const json = await res.json();
      if (json.success && json.address) {
        setDetectedAddress(json.address);
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    }
  };

  useEffect(() => {
    fetchAddressForCoords(lat, lng);
  }, [lat, lng]);

  // Recherche textuelle d'adresse
  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressSearch.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(addressSearch)}`);
      const json = await res.json();
      if (json.success && json.results.length > 0) {
        setSearchResults(json.results);
        const top = json.results[0];
        setLat(top.lat);
        setLng(top.lng);
      }
    } catch (err) {
      console.error("Address search error:", err);
    } finally {
      setSearching(false);
    }
  };

  // Centrer sur la position GPS de l'administrateur
  const handleUseCurrentPosition = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      (err) => console.error("GPS error:", err),
      { enableHighAccuracy: true }
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          radiusMeters: radius,
        }),
      });

      const json = await res.json();
      if (json.success && onSave) {
        onSave({ latitude: lat, longitude: lng, radiusMeters: radius });
      }
    } catch (err) {
      console.error("Save geofence error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <NeuCard className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--neu-border)] pb-4">
        <div>
          <h3 className="font-bold text-lg text-[var(--neu-text)] flex items-center gap-2">
            <MapPin className="text-emerald-500" size={22} />
            Carte Interactive & Périmètre de Géolocalisation (Geofence)
          </h3>
          <p className="text-xs text-[var(--neu-text-subtle)] mt-1">
            Définissez visuellement la position exacte de votre bureau et ajustez le rayon de pointage autorisé.
          </p>
        </div>

        <NeuButton
          onClick={handleUseCurrentPosition}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 flex items-center gap-1.5"
        >
          <Navigation size={14} />
          Centrer sur Ma Position GPS
        </NeuButton>
      </div>

      {/* CHERCHER UNE ADRESSE */}
      <form onSubmit={handleSearchAddress} className="flex gap-2">
        <div className="flex-1 relative">
          <NeuInput
            type="text"
            placeholder="Rechercher une adresse (ex: Immeuble Postel 2001, Abidjan Plateau)..."
            value={addressSearch}
            onChange={(e) => setAddressSearch(e.target.value)}
          />
        </div>
        <NeuButton type="submit" disabled={searching} className="bg-emerald-600 text-white px-4">
          <Search size={16} className={searching ? "animate-spin" : ""} />
        </NeuButton>
      </form>

      {/* RÉSULTATS DE RECHERCHE D'ADRESSE */}
      {searchResults.length > 0 && (
        <div className="bg-[var(--neu-bg-subtle)] border border-[var(--neu-border)] rounded-xl p-2 space-y-1 text-xs max-h-36 overflow-y-auto">
          {searchResults.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setLat(item.lat);
                setLng(item.lng);
                setSearchResults([]);
              }}
              className="w-full text-left p-2 hover:bg-emerald-500/10 rounded-lg text-[var(--neu-text)] transition truncate block"
            >
              📍 {item.name}
            </button>
          ))}
        </div>
      )}

      {/* VUE CARTOGRAPHIQUE INTERACTIVE VISUELLE (MOCKUP INTERACTIF DYNAMIQUE) */}
      <div className="relative w-full h-64 bg-slate-900 rounded-2xl overflow-hidden border-2 border-emerald-500/30 flex items-center justify-center shadow-inner">
        {/* Grille et fond carte radar */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

        {/* Cercle du Rayon de Pointage (Geofence Circle) */}
        <div
          className="absolute rounded-full border-2 border-emerald-500 bg-emerald-500/15 animate-pulse transition-all duration-300 flex items-center justify-center pointer-events-none"
          style={{
            width: `${Math.min(240, Math.max(60, (radius / 500) * 200))}px`,
            height: `${Math.min(240, Math.max(60, (radius / 500) * 200))}px`,
          }}
        />

        {/* Marqueur du Bureau (Pin) */}
        <div className="relative z-10 flex flex-col items-center animate-bounce">
          <div className="bg-rose-600 text-white p-2.5 rounded-full shadow-lg border-2 border-white">
            <MapPin size={24} />
          </div>
          <span className="bg-slate-900/90 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-slate-700 shadow mt-1">
            Siège / Bureau ({radius}m)
          </span>
        </div>

        {/* Contrôles d'information sur la carte */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-700 text-white text-[11px] p-2.5 rounded-xl font-mono space-y-0.5 backdrop-blur-sm">
          <div>LAT : {lat.toFixed(6)}</div>
          <div>LNG : {lng.toFixed(6)}</div>
        </div>

        <div className="absolute top-3 right-3 bg-emerald-600/90 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow backdrop-blur-sm">
          ⭕ Zone de Pointage Autorisée : {radius}m
        </div>
      </div>

      {/* REGLAGE DYNAMIQUE DU RAYON (SLIDER) */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-bold text-[var(--neu-text)]">
          <span>📏 Rayon d'Autorisation de Pointage (Geofence Radius)</span>
          <span className="text-emerald-600 font-mono text-sm">{radius} mètres</span>
        </div>

        <input
          type="range"
          min="50"
          max="1000"
          step="25"
          value={radius}
          onChange={(e) => setRadius(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-[var(--neu-bg-subtle)] rounded-lg appearance-none cursor-pointer accent-emerald-600"
        />

        <div className="flex justify-between text-[10px] text-[var(--neu-text-subtle)]">
          <span>50m (Strict)</span>
          <span>250m (Moyen)</span>
          <span>1000m (Large / Campus)</span>
        </div>
      </div>

      {/* ADRESSE DÉTECTÉE */}
      <div className="p-3 bg-[var(--neu-bg-subtle)] rounded-xl border border-[var(--neu-border)] text-xs text-[var(--neu-text)] flex items-center justify-between">
        <div>
          <span className="font-semibold text-[var(--neu-text-subtle)] block text-[11px]">Adresse physique détectée :</span>
          <span>{detectedAddress}</span>
        </div>
        <CheckCircle2 size={18} className="text-emerald-500 shrink-0 ml-2" />
      </div>

      {/* BOUTON D'ENREGISTREMENT */}
      <div className="flex justify-end pt-2">
        <NeuButton
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 flex items-center gap-2"
        >
          {saving ? "Enregistrement..." : "💾 Enregistrer la Géolocalisation Bureau"}
        </NeuButton>
      </div>
    </NeuCard>
  );
}
