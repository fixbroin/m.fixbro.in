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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Globe, Sparkles, Plus, Trash2, RefreshCw, Pencil, ExternalLink, Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  SeoCity,
  getAllCitiesAdmin,
  saveCitySeo,
  toggleCityActive,
  regenerateCitySeo,
  batchRegenerateAllCitySeo,
  deleteCitySeo,
  importCitiesBatch,
} from './actions';

interface OsmCityCandidate {
  name: string;
  lat: number | null;
  lon: number | null;
}

const EMPTY_FORM: Partial<SeoCity> & { name: string } = {
  name: '',
  slug: '',
  country: 'India',
  h1_title: '',
  paragraph: '',
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
  is_active: true,
};

export default function CitySeoManager() {
  const { toast } = useToast();
  const [cities, setCities] = useState<SeoCity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Manual Add/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Partial<SeoCity> & { name: string }>(EMPTY_FORM);

  // OSM Map & Search Popup
  const [osmOpen, setOsmOpen] = useState(false);
  const [searchBy, setSearchBy] = useState<'country' | 'state'>('country');
  const [countryQuery, setCountryQuery] = useState('India');
  const [onlyMajorCities, setOnlyMajorCities] = useState(true);
  const [isSearchingOsm, setIsSearchingOsm] = useState(false);
  const [isImportingOsm, setIsImportingOsm] = useState(false);
  const [fetchedCities, setFetchedCities] = useState<OsmCityCandidate[]>([]);
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>({});
  const [filterText, setFilterText] = useState('');

  // Leaflet refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const [leafletReady, setLeafletReady] = useState(false);

  const loadCities = async () => {
    setIsLoading(true);
    const data = await getAllCitiesAdmin();
    setCities(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadCities();
  }, []);

  // Load Leaflet CDN once when OSM dialog opens
  useEffect(() => {
    if (!osmOpen) return;
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
  }, [osmOpen]);

  // Initialize Leaflet Map inside OSM dialog
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

      const map = L.map(mapContainerRef.current).setView([20.5937, 78.9629], 4);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
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

  // Plot fetched cities on the Leaflet map
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    if (fetchedCities.length === 0) return;
    const bounds: any[] = [];
    fetchedCities.slice(0, 100).forEach((c) => {
      if (c.lat === null || c.lon === null) return;
      const marker = L.circleMarker([c.lat, c.lon], {
        radius: 6,
        color: '#004152',
        fillColor: '#f59e0b',
        fillOpacity: 0.9,
        weight: 2,
      }).bindPopup(`<strong>${c.name}</strong>`);
      marker.addTo(markersLayerRef.current);
      bounds.push([c.lat, c.lon]);
    });

    if (bounds.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [24, 24], maxZoom: 7 });
    }
  }, [fetchedCities]);

  const handleSearchOsm = async () => {
    const queryText = countryQuery.trim();
    if (!queryText) return;

    setIsSearchingOsm(true);
    setFetchedCities([]);
    setSelectedMap({});
    setFilterText('');

    try {
      // Center map on searched country/state via Nominatim
      fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(queryText)}`)
        .then((r) => r.json())
        .then((nomData) => {
          if (Array.isArray(nomData) && nomData.length > 0 && mapInstanceRef.current) {
            mapInstanceRef.current.setView(
              [parseFloat(nomData[0].lat), parseFloat(nomData[0].lon)],
              5
            );
          }
        })
        .catch(() => {});

      const res = await fetch('/api/admin/cities-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: queryText, searchBy, onlyMajorCities }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load cities.');
      }

      const list: OsmCityCandidate[] = Array.isArray(data.cities) ? data.cities : [];
      setFetchedCities(list);

      const existingNames = new Set(cities.map((c) => c.name.toLowerCase().trim()));
      const initialSel: Record<string, boolean> = {};
      if (list.length <= 50) {
        list.forEach((c) => {
          if (!existingNames.has(c.name.toLowerCase().trim())) {
            initialSel[c.name] = true;
          }
        });
      }
      setSelectedMap(initialSel);

      toast({
        title: `Found ${list.length} Cities in ${queryText}`,
        description:
          list.length > 50
            ? 'Use the filter box to search and select the cities you want to import.'
            : 'Select the cities you want to import with unique SEO templates.',
      });
    } catch (err: any) {
      toast({
        title: 'City Lookup Error',
        description: err?.message || 'Could not fetch cities.',
        variant: 'destructive',
      });
    } finally {
      setIsSearchingOsm(false);
    }
  };

  const handleImportSelected = async () => {
    const selected = fetchedCities.filter((c) => selectedMap[c.name]);
    if (selected.length === 0) return;

    setIsImportingOsm(true);
    const res = await importCitiesBatch(countryQuery.trim() || 'India', selected);
    setIsImportingOsm(false);

    if (res.success) {
      toast({
        title: 'Cities Imported!',
        description: `Imported ${res.imported} cities with unique random SEO templates.`,
      });
      setOsmOpen(false);
      await loadCities();
    } else {
      toast({ title: 'Import Error', description: res.error || 'Failed to import.', variant: 'destructive' });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveCitySeo(form);
      if (res.success) {
        toast({ title: 'Saved!', description: 'City SEO saved successfully.' });
        setDialogOpen(false);
        setForm(EMPTY_FORM);
        await loadCities();
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to save city.', variant: 'destructive' });
      }
    });
  };

  const handleRegenerate = (id: string) => {
    startTransition(async () => {
      const res = await regenerateCitySeo(id);
      if (res.success) {
        toast({ title: 'Regenerated!', description: 'Applied a new random unique SEO template.' });
        await loadCities();
      }
    });
  };

  const handleToggle = (id: string, nextVal: boolean) => {
    startTransition(async () => {
      await toggleCityActive(id, nextVal);
      setCities((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: nextVal } : c)));
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteCitySeo(id);
      if (res.success) {
        toast({ description: 'City deleted.' });
        setCities((prev) => prev.filter((c) => c.id !== id));
      }
    });
  };

  const filteredCandidates = fetchedCities.filter((c) =>
    c.name.toLowerCase().includes(filterText.toLowerCase())
  );
  const selectedCount = fetchedCities.filter((c) => selectedMap[c.name]).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            OpenStreetMap City SEO Generator
          </CardTitle>
          <CardDescription>
            Open the interactive OpenStreetMap importer to search any country or state, view cities on the map, and generate unique SEO pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => setOsmOpen(true)}>
            <Sparkles className="mr-2 h-4 w-4" /> Open Map &amp; Auto-Generate Cities
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending || cities.length === 0}
            onClick={() => {
              startTransition(async () => {
                const res = await batchRegenerateAllCitySeo();
                if (res.success) {
                  toast({ title: 'Batch SEO Updated', description: `Regenerated SEO for ${res.updated} cities.` });
                  await loadCities();
                }
              });
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Batch Regenerate All SEO
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setForm(EMPTY_FORM);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add City Manually
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>City SEO Pages ({cities.length})</CardTitle>
          <CardDescription>
            Each active city is published at /city-slug with breadcrumbs, canonical URL, and interlinking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>City</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead className="hidden md:table-cell">H1 Title</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading cities...</TableCell>
                  </TableRow>
                ) : cities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No cities added yet. Click &ldquo;Open Map &amp; Auto-Generate Cities&rdquo; above to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  cities.map((city) => (
                    <TableRow key={city.id}>
                      <TableCell className="font-medium">
                        {city.name}
                        <span className="block text-xs text-muted-foreground">{city.country}</span>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/${city.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs font-mono text-primary hover:underline"
                        >
                          /{city.slug}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs truncate text-sm text-muted-foreground">
                        {city.h1_title}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={city.is_active}
                          onCheckedChange={(val) => handleToggle(city.id, val)}
                        />
                      </TableCell>
                      <TableCell className="text-right space-x-1 whitespace-nowrap">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Regenerate random SEO"
                          onClick={() => handleRegenerate(city.id)}
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
                            setForm(city);
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
                          onClick={() => handleDelete(city.id)}
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

      {/* Interactive OpenStreetMap Importer Popup */}
      <Dialog open={osmOpen} onOpenChange={setOsmOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Import Cities from Country / State
            </DialogTitle>
            <DialogDescription>
              Select search level, type a country or state name, preview on OpenStreetMap, and select cities to import with unique SEO templates.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Search By</Label>
              <div className="flex gap-5">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="citySearchBy"
                    value="country"
                    checked={searchBy === 'country'}
                    onChange={() => {
                      setSearchBy('country');
                      setFetchedCities([]);
                      setSelectedMap({});
                    }}
                    className="accent-primary"
                    disabled={isSearchingOsm || isImportingOsm}
                  />
                  Country
                </label>
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="citySearchBy"
                    value="state"
                    checked={searchBy === 'state'}
                    onChange={() => {
                      setSearchBy('state');
                      setFetchedCities([]);
                      setSelectedMap({});
                    }}
                    className="accent-primary"
                    disabled={isSearchingOsm || isImportingOsm}
                  />
                  State / Province
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="major-cities-only"
                checked={onlyMajorCities}
                onCheckedChange={(v) => setOnlyMajorCities(Boolean(v))}
                disabled={isSearchingOsm || isImportingOsm}
              />
              <Label htmlFor="major-cities-only" className="text-sm font-normal cursor-pointer">
                Only major cities (Excludes smaller towns)
              </Label>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                {searchBy === 'country' ? 'Country Name' : 'State / Province Name'}
              </Label>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  value={countryQuery}
                  onChange={(e) => setCountryQuery(e.target.value)}
                  placeholder={
                    searchBy === 'country'
                      ? 'e.g. India, United States, United Kingdom'
                      : 'e.g. Karnataka, Maharashtra, California'
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchOsm();
                    }
                  }}
                  disabled={isSearchingOsm || isImportingOsm}
                />
                <Button type="button" onClick={handleSearchOsm} disabled={isSearchingOsm || isImportingOsm || !countryQuery.trim()}>
                  {isSearchingOsm ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...</>
                  ) : (
                    <><Search className="mr-2 h-4 w-4" /> Search</>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border overflow-hidden h-[320px] bg-muted">
                <div ref={mapContainerRef} className="w-full h-full" />
              </div>

              <div className="rounded-xl border p-3 flex flex-col h-[320px]">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold shrink-0">
                    {fetchedCities.length > 0 ? `Found ${fetchedCities.length} Cities` : 'Cities'}
                  </span>
                  <Input
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="Filter cities..."
                    className="h-8 text-xs"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs shrink-0"
                    onClick={() => {
                      const allSelected = fetchedCities.length > 0 && selectedCount === fetchedCities.length;
                      const next: Record<string, boolean> = {};
                      fetchedCities.forEach((c) => {
                        next[c.name] = !allSelected;
                      });
                      setSelectedMap(next);
                    }}
                  >
                    {fetchedCities.length > 0 && selectedCount === fetchedCities.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                <ScrollArea className="flex-1 pr-2">
                  {filteredCandidates.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-12">
                      Search a country or state to load cities here.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {filteredCandidates.map((c) => {
                        const alreadyExists = cities.some(
                          (ec) => ec.name.toLowerCase().trim() === c.name.toLowerCase().trim()
                        );
                        return (
                          <label
                            key={c.name}
                            className="flex items-center justify-between gap-2 p-2 rounded-md border hover:bg-muted cursor-pointer text-xs"
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <Checkbox
                                checked={Boolean(selectedMap[c.name])}
                                onCheckedChange={(v) =>
                                  setSelectedMap((p) => ({ ...p, [c.name]: Boolean(v) }))
                                }
                              />
                              <span className="truncate">{c.name}</span>
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
              disabled={isImportingOsm || selectedCount === 0}
            >
              {isImportingOsm ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</>
              ) : (
                `Import ${selectedCount} Selected Cities`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? `Edit ${form.name} SEO` : 'Add City SEO'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="city-name">City Name *</Label>
                <Input
                  id="city-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Bangalore"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city-country">Country</Label>
                <Input
                  id="city-country"
                  value={form.country || ''}
                  onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                  placeholder="India"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city-h1">H1 Title (leave blank to auto-generate randomly)</Label>
              <Input
                id="city-h1"
                value={form.h1_title || ''}
                onChange={(e) => setForm((p) => ({ ...p, h1_title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city-para">Intro Paragraph (leave blank to auto-generate)</Label>
              <Textarea
                id="city-para"
                value={form.paragraph || ''}
                onChange={(e) => setForm((p) => ({ ...p, paragraph: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city-mt">Meta Title</Label>
              <Input
                id="city-mt"
                value={form.meta_title || ''}
                onChange={(e) => setForm((p) => ({ ...p, meta_title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city-md">Meta Description</Label>
              <Textarea
                id="city-md"
                value={form.meta_description || ''}
                onChange={(e) => setForm((p) => ({ ...p, meta_description: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city-kw">Meta Keywords</Label>
              <Textarea
                id="city-kw"
                value={form.meta_keywords || ''}
                onChange={(e) => setForm((p) => ({ ...p, meta_keywords: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save City SEO'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
