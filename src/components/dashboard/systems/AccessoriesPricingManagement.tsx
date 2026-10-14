"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { DollarSign, Save, RotateCcw } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

import {
  loadPricingConfig,
  savePricingConfig,
  resetPricingConfig,
  AccessoryPricingConfig,
} from "@/utils/accessoryPricing";

export function AccessoriesPricingManagement() {
  const [config, setConfig] = useState<AccessoryPricingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  // ---------------- LOAD ON MOUNT ----------------
  useEffect(() => {
    async function fetchConfig() {
      const data = await loadPricingConfig();
      setConfig(data);
      setLoading(false);
    }
    fetchConfig();
  }, []);

  if (loading || !config) return <div>Loading...</div>;

  // ---------------- SAVE ----------------
  const handleSave = async () => {
    try {
      await savePricingConfig(config);

      showToast(`Accessory pricing has been updated successfully.`, "success");
    } catch (error) {
      showToast(`Failed to save pricing configuration.`, "error");
    }
  };

  // ---------------- RESET ----------------
  const handleReset = async () => {
    try {
      const defaults = await resetPricingConfig();
      setConfig(defaults);
      showToast(`Pricing has been reset to default values.`, "success");
    } catch (error) {
      showToast(`Failed to reset pricing configuration.`, "error");
    }
  };

  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5 shrink-0" />
            <span>Accessories Pricing Management</span>
          </CardTitle>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={handleReset} className="flex-1 sm:flex-initial justify-center">
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button size="sm" onClick={handleSave} className="flex-1 sm:flex-initial justify-center">
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* NFC CARDS */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">NFC Cards Base Prices</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Essential */}
            <div className="space-y-2">
              <Label className="text-xs">Essential (Single)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  value={config.cards.essential.single}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      cards: {
                        ...config.cards,
                        essential: {
                          ...config.cards.essential,
                          single: parseFloat(e.target.value) || 0,
                        },
                      },
                    })
                  }
                  className="pl-7"
                  min="0"
                />
              </div>
            </div>

            {/* Infinite */}
            <div className="space-y-2">
              <Label className="text-xs">Personalize (Single)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  value={config.cards.infinite.single}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      cards: {
                        ...config.cards,
                        infinite: {
                          ...config.cards.infinite,
                          single: parseFloat(e.target.value) || 0,
                        },
                      },
                    })
                  }
                  className="pl-7"
                  min="0"
                />
              </div>
            </div>

            {/* Custom */}
            <div className="space-y-2">
              <Label className="text-xs">Full Custom (Single)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  value={config.cards.custom.single}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      cards: {
                        ...config.cards,
                        custom: {
                          ...config.cards.custom,
                          single: parseFloat(e.target.value) || 0,
                        },
                      },
                    })
                  }
                  className="pl-7"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* TAP STICKERS */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Tap Stickers Base Prices</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Essential */}
            <div className="space-y-2">
              <Label className="text-xs">Essential (Single)</Label>
              <Input
                type="number"
                value={config.stickers.essential.single}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    stickers: {
                      ...config.stickers,
                      essential: {
                        ...config.stickers.essential,
                        single: parseFloat(e.target.value) || 0,
                      },
                    },
                  })
                }
                className="pl-7"
              />
            </div>

            {/* Infinite */}
            <div className="space-y-2">
              <Label className="text-xs">Personalize (Single)</Label>
              <Input
                type="number"
                value={config.stickers.infinite.single}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    stickers: {
                      ...config.stickers,
                      infinite: {
                        ...config.stickers.infinite,
                        single: parseFloat(e.target.value) || 0,
                      },
                    },
                  })
                }
                className="pl-7"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* QUANTITY DISCOUNTS */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Quantity Discounts</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Double */}
            <div className="space-y-2">
              <Label className="text-xs">Double (2 items)</Label>
              <Input
                type="number"
                value={config.discounts.double}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    discounts: {
                      ...config.discounts,
                      double: parseFloat(e.target.value) || 0,
                    },
                  })
                }
              />
            </div>

            {/* Pack */}
            <div className="space-y-2">
              <Label className="text-xs">Pack (5 items)</Label>
              <Input
                type="number"
                value={config.discounts.pack}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    discounts: {
                      ...config.discounts,
                      pack: parseFloat(e.target.value) || 0,
                    },
                  })
                }
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* ADD-ON FEES */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Add-on Fees</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Logo Removal */}
            <div className="space-y-2">
              <Label className="text-xs">Logo Removal Fee (Cards)</Label>
              <Input
                type="number"
                value={config.addOns.logoRemovalFee}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    addOns: {
                      ...config.addOns,
                      logoRemovalFee: parseFloat(e.target.value) || 0,
                    },
                  })
                }
              />
            </div>

            {/* Custom Logo */}
            <div className="space-y-2">
              <Label className="text-xs">Custom Logo Fee (Stickers)</Label>
              <Input
                type="number"
                value={config.addOns.customLogoFee}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    addOns: {
                      ...config.addOns,
                      customLogoFee: parseFloat(e.target.value) || 0,
                    },
                  })
                }
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* SPECIAL SALE */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Special Sale Configuration</h4>

          {/* Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <Label className="text-sm font-medium">Enable Special Sale</Label>
              <p className="text-xs text-muted-foreground">
                Activate promotion countdown
              </p>
            </div>

            <Switch
              checked={config.specialSale.isActive}
              onCheckedChange={(checked) => {
                setConfig({
                  ...config,
                  specialSale: {
                    ...config.specialSale,
                    isActive: checked,
                    endDate: checked
                      ? new Date(
                          Date.now() + 7 * 24 * 60 * 60 * 1000
                        ).toISOString()
                      : config.specialSale.endDate,
                  },
                });
              }}
            />
          </div>

          {/* Sale Name & Percentage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Sale Name</Label>
              <Input
                type="text"
                disabled={!config.specialSale.isActive}
                value={config.specialSale.saleName}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    specialSale: {
                      ...config.specialSale,
                      saleName: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div>
              <Label className="text-xs">Sale Percentage</Label>
              <Input
                type="number"
                disabled={!config.specialSale.isActive}
                value={config.specialSale.percentage}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    specialSale: {
                      ...config.specialSale,
                      percentage: Math.max(
                        0,
                        Math.min(100, Number(e.target.value))
                      ),
                    },
                  })
                }
              />
            </div>
          </div>

          {/* End Date */}
          <div>
            <Label className="text-xs">Sale End Date & Time</Label>
            <Input
              type="datetime-local"
              disabled={!config.specialSale.isActive}
              value={new Date(config.specialSale.endDate)
                .toISOString()
                .slice(0, 16)}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                setConfig({
                  ...config,
                  specialSale: {
                    ...config.specialSale,
                    endDate: newDate.toISOString(),
                  },
                });
              }}
            />
          </div>

          {/* Sale Preview */}
          {config.specialSale.isActive && (
            <div className="p-3 bg-purple-900/10 border border-purple-500/20 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">
                Sale Preview:
              </p>
              <div className="text-sm space-y-1">
                <div>
                  <span className="font-medium">
                    {config.specialSale.saleName}
                  </span>
                  <span className="ml-2 text-purple-600 font-bold">
                    {config.specialSale.percentage}% OFF
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Ends: {new Date(config.specialSale.endDate).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Calculation Preview */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-2">
          <h5 className="text-xs font-semibold text-muted-foreground uppercase">
            Example Calculation
          </h5>
          <div className="text-sm space-y-1">
            {config.specialSale.isActive &&
            config.specialSale.percentage > 0 ? (
              <>
                <div>
                  Single Essential Card (with {config.specialSale.percentage}%
                  sale):{" "}
                  <span className="font-semibold">
                    $
                    {(
                      config.cards.essential.single *
                      (1 - config.specialSale.percentage / 100)
                    ).toFixed(2)}
                  </span>{" "}
                  <span className="text-xs line-through text-muted-foreground">
                    ${config.cards.essential.single.toFixed(2)}
                  </span>
                </div>
                <div>
                  Double Essential Cards (sale + {config.discounts.double}% qty
                  discount):{" "}
                  <span className="font-semibold">
                    $
                    {(
                      config.cards.essential.single *
                      (1 - config.specialSale.percentage / 100) *
                      2 *
                      (1 - config.discounts.double / 100)
                    ).toFixed(2)}
                  </span>{" "}
                  <span className="text-xs text-green-600">
                    (Total:{" "}
                    {Math.round(
                      config.specialSale.percentage +
                        config.discounts.double *
                          (1 - config.specialSale.percentage / 100)
                    )}
                    % off)
                  </span>
                </div>
                <div>
                  Pack Essential Cards (sale + {config.discounts.pack}% qty
                  discount):{" "}
                  <span className="font-semibold">
                    $
                    {(
                      config.cards.essential.single *
                      (1 - config.specialSale.percentage / 100) *
                      5 *
                      (1 - config.discounts.pack / 100)
                    ).toFixed(2)}
                  </span>{" "}
                  <span className="text-xs text-green-600">
                    (Total:{" "}
                    {Math.round(
                      config.specialSale.percentage +
                        config.discounts.pack *
                          (1 - config.specialSale.percentage / 100)
                    )}
                    % off)
                  </span>
                </div>
              </>
            ) : (
              <>
                <div>
                  Single Essential Card:{" "}
                  <span className="font-semibold">
                    ${config.cards.essential.single.toFixed(2)}
                  </span>
                </div>
                <div>
                  Double Essential Cards:{" "}
                  <span className="font-semibold">
                    $
                    {(
                      config.cards.essential.single *
                      2 *
                      (1 - config.discounts.double / 100)
                    ).toFixed(2)}
                  </span>{" "}
                  <span className="text-xs text-green-600">
                    ({config.discounts.double}% off)
                  </span>
                </div>
                <div>
                  Pack Essential Cards (5):{" "}
                  <span className="font-semibold">
                    $
                    {(
                      config.cards.essential.single *
                      5 *
                      (1 - config.discounts.pack / 100)
                    ).toFixed(2)}
                  </span>{" "}
                  <span className="text-xs text-green-600">
                    ({config.discounts.pack}% off)
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <Separator />

        {/* INVENTORY / STOCK MANAGEMENT */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            Stock / Availability Management
          </h4>
          
          <div className="space-y-4">
            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Card Options Availability
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-muted/20 p-4 rounded-lg border border-border">
              {/* Essential Card Stock */}
              <div className="flex items-center justify-between p-2 bg-background rounded border border-border/55">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium">Essential Card</Label>
                  <p className="text-[10px] text-muted-foreground">
                    {config.outOfStock?.essential ? "Out of Stock" : "In Stock"}
                  </p>
                </div>
                <Switch
                  checked={!!config.outOfStock?.essential}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      outOfStock: {
                        ...config.outOfStock,
                        essential: checked,
                      },
                    })
                  }
                />
              </div>

              {/* Personalize Card Stock */}
              <div className="flex items-center justify-between p-2 bg-background rounded border border-border/55">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium">Personal Card</Label>
                  <p className="text-[10px] text-muted-foreground">
                    {config.outOfStock?.personalize ? "Out of Stock" : "In Stock"}
                  </p>
                </div>
                <Switch
                  checked={!!config.outOfStock?.personalize}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      outOfStock: {
                        ...config.outOfStock,
                        personalize: checked,
                      },
                    })
                  }
                />
              </div>

              {/* Custom Card Stock */}
              <div className="flex items-center justify-between p-2 bg-background rounded border border-border/55">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium">Custom Card</Label>
                  <p className="text-[10px] text-muted-foreground">
                    {config.outOfStock?.custom ? "Out of Stock" : "In Stock"}
                  </p>
                </div>
                <Switch
                  checked={!!config.outOfStock?.custom}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      outOfStock: {
                        ...config.outOfStock,
                        custom: checked,
                      },
                    })
                  }
                />
              </div>

              {/* Sticker Stock */}
              <div className="flex items-center justify-between p-2 bg-background rounded border border-border/55">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium">Sticker</Label>
                  <p className="text-[10px] text-muted-foreground">
                    {config.outOfStock?.sticker ? "Out of Stock" : "In Stock"}
                  </p>
                </div>
                <Switch
                  checked={!!config.outOfStock?.sticker}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      outOfStock: {
                        ...config.outOfStock,
                        sticker: checked,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Color Options Availability
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 bg-muted/20 p-4 rounded-lg border border-border">
              {[
                { name: "Red", key: "red", hex: "#EF4444" },
                { name: "Pink", key: "pink", hex: "#EC4899" },
                { name: "Yellow", key: "yellow", hex: "#EAB308" },
                { name: "Green", key: "green", hex: "#059669" },
                { name: "Blue", key: "blue", hex: "#3B82F6" },
                { name: "Purple", key: "purple", hex: "#8B5CF6" },
                { name: "White", key: "white", hex: "#FFFFFF" },
                { name: "Black", key: "black", hex: "#000000" },
                { name: "Gray", key: "gray", hex: "#4f4e4f" },
              ].map((colorItem) => (
                <div key={colorItem.key} className="flex items-center justify-between p-2 bg-background rounded border border-border/55">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-border"
                      style={{ backgroundColor: colorItem.hex }}
                    />
                    <div className="space-y-0.5">
                      <Label className="text-xs font-medium">{colorItem.name}</Label>
                      <p className="text-[9px] text-muted-foreground">
                        {config.outOfStockColors?.[colorItem.key] ? "Out of Stock" : "In Stock"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={!!config.outOfStockColors?.[colorItem.key]}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        outOfStockColors: {
                          ...config.outOfStockColors,
                          [colorItem.key]: checked,
                        },
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
