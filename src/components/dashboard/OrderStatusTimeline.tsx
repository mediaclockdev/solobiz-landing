"use client";
import { Check, Package, Truck, Home, Clock } from "lucide-react";
import { TrackingInfo, TrackingStage } from "@/utils/invoiceGenerator";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface OrderStatusTimelineProps {
  tracking?: TrackingInfo[];
  currentStatus?: "pending" | "paid" | "cancelled";
  isAdmin?: boolean;
  cardStatus?: any;
}

const stages: {
  stage: TrackingStage;
  label: string;
  icon: React.ElementType;
}[] = [
  { stage: "placed", label: "Order Placed", icon: Package },
  { stage: "processing", label: "Processing", icon: Clock },
  { stage: "shipped", label: "Shipped", icon: Truck },
  { stage: "delivered", label: "Delivered", icon: Home },
];

export function OrderStatusTimeline({
  tracking = [],
  currentStatus,
  isAdmin = false,
  cardStatus,
}: OrderStatusTimelineProps) {
  const getStageStatus = (
    stage: TrackingStage,
  ): "completed" | "current" | "upcoming" => {
    const stageIndex = stages.findIndex((s) => s.stage === stage);
    const trackingStages = tracking.map((t) => t.stage);
    const latestStageIndex = Math.max(
      ...trackingStages.map((s) => stages.findIndex((st) => st.stage === s)),
    );

    if (currentStatus === "cancelled") {
      return trackingStages.includes(stage) ? "completed" : "upcoming";
    }

    if (trackingStages.includes(stage)) {
      return "completed";
    }

    if (stageIndex === latestStageIndex + 1) {
      return "current";
    }

    return "upcoming";
  };

  const getTrackingInfo = (stage: TrackingStage): TrackingInfo | undefined => {
    return tracking.find((t) => t.stage === stage);
  };

  if (currentStatus === "cancelled") {
    return (
      <div className="space-y-4">
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
          <p className="text-sm font-medium text-destructive">
            Order Cancelled
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            This order has been cancelled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {stages.map((stage, index) => {
        const status = getStageStatus(stage.stage);
        const trackingInfo = getTrackingInfo(stage.stage);
        const Icon = stage.icon;
        const isLast = index === stages.length - 1;
        return (
          <div key={stage.stage} className="relative">
            <div className="flex items-start gap-4">
              {/* Icon and Line */}
              <div className="relative flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                    status === "completed" &&
                      "bg-primary border-primary text-primary-foreground",
                    status === "current" &&
                      "bg-primary/10 border-primary text-primary animate-pulse",
                    status === "upcoming" &&
                      "bg-muted border-muted-foreground/20 text-muted-foreground",
                  )}
                >
                  {status === "completed" ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>

                {/* Connecting line */}
                {!isLast && (
                  <div
                    className={cn(
                      "w-0.5 h-16 mt-1 transition-all",
                      status === "completed"
                        ? "bg-primary"
                        : "bg-muted-foreground/20",
                    )}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-8">
                <div className="flex items-center justify-between mb-1">
                  <h4
                    className={cn(
                      "text-sm font-medium",
                      status === "completed" && "text-foreground",
                      status === "current" && "text-primary font-semibold",
                      status === "upcoming" && "text-muted-foreground",
                    )}
                  >
                    {stage.label}
                  </h4>
                  {trackingInfo && (
                    <span className="text-xs text-muted-foreground">
                      {format(
                        new Date(trackingInfo.timestamp),
                        "MMM dd, HH:mm",
                      )}
                    </span>
                  )}
                </div>

                {trackingInfo?.description && (
                  <>
                    <p className="text-xs text-muted-foreground mt-1">
                      {trackingInfo.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isAdmin && "[Yes]"}{" "}
                      {format(
                        new Date(trackingInfo.timestamp),
                        "MMM dd, HH:mm",
                      )}
                    </p>
                    {cardStatus &&
                      trackingInfo?.stage
                        ?.toLowerCase()
                        ?.includes("processing") && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {isAdmin &&
                            cardStatus?.map((sta, idx) => {
                              return (
                                <p key={sta.card_id || sta.card_number || idx}>
                                  {/* <span>{sta.orderItemId} {"=>"}</span> */}

                                  <span>
                                    {sta.card_number} | {sta.card_id} |{" "}
                                    {sta.nfc_uid}
                                  </span>
                                </p>
                              );
                            })}
                        </div>
                      )}
                  </>
                )}

                {status === "current" && !trackingInfo && (
                  <p className="text-xs text-primary mt-1">In progress...</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
