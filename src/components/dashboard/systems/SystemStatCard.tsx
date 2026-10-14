"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SystemStatCardProps = {
  title: string;
  icon: React.ReactNode;
  totalValue: number;
  metrics: {
    label: string;
    value: number;
    percentage: number;
    color?: string;
  }[];
  className?: string;
};

export function SystemStatCard({ title, icon, totalValue, metrics, className }: SystemStatCardProps) {
  return (
    <Card className={cn("card-hover", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground border-b pb-2 flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-3">{totalValue.toLocaleString()}</div>
        <div className="space-y-2">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{metric.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{metric.value.toLocaleString()}</span>
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded",
                  metric.color || "bg-muted text-muted-foreground"
                )}>
                  {metric.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}