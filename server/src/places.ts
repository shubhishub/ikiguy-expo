// Google Places (New) text search, proxied so the API key stays server-side.
// Set GOOGLE_MAPS_API_KEY in the server env. Without it, search returns [].

const key = process.env.GOOGLE_MAPS_API_KEY;

export type PlaceResult = {
  placeId: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  types: string[];
  isHealth: boolean;
};

// Place types Google classifies as health/medical.
const HEALTH_TYPES = new Set([
  'hospital', 'doctor', 'dentist', 'pharmacy', 'physiotherapist',
  'medical_lab', 'health', 'clinic', 'wellness_center', 'drugstore',
]);

export function placesConfigured(): boolean {
  return !!key;
}

export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  if (!key) return [];
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.location,places.types',
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 12 }),
  });

  if (!res.ok) {
    console.error('[places] search failed', res.status, await res.text().catch(() => ''));
    return [];
  }

  const data = (await res.json()) as {
    places?: {
      id: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      location?: { latitude?: number; longitude?: number };
      types?: string[];
    }[];
  };

  return (data.places ?? []).map((p) => {
    const types = p.types ?? [];
    return {
      placeId: p.id,
      name: p.displayName?.text ?? 'Unknown place',
      address: p.formattedAddress ?? '',
      lat: p.location?.latitude ?? null,
      lng: p.location?.longitude ?? null,
      types,
      isHealth: types.some((t) => HEALTH_TYPES.has(t)),
    };
  });
}
