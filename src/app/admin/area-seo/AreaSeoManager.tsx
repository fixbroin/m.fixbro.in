'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, Sparkles, Plus, Trash2, RefreshCw, Pencil, ExternalLink, Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SeoCity, getAllCitiesAdmin } from '../city-seo/actions';
import {
  SeoArea,
  getAreasByCityAdmin,
  saveAreaSeo,
  toggleAreaActive,
  regenerateAreaSeo,
  batchRegenerateCityAreaSeo,
  deleteAreaSeo,
  importAreasBatch,
} from './actions';

interface OsmAreaCandidate {
  name: string;
  lat: number;
  lon: number;
}

export default function AreaSeoManager() {
  const { toast } = useToast();
  const [cities, setCities] = useState<SeoCity[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [areas, setAreas] = useState<SeoArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Manual Add/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Partial<SeoArea> & { name: string }>({ name: '' });

  // Interactive OpenStreetMap Area Dialog
  const [osmOpen, setOsmOpen] = useState(false);
  const [mapSearch, setMapSearch] = useState('');
  const [centerCoords, setCenterCoords] = useState<{ lat: number; lon: number }>({ lat: 12.9716, lon: 77.5946 });
  const [radiusKm, setRadiusKm] = useState(15);
  const [onlyMajorAreas, setOnlyMajorAreas] = useState(true);
  const [isFetchingAreas, setIsFetchingAreas] = useState(false);
  const [isImportingAreas, setIsImportingAreas] = useState(false);
  const [fetchedAreas, setFetchedAreas] = useState<OsmAreaCandidate[]>([]);
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>({});
  const [filterText, setFilterText] = useState('');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const areaMarkersRef = useRef<any>(null);
  const [leafletReady, setLeafletReady] = useState(false);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const cityList = await getAllCitiesAdmin();
      setCities(cityList);
      if (cityList.length > 0) {
        setSelectedCityId(cityList[0].id);
        const areaList = await getAreasByCityAdmin(cityList[0].id);
        setAreas(areaList);
      }
      setIsLoading(false);
    }
    init();
  }, []);

  const loadAreas = async (cityId: string) => {
    if (!cityId) return;
    setIsLoading(true);
    const data = await getAreasByCityAdmin(cityId);
    setAreas(data);
    setIsLoading(false);
  };

  const handleCityChange = async (cityId: string) => {
    setSelectedCityId(cityId);
    await loadAreas(cityId);
  };

  const selectedCity = cities.find((c) => c.id === selectedCityId);

  // Load Leaflet CDN once when OSM dialog opens
  useEffect(() => {
    if (!osmOpen) return;
    if (selectedCity) {
      setMapSearch(selectedCity.name);
      if (selectedCity.latitude && selectedCity.longitude) {
        setCenterCoords({ lat: Number(selectedCity.latitude), lon: Number(selectedCity.longitude) });
      }
    }

    if ((window as any).L) {
      setLeafletReady(true);
      return;
    }

    if (!document.querySelector('link[data-leaflet="1"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.setAttribute('data-leaflet', '1');
      document.head.appendChild(link);
    }

    const existingScript = document.querySelector('script[data-leaflet="1"]') as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => setLeafletReady(true));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.setAttribute('data-leaflet', '1');
    script.onload = () => setLeafletReady(true);
    document.body.appendChild(script);
  }, [osmOpen, selectedCity]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!osmOpen || !leafletReady) return;
    const L = (window as any).L;
    if (!L || !mapContainerRef.current) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      (mapContainerRef.current as any)._leaflet_id = null;

      const map = L.map(mapContainerRef.current).setView([centerCoords.lat, centerCoords.lon], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      markerRef.current = L.marker([centerCoords.lat, centerCoords.lon], { icon }).addTo(map);
      circleRef.current = L.circle([centerCoords.lat, centerCoords.lon], {
        radius: radiusKm * 1000,
        color: '#004152',
        fillColor: '#004152',
        fillOpacity: 0.12,
      }).addTo(map);
      areaMarkersRef.current = L.layerGroup().addTo(map);

      map.on('click', (e: any) => {
        setCenterCoords({ lat: e.latlng.lat, lon: e.latlng.lng });
      });

      mapInstanceRef.current = map;
      setTimeout(() => map.invalidateSize(), 150);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [osmOpen, leafletReady]);

  // Sync marker & radius circle when centerCoords or radiusKm changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current || !circleRef.current) return;
    markerRef.current.setLatLng([centerCoords.lat, centerCoords.lon]);
    circleRef.current.setLatLng([centerCoords.lat, centerCoords.lon]);
    circleRef.current.setRadius(radiusKm * 1000);
  }, [centerCoords, radiusKm]);

  // Plot fetched areas
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !areaMarkersRef.current) return;
    areaMarkersRef.current.clearLayers();
    fetchedAreas.slice(0, 120).forEach((a) => {
      L.circleMarker([a.lat, a.lon], {
        radius: 5,
        color: '#b45309',
        fillColor: '#f59e0b',
        fillOpacity: 0.9,
        weight: 1.5,
      })
        .bindPopup(`<strong>${a.name}</strong>`)
        .addTo(areaMarkersRef.current);
    });
  }, [fetchedAreas]);

  const handleSearchLocation = async () => {
    if (!mapSearch.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(mapSearch.trim())}`
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const next = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        setCenterCoords(next);
        mapInstanceRef.current?.setView([next.lat, next.lon], 12);
      } else {
        toast({ title: 'Not found', description: 'Location not found on map.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Search failed', description: 'Could not search Nominatim.', variant: 'destructive' });
    }
  };

  const handleFetchAreasFromMap = async () => {
    setIsFetchingAreas(true);
    setFetchedAreas([]);
    setSelectedMap({});
    try {
      const placeTypes = onlyMajorAreas
        ? 'suburb|quarter|village'
        : 'suburb|neighbourhood|quarter|village|locality';
      const overpassQuery = `[out:json][timeout:25];(node["place"~"${placeTypes}"](around:${radiusKm * 1000},${centerCoords.lat},${centerCoords.lon});way["place"~"${placeTypes}"](around:${radiusKm * 1000},${centerCoords.lat},${centerCoords.lon}););out center 150;`;
      const res = await fetch('/api/admin/overpass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: overpassQuery }),
      });
      const data = await res.json();
      let elements: any[] = Array.isArray(data?.elements) ? data.elements : [];

      // Fallback to Nominatim bounded search around the map center if Overpass is overloaded
      if (!res.ok || elements.length === 0) {
        const deltaLat = radiusKm / 111;
        const deltaLon = radiusKm / (111 * Math.cos((centerCoords.lat * Math.PI) / 180));
        const viewbox = `${centerCoords.lon - deltaLon},${centerCoords.lat + deltaLat},${centerCoords.lon + deltaLon},${centerCoords.lat - deltaLat}`;
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&bounded=1&viewbox=${viewbox}&limit=40&q=${encodeURIComponent(`suburb ${selectedCity?.name || ''}`)}`
        );
        if (nomRes.ok) {
          const nomData = await nomRes.json();
          if (Array.isArray(nomData)) {
            elements = nomData.map((item: any) => ({
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
              tags: { name: (item.name || item.display_name?.split(',')[0] || '').trim() },
            }));
          }
        }
      }

      if (elements.length === 0 && !res.ok) {
        throw new Error(data.details || data.error || 'Overpass query failed');
      }
      const seen = new Set<string>();
      const list: OsmAreaCandidate[] = [];
      for (const el of elements) {
        const name = (el?.tags?.['name:en'] || el?.tags?.name || '').trim();
        if (!name) continue;
        const key = name.toLowerCase();
        if (seen.has(key) || (selectedCity && key === selectedCity.name.toLowerCase())) continue;
        seen.add(key);
        list.push({ name, lat: Number(el.lat), lon: Number(el.lon) });
      }
      list.sort((a, b) => a.name.localeCompare(b.name));
      setFetchedAreas(list);
      const existingAreaNames = new Set(areas.map((a) => a.name.toLowerCase().trim()));
      const sel: Record<string, boolean> = {};
      list.forEach((a) => {
        if (!existingAreaNames.has(a.name.toLowerCase().trim())) {
          sel[a.name] = true;
        }
      });
      setSelectedMap(sel);
      toast({ title: `Found ${list.length} Areas`, description: 'Select areas to import with unique SEO.' });
    } catch (err: any) {
      toast({
        title: 'Fetch Failed',
        description: err?.message || 'Could not fetch areas from OpenStreetMap.',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingAreas(false);
    }
  };

  const handleImportSelected = async () => {
    if (!selectedCityId) return;
    const selected = fetchedAreas.filter((a) => selectedMap[a.name]);
    if (selected.length === 0) return;

    setIsImportingAreas(true);
    const res = await importAreasBatch(selectedCityId, selected);
    setIsImportingAreas(false);

    if (res.success) {
      toast({
        title: 'Areas Imported!',
        description: `Imported ${res.imported} areas for ${selectedCity?.name} with unique SEO templates.`,
      });
      setOsmOpen(false);
      await loadAreas(selectedCityId);
    } else {
      toast({ title: 'Import Error', description: res.error || 'Failed to import areas.', variant: 'destructive' });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCityId) return;
    startTransition(async () => {
      const res = await saveAreaSeo({ ...form, city_id: selectedCityId });
      if (res.success) {
        toast({ title: 'Saved!', description: 'Area SEO saved successfully.' });
        setDialogOpen(false);
        setForm({ name: '' });
        await loadAreas(selectedCityId);
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to save area.', variant: 'destructive' });
      }
    });
  };

  const handleRegenerate = (id: string) => {
    startTransition(async () => {
      const res = await regenerateAreaSeo(id);
      if (res.success) {
        toast({ title: 'Regenerated!', description: 'Applied a new random unique SEO template.' });
        await loadAreas(selectedCityId);
      }
    });
  };

  const handleToggle = (id: string, nextVal: boolean) => {
    startTransition(async () => {
      await toggleAreaActive(id, nextVal);
      setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, is_active: nextVal } : a)));
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteAreaSeo(id);
      if (res.success) {
        toast({ description: 'Area deleted.' });
        setAreas((prev) => prev.filter((a) => a.id !== id));
      }
    });
  };

  const filteredCandidates = fetchedAreas.filter((a) =>
    a.name.toLowerCase().includes(filterText.toLowerCase())
  );
  const selectedCount = fetchedAreas.filter((a) => selectedMap[a.name]).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            OpenStreetMap Area SEO Generator
          </CardTitle>
          <CardDescription>
            Choose a city and open the interactive map to pick neighborhoods/localities by radius and generate unique area SEO pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="w-full sm:w-64">
            <Select value={selectedCityId} onValueChange={handleCityChange} disabled={cities.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={cities.length === 0 ? 'Add a city first' : 'Select city'} />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" onClick={() => setOsmOpen(true)} disabled={!selectedCityId}>
            <Sparkles className="mr-2 h-4 w-4" /> Open Map &amp; Auto-Generate Areas
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!selectedCityId || isPending || areas.length === 0}
            onClick={() => {
              startTransition(async () => {
                const res = await batchRegenerateCityAreaSeo(selectedCityId);
                if (res.success) {
                  toast({ title: 'Batch Area SEO Updated', description: `Regenerated SEO for ${res.updated} areas.` });
                  const nextAreas = await getAreasByCityAdmin(selectedCityId);
                  setAreas(nextAreas);
                }
              });
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Batch Regenerate SEO
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!selectedCityId}
            onClick={() => {
              setForm({ name: '', is_active: true });
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Area Manually
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Area SEO Pages {selectedCity ? `in ${selectedCity.name}` : ''} ({areas.length})
          </CardTitle>
          <CardDescription>
            Each active area is published at /{selectedCity?.slug || 'city'}/area-slug with nearby-area interlinking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Area</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead className="hidden md:table-cell">H1 Title</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading areas...</TableCell>
                  </TableRow>
                ) : cities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Please create or import cities in <Link href="/admin/city-seo" className="text-primary underline">City-wise SEO</Link> first.
                    </TableCell>
                  </TableRow>
                ) : areas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No areas for {selectedCity?.name} yet. Click &ldquo;Open Map &amp; Auto-Generate Areas&rdquo; above.
                    </TableCell>
                  </TableRow>
                ) : (
                  areas.map((area) => (
                    <TableRow key={area.id}>
                      <TableCell className="font-medium">{area.name}</TableCell>
                      <TableCell>
                        <Link
                          href={`/${selectedCity?.slug}/${area.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs font-mono text-primary hover:underline"
                        >
                          /{selectedCity?.slug}/{area.slug}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs truncate text-sm text-muted-foreground">
                        {area.h1_title}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={area.is_active}
                          onCheckedChange={(val) => handleToggle(area.id, val)}
                        />
                      </TableCell>
                      <TableCell className="text-right space-x-1 whitespace-nowrap">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Regenerate random SEO"
                          onClick={() => handleRegenerate(area.id)}
                          disabled={isPending}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Edit"
                          onClick={() => {
                            setForm(area);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          title="Delete"
                          onClick={() => handleDelete(area.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Interactive OpenStreetMap Area Picker Dialog */}
      <Dialog open={osmOpen} onOpenChange={setOsmOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Areas for {selectedCity?.name} (OpenStreetMap)</DialogTitle>
            <DialogDescription>
              Search or click anywhere on the map to set the center point, adjust the radius, and fetch nearby neighborhoods/areas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                value={mapSearch}
                onChange={(e) => setMapSearch(e.target.value)}
                placeholder="Search city or landmark..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchLocation();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleSearchLocation}>
                <Search className="mr-2 h-4 w-4" /> Locate
              </Button>
              <Button type="button" onClick={handleFetchAreasFromMap} disabled={isFetchingAreas}>
                {isFetchingAreas ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fetching...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Fetch Areas</>
                )}
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-muted-foreground">
                <span>Search Radius: {radiusKm} km</span>
                <span>Center: {centerCoords.lat.toFixed(4)}, {centerCoords.lon.toFixed(4)}</span>
              </div>
              <Slider
                min={5}
                max={50}
                step={5}
                value={[radiusKm]}
                onValueChange={(v) => setRadiusKm(v[0] || 15)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="only-major-areas"
                checked={onlyMajorAreas}
                onCheckedChange={(v) => setOnlyMajorAreas(Boolean(v))}
                disabled={isFetchingAreas || isImportingAreas}
              />
              <Label htmlFor="only-major-areas" className="text-xs font-medium cursor-pointer">
                Only major areas (Excludes minor layouts, building names, and apartments)
              </Label>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border overflow-hidden h-[320px] bg-muted">
                <div ref={mapContainerRef} className="w-full h-full" />
              </div>

              <div className="rounded-xl border p-3 flex flex-col h-[320px]">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold shrink-0">
                    {fetchedAreas.length > 0 ? `Found ${fetchedAreas.length} Areas` : 'Areas'}
                  </span>
                  <Input
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="Filter areas..."
                    className="h-8 text-xs"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs shrink-0"
                    onClick={() => {
                      const allSelected = fetchedAreas.length > 0 && selectedCount === fetchedAreas.length;
                      const next: Record<string, boolean> = {};
                      fetchedAreas.forEach((a) => {
                        next[a.name] = !allSelected;
                      });
                      setSelectedMap(next);
                    }}
                  >
                    {fetchedAreas.length > 0 && selectedCount === fetchedAreas.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                <ScrollArea className="flex-1 pr-2">
                  {filteredCandidates.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-12">
                      Click &ldquo;Fetch Areas&rdquo; to load suburbs &amp; neighborhoods within {radiusKm} km.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {filteredCandidates.map((a) => {
                        const alreadyExists = areas.some(
                          (ea) => ea.name.toLowerCase().trim() === a.name.toLowerCase().trim()
                        );
                        return (
                          <label
                            key={a.name}
                            className="flex items-center justify-between gap-2 p-2 rounded-md border hover:bg-muted cursor-pointer text-xs"
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <Checkbox
                                checked={Boolean(selectedMap[a.name])}
                                onCheckedChange={(v) =>
                                  setSelectedMap((p) => ({ ...p, [a.name]: Boolean(v) }))
                                }
                              />
                              <span className="truncate">{a.name}</span>
                            </span>
                            {alreadyExists && (
                              <span className="text-[10px] text-muted-foreground shrink-0">Added</span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOsmOpen(false)}>
              Close
            </Button>
            <Button
              type="button"
              onClick={handleImportSelected}
              disabled={isImportingAreas || selectedCount === 0}
            >
              {isImportingAreas ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</>
              ) : (
                `Import ${selectedCount} Selected Areas`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? `Edit ${form.name} SEO` : `Add Area in ${selectedCity?.name}`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="area-name">Area Name *</Label>
              <Input
                id="area-name"
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Whitefield"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="area-h1">H1 Title (leave blank to auto-generate randomly)</Label>
              <Input
                id="area-h1"
                value={form.h1_title || ''}
                onChange={(e) => setForm((p) => ({ ...p, h1_title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="area-para">Intro Paragraph (leave blank to auto-generate)</Label>
              <Textarea
                id="area-para"
                value={form.paragraph || ''}
                onChange={(e) => setForm((p) => ({ ...p, paragraph: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="area-mt">Meta Title</Label>
              <Input
                id="area-mt"
                value={form.meta_title || ''}
                onChange={(e) => setForm((p) => ({ ...p, meta_title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="area-md">Meta Description</Label>
              <Textarea
                id="area-md"
                value={form.meta_description || ''}
                onChange={(e) => setForm((p) => ({ ...p, meta_description: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="area-kw">Meta Keywords</Label>
              <Textarea
                id="area-kw"
                value={form.meta_keywords || ''}
                onChange={(e) => setForm((p) => ({ ...p, meta_keywords: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save Area SEO'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
