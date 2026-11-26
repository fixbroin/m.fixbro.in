'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import CheckoutForm from './CheckoutForm';

interface CheckoutClientProps {
  planTitle: string;
  ratePerSqFt: number;
  currencySymbol: string;
}

const SQFT_PRESETS = [500, 1000, 1500, 2000];

export default function CheckoutClient({
  planTitle,
  ratePerSqFt,
  currencySymbol,
}: CheckoutClientProps) {
  const [sqFtInput, setSqFtInput] = useState<string>('1');
  const parsedSqFt = Math.max(1, Math.floor(Number(sqFtInput) || 1));
  const totalAmount = ratePerSqFt * parsedSqFt;
  const detailedPlanTitle = `${planTitle} (${parsedSqFt.toLocaleString()} sq.ft × ${currencySymbol}${ratePerSqFt.toLocaleString()}/sq.ft)`;

  return (
    <div className="container py-12 md:py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
        <div className="md:order-last">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>
                Enter your area in square feet to calculate the total amount.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{planTitle} (Rate / sq.ft)</span>
                <span className="font-semibold">
                  {currencySymbol}
                  {ratePerSqFt.toLocaleString()} / sq.ft
                </span>
              </div>

              <div className="space-y-2 rounded-xl border bg-muted/30 p-4">
                <Label htmlFor="checkout-sqft" className="text-sm font-semibold">
                  Enter Area (Square Feet)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="checkout-sqft"
                    type="number"
                    min={1}
                    step={1}
                    value={sqFtInput}
                    onChange={(e) => setSqFtInput(e.target.value)}
                    onBlur={() => {
                      if (!sqFtInput || Number(sqFtInput) < 1) {
                        setSqFtInput('1');
                      }
                    }}
                    placeholder="e.g. 1000"
                    className="font-semibold"
                  />
                  <span className="text-sm font-medium text-muted-foreground shrink-0">
                    sq.ft
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {SQFT_PRESETS.map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      size="sm"
                      variant={parsedSqFt === preset ? 'default' : 'outline'}
                      className="h-7 px-2.5 text-xs"
                      onClick={() => setSqFtInput(String(preset))}
                    >
                      {preset.toLocaleString()} sq.ft
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center text-sm text-muted-foreground border-t pt-4">
                <span>
                  {currencySymbol}
                  {ratePerSqFt.toLocaleString()} × {parsedSqFt.toLocaleString()} sq.ft
                </span>
                <span className="font-medium text-foreground">
                  {currencySymbol}
                  {totalAmount.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center text-lg font-bold border-t pt-3">
                <p>Total</p>
                <p>
                  {currencySymbol}
                  {totalAmount.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>
                Please enter your details to proceed with the booking.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CheckoutForm
                planTitle={detailedPlanTitle}
                planPrice={totalAmount}
                currencySymbol={currencySymbol}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
