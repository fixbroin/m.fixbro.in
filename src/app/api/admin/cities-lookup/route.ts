import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, searchBy = 'country', onlyMajorCities = true } = await request.json();
    const queryText = String(country || '').trim();
    if (!queryText) {
      return NextResponse.json({ error: 'Country or state is required' }, { status: 400 });
    }

    // 1. Try Nominatim + Overpass first (returns ~508 major cities with coordinates when Overpass is responsive)
    const featureParam = searchBy === 'state' ? '&featuretype=state' : '&featuretype=country';
    let place: any = null;
    try {
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1${featureParam}&q=${encodeURIComponent(queryText)}`,
        { headers: { 'User-Agent': 'FixbroApp/1.0 (sup@fixbro.in)', Accept: 'application/json' }, signal: AbortSignal.timeout(6000) }
      );
      const nomData = nomRes.ok ? await nomRes.json() : [];
      if (Array.isArray(nomData) && nomData.length > 0) {
        place = nomData[0];
      }
    } catch {
      // Ignore Nominatim timeout and try fallback
    }

    if (place) {
      try {
        const placeFilter = onlyMajorCities ? 'node["place"="city"]' : 'node["place"~"city|town"]';
        const overpassQuery =
          place.osm_type === 'relation' && place.osm_id
            ? `[out:json][timeout:15];area(${3600000000 + Number(place.osm_id)})->.a;(${placeFilter}(area.a););out body;`
            : `[out:json][timeout:15];(${placeFilter}(around:250000,${place.lat},${place.lon}););out body;`;

        const ovData = await Promise.any(
          OVERPASS_ENDPOINTS.map(async (ep) => {
            const r = await fetch(ep, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'FixbroApp/1.0 (sup@fixbro.in)',
                Accept: 'application/json',
              },
              body: `data=${encodeURIComponent(overpassQuery)}`,
              signal: AbortSignal.timeout(7000),
            });
            if (!r.ok) throw new Error(`Status ${r.status}`);
            return r.json();
          })
        );

        const elements: any[] = Array.isArray(ovData?.elements) ? ovData.elements : [];
        const seen = new Set<string>();
        const cities = elements
          .map((el) => ({
            name: String(el?.tags?.['name:en'] || el?.tags?.name || '').trim(),
            lat: Number(el.lat),
            lon: Number(el.lon),
          }))
          .filter((c) => {
            const k = c.name.toLowerCase();
            if (!c.name || seen.has(k)) return false;
            seen.add(k);
            return true;
          })
          .sort((a, b) => a.name.localeCompare(b.name));

        if (cities.length > 0) {
          return NextResponse.json({
            source: 'overpass',
            center: { lat: parseFloat(place.lat), lon: parseFloat(place.lon) },
            cities,
          });
        }
      } catch {
        // Fall through to CountriesNow fallback if Overpass timed out or returned 502/406
      }
    }

    // 2. When searching by Country with "Only major cities", use OpenDataSoft GeoNames (population > 100,000 -> ~538 major cities in India with coordinates)
    if (searchBy === 'country' && onlyMajorCities) {
      try {
        const baseWhere = encodeURIComponent(`cou_name_en="${queryText}" AND population>100000`);
        const firstRes = await fetch(
          `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/geonames-all-cities-with-a-population-1000/records?where=${baseWhere}&limit=100&offset=0`,
          { signal: AbortSignal.timeout(7000) }
        );
        if (firstRes.ok) {
          const firstData = await firstRes.json();
          const totalCount = Number(firstData.total_count || 0);
          const allRecords: any[] = Array.isArray(firstData.results) ? [...firstData.results] : [];

          if (totalCount > 100) {
            const offsets: number[] = [];
            for (let off = 100; off < Math.min(totalCount, 1500); off += 100) {
              offsets.push(off);
            }
            const pages = await Promise.all(
              offsets.map((off) =>
                fetch(
                  `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/geonames-all-cities-with-a-population-1000/records?where=${baseWhere}&limit=100&offset=${off}`,
                  { signal: AbortSignal.timeout(7000) }
                ).then((r) => (r.ok ? r.json() : { results: [] }))
              )
            );
            pages.forEach((p) => {
              if (Array.isArray(p?.results)) allRecords.push(...p.results);
            });
          }

          if (allRecords.length > 0) {
            const seen = new Set<string>();
            const cities = allRecords
              .map((rec) => ({
                name: String(rec.name || rec.ascii_name || '').trim(),
                lat: typeof rec.coordinates?.lat === 'number' ? rec.coordinates.lat : null,
                lon: typeof rec.coordinates?.lon === 'number' ? rec.coordinates.lon : null,
              }))
              .filter((c) => {
                const k = c.name.toLowerCase();
                if (!c.name || seen.has(k)) return false;
                seen.add(k);
                return true;
              })
              .sort((a, b) => a.name.localeCompare(b.name));

            if (cities.length > 0) {
              return NextResponse.json({ source: 'geonames', cities });
            }
          }
        }
      } catch {
        // Fall through to CountriesNow
      }
    }

    // 3. Fallback to CountriesNow API (all cities & towns when onlyMajorCities is unchecked or GeoNames unavailable)
    if (searchBy === 'country') {
      const cnRes = await fetch('https://countriesnow.space/api/v0.1/countries/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: queryText }),
        signal: AbortSignal.timeout(8000),
      });
      if (cnRes.ok) {
        const cnData = await cnRes.json();
        if (!cnData.error && Array.isArray(cnData.data) && cnData.data.length > 0) {
          const seen = new Set<string>();
          const cities = cnData.data
            .map((name: string) => String(name).trim())
            .filter((name: string) => {
              const k = name.toLowerCase();
              if (!name || seen.has(k)) return false;
              seen.add(k);
              return true;
            })
            .sort((a: string, b: string) => a.localeCompare(b))
            .map((name: string) => ({ name, lat: null, lon: null }));

          return NextResponse.json({ source: 'countriesnow', cities });
        }
      }
    }

    return NextResponse.json(
      { error: `Could not fetch cities for "${queryText}" (Overpass timed out).` },
      { status: 502 }
    );
  } catch (error: any) {
    console.error('Cities lookup error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch cities.' },
      { status: 502 }
    );
  }
}
