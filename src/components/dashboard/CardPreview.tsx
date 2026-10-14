"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Globe, MapPin } from "lucide-react";
import { BusinessCard } from '@/types/businessCard';
import { getFullName } from '@/utils/businessCard';

interface CardPreviewProps {
  card: BusinessCard;
}

export function CardPreview({ card }: CardPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gradient-to-br from-background to-muted p-8 rounded-lg">
          <div 
            className="bg-card rounded-lg shadow-lg p-6 border-l-4 max-w-md mx-auto"
            style={{ borderLeftColor: card.brandColor }}
          >
            {/* Header Section with brand color background */}
            <div className="relative h-24 mb-4 -m-6 mt-[-24px] rounded-t-lg" style={{ backgroundColor: card.brandColor }}>
              <div className="absolute bottom-[-32px] left-6">
                {card.profilePhoto ? (
                  <img
                    src={card.profilePhoto}
                    alt={getFullName(card)}
                    className="w-16 h-16 rounded-full object-cover border-4 border-card"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl border-4 border-card"
                    style={{ backgroundColor: card.brandColor }}
                  >
                    {getFullName(card).split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Section */}
            <div className="flex items-center gap-4 mb-4 mt-8">
              <div>
                <h3 className="font-bold text-lg text-foreground">{getFullName(card)}</h3>
                <p className="text-sm" style={{ color: card.brandColor }}>
                  {card.profile.title}
                </p>
                {card.profile.company && (
                  <p className="text-sm font-medium text-foreground">{card.profile.company}</p>
                )}
              </div>
            </div>

            <Separator className="my-4" />

            {/* Contact Information */}
            <div className="space-y-3">
              {card.business.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{card.business.email}</span>
                </div>
              )}
              {card.business.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{card.business.phone}</span>
                </div>
              )}
              {card.business.website && (
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{card.business.website}</span>
                </div>
              )}
              {card.business.address && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {typeof card.business.address === 'string' 
                      ? card.business.address 
                      : `${card.business.address.street}, ${card.business.address.city}, ${card.business.address.state} ${card.business.address.zip}`
                    }
                  </span>
                </div>
              )}
            </div>

            {/* Bio */}
            {card.about.bio && (
              <>
                <Separator className="my-4" />
                <p className="text-sm text-muted-foreground">{card.about.bio}</p>
              </>
            )}

            {/* Tags */}
            {card.metadata?.tags && card.metadata.tags.length > 0 && (
              <>
                <Separator className="my-4" />
                <div className="flex flex-wrap gap-2">
                  {card.metadata.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}