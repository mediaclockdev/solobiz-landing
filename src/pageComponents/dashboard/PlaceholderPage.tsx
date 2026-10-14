"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Hammer } from "lucide-react";

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <Alert>
        <Hammer className="h-4 w-4" />
        <AlertTitle>Work in progress!</AlertTitle>
        <AlertDescription>
          This page is currently under development. Please check back later.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>{title ?? ""} Content</CardTitle>
          <CardDescription>
            This is a placeholder for the {title?.toLowerCase()} page content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-60 flex items-center justify-center bg-muted rounded-md">
            <p className="text-muted-foreground">Content coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
