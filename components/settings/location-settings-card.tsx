"use client";

import { MapPin, Save } from "lucide-react";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";

export interface LocationData {
  officeLat: number;
  officeLng: number;
  radiusMeters: number;
  strictGeofence: boolean;
}

interface LocationSettingsCardProps {
  location: LocationData;
  setLocation: (val: LocationData) => void;
  onSave: () => void;
  saving: boolean;
}

export function LocationSettingsCard({
  location,
  setLocation,
  onSave,
  saving,
}: LocationSettingsCardProps) {
  return (
    <NeuCard>
      <NeuCardHeader>
        <NeuCardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[var(--neu-accent)]" /> Configuration de Géolocalisation & Geofence
        </NeuCardTitle>
      </NeuCardHeader>
      <NeuCardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NeuInput
            label="Latitude Bureau"
            type="number"
            step="0.0001"
            value={location.officeLat}
            onChange={(e) => setLocation({ ...location, officeLat: Number(e.target.value) })}
          />
          <NeuInput
            label="Longitude Bureau"
            type="number"
            step="0.0001"
            value={location.officeLng}
            onChange={(e) => setLocation({ ...location, officeLng: Number(e.target.value) })}
          />
          <NeuInput
            label="Rayon Autorisé (mètres)"
            type="number"
            value={location.radiusMeters}
            onChange={(e) => setLocation({ ...location, radiusMeters: Number(e.target.value) })}
          />
        </div>

        <div className="flex justify-end pt-4">
          <NeuButton variant="accent" onClick={onSave} loading={saving}>
            <Save className="w-4 h-4 mr-2" /> Enregistrer Géolocalisation
          </NeuButton>
        </div>
      </NeuCardContent>
    </NeuCard>
  );
}
