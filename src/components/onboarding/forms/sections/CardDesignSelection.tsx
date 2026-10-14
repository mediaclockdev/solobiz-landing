"use client";
import React from "react";
import { FormComponentProps } from "@/types/businessCard";
import { Label } from "@/components/ui/label";
import { useSliderNav, SliderArrows } from "@/components/ui/slider-nav";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

const DESIGN_ORDER: Record<string, string[]> = {
  classic: ["standard", "extended", "centered", "portrait"],
  traditional: ["align-right", "align-left", "portrait", "slides"],
  modern: ["standard", "centered", "fadein", "portrait"],
};

export function CardDesignSelection({
  card,
  onUpdate,
  isEditMode,
}: FormComponentProps) {
  const currentTemplate = card.templateType || "classic";
  const isDisabled = !isEditMode;

  // Which of the 4 designs the slider is showing. Opens on the card's
  // current layout so the dots reflect what's actually selected.
  const layoutOrder = DESIGN_ORDER[currentTemplate] ?? DESIGN_ORDER.classic;
  const selectedIndex = Math.max(
    0,
    layoutOrder.indexOf((card.cardLayout || "").toLowerCase()),
  );
  const [activeDesign, setActiveDesign] = React.useState(selectedIndex);

  // Follow the selection when the layout or template changes elsewhere
  // (e.g. the Change Template sheet), but leave manual swiping alone.
  React.useEffect(() => {
    setActiveDesign(selectedIndex);
  }, [selectedIndex]);
  const renderClassicDesigns = () => (
    <>
      {/* Standard */}
      {isDisabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() =>
                !isDisabled && onUpdate({ ...card, cardLayout: "standard" })
              }
              disabled={isDisabled}
              className={`p-1 rounded-lg transition-all ${
                card.cardLayout === "standard" ||
                (!card.cardLayout && currentTemplate === "classic")
                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                  : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
              } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {/* <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-16 rounded overflow-hidden relative">
                  <div
                    className="h-8 w-full"
                    style={{ backgroundColor: card.brandColor }}
                  ></div>
                  <div className="h-8 w-full bg-white flex items-center justify-center">
                    <div className="absolute top-6 left-2 w-2 h-2 bg-white rounded-full"></div>
                    <div className="space-y-0.5 mt-2">
                      <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
                      <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
                      <div className="w-4 h-0.5 bg-foreground/40 rounded-sm"></div>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium">Standard</span>
              </div> */}
              <div className="cursor-pointer transition-all duration-300">
                <p className="text-center mb-2 text-sm font-medium text-gray-700">
                  Standard
                </p>
                <div className="card-container rounded-xl overflow-hidden shadow-2xl bg-white relative cursor-not-allowed">
                  <div className="relative w-full aspect-[4/3]">
                    <div
                      className="w-full h-full"
                      style={{
                        // borderBottom: `6px solid ${card.brandColor}`,
                        backgroundColor: `${card.brandColor}90`,
                      }}
                    ></div>
                    <div
                      className="absolute bottom-5 right-3 w-1/4 aspect-video rounded-xl bg-gray-200 translate-y-4"
                      style={{ bottom: 4 }}
                    ></div>

                    {/* Circle left */}
                    <div className="absolute bottom-0 left-3 translate-y-[38%]">
                      <div
                        className="w-20 sm:w-16 lg:w-7 aspect-square rounded-full relative before:content-[''] before:absolute before:w-full before:h-full before:left-0 before:top-0 before:bg-white before:rounded-full before:-z-10"
                        style={{
                          border: `3px solid #FFF`,
                          backgroundColor: `${card.brandColor}90`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-6 pb-6 px-4">
                    <h2 className="text-lg md:text-xl font-bold mb-1"></h2>
                  </div>
                </div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Available when editing a card only.</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        // <button
        //   onClick={() =>
        //     !isDisabled && onUpdate({ ...card, cardLayout: "standard" })
        //   }
        //   disabled={isDisabled}
        //   className={`p-4 rounded-lg border-2 transition-all ${
        //     card.cardLayout === "standard" ||
        //     (!card.cardLayout && currentTemplate === "classic")
        //       ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
        //       : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
        //   } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        // >
        //   <div className="flex flex-col items-center space-y-2">
        //     <div className="w-12 h-16 rounded overflow-hidden relative">
        //       <div
        //         className="h-8 w-full"
        //         style={{ backgroundColor: card.brandColor }}
        //       ></div>
        //       <div className="h-8 w-full bg-white flex items-center justify-center">
        //         <div className="absolute top-6 left-2 w-2 h-2 bg-white rounded-full"></div>
        //         <div className="space-y-0.5 mt-2">
        //           <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
        //           <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
        //           <div className="w-4 h-0.5 bg-foreground/40 rounded-sm"></div>
        //         </div>
        //       </div>
        //     </div>
        //     <span className="text-xs font-medium">Standard</span>
        //   </div>
        // </button>
        <div
          onClick={() =>
            !isDisabled && onUpdate({ ...card, cardLayout: "standard" })
          }
          className={`cursor-pointer shrink-0 w-[160px] transition-all duration-300 
            ${
              card.cardLayout === "standard" ||
              (!card.cardLayout && currentTemplate === "classic")
                ? "bg-[var(--primary)]/10"
                : "opacity-50 hover:opacity-70"
            } 
            ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <p className="text-center mb-2 text-sm font-medium text-gray-700">Standard</p>
          <div className="relative h-[170px] w-[160px] overflow-hidden rounded-xl">
            <div className="absolute left-0 top-0 w-[400px] origin-top-left scale-[0.4]">
              <div
                className="max-w-md w-full rounded-2xl overflow-hidden shadow-2xl card-container min-h-[425px] bg-white"
                data-id="card-container"
                data-template="classic"
              >
                <div className="flex flex-col relative items-center justify-center bg-white">
                  <div className="relative bg-white">
                    <div className="relative">
                      <div
                        className="relative w-full aspect-[16/9] bg-[#FFD93D] h-[250px]"
                        style={{ backgroundColor: card.brandColor || "#99b2ff" }}
                      ></div>
                      <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/10 via-black/5 to-transparent pointer-events-none"></div>
                    </div>

                    <div className="px-6">
                      <div
                        className="border-[6px] border-white left-10 object-cover absolute w-28 h-28 rounded-full bottom-0 translate-y-1/2"
                        style={{
                          backgroundColor: card.brandColor || "#99b2ff",
                        }}
                      ></div>
                      <div
                        className="absolute bottom-0 right-10 translate-y-1/2 w-28 h-16 rounded-xl object-cover"
                        style={{
                          backgroundColor: "#ccc",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start justify-start bg-white p-6 pb-0 pt-20">
                  <div className="flex flex-col gap-1 items-start justify-start">
                    <div
                      className="flex items-end flex-wrap justify-start gap-2 mb-2 gap-y-1 text-3xl font-bold"
                      data-id="name"
                    >
                      <div className="flex items-center gap-1 flex-wrap mb-1"></div>
                    </div>
                    <div className="text-xl"></div>
                    <div className="text-xl font-light"></div>
                    <div className="text-md text-gray-500 mt-2"></div>
                  </div>
                </div>

                <div className="flex flex-col items-start justify-start bg-white py-6 px-3 pt-2">
                  <div
                    data-rfd-droppable-id="links"
                    className="flex flex-col items-start justify-start w-full gap-2 min-h-[50px] transition-all duration-200 bg-transparent py-2 w-full"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extended */}
      {isDisabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() =>
                !isDisabled && onUpdate({ ...card, cardLayout: "extended" })
              }
              disabled={isDisabled}
              className={`p-1 rounded-lg transition-all ${
                card.cardLayout === "extended"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                  : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
              } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {/* <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-16 rounded overflow-hidden relative">
                  <div
                    className="h-8 w-full"
                    style={{ backgroundColor: card.brandColor }}
                  ></div>
                  <div className="h-8 w-full bg-white flex items-center justify-center">
                    <div className="absolute top-4 right-2 w-1.5 h-1 bg-white/80 rounded-sm"></div>
                    <div className="absolute top-6 right-2 w-2 h-2 bg-white rounded-full"></div>
                    <div className="space-y-0.5 mt-2">
                      <div className="w-7 h-0.5 bg-foreground/60 rounded-sm"></div>
                      <div className="w-6 h-0.5 bg-foreground/40 rounded-sm"></div>
                      <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium">Extended</span>
              </div> */}
              <div className="cursor-pointer transition-all duration-300">
                <p className="text-center mb-2 text-sm font-medium text-gray-700">
                  Extended
                </p>
                <div className="card-container rounded-xl overflow-hidden shadow-2xl bg-white relative cursor-not-allowed">
                  <div className="relative w-full aspect-[4/3]">
                    <div
                      className="w-full h-full"
                      style={{
                        // borderBottom: `6px solid ${card.brandColor}`,
                        backgroundColor: `${card.brandColor}90`,
                      }}
                    ></div>
                    {/* <div className="absolute top-3 left-3 w-1/4 aspect-video rounded-lg bg-gray-200"></div> */}
                    <div
                      className="absolute bottom-5 left-3 w-1/4 aspect-video rounded-xl bg-gray-200"
                      style={{ bottom: -9 }}
                    ></div>
                    {/* Circle right */}
                    <div className="absolute bottom-0 right-3 translate-y-[38%]">
                      <div
                        className="w-20 sm:w-16 lg:w-7 aspect-square rounded-full relative before:content-[''] before:absolute before:w-full before:h-full before:left-0 before:top-0 before:bg-white before:rounded-full before:-z-10"
                        style={{
                          border: `3px solid #FFF`,
                          backgroundColor: `${card.brandColor}90`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-6 pb-6 px-4">
                    <h2 className="text-lg md:text-xl font-bold mb-1"></h2>
                  </div>
                </div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Available when editing a card only.</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        // <button
        //   onClick={() =>
        //     !isDisabled && onUpdate({ ...card, cardLayout: "extended" })
        //   }
        //   disabled={isDisabled}
        //   className={`p-4 rounded-lg border-2 transition-all ${
        //     card.cardLayout === "extended"
        //       ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
        //       : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
        //   } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        // >
        //   <div className="flex flex-col items-center space-y-2">
        //     <div className="w-12 h-16 rounded overflow-hidden relative">
        //       <div
        //         className="h-8 w-full"
        //         style={{ backgroundColor: card.brandColor }}
        //       ></div>
        //       <div className="h-8 w-full bg-white flex items-center justify-center">
        //         <div className="absolute top-4 right-2 w-1.5 h-1 bg-white/80 rounded-sm"></div>
        //         <div className="absolute top-6 right-2 w-2 h-2 bg-white rounded-full"></div>
        //         <div className="space-y-0.5 mt-2">
        //           <div className="w-7 h-0.5 bg-foreground/60 rounded-sm"></div>
        //           <div className="w-6 h-0.5 bg-foreground/40 rounded-sm"></div>
        //           <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
        //         </div>
        //       </div>
        //     </div>
        //     <span className="text-xs font-medium">Extended</span>
        //   </div>
        // </button>
        <div
          onClick={() =>
            !isDisabled && onUpdate({ ...card, cardLayout: "extended" })
          }
          className={`cursor-pointer shrink-0 w-[160px] transition-all duration-300 
            ${
              card.cardLayout === "extended" ||
              (!card.cardLayout && currentTemplate === "classic")
                ? "bg-[var(--primary)]/10"
                : "opacity-50 hover:opacity-70"
            } 
            ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <p className="text-center mb-2 text-sm font-medium text-gray-700">Extended</p>
          <div className="relative h-[170px] w-[160px] overflow-hidden rounded-xl">
            <div className="absolute left-0 top-0 w-[400px] origin-top-left scale-[0.4]">
              <div
                className="max-w-md w-full rounded-2xl overflow-hidden shadow-2xl card-container min-h-[425px] bg-white"
                data-id="card-container"
                data-template="classic"
              >
                <div className="flex flex-col relative items-center justify-center bg-white">
                  <div className="relative bg-white">
                    <div className="relative">
                      <div
                        className="relative w-full aspect-[16/9] bg-[#FFD93D] h-[250px]"
                        style={{ backgroundColor: card.brandColor || "#99b2ff" }}
                      ></div>
                      <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/10 via-black/5 to-transparent pointer-events-none"></div>
                    </div>

                    <div className="px-6">
                      <div
                        className="border-[6px] aspect-[1/1] border-white object-cover w-28 absolute rounded-full bottom-0 right-10 translate-y-1/2"
                        style={{
                          backgroundColor: card.brandColor || "#99b2ff",
                          aspectRatio: "1 / 1",
                        }}
                      ></div>
                      <div
                        className="object-cover absolute top-6 left-10 w-28 rounded-xl aspect-[16/9] left-10"
                        style={{
                          backgroundColor: "#ccc",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start justify-start bg-white py-6 px-3 pt-2">
                  <div
                    data-rfd-droppable-id="links"
                    className="flex flex-col items-start justify-start w-full gap-2 min-h-[50px] transition-all duration-200 bg-transparent py-2 w-full"
                  ></div>
                </div>
                <div className="flex flex-col items-start justify-start bg-white py-6 px-3 pt-2">
                  <div
                    data-rfd-droppable-id="links"
                    className="flex flex-col items-start justify-start w-full gap-2 min-h-[50px] transition-all duration-200 bg-transparent py-2 w-full"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Centered */}
      {isDisabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() =>
                !isDisabled && onUpdate({ ...card, cardLayout: "centered" })
              }
              disabled={isDisabled}
              className={`p-1 rounded-lg transition-all ${
                card.cardLayout === "centered"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                  : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
              } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {/* <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-16 rounded overflow-hidden relative">
                  <div
                    className="h-8 w-full"
                    style={{ backgroundColor: card.brandColor }}
                  ></div>
                  <div className="h-8 w-full bg-white flex flex-col items-center justify-center">
                    <div className="absolute top-5 w-2 h-2 bg-white rounded-full"></div>
                    <div className="space-y-0.5 mt-3 flex flex-col items-center">
                      <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
                      <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
                      <div className="w-4 h-0.5 bg-foreground/40 rounded-sm"></div>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium">Centered</span>
              </div> */}
              <div className="cursor-pointer transition-all duration-300">
                <p className="text-center mb-2 text-sm font-medium text-gray-700">
                  Centered
                </p>
                <div className="card-container rounded-xl overflow-hidden shadow-2xl bg-white relative cursor-not-allowed">
                  <div className="relative w-full aspect-[4/3]">
                    <div
                      className="w-full h-full"
                      style={{
                        // borderBottom: `6px solid ${card.brandColor}`,
                        backgroundColor: `${card.brandColor}90`,
                      }}
                    ></div>
                    <div
                      className="absolute w-1/4 aspect-video rounded-xl bg-gray-200"
                      style={{
                        bottom: -22,
                        right: 35,
                        zIndex: 99999999,
                      }}
                    ></div>
                    {/* Circle right */}
                    <div
                      className="absolute bottom-0 right-3 translate-y-[38%]"
                      style={{ right: 50 }}
                    >
                      <div
                        className="w-20 sm:w-16 lg:w-7 aspect-square rounded-full relative before:content-[''] before:absolute before:w-full before:h-full before:left-0 before:top-0 before:bg-white before:rounded-full before:-z-10"
                        style={{
                          border: `3px solid #FFF`,
                          backgroundColor: `${card.brandColor}90`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-6 pb-6 px-4">
                    <h2 className="text-lg md:text-xl font-bold mb-1"></h2>
                  </div>
                </div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Available when editing a card only.</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        // <button
        //   onClick={() =>
        //     !isDisabled && onUpdate({ ...card, cardLayout: "centered" })
        //   }
        //   disabled={isDisabled}
        //   className={`p-4 rounded-lg border-2 transition-all ${
        //     card.cardLayout === "centered"
        //       ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
        //       : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
        //   } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        // >
        //   <div className="flex flex-col items-center space-y-2">
        //     <div className="w-12 h-16 rounded overflow-hidden relative">
        //       <div
        //         className="h-8 w-full"
        //         style={{ backgroundColor: card.brandColor }}
        //       ></div>
        //       <div className="h-8 w-full bg-white flex flex-col items-center justify-center">
        //         <div className="absolute top-5 w-2 h-2 bg-white rounded-full"></div>
        //         <div className="space-y-0.5 mt-3 flex flex-col items-center">
        //           <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
        //           <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
        //           <div className="w-4 h-0.5 bg-foreground/40 rounded-sm"></div>
        //         </div>
        //       </div>
        //     </div>
        //     <span className="text-xs font-medium">Centered</span>
        //   </div>
        // </button>
        <div
          onClick={() =>
            !isDisabled && onUpdate({ ...card, cardLayout: "centered" })
          }
          className={`cursor-pointer shrink-0 w-[160px] transition-all duration-300 
            ${
              card.cardLayout === "centered" ||
              (!card.cardLayout && currentTemplate === "classic")
                ? "bg-[var(--primary)]/10"
                : "opacity-50 hover:opacity-70"
            } 
            ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <p className="text-center mb-2 text-sm font-medium text-gray-700">Centered</p>
          <div className="relative h-[170px] w-[160px] overflow-hidden rounded-xl">
            <div className="absolute left-0 top-0 w-[400px] origin-top-left scale-[0.4]">
              <div
                className="max-w-md w-full rounded-2xl overflow-hidden shadow-2xl card-container min-h-[425px] bg-white"
                data-id="card-container"
                data-template="classic"
                style={{ minWidth: "384px" }}
              >
                <div className="flex flex-col relative items-center justify-center bg-white">
                  <div className="relative bg-white">
                    <div className="relative">
                      <div
                        className="relative w-full aspect-[16/9] bg-[#FFD93D] h-[250px]"
                        style={{ backgroundColor: card.brandColor || "#99b2ff" }}
                      ></div>
                      <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/10 via-black/5 to-transparent pointer-events-none"></div>
                    </div>
                    <div className="px-6">
                      <div
                        className="border-[6px] border-white object-cover w-28 absolute rounded-full bottom-0 left-1/2 translate-y-1/2 -translate-x-1/2"
                        style={{
                          backgroundColor: card.brandColor || "#99b2ff",
                          aspectRatio: "1 / 1",
                        }}
                      ></div>

                      <div
                        className="object-cover absolute -bottom-16 left-1/2 translate-x-[20%] w-16 rounded-xl"
                        style={{
                          backgroundColor: "#ccc",
                          aspectRatio: "16 / 9",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start justify-start bg-white py-6 px-3 pt-2">
                  <div
                    data-rfd-droppable-id="links"
                    className="flex flex-col items-start justify-start w-full gap-2 min-h-[50px] transition-all duration-200 bg-transparent py-2 w-full"
                  ></div>
                </div>

                <div className="flex flex-col items-start justify-start bg-white py-6 px-3 pt-2">
                  <div
                    data-rfd-droppable-id="links"
                    className="flex flex-col items-start justify-start w-full gap-2 min-h-[50px] transition-all duration-200 bg-transparent py-2 w-full"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portrait */}
      {isDisabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() =>
                !isDisabled && onUpdate({ ...card, cardLayout: "portrait" })
              }
              disabled={isDisabled}
              className={`p-1 rounded-lg transition-all ${
                card.cardLayout === "portrait"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                  : "opacity-50 hover:opacity-70"
              } ${isDisabled ? "cursor-not-allowed" : ""}`}

              // className={`p-1 rounded-lg transition-all ${
              //   card.cardLayout === "portrait"
              //     ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
              //     : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
              // } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {/* <div className="flex flex-col items-center space-y-2">
                <div className="w-9 h-12 rounded overflow-hidden relative">
                  <div
                    className="h-8 w-full"
                    style={{ backgroundColor: card.brandColor }}
                  ></div>
                  <div className="h-4 w-full bg-white flex flex-col items-center justify-center">
                    <div className="space-y-0.5">
                      <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
                      <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium">Portrait</span>
              </div> */}
              <div className="cursor-pointer transition-all duration-300">
                <p className="text-center mb-2 text-sm font-medium text-gray-700">
                  Portrait
                </p>
                <div className="card-container rounded-xl overflow-hidden shadow-2xl bg-white relative">
                  <div className="relative w-full aspect-[4/3]">
                    <div
                      className="w-full h-full"
                      style={{
                        // borderBottom: `6px solid ${card.brandColor}`,
                        backgroundColor: `${card.brandColor}80`,
                      }}
                    ></div>

                    {/* No circle for portrait */}
                  </div>
                  <div className="pt-6 pb-6 px-4">
                    <h2 className="text-lg md:text-xl font-bold mb-1"></h2>
                  </div>
                </div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Available when editing a card only.</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        // <button
        //   onClick={() =>
        //     !isDisabled && onUpdate({ ...card, cardLayout: "portrait" })
        //   }
        //   disabled={isDisabled}
        //   className={`p-4 rounded-lg border-2 transition-all ${
        //     card.cardLayout === "portrait"
        //       ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
        //       : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
        //   } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        // >
        //   <div className="flex flex-col items-center space-y-2">
        //     <div className="w-9 h-12 rounded overflow-hidden relative">
        //       <div
        //         className="h-8 w-full"
        //         style={{ backgroundColor: card.brandColor }}
        //       ></div>
        //       <div className="h-4 w-full bg-white flex flex-col items-center justify-center">
        //         <div className="space-y-0.5">
        //           <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
        //           <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
        //         </div>
        //       </div>
        //     </div>
        //     <span className="text-xs font-medium">Portrait</span>
        //   </div>
        // </button>
        <div
          onClick={() =>
            !isDisabled && onUpdate({ ...card, cardLayout: "portrait" })
          }
          className={`cursor-pointer shrink-0 w-[160px] transition-all duration-300 
            ${
              card.cardLayout === "portrait" ||
              (!card.cardLayout && currentTemplate === "classic")
                ? "bg-[var(--primary)]/10"
                : "opacity-50 hover:opacity-70"
            } 
            ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <div className="cursor-pointer shrink-0 w-[160px] transition-all duration-300">
            <p className="text-center mb-2 text-sm font-medium text-gray-700">
              Portrait
            </p>
            <div className="relative h-[170px] w-[160px] overflow-hidden rounded-xl">
              <div className="absolute left-0 top-0 w-[400px] origin-top-left scale-[0.4]">
                <div
                  className="max-w-md w-full rounded-2xl overflow-hidden shadow-2xl card-container min-h-[425px] bg-white"
                  data-id="card-container"
                  data-template="classic"
                >
                  <div className="flex flex-col relative items-center justify-center bg-white">
                    <div className="relative bg-white">
                      <div className="relative">
                        <div
                          className="relative w-full aspect-[16/9] bg-[#FFD93D] h-[400px]"
                          style={{
                            backgroundColor: card.brandColor || "#99b2ff",
                          }}
                        ></div>
                        <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/10 via-black/5 to-transparent pointer-events-none"></div>
                      </div>
                      <div className="px-6">
                        <div
                          className="border-[6px] border-white left-10 object-cover absolute w-28 h-28 rounded-full bottom-0 translate-y-1/2"
                          style={{
                            backgroundColor: card.brandColor || "#99b2ff",
                          }}
                        ></div>
                        <div
                          className="absolute bottom-0 right-10 translate-y-1/2 w-28 h-16 rounded-xl object-cover"
                          style={{
                            backgroundColor: "#ccc",
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start justify-start bg-white py-6 px-3 pt-2">
                    <div
                      data-rfd-droppable-id="links"
                      className="flex flex-col items-start justify-start w-full gap-2 min-h-[50px] transition-all duration-200 bg-transparent py-2 w-full"
                    ></div>
                  </div>
                  <div className="flex flex-col items-start justify-start bg-white py-6 px-3 pt-2">
                    <div
                      data-rfd-droppable-id="links"
                      className="flex flex-col items-start justify-start w-full gap-2 min-h-[50px] transition-all duration-200 bg-transparent py-2 w-full"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
  const hexToRgba = (hex, alpha = 0.2) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const renderTraditionalDesigns = () => (
    <>
      {/* Align Right */}
      {isDisabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() =>
                !isDisabled && onUpdate({ ...card, cardLayout: "align-right" })
              }
              disabled={isDisabled}
              className={`p-1 rounded-lg transition-all ${
                card.cardLayout === "align-right" ||
                (!card.cardLayout && currentTemplate === "traditional")
                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                  : "opacity-50 hover:opacity-70"
              } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {/* <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-16 rounded overflow-hidden relative">
                  <div
                    className="h-8 w-full"
                    style={{ backgroundColor: card.brandColor }}
                  ></div>
                  <div className="h-8 w-full bg-white flex items-center justify-center">
                    <div className="absolute top-4 right-2 w-3 h-1 bg-white/80 rounded-sm"></div>
                    <div className="absolute bottom-2 right-2 w-2 h-2 bg-white rounded-full"></div>
                    <div className="space-y-0.5 mt-2 ml-1">
                      <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
                      <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium">Align Right</span>
              </div> */}

              <div className="cursor-pointer transition-all duration-300">
                <p className="text-center mb-2 text-sm font-medium text-gray-700">
                  Align Right
                </p>
                <div className="card-container rounded-xl overflow-hidden shadow-2xl bg-white relative cursor-not-allowed">
                  <div className="relative w-full aspect-[4/3]">
                    {/* <div
                      className="w-full h-full"
                      style={{
                        borderBottom: `6px solid ${card.brandColor}`,
                        backgroundColor: `${card.brandColor}80`,
                      }}
                    ></div> */}
                    <div
                      className="w-full h-full border-b-[15px] md:border-b-[6px] border-b-[var(--brand)] bg-[color:var(--back)]"
                      style={
                        {
                          ["--brand"]: card.brandColor,
                          ["--back"]: `${card.brandColor}80`,
                        } as React.CSSProperties
                      }
                    />
                    <div className="absolute top-3 left-3 w-1/4 aspect-video rounded-lg bg-gray-200"></div>
                    {/* Circle right */}
                    <div className="absolute bottom-0 right-3 translate-y-[38%]">
                      <div
                        className="w-20 sm:w-16 lg:w-7 aspect-square rounded-full relative before:content-[''] before:absolute before:w-full before:h-full before:left-0 before:top-0 before:bg-white before:rounded-full before:-z-10"
                        style={{
                          border: `3px solid ${card.brandColor}`,
                          backgroundColor: `${card.brandColor}80`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-6 pb-6 px-4">
                    <h2 className="text-lg md:text-xl font-bold mb-1"></h2>
                  </div>
                </div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Available when editing a card only.</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        // <button
        //   onClick={() =>
        //     !isDisabled && onUpdate({ ...card, cardLayout: "align-right" })
        //   }
        //   disabled={isDisabled}
        //   className={`p-4 rounded-lg border-2 transition-all ${
        //     card.cardLayout === "align-right" ||
        //     (!card.cardLayout && currentTemplate === "traditional")
        //       ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
        //       : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
        //   } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        // >
        //   <div className="flex flex-col items-center space-y-2">
        //     <div className="w-12 h-16 rounded overflow-hidden relative">
        //       <div
        //         className="h-8 w-full"
        //         style={{ backgroundColor: card.brandColor }}
        //       ></div>
        //       <div className="h-8 w-full bg-white flex items-center justify-center">
        //         <div className="absolute top-4 right-2 w-3 h-1 bg-white/80 rounded-sm"></div>
        //         <div className="absolute bottom-2 right-2 w-2 h-2 bg-white rounded-full"></div>
        //         <div className="space-y-0.5 mt-2 ml-1">
        //           <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
        //           <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
        //         </div>
        //       </div>
        //     </div>
        //     <span className="text-xs font-medium">Align Right</span>
        //   </div>
        // </button>
        <div
          onClick={() => {
            !isDisabled && onUpdate({ ...card, cardLayout: "align-right" });
          }}
          className={`cursor-pointer shrink-0 w-[160px] transition-all duration-300 
            ${
              card.cardLayout === "align-right" ||
              (!card.cardLayout && currentTemplate === "classic")
                ? "bg-[var(--primary)]/10"
                : "opacity-50 hover:opacity-70"
            } 
            ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <div className="cursor-pointer shrink-0 w-[160px] transition-all duration-300">
            <p className="text-center mb-2 text-sm font-medium text-gray-700">
              Align Right
            </p>
            <div className="relative h-[170px] w-[160px] overflow-hidden rounded-xl">
              <div className="absolute left-0 top-0 w-[400px] origin-top-left scale-[0.4]">
                <div
                  className="max-w-md w-full card-container rounded-xl overflow-hidden shadow-2xl bg-white min-h-[425px]"
                  data-template="traditional"
                >
                  <div className="relative h-64">
                    <div
                      className="w-full h-full object-cover"
                      style={{
                        aspectRatio: "4 / 3",
                        borderBottom: `20px solid ${card.brandColor}`,
                        backgroundColor: `${card.brandColor}80`,
                      }}
                    />
                    <div className="absolute top-6 left-6">
                      <div
                        className="w-28 rounded-lg object-cover"
                        style={{
                          aspectRatio: "16 / 9",
                          backgroundColor: "#eee",
                        }}
                      />
                    </div>
                    <div className="absolute bottom-4 right-6 translate-y-1/2">
                      <div
                        className={`
                            w-28 h-28 rounded-full object-cover
                            ${
                              card.templateType === "traditional"
                                ? "relative before:content-[''] before:absolute before:w-full before:h-full before:left-0 before:right-0 before:bg-white before:rounded-[100px] before:-z-10"
                                : ""
                            }
                          `}
                        style={{
                          border: `6px solid ${card.brandColor}`,
                          backgroundColor: `${card.brandColor}80`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-12 pb-8">
                    <div className="text-left mb-2 px-6">
                      <div className="flex items-end flex-wrap justify-start mb-2">
                        <h2 className="text-3xl font-bold"></h2>
                        <div className="flex items-center gap-1 flex-wrap mb-1 ml-2"></div>
                      </div>
                      <p className="text-xl text-gray-600 mb-1"></p>
                      <p className="text-gray-600 text-xl"></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Align Left */}
      {isDisabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() =>
                !isDisabled && onUpdate({ ...card, cardLayout: "align-left" })
              }
              disabled={isDisabled}
              className={`p-1 rounded-lg transition-all ${
                card.cardLayout === "align-left"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                  : " opacity-50 hover:opacity-70"
              } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {/* <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-16 rounded overflow-hidden relative">
                  <div
                    className="h-8 w-full"
                    style={{ backgroundColor: card.brandColor }}
                  ></div>
                  <div className="h-8 w-full bg-white flex items-center justify-center">
                    <div className="absolute top-4 left-2 w-3 h-1 bg-white/80 rounded-sm"></div>
                    <div className="absolute bottom-2 left-2 w-2 h-2 bg-white rounded-full"></div>
                    <div className="space-y-0.5 mt-2 mr-1">
                      <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
                      <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium">Align Left</span>
              </div> */}

              <div className="cursor-pointer transition-all duration-300">
                <p className="text-center mb-2 text-sm font-medium text-gray-700">
                  Align Left
                </p>
                <div className="card-container rounded-xl overflow-hidden shadow-2xl bg-white relative cursor-not-allowed">
                  <div className="relative w-full aspect-[4/3]">
                    {/* <div
                      className="w-full h-full"
                      style={{
                        borderBottom: `6px solid ${card.brandColor}`,
                        backgroundColor: `${card.brandColor}80`,
                      }}
                    ></div> */}
                    <div
                      className="w-full h-full border-b-[15px] md:border-b-[6px] border-b-[var(--brand)] bg-[color:var(--back)]"
                      style={
                        {
                          ["--brand"]: card.brandColor,
                          ["--back"]: `${card.brandColor}80`,
                        } as React.CSSProperties
                      }
                    />
                    <div className="absolute top-3 right-3 w-1/4 aspect-video rounded-lg bg-gray-200"></div>
                    {/* Circle left */}
                    <div className="absolute bottom-0 left-3 translate-y-[38%]">
                      <div
                        className="w-20 sm:w-16 lg:w-7 aspect-square rounded-full relative before:content-[''] before:absolute before:w-full before:h-full before:left-0 before:top-0 before:bg-white before:rounded-full before:-z-10"
                        style={{
                          border: `3px solid ${card.brandColor}`,
                          backgroundColor: `${card.brandColor}80`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-6 pb-6 px-4">
                    <h2 className="text-lg md:text-xl font-bold mb-1"></h2>
                  </div>
                </div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Available when editing a card only.</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        // <button
        //   onClick={() =>
        //     !isDisabled && onUpdate({ ...card, cardLayout: "align-left" })
        //   }
        //   disabled={isDisabled}
        //   className={`p-4 rounded-lg border-2 transition-all ${
        //     card.cardLayout === "align-left"
        //       ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
        //       : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
        //   } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        // >
        //   <div className="flex flex-col items-center space-y-2">
        //     <div className="w-12 h-16 rounded overflow-hidden relative">
        //       <div
        //         className="h-8 w-full"
        //         style={{ backgroundColor: card.brandColor }}
        //       ></div>
        //       <div className="h-8 w-full bg-white flex items-center justify-center">
        //         <div className="absolute top-4 left-2 w-3 h-1 bg-white/80 rounded-sm"></div>
        //         <div className="absolute bottom-2 left-2 w-2 h-2 bg-white rounded-full"></div>
        //         <div className="space-y-0.5 mt-2 mr-1">
        //           <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
        //           <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
        //         </div>
        //       </div>
        //     </div>
        //     <span className="text-xs font-medium">Align Left</span>
        //   </div>
        // </button>
        <div
          onClick={() =>
            !isDisabled && onUpdate({ ...card, cardLayout: "align-left" })
          }
          className={`cursor-pointer shrink-0 w-[160px] transition-all duration-300 
            ${
              card.cardLayout === "align-left" ||
              (!card.cardLayout && currentTemplate === "classic")
                ? "bg-[var(--primary)]/10"
                : "opacity-50 hover:opacity-70"
            } 
            ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <div className="cursor-pointer shrink-0 w-[160px] transition-all duration-300">
            <p className="text-center mb-2 text-sm font-medium text-gray-700">
              Align Left
            </p>
            <div className="relative h-[170px] w-[160px] overflow-hidden rounded-xl">
              <div className="absolute left-0 top-0 w-[400px] origin-top-left scale-[0.4]">
                <div
                  className="max-w-md w-full card-container rounded-xl overflow-hidden shadow-2xl bg-white min-h-[425px]"
                  data-template="traditional"
                >
                  <div className="relative h-64">
                    <div
                      className="w-full h-full object-cover"
                      style={{
                        aspectRatio: "4 / 3",
                        borderBottom: `20px solid ${card.brandColor}`,
                        backgroundColor: `${card.brandColor}80`,
                      }}
                    />
                    <div className="absolute top-6 right-6">
                      <div
                        className="w-28 rounded-lg object-cover"
                        style={{
                          aspectRatio: "16 / 9",
                          backgroundColor: "#eee",
                        }}
                      />
                    </div>
                    <div className="absolute bottom-4 left-6 translate-y-1/2">
                      <div
                        className={`
                            w-28 h-28 rounded-full object-cover
                            ${
                              card.templateType === "traditional"
                                ? "relative before:content-[''] before:absolute before:w-full before:h-full before:left-0 before:right-0 before:bg-white before:rounded-[100px] before:-z-10"
                                : ""
                            }
                          `}
                        style={{
                          border: `6px solid ${card.brandColor}`,
                          backgroundColor: `${card.brandColor}80`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="pt-12 pb-8">
                    <div className="text-left mb-2 px-6">
                      <div className="flex items-end flex-wrap justify-start mb-2">
                        <h2 className="text-3xl font-bold"></h2>
                        <div className="flex items-center gap-1 flex-wrap mb-1 ml-2"></div>
                      </div>
                      <p className="text-xl text-gray-600 mb-1"></p>
                      <p className="text-gray-600 text-xl"></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portrait */}
      {isDisabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() =>
                !isDisabled && onUpdate({ ...card, cardLayout: "portrait" })
              }
              disabled={isDisabled}
              className={`p-1 rounded-lg transition-all ${
                card.cardLayout === "portrait"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                  : "opacity-50 hover:opacity-70"
              } ${isDisabled ? "cursor-not-allowed" : ""}`}
            >
              <div className="cursor-pointer transition-all duration-300">
                <p className="text-center mb-2 text-sm font-medium text-gray-700">
                  Portrait
                </p>
                <div className="card-container rounded-xl overflow-hidden shadow-2xl bg-white relative">
                  <div className="relative w-full aspect-[4/3]">
                    <div
                      className="w-full h-full border-b-[15px] md:border-b-[6px] border-b-[var(--brand)] bg-[color:var(--back)]"
                      style={
                        {
                          ["--brand"]: card.brandColor,
                          ["--back"]: `${card.brandColor}80`,
                        } as React.CSSProperties
                      }
                    />
                    {/* <div
                      className="w-full h-full"
                      style={{
                        borderBottom: `6px solid ${card.brandColor}`,
                        backgroundColor: `${card.brandColor}80`,
                      }}
                    ></div> */}

                    {/* No circle for portrait */}
                  </div>
                  <div className="pt-6 pb-6 px-4">
                    <h2 className="text-lg md:text-xl font-bold mb-1"></h2>
                  </div>
                </div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Available when editing a card only.</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        // <button
        //   onClick={() =>
        //     !isDisabled && onUpdate({ ...card, cardLayout: "portrait" })
        //   }
        //   disabled={isDisabled}
        //   className={`p-4 rounded-lg border-2 transition-all ${
        //     card.cardLayout === "portrait"
        //       ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
        //       : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
        //   } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        // >
        //   <div className="flex flex-col items-center space-y-2">
        //     <div className="w-9 h-12 rounded overflow-hidden relative">
        //       <div
        //         className="h-8 w-full"
        //         style={{ backgroundColor: card.brandColor }}
        //       ></div>
        //       <div className="h-4 w-full bg-white flex flex-col items-center justify-center">
        //         <div className="space-y-0.5">
        //           <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
        //           <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
        //         </div>
        //       </div>
        //     </div>
        //     <span className="text-xs font-medium">Portrait</span>
        //   </div>
        // </button>

        <div
          onClick={() =>
            !isDisabled && onUpdate({ ...card, cardLayout: "portrait" })
          }
          className={`cursor-pointer shrink-0 w-[160px] transition-all duration-300 
            ${
              card.cardLayout === "portrait" ||
              (!card.cardLayout && currentTemplate === "classic")
                ? "bg-[var(--primary)]/10"
                : "opacity-50 hover:opacity-70"
            } 
            ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <div className="cursor-pointer shrink-0 w-[160px] transition-all duration-300">
            <p className="text-center mb-2 text-sm font-medium text-gray-700">
              Portrait
            </p>
            <div className="relative h-[170px] w-[160px] overflow-hidden rounded-xl">
              <div className="absolute left-0 top-0 w-[400px] origin-top-left scale-[0.4]">
                <div
                  className="max-w-md w-full card-container rounded-xl overflow-hidden shadow-2xl bg-white min-h-[425px]"
                  data-template="traditional"
                  style={{ minWidth: "384px" }}
                >
                  <div className="relative h-96">
                    <div
                      className="w-full h-full object-cover"
                      style={{
                        aspectRatio: "1 / 1",
                        borderBottom: `20px solid ${card.brandColor}`,
                        backgroundColor: `${card.brandColor}80`,
                      }}
                    />
                  </div>
                  <div className="pt-12 pb-8">
                    <div className="text-left mb-2 px-6">
                      <div className="flex items-end flex-wrap justify-start mb-2">
                        <h2 className="text-3xl font-bold"></h2>
                        <div className="flex items-center gap-1 flex-wrap mb-1 ml-2"></div>
                      </div>
                      <p className="text-xl text-gray-600 mb-1"></p>
                      <p className="text-gray-600 text-xl"></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slides */}
      {isDisabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() =>
                !isDisabled && onUpdate({ ...card, cardLayout: "slides" })
              }
              disabled={isDisabled}
              className={`p-1 rounded-lg transition-all ${
                card.cardLayout === "slides"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                  : "opacity-50 hover:opacity-70"
              } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {/* <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-16 rounded overflow-hidden relative">
                  <div
                    className="h-8 w-full"
                    style={{ backgroundColor: card.brandColor }}
                  ></div>
                  <div className="h-8 w-full bg-white flex items-center justify-center">
                    <div className="absolute top-5 left-2 flex space-x-0.5">
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                      <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                      <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                    </div>
                    <div className="absolute top-6 right-2 w-2 h-2 bg-white rounded-full"></div>
                    <div className="space-y-0.5 mt-2">
                      <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
                      <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium">Slides</span>
              </div> */}

              <div className="cursor-pointer transition-all duration-300">
                <p className="text-center mb-2 text-sm font-medium text-gray-700">
                  Slides
                </p>
                <div className="card-container rounded-xl overflow-hidden shadow-2xl bg-white relative cursor-not-allowed">
                  <div className="relative w-full aspect-[4/3]">
                    <div
                      className="w-full h-full border-b-[15px] md:border-b-[6px] border-b-[var(--brand)] bg-[color:var(--back)]"
                      style={
                        {
                          ["--brand"]: card.brandColor,
                          ["--back"]: `${card.brandColor}80`,
                        } as React.CSSProperties
                      }
                    />
                    {/* <div
                      className="w-full h-full"
                      style={{
                        borderBottom: `6px solid ${card.brandColor}`,
                        backgroundColor: `${card.brandColor}80`,
                      }}
                    ></div> */}
                    {/* <div className="absolute top-3 left-3 w-1/4 aspect-video rounded-lg bg-gray-200"></div> */}
                    {/* Circle right */}
                    <div className="absolute bottom-0 right-3 translate-y-[38%]">
                      <div
                        className="w-20 sm:w-16 lg:w-7 aspect-square rounded-full relative before:content-[''] before:absolute before:w-full before:h-full before:left-0 before:top-0 before:bg-white before:rounded-full before:-z-10"
                        style={{
                          border: `3px solid ${card.brandColor}`,
                          backgroundColor: `${card.brandColor}80`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-6 pb-6 px-4">
                    <h2 className="text-lg md:text-xl font-bold mb-1"></h2>
                  </div>
                </div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Available when editing a card only.</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        // <button
        //   onClick={() =>
        //     !isDisabled && onUpdate({ ...card, cardLayout: "slides" })
        //   }
        //   disabled={isDisabled}
        //   className={`p-4 rounded-lg border-2 transition-all ${
        //     card.cardLayout === "slides"
        //       ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
        //       : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
        //   } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        // >
        //   <div className="flex flex-col items-center space-y-2">
        //     <div className="w-12 h-16 rounded overflow-hidden relative">
        //       <div
        //         className="h-8 w-full"
        //         style={{ backgroundColor: card.brandColor }}
        //       ></div>
        //       <div className="h-8 w-full bg-white flex items-center justify-center">
        //         <div className="absolute top-5 left-2 flex space-x-0.5">
        //           <div className="w-1 h-1 bg-white rounded-full"></div>
        //           <div className="w-1 h-1 bg-white/60 rounded-full"></div>
        //           <div className="w-1 h-1 bg-white/60 rounded-full"></div>
        //         </div>
        //         <div className="absolute top-6 right-2 w-2 h-2 bg-white rounded-full"></div>
        //         <div className="space-y-0.5 mt-2">
        //           <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
        //           <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
        //         </div>
        //       </div>
        //     </div>
        //     <span className="text-xs font-medium">Slides</span>
        //   </div>
        // </button>
        <div
          onClick={() =>
            !isDisabled && onUpdate({ ...card, cardLayout: "slides" })
          }
          className={`cursor-pointer shrink-0 w-[160px] transition-all duration-300 
            ${
              card.cardLayout === "slides" ||
              (!card.cardLayout && currentTemplate === "classic")
                ? "bg-[var(--primary)]/10"
                : "opacity-50 hover:opacity-70"
            } 
            ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <div className="cursor-pointer shrink-0 w-[160px] transition-all duration-300">
            <p className="text-center mb-2 text-sm font-medium text-gray-700">Slides</p>
            <div className="relative h-[170px] w-[160px] overflow-hidden rounded-xl">
              <div className="absolute left-0 top-0 w-[400px] origin-top-left scale-[0.4]">
                <div
                  className="max-w-md w-full card-container rounded-xl overflow-hidden shadow-2xl bg-white min-h-[425px]"
                  data-template="traditional"
                  style={{ minWidth: "384px" }}
                >
                  <div className="relative h-64">
                    <div
                      className="w-full h-full object-cover"
                      style={{
                        aspectRatio: "4 / 3",
                        borderBottom: `20px solid ${card.brandColor}`,
                        backgroundColor: `${card.brandColor}80`,
                      }}
                    />

                    <div className="absolute bottom-4 right-6 translate-y-1/2">
                      <div
                        className={`
                            w-28 h-28 rounded-full object-cover
                            ${
                              card.templateType === "traditional"
                                ? "relative before:content-[''] before:absolute before:w-full before:h-full before:left-0 before:right-0 before:bg-white before:rounded-[100px] before:-z-10"
                                : ""
                            }
                          `}
                        style={{
                          border: `6px solid ${card.brandColor}`,
                          backgroundColor: `${card.brandColor}80`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="pt-12 pb-8">
                    <div className="text-left mb-2 px-6">
                      <div className="flex items-end flex-wrap justify-start mb-2">
                        <h2 className="text-3xl font-bold"></h2>
                        <div className="flex items-center gap-1 flex-wrap mb-1 ml-2"></div>
                      </div>
                      <p className="text-xl text-gray-600 mb-1"></p>
                      <p className="text-gray-600 text-xl"></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderModernDesigns = () => (
    <>
      {/* Standard */}
      {isDisabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() =>
                !isDisabled && onUpdate({ ...card, cardLayout: "standard" })
              }
              disabled={isDisabled}
              className={`p-1 rounded-lg transition-all ${
                card.cardLayout === "standard" ||
                (!card.cardLayout && currentTemplate === "modern")
                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                  : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
              } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {/* <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-16 rounded overflow-hidden relative">
                  <div
                    className="h-8 w-full"
                    style={{ backgroundColor: card.brandColor }}
                  ></div>
                  <div className="h-8 w-full bg-white flex items-center justify-center">
                    <div className="absolute top-6 left-2 w-2 h-2 bg-white rounded-full"></div>
                    <div className="space-y-0.5 mt-2">
                      <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
                      <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
                      <div className="w-4 h-0.5 bg-foreground/40 rounded-sm"></div>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium">Standard</span>
              </div> */}
              <div className="cursor-pointer transition-all duration-300">
                <p className="text-center mb-2 text-sm font-medium text-gray-700">
                  Standard
                </p>
                <div className="card-container rounded-xl overflow-hidden shadow-2xl bg-white relative cursor-not-allowed">
                  <div className="relative bg-white">
                    <div className="relative w-full aspect-[4/3]">
                      <div
                        className="w-full h-full"
                        style={{
                          // borderBottom: `6px solid ${card.brandColor}`,
                          backgroundColor: `${card.brandColor}90`,
                        }}
                      ></div>
                      <div
                        className="absolute bottom-5 right-3 w-1/4 aspect-video rounded-xl bg-gray-200 translate-y-4"
                        style={{ bottom: 4 }}
                      ></div>

                      {/* Circle left */}
                      <div className="absolute bottom-0 left-3 translate-y-[38%]">
                        <div
                          className="w-20 sm:w-16 lg:w-7 aspect-square rounded-full relative before:content-[''] before:absolute before:w-full before:h-full before:left-0 before:top-0 before:bg-white before:rounded-full before:-z-10"
                          style={{
                            border: `3px solid #FFF`,
                            backgroundColor: `${card.brandColor}90`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-6 pb-6 px-4">
                    <h2 className="text-lg md:text-xl font-bold mb-1"></h2>
                  </div>
                </div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Available when editing a card only.</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        // <button
        //   onClick={() =>
        //     !isDisabled && onUpdate({ ...card, cardLayout: "standard" })
        //   }
        //   disabled={isDisabled}
        //   className={`p-4 rounded-lg border-2 transition-all ${
        //     card.cardLayout === "standard" ||
        //     (!card.cardLayout && currentTemplate === "modern")
        //       ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
        //       : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
        //   } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        // >
        //   <div className="flex flex-col items-center space-y-2">
        //     <div className="w-12 h-16 rounded overflow-hidden relative">
        //       <div
        //         className="h-8 w-full"
        //         style={{ backgroundColor: card.brandColor }}
        //       ></div>
        //       <div className="h-8 w-full bg-white flex items-center justify-center">
        //         <div className="absolute top-6 left-2 w-2 h-2 bg-white rounded-full"></div>
        //         <div className="space-y-0.5 mt-2">
        //           <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
        //           <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
        //           <div className="w-4 h-0.5 bg-foreground/40 rounded-sm"></div>
        //         </div>
        //       </div>
        //     </div>
        //     <span className="text-xs font-medium">Standard</span>
        //   </div>
        // </button>
        <div
          onClick={() =>
            !isDisabled && onUpdate({ ...card, cardLayout: "standard" })
          }
          className={`cursor-pointer shrink-0 w-[160px] transition-all duration-300 
            ${
              card.cardLayout === "standard" ||
              (!card.cardLayout && currentTemplate === "modern")
                ? "bg-[var(--primary)]/10"
                : "opacity-50 hover:opacity-70"
            } 
            ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <p className="text-center mb-2 text-sm font-medium text-gray-700">Standard</p>
          <div className="relative h-[170px] w-[160px] overflow-hidden rounded-xl">
            <div className="absolute left-0 top-0 w-[400px] origin-top-left scale-[0.4]">
              <div
                className="max-w-md w-full rounded-2xl shadow-2xl card-container overflow-hidden bg-white min-h-[425px]"
                data-id="card-container"
                data-template="modern"
                style={{ minWidth: "384px" }}
              >
                <div className="flex flex-col relative justify-center bg-white rounded-2xl">
                  <div className="relative bg-white rounded-2xl">
                    <div className="relative">
                      <div
                        className="relative w-full aspect-[16/9] bg-[#FFD93D] h-[250] rounded-2xl shadow-2xl"
                        style={{ backgroundColor: card.brandColor || "#99b2ff" }}
                      ></div>
                      <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/10 via-black/5 to-transparent pointer-events-none"></div>
                    </div>

                    <div className="px-6">
                      <div
                        className="border-[6px] border-white left-10 object-cover absolute w-28 h-28 rounded-full bottom-0 translate-y-1/2"
                        style={{
                          backgroundColor: card.brandColor || "#99b2ff",
                        }}
                      ></div>
                      <div
                        className="absolute bottom-0 top-[250px] left-[180px] translate-y-1/2 w-16 h-9 rounded-xl"
                        style={{
                          backgroundColor: "#ccc",
                        }}
                      ></div>
                    </div>
                  </div>
                  <div></div>
                </div>
                <div className="flex flex-col items-start justify-start bg-white p-6 pb-0 pt-20">
                  <div className="flex flex-col gap-1 items-start justify-start">
                    <div
                      className="flex items-end flex-wrap justify-start gap-2 mb-2 gap-y-1 text-3xl font-bold"
                      data-id="name"
                    >
                      <div className="flex items-center gap-1 flex-wrap mb-1"></div>
                    </div>
                    <div className="text-xl"></div>
                    <div className="text-xl font-light"></div>
                    <div className="text-md text-gray-500 mt-2"></div>
                  </div>
                </div>

                <div className="flex flex-col items-start justify-start bg-white py-6 px-3 pt-2">
                  <div
                    data-rfd-droppable-id="links"
                    className="flex flex-col items-start justify-start w-full gap-2 min-h-[50px] transition-all duration-200 bg-transparent py-2 w-full"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Centered */}
      {isDisabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() =>
                !isDisabled && onUpdate({ ...card, cardLayout: "centered" })
              }
              disabled={isDisabled}
              className={`p-1 rounded-lg transition-all ${
                card.cardLayout === "centered"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                  : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
              } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {/* <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-16 rounded overflow-hidden relative">
                  <div
                    className="h-8 w-full"
                    style={{ backgroundColor: card.brandColor }}
                  ></div>
                  <div className="h-8 w-full bg-white flex flex-col items-center justify-center">
                    <div className="absolute top-5 w-2 h-2 bg-white rounded-full"></div>
                    <div className="space-y-0.5 mt-3 flex flex-col items-center">
                      <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
                      <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
                      <div className="w-4 h-0.5 bg-foreground/40 rounded-sm"></div>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium">Centered</span>
              </div> */}
              <div className="cursor-pointer transition-all duration-300">
                <p className="text-center mb-2 text-sm font-medium text-gray-700">
                  Centered
                </p>
                <div className="card-container rounded-xl overflow-hidden shadow-2xl bg-white relative cursor-not-allowed">
                  <div className="relative w-full aspect-[4/3]">
                    <div
                      className="w-full h-full"
                      style={{
                        // borderBottom: `6px solid ${card.brandColor}`,
                        backgroundColor: `${card.brandColor}90`,
                      }}
                    ></div>
                    <div
                      className="absolute w-1/4 aspect-video rounded-xl bg-gray-200"
                      style={{
                        bottom: -22,
                        right: 35,
                        zIndex: 99999999,
                      }}
                    ></div>
                    {/* Circle right */}
                    <div
                      className="absolute bottom-0 right-3 translate-y-[38%]"
                      style={{ right: 50 }}
                    >
                      <div
                        className="w-20 sm:w-16 lg:w-7 aspect-square rounded-full relative before:content-[''] before:absolute before:w-full before:h-full before:left-0 before:top-0 before:bg-white before:rounded-full before:-z-10"
                        style={{
                          border: `3px solid #FFF`,
                          backgroundColor: `${card.brandColor}90`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-6 pb-6 px-4">
                    <h2 className="text-lg md:text-xl font-bold mb-1"></h2>
                  </div>
                </div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Available when editing a card only.</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        // <button
        //   onClick={() =>
        //     !isDisabled && onUpdate({ ...card, cardLayout: "centered" })
        //   }
        //   disabled={isDisabled}
        //   className={`p-4 rounded-lg border-2 transition-all ${
        //     card.cardLayout === "centered"
        //       ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
        //       : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
        //   } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        // >
        //   <div className="flex flex-col items-center space-y-2">
        //     <div className="w-12 h-16 rounded overflow-hidden relative">
        //       <div
        //         className="h-8 w-full"
        //         style={{ backgroundColor: card.brandColor }}
        //       ></div>
        //       <div className="h-8 w-full bg-white flex flex-col items-center justify-center">
        //         <div className="absolute top-5 w-2 h-2 bg-white rounded-full"></div>
        //         <div className="space-y-0.5 mt-3 flex flex-col items-center">
        //           <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
        //           <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
        //           <div className="w-4 h-0.5 bg-foreground/40 rounded-sm"></div>
        //         </div>
        //       </div>
        //     </div>
        //     <span className="text-xs font-medium">Centered</span>
        //   </div>
        // </button>
        <div
          onClick={() =>
            !isDisabled && onUpdate({ ...card, cardLayout: "centered" })
          }
          className={`cursor-pointer shrink-0 w-[160px] transition-all duration-300 
            ${
              card.cardLayout === "centered" ||
              (!card.cardLayout && currentTemplate === "modern")
                ? "bg-[var(--primary)]/10"
                : "opacity-50 hover:opacity-70"
            } 
            ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <p className="text-center mb-2 text-sm font-medium text-gray-700">Centered</p>
          <div className="relative h-[170px] w-[160px] overflow-hidden rounded-xl">
            <div className="absolute left-0 top-0 w-[400px] origin-top-left scale-[0.4]">
              <div
                className="max-w-md w-full rounded-2xl shadow-2xl card-container overflow-hidden bg-white min-h-[425px]"
                data-id="card-container"
                data-template="modern"
                style={{ minWidth: "384px" }}
              >
                <div className="flex flex-col relative justify-center bg-white rounded-2xl">
                  <div className="relative bg-white rounded-2xl">
                    <div className="relative">
                      <div
                        className="relative w-full aspect-[16/9] bg-[#FFD93D] h-[250px] rounded-2xl shadow-2xl"
                        style={{ backgroundColor: card.brandColor || "#99b2ff" }}
                      ></div>
                      <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/10 via-black/5 to-transparent pointer-events-none"></div>
                    </div>
                    <div className="px-6">
                      <div
                        className="border-[6px] border-white object-cover w-28 absolute rounded-full bottom-0 left-1/2 translate-y-1/2 -translate-x-1/2"
                        style={{
                          backgroundColor: card.brandColor || "#99b2ff",
                          aspectRatio: "1 / 1",
                        }}
                      ></div>

                      <div
                        className="absolute left-[333px] top-[250px] bottom-0 translate-y-1/2 w-16 h-9 rounded-xl"
                        style={{
                          backgroundColor: "#ccc",
                          aspectRatio: "16 / 9",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-start justify-start bg-white p-6 pb-0 pt-20">
                  <div className="flex flex-col gap-1 items-start justify-start">
                    <div
                      className="flex items-end flex-wrap justify-start gap-2 mb-2 gap-y-1 text-3xl font-bold"
                      data-id="name"
                    >
                      <div className="flex items-center gap-1 flex-wrap mb-1"></div>
                    </div>
                    <div className="text-xl"></div>
                    <div className="text-xl font-light"></div>
                    <div className="text-md text-gray-500 mt-2"></div>
                  </div>
                </div>

                <div className="flex flex-col items-start justify-start bg-white py-6 px-3 pt-2">
                  <div
                    data-rfd-droppable-id="links"
                    className="flex flex-col items-start justify-start w-full gap-2 min-h-[50px] transition-all duration-200 bg-transparent py-2 w-full"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FadeIn */}
      {isDisabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() =>
                !isDisabled && onUpdate({ ...card, cardLayout: "fadein" })
              }
              disabled={isDisabled}
              className={`p-1 rounded-lg transition-all ${
                card.cardLayout === "fadein"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                  : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
              } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {/* <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-16 rounded overflow-hidden relative">
                  <div
                    className="h-8 w-full"
                    style={{ backgroundColor: card.brandColor }}
                  ></div>
                  <div className="h-8 w-full bg-white flex flex-col items-center justify-center">
                    <div className="absolute top-5 w-2 h-2 bg-white rounded-full"></div>
                    <div className="space-y-0.5 mt-3 flex flex-col items-center">
                      <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
                      <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
                      <div className="w-4 h-0.5 bg-foreground/40 rounded-sm"></div>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium">Centered</span>
              </div> */}
              <div className="cursor-pointer transition-all duration-300">
                <p className="text-center mb-2 text-sm font-medium text-gray-700">
                  Fade In
                </p>
                <div className="card-container rounded-xl overflow-hidden shadow-2xl bg-white relative cursor-not-allowed">
                  <div className="relative w-full aspect-[4/3]">
                    <div
                      className="w-full h-full"
                      style={{
                        // borderBottom: `6px solid ${card.brandColor}`,
                        backgroundColor: `${card.brandColor}90`,
                      }}
                    ></div>
                    <div
                      className="absolute w-1/4 aspect-video rounded-xl bg-gray-200"
                      style={{
                        bottom: -22,
                        right: 35,
                        zIndex: 99999999,
                      }}
                    ></div>
                    {/* Circle right */}
                    <div
                      className="absolute bottom-0 right-3 translate-y-[38%]"
                      style={{ right: 50 }}
                    >
                      <div
                        className="w-20 sm:w-16 lg:w-7 aspect-square rounded-full relative before:content-[''] before:absolute before:w-full before:h-full before:left-0 before:top-0 before:bg-white before:rounded-full before:-z-10"
                        style={{
                          border: `3px solid #FFF`,
                          backgroundColor: `${card.brandColor}90`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-6 pb-6 px-4">
                    <h2 className="text-lg md:text-xl font-bold mb-1"></h2>
                  </div>
                </div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Available when editing a card only.</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        // <button
        //   onClick={() =>
        //     !isDisabled && onUpdate({ ...card, cardLayout: "centered" })
        //   }
        //   disabled={isDisabled}
        //   className={`p-4 rounded-lg border-2 transition-all ${
        //     card.cardLayout === "centered"
        //       ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
        //       : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
        //   } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        // >
        //   <div className="flex flex-col items-center space-y-2">
        //     <div className="w-12 h-16 rounded overflow-hidden relative">
        //       <div
        //         className="h-8 w-full"
        //         style={{ backgroundColor: card.brandColor }}
        //       ></div>
        //       <div className="h-8 w-full bg-white flex flex-col items-center justify-center">
        //         <div className="absolute top-5 w-2 h-2 bg-white rounded-full"></div>
        //         <div className="space-y-0.5 mt-3 flex flex-col items-center">
        //           <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
        //           <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
        //           <div className="w-4 h-0.5 bg-foreground/40 rounded-sm"></div>
        //         </div>
        //       </div>
        //     </div>
        //     <span className="text-xs font-medium">Centered</span>
        //   </div>
        // </button>
        <div
          onClick={() =>
            !isDisabled && onUpdate({ ...card, cardLayout: "fadein" })
          }
          className={`cursor-pointer shrink-0 w-[160px] transition-all duration-300 
            ${
              card.cardLayout === "fadein" ||
              (!card.cardLayout && currentTemplate === "modern")
                ? "bg-[var(--primary)]/10"
                : "opacity-50 hover:opacity-70"
            } 
            ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <p className="text-center mb-2 text-sm font-medium text-gray-700">Fade In</p>
          <div className="relative h-[170px] w-[160px] overflow-hidden rounded-xl">
            <div className="absolute left-0 top-0 w-[400px] origin-top-left scale-[0.4]">
              <div
                className="max-w-md w-full rounded-2xl shadow-2xl card-container overflow-hidden bg-white min-h-[425px]"
                data-id="card-container"
                data-template="modern"
                style={{ minWidth: "384px" }}
              >
                <div className="flex flex-col relative justify-center bg-white rounded-2xl">
                  <div className="relative bg-white rounded-2xl">
                    <div className="relative">
                      <div
                        className="relative w-full aspect-[16/9] bg-[#FFD93D] h-[300px]  shadow-2xl"
                        style={{ backgroundColor: card.brandColor || "#99b2ff" }}
                      ></div>
                      <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/10 via-black/5 to-transparent pointer-events-none"></div>
                    </div>
                    <div className="px-6">
                      <div
                        className="border-[6px] border-white object-cover w-28 absolute rounded-full bottom-0 left-1/2 -translate-y-[115%] -translate-x-1/2"
                        style={{
                          backgroundColor: card.brandColor || "#99b2ff",
                          aspectRatio: "1 / 1",
                        }}
                      ></div>

                      <div
                        className="absolute left-[333px] top-[77px] w-16 h-9 rounded-xl"
                        style={{
                          backgroundColor: "#ccc",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-start justify-start bg-white p-6 pb-0 pt-20">
                  <div className="flex flex-col gap-1 items-start justify-start">
                    <div
                      className="flex items-end flex-wrap justify-start gap-2 mb-2 gap-y-1 text-3xl font-bold"
                      data-id="name"
                    >
                      <div className="flex items-center gap-1 flex-wrap mb-1"></div>
                    </div>
                    <div className="text-xl"></div>
                    <div className="text-xl font-light"></div>
                    <div className="text-md text-gray-500 mt-2"></div>
                  </div>
                </div>

                <div className="flex flex-col items-start justify-start bg-white py-6 px-3 pt-2">
                  {/* <div
                    data-rfd-droppable-id="links"
                    className="flex flex-col items-start justify-start w-full gap-2 min-h-[50px] transition-all duration-200 bg-transparent py-2 w-full"
                  ></div> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portrait */}
      {isDisabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() =>
                !isDisabled && onUpdate({ ...card, cardLayout: "portrait" })
              }
              disabled={isDisabled}
              className={`p-1 rounded-lg transition-all ${
                card.cardLayout === "portrait"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                  : "opacity-50 hover:opacity-70"
              } ${isDisabled ? "cursor-not-allowed" : ""}`}

              // className={`p-1 rounded-lg transition-all ${
              //   card.cardLayout === "portrait"
              //     ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
              //     : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
              // } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {/* <div className="flex flex-col items-center space-y-2">
                <div className="w-9 h-12 rounded overflow-hidden relative">
                  <div
                    className="h-8 w-full"
                    style={{ backgroundColor: card.brandColor }}
                  ></div>
                  <div className="h-4 w-full bg-white flex flex-col items-center justify-center">
                    <div className="space-y-0.5">
                      <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
                      <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium">Portrait</span>
              </div> */}
              <div className="cursor-pointer transition-all duration-300">
                <p className="text-center mb-2 text-sm font-medium text-gray-700">
                  Portrait
                </p>
                <div className="card-container rounded-xl overflow-hidden shadow-2xl bg-white relative">
                  <div className="relative w-full aspect-[4/3]">
                    <div
                      className="w-full h-full"
                      style={{
                        // borderBottom: `6px solid ${card.brandColor}`,
                        backgroundColor: `${card.brandColor}80`,
                      }}
                    ></div>

                    {/* No circle for portrait */}
                  </div>
                  <div className="pt-6 pb-6 px-4">
                    <h2 className="text-lg md:text-xl font-bold mb-1"></h2>
                  </div>
                </div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Available when editing a card only.</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        // <button
        //   onClick={() =>
        //     !isDisabled && onUpdate({ ...card, cardLayout: "portrait" })
        //   }
        //   disabled={isDisabled}
        //   className={`p-4 rounded-lg border-2 transition-all ${
        //     card.cardLayout === "portrait"
        //       ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
        //       : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
        //   } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        // >
        //   <div className="flex flex-col items-center space-y-2">
        //     <div className="w-9 h-12 rounded overflow-hidden relative">
        //       <div
        //         className="h-8 w-full"
        //         style={{ backgroundColor: card.brandColor }}
        //       ></div>
        //       <div className="h-4 w-full bg-white flex flex-col items-center justify-center">
        //         <div className="space-y-0.5">
        //           <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
        //           <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
        //         </div>
        //       </div>
        //     </div>
        //     <span className="text-xs font-medium">Portrait</span>
        //   </div>
        // </button>
        <div
          onClick={() =>
            !isDisabled && onUpdate({ ...card, cardLayout: "portrait" })
          }
          className={`cursor-pointer shrink-0 w-[160px] transition-all duration-300 
            ${
              card.cardLayout === "portrait" ||
              (!card.cardLayout && currentTemplate === "modern")
                ? "bg-[var(--primary)]/10"
                : "opacity-50 hover:opacity-70"
            } 
            ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <div className="cursor-pointer shrink-0 w-[160px] transition-all duration-300">
            <p className="text-center mb-2 text-sm font-medium text-gray-700">
              Portrait
            </p>
            <div className="relative h-[170px] w-[160px] overflow-hidden rounded-xl">
              <div className="absolute left-0 top-0 w-[400px] origin-top-left scale-[0.4]">
                <div
                  className="max-w-md w-full rounded-2xl shadow-2xl card-container overflow-hidden bg-white min-h-[425px]"
                  data-id="card-container"
                  data-template="modern"
                >
                  <div className="flex flex-col relative items-center justify-center bg-white overflow-hidden rounded-2xl">
                    <div className="relative bg-white rounded-2xl">
                      <div className="relative">
                        <div
                          className="relative w-full aspect-[16/9] bg-[#FFD93D] h-[400px]"
                          style={{
                            backgroundColor: card.brandColor || "#99b2ff",
                          }}
                        ></div>
                        <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/10 via-black/5 to-transparent pointer-events-none"></div>
                        <div
                          className="border-[6px] border-white left-10 object-cover absolute w-28 h-28 rounded-full bottom-0 translate-y-1/2"
                          style={{
                            backgroundColor: card.brandColor || "#99b2ff",
                          }}
                        ></div>
                        <div
                          className="absolute bottom-0 top-[400px] left-[180px] translate-y-1/2 w-16 h-9 rounded-xl"
                          style={{
                            backgroundColor: "#ccc",
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-start justify-start bg-white p-6 pb-0 pt-20">
                    <div className="flex flex-col gap-1 items-start justify-start">
                      <div
                        className="flex items-end flex-wrap justify-start gap-2 mb-2 gap-y-1 text-3xl font-bold"
                        data-id="name"
                      >
                        <div className="flex items-center gap-1 flex-wrap mb-1"></div>
                      </div>
                      <div className="text-xl"></div>
                      <div className="text-xl font-light"></div>
                      <div className="text-md text-gray-500 mt-2"></div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start justify-start bg-white py-6 px-3 pt-2">
                    <div
                      data-rfd-droppable-id="links"
                      className="flex flex-col items-start justify-start w-full gap-2 min-h-[50px] transition-all duration-200 bg-transparent py-2 w-full"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const designSlides = React.Children.toArray(
    (currentTemplate === "classic"
      ? renderClassicDesigns()
      : currentTemplate === "modern"
        ? renderModernDesigns()
        : renderTraditionalDesigns()
    ).props.children,
  );

  const designNav = useSliderNav(
    designSlides.length,
    activeDesign,
    setActiveDesign,
  );

  return (
    <TooltipProvider>
      {/* Client: on desktop ALL four card designs are shown at once; the
          slider is the narrow-screen fallback. Driven by this section's own
          width so the onboarding panel (~436px) keeps the slider while the
          dashboard Edit tab shows the full set. */}
      <div className="space-y-3 [container-type:inline-size]">
        {!isDisabled && (
          <Label className="text-sm text-muted-foreground">Card Design</Label>
        )}
        <div className={isDisabled ? "hidden" : "block"}>
          <div
            className="relative w-full overflow-hidden outline-none"
            aria-label="Card design"
            {...designNav.handlers}
          >
            <div className="[@container(min-width:560px)]:hidden">
              <SliderArrows
                onPrev={designNav.goPrev}
                onNext={designNav.goNext}
                canPrev={designNav.canPrev}
                canNext={designNav.canNext}
                label="design"
              />
            </div>
            <div
              className="flex transition-transform duration-300 ease-in-out [@container(min-width:560px)]:grid [@container(min-width:560px)]:items-start [@container(min-width:560px)]:grid-cols-[repeat(auto-fit,160px)] [@container(min-width:560px)]:justify-center [@container(min-width:560px)]:gap-2 [@container(min-width:560px)]:!transform-none"
              style={{ transform: `translateX(-${activeDesign * 100}%)` }}
            >
              {designSlides.map((slide, idx) => (
                <div
                  key={idx}
                  className="w-full shrink-0 flex items-center justify-center py-1"
                >
                  {slide}
                </div>
              ))}
            </div>
          </div>

          {/* Slider Dots */}
          <div className="flex items-center justify-center gap-2 mt-2 [@container(min-width:560px)]:hidden">
            {designSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveDesign(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeDesign === idx
                    ? "w-6 bg-indigo-600"
                    : "w-2 bg-slate-300 hover:bg-slate-400"
                }`}
                aria-label={`Go to design ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// flex gap-6 py-8 flex-wrap
