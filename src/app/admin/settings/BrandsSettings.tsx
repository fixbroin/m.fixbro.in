'use client';

import { useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ImageUploadInput from './ImageUploadInput';
import { deleteFile } from '@/lib/storage-actions';
import {
  getBrandsSection,
  updateBrandsSection,
  BrandItem,
  BrandsSectionContent,
} from './actions/brands-actions';

export default function BrandsSettings() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState<BrandsSectionContent>({
    title: 'Top brands',
    subtitle: 'We use high-quality materials and fittings, only from brands we trust.',
    row1: [],
    row2: [],
  });

  useEffect(() => {
    startTransition(async () => {
      const data = await getBrandsSection();
      setContent(data);
    });
  }, []);

  const updateRowItem = (
    rowKey: 'row1' | 'row2',
    index: number,
    patch: Partial<BrandItem>
  ) => {
    setContent((prev) => {
      const nextRow = [...prev[rowKey]];
      nextRow[index] = { ...nextRow[index], ...patch };
      return { ...prev, [rowKey]: nextRow };
    });
  };

  const addRowItem = (rowKey: 'row1' | 'row2') => {
    setContent((prev) => ({
      ...prev,
      [rowKey]: [
        ...prev[rowKey],
        { id: `${rowKey}-${Date.now()}`, name: 'New Brand', imageUrl: '' },
      ],
    }));
  };

  const removeRowItem = async (rowKey: 'row1' | 'row2', index: number) => {
    const target = content[rowKey][index];
    if (target?.imageUrl) {
      await deleteFile(target.imageUrl);
    }
    setContent((prev) => ({
      ...prev,
      [rowKey]: prev[rowKey].filter((_, i) => i !== index),
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateBrandsSection(content);
        toast({ title: 'Success!', description: 'Brands section updated.' });
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to update brands section.',
          variant: 'destructive',
        });
      }
    });
  };

  const renderRowEditor = (rowKey: 'row1' | 'row2', heading: string) => (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">{heading}</h3>
        <Button type="button" variant="outline" size="sm" onClick={() => addRowItem(rowKey)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Brand
        </Button>
      </div>
      <Separator />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {content[rowKey].map((brand, idx) => (
          <div key={brand.id || idx} className="rounded-lg border p-4 space-y-3 bg-muted/20">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={`${rowKey}-name-${idx}`}>Brand Name</Label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => removeRowItem(rowKey, idx)}
                aria-label="Delete brand"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Input
              id={`${rowKey}-name-${idx}`}
              value={brand.name}
              onChange={(e) => updateRowItem(rowKey, idx, { name: e.target.value })}
              placeholder="Brand name"
            />
            <div className="space-y-1.5">
              <Label>Brand Logo</Label>
              <ImageUploadInput
                id={`${rowKey}-logo-${idx}`}
                value={brand.imageUrl}
                onChange={(url) => updateRowItem(rowKey, idx, { imageUrl: url })}
                folder="brands"
                accept="image/png, image/jpeg, image/webp, image/svg+xml"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Brands Section</CardTitle>
        <CardDescription>
          Manage the scrolling brand logos on the homepage. Replacing or deleting a logo removes the old file from disk.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-8">
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="text-lg font-semibold">Section Header</h3>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="brands-title">Title</Label>
              <Input
                id="brands-title"
                value={content.title}
                onChange={(e) => setContent((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brands-subtitle">Subtitle</Label>
              <Input
                id="brands-subtitle"
                value={content.subtitle}
                onChange={(e) => setContent((prev) => ({ ...prev, subtitle: e.target.value }))}
              />
            </div>
          </div>

          {renderRowEditor('row1', 'Top Row (Scrolling Left)')}
          {renderRowEditor('row2', 'Bottom Row (Scrolling Right)')}

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Brands'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
