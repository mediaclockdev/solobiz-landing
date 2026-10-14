"use client";
import React, { useState } from "react";
import Tesseract from "tesseract.js"; // ✅ OCR
import { FormComponentProps } from "@/types/businessCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Card } from "@/components/ui/card";
import { Pencil } from "lucide-react";

export function BusinessForm({
  card,
  onUpdate,
  onEditingChange,
}: FormComponentProps) {
  const [activeTab, setActiveTab] = React.useState<"manual" | "upload">(
    "manual",
  );
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [extractedText, setExtractedText] = React.useState<string>(""); // ✅ OCR result
  const [loading, setLoading] = React.useState(false); // ✅ OCR loading
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [cardSnapshot, setCardSnapshot] = useState<typeof card | null>(null);

  React.useEffect(() => {
    if (onEditingChange) {
      onEditingChange(isEditingBio);
    }
  }, [isEditingBio, onEditingChange]);

  const handleInputChange = (field: string, value: string) => {
    const keys = field.split(".");
    const updatedCard = JSON.parse(JSON.stringify(card));

    let current: any = updatedCard;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    onUpdate(updatedCard);
  };

  const formatPhone = (phone: string) => {
    if (!phone) return "";

    // Clean input (keep +)
    const cleaned = phone.replace(/(?!^\+)\D/g, "");

    // Remove "+"
    const digits = cleaned.replace("+", "");

    // Known country codes
    const knownCodes = ["1", "91"];

    let countryCode = "";
    let rest = "";

    // Try to match known country codes first
    for (const code of knownCodes) {
      if (digits.startsWith(code)) {
        countryCode = code;
        rest = digits.slice(code.length);
        break;
      }
    }

    // If not matched → fallback to first 1–3 digits as country code
    if (!countryCode) {
      countryCode = digits.slice(0, 3);
      rest = digits.slice(3);
    }

    // --- USA/Canada format ---
    if (countryCode === "1" && rest.length === 10) {
      return `+1 (${rest.slice(0, 3)}) ${rest.slice(3, 6)}-${rest.slice(6)}`;
    }

    // --- India format ---
    if (countryCode === "91" && rest.length === 10) {
      return `+91 ${rest.slice(0, 5)} ${rest.slice(5)}`;
    }

    // --- Default fallback: group 3-3-3 ---
    return `+${countryCode} ${rest.replace(/(\d{3})(?=\d)/g, "$1 ")}`;
  };

  const handlePhoneChange = (value: string) => {
    const raw = "+" + value.replace(/\D/g, "");
    const formatted = formatPhone(raw); // apply proper format

    const updatedCard = JSON.parse(JSON.stringify(card));
    updatedCard.business.phone = formatted;
    onUpdate(updatedCard);
  };

  const handleAccreditationsChange = (value: string) => {
    const accreditations = value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item);
    const updatedCard = JSON.parse(JSON.stringify(card));
    updatedCard.profile.accreditations = accreditations;
    onUpdate(updatedCard);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleExtractText = async () => {
    if (!selectedFile) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("cardId", card.id); // optional metadata

      const res = await fetch(
        "https://robuc33.app.n8n.cloud/webhook/business-card-upload",
        {
          method: "POST",
          body: formData,
        },
      );

      if (!res.ok) {
        throw new Error("OCR webhook failed");
      }

      const data = await res.json();

      const parseJobTitle = (jobTitle?: string) => {
        if (!jobTitle) {
          return { title: "", department: "" };
        }

        const parts = jobTitle.split("•").map((p) => p.trim());

        return {
          title: parts[0] || "",
          department: parts[1] || "",
        };
      };

      console.log("Data", data);
      const { title, department } = parseJobTitle(data.jobTitle);
      /**
       * Expected response from n8n:
       * {
       *   firstName,
       *   lastName,
       *   phone,
       *   email,
       *   company,
       *   website,
       *   address: { street, city, state, zip }
       * }
       */

      const updatedCard = {
        ...card,
        profile: {
          ...card.profile,
          firstName: data.fullName || "",
          lastName: data.lastName || "",
          company: data.company || "",
          title: title || "",
          department: department || "",
        },
        business: {
          ...card.business,
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || "",
          // The scanner returns `address` either as the documented object
          // ({ street, city, state, zip }) or, from some cards, as a single
          // string. Normalise before merging so both shapes land correctly and
          // existing values survive when a field is missing.
          //
          // This previously spread `data.address` and THEN wrote
          // `street: data.address || "sddsc"`, which overwrote street with the
          // whole object in the documented case, and fell back to the literal
          // debug string "sddsc" whenever the scan returned no address at all.
          address: {
            ...card.business.address,
            ...(typeof data.address === "string"
              ? { street: data.address }
              : (data.address ?? {})),
          },
        },
      };

      onUpdate(updatedCard);
    } catch (err) {
      console.error("❌ OCR Error:", err);
      alert("Failed to extract text from card");
    } finally {
      setLoading(false);
    }
  };

  console.log("Address Card ", card);

  return (
    <>
      <div className="space-y-6 hidden">
        <div>
          {/* Manual Entry / Upload Card Tabs */}
          <div className="mb-6">
            <div className="flex gap-8 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab("manual")}
                className={`relative pb-2 text-sm font-medium transition-colors ${
                  activeTab === "manual"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Manual Entry
                {activeTab === "manual" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("upload")}
                className={`relative pb-2 text-sm font-medium transition-colors ${
                  activeTab === "upload"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Upload Card
                {activeTab === "upload" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            </div>
          </div>

          {/* Manual Entry Form */}
          {activeTab === "manual" && (
            <>
              {/* First Name and Last Name */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First Name<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="First Name"
                    value={card.profile.firstName || ""}
                    onChange={(e) =>
                      handleInputChange("profile.firstName", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Last Name"
                    value={card.profile.lastName || ""}
                    onChange={(e) =>
                      handleInputChange("profile.lastName", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Accreditations */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="accreditations" className="text-sm font-medium">
                  Accreditations
                </Label>
                <Input
                  id="accreditations"
                  placeholder="e.g. MBA, PhD, CPA (separate with commas)"
                  value={(card.profile.accreditations || []).join(", ")}
                  onChange={(e) => handleAccreditationsChange(e.target.value)}
                />
              </div>

              {/* Company Name */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="company" className="text-sm font-medium">
                  Company Name
                </Label>
                <Input
                  id="company"
                  placeholder="Enter your company name"
                  value={card.profile.company || ""}
                  onChange={(e) =>
                    handleInputChange("profile.company", e.target.value)
                  }
                />
              </div>

              {/* Job Title */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="title" className="text-sm font-medium">
                  Job Title
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. Senior Software Engineer"
                  value={card.profile.title || ""}
                  onChange={(e) =>
                    handleInputChange("profile.title", e.target.value)
                  }
                />
              </div>

              {/* Department */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="department" className="text-sm font-medium">
                  Department
                </Label>
                <Input
                  id="department"
                  placeholder="e.g. Engineering, Sales, Marketing"
                  value={card.profile.department || ""}
                  onChange={(e) =>
                    handleInputChange("profile.department", e.target.value)
                  }
                />
              </div>

              {/* Company Slogan */}
              <div className="space-y-2 mb-6">
                <Label htmlFor="companySlogan" className="text-sm font-medium">
                  Company Slogan
                </Label>
                <Input
                  id="companySlogan"
                  placeholder="Enter your slogan or tagline"
                  value={card.profile.companySlogan || ""}
                  onChange={(e) =>
                    handleInputChange("profile.companySlogan", e.target.value)
                  }
                />
              </div>

              {/* Phone Number */}
              {/* <div className="space-y-2 mb-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone Number{" "}
                <span className="text-muted-foreground">Optional</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                pattern="[0-9+\-]*"
                maxLength={15}
                placeholder="e.g. +1 234 567 8901"
                value={card.business.phone || ""}
                onChange={(e) =>
                  handleInputChange("business.phone", e.target.value)
                }
              />
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Format: (XXX) XXX-XXXX or +X (XXX) XXX-XXXX
            </p> */}
              <div className="space-y-2 mb-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number{" "}
                  <span className="text-muted-foreground">
                    (with country code)
                  </span>
                </Label>

                <PhoneInput
                  country={"us"}
                  value={card.business.phone || ""}
                  onChange={handlePhoneChange}
                  containerClass="w-full" // full-width wrapper
                  inputClass="!w-full bg-[#f5f7f9] h-[42px] text-sm font-medium border border-[#e2e8f0] rounded-md !bg-background !border !border-input !rounded-md"
                  buttonClass="!bg-background"
                  countryCodeEditable={false}
                />
              </div>

              {/* Email Address */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address{" "}
                  <span className="text-muted-foreground">Optional</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@company.com"
                  value={card.business.email || ""}
                  onChange={(e) =>
                    handleInputChange("business.email", e.target.value)
                  }
                />
              </div>

              {/* Website URL */}
              <div className="space-y-2 mb-2">
                <Label htmlFor="website" className="text-sm font-medium">
                  Website URL{" "}
                  <span className="text-muted-foreground">Optional</span>
                </Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://www.yourwebsite.com"
                  value={card.business.website || ""}
                  onChange={(e) =>
                    handleInputChange("business.website", e.target.value)
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground mb-6">
                Example: https://www.example.com or www.example.com
              </p>

              {/* Removed Company Address from BIO form */}
            </>
          )}

          {/* Upload Card Interface */}
          {activeTab === "upload" && (
            <div className="space-y-6">
              {/* File Upload Area */}
              <div
                className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) setSelectedFile(file);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Drop your business card image here or click to upload
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports JPG, PNG, PDF (max 5MB)
                  </p>
                  <button
                    type="button"
                    className="text-primary hover:text-primary/80 font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Click here to select a file
                  </button>
                </div>

                {selectedFile && (
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <p className="text-sm text-foreground">
                      Selected: {selectedFile.name}
                    </p>
                  </div>
                )}
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* OCR Button + Extracted Text */}
              {selectedFile && (
                <div className="space-y-4">
                  <Button onClick={handleExtractText} disabled={loading}>
                    {loading ? "Extracting..." : "Extract Text"}
                  </Button>

                  {/* {extractedText && (
                  <div className="p-3 border rounded-md bg-muted text-sm whitespace-pre-wrap">
                    <strong>Extracted Text:</strong>
                    <p>{extractedText}</p>
                  </div>
                )} */}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Card Form Design */}
      <div className="flex items-center justify-between px-4 mt-4 mb-2">
        <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
          BIO
        </span>
        {!isEditingBio && activeTab === "manual" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-sm font-bold rounded-full px-4 hover:bg-slate-100 transition-transform active:scale-95 dark:hover:bg-slate-700"
            onClick={() => {
              setCardSnapshot(JSON.parse(JSON.stringify(card)));
              setIsEditingBio(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
          </Button>
        )}
      </div>

      {/* [container-type:inline-size]: the field pairs below size against THIS
          card's width, not the viewport. Two reasons the viewport is wrong here:
          this form is shared by the onboarding panel (capped at 500px, and the
          client wants it to stay mobile-only) and the dashboard Edit tab (which
          must expand); and on the Edit tab the sidebar collapsing changes this
          card's width by ~123px at an unchanged viewport. */}
      <Card className="rounded-md shadow-sm border p-4 lg:p-6 [container-type:inline-size]">
        <div className="space-y-6">
          <div>
            {/* Manual Entry / Upload Card Tabs */}
            <div className="mb-6">
              <div className="flex gap-8 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("manual")}
                  className={`relative pb-2 text-sm font-medium transition-colors ${
                    activeTab === "manual"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Manual Entry
                  {activeTab === "manual" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("upload")}
                  className={`relative pb-2 text-sm font-medium transition-colors ${
                    activeTab === "upload"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Upload Card
                  {activeTab === "upload" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              </div>
            </div>

            {/* Manual Entry Form */}
            {activeTab === "manual" && isEditingBio && (
              <>
                {/* First Name and Last Name */}
                <div className="grid grid-cols-1 [@container(min-width:480px)]:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-xs font-bold text-slate-900 dark:text-slate-400"
                    >
                      First Name<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      className="h-10 border-slate-200 dark:border-slate-700 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-400 px-3 bg-white dark:bg-slate-800 dark:text-white rounded-md"
                      id="firstName"
                      placeholder="First Name"
                      value={card.profile.firstName || ""}
                      onChange={(e) =>
                        handleInputChange("profile.firstName", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-xs font-bold text-slate-900 dark:text-slate-400"
                    >
                      Last Name<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      className="h-10 border-slate-200 dark:border-slate-700 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-400 px-3 bg-white dark:bg-slate-800 dark:text-white rounded-md"
                      id="lastName"
                      placeholder="Last Name"
                      value={card.profile.lastName || ""}
                      onChange={(e) =>
                        handleInputChange("profile.lastName", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 [@container(min-width:480px)]:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="title"
                      className="text-xs font-bold text-slate-900 dark:text-slate-400"
                    >
                      Job Title
                    </Label>
                    <Input
                      className="h-10 border-slate-200 dark:border-slate-700 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-400 px-3 bg-white dark:bg-slate-800 dark:text-white rounded-md"
                      id="title"
                      placeholder="e.g CEO"
                      value={card.profile.title || ""}
                      onChange={(e) =>
                        handleInputChange("profile.title", e.target.value)
                      }
                    />
                  </div>

                  {/* Department */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="department"
                      className="text-xs font-bold text-slate-900 dark:text-slate-400"
                    >
                      Department
                    </Label>
                    <Input
                      className="h-10 border-slate-200 dark:border-slate-700 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-400 px-3 bg-white dark:bg-slate-800 dark:text-white rounded-md"
                      id="department"
                      placeholder="e.g Marketing"
                      value={card.profile.department || ""}
                      onChange={(e) =>
                        handleInputChange("profile.department", e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Accreditations */}
                <div className="space-y-2 mb-4">
                  <Label
                    htmlFor="accreditations"
                    className="text-xs font-bold text-slate-900 dark:text-slate-400"
                  >
                    Accreditations
                  </Label>
                  <Input
                    className="h-10 border-slate-200 dark:border-slate-700 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-400 px-3 bg-white dark:bg-slate-800 dark:text-white rounded-md"
                    id="accreditations"
                    placeholder="e.g. MBA, PhD, CPA (separate with commas)"
                    value={(card.profile.accreditations || []).join(", ")}
                    onChange={(e) => handleAccreditationsChange(e.target.value)}
                  />
                </div>

                {/* Education Name */}
                <div className="space-y-2 mb-4">
                  <Label
                    htmlFor="education"
                    className="text-xs font-bold text-slate-900 dark:text-slate-400"
                  >
                    Education
                  </Label>
                  <Input
                    className="h-10 border-slate-200 dark:border-slate-700 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-400 px-3 bg-white dark:bg-slate-800 dark:text-white rounded-md"
                    id="education"
                    placeholder="Education"
                    value={card.profile.education || ""}
                    onChange={(e) =>
                      handleInputChange("profile.education", e.target.value)
                    }
                  />
                </div>

                {/* Company Name */}
                <div className="space-y-2 mb-4">
                  <Label
                    htmlFor="company"
                    className="text-xs font-bold text-slate-900 dark:text-slate-400"
                  >
                    Company Name
                  </Label>
                  <Input
                    className="h-10 border-slate-200 dark:border-slate-700 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-400 px-3 bg-white dark:bg-slate-800 dark:text-white rounded-md"
                    id="company"
                    placeholder="Company name"
                    value={card.profile.company || ""}
                    onChange={(e) =>
                      handleInputChange("profile.company", e.target.value)
                    }
                  />
                </div>

                {/* Company Slogan */}
                <div className="space-y-2 mb-4">
                  <Label
                    htmlFor="companySlogan"
                    className="text-xs font-bold text-slate-900 dark:text-slate-400"
                  >
                    Company Slogan
                  </Label>
                  <Input
                    className="h-10 border-slate-200 dark:border-slate-700 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-400 px-3 bg-white dark:bg-slate-800 dark:text-white rounded-md"
                    id="companySlogan"
                    placeholder="Slogan or Tagline"
                    value={card.profile.companySlogan || ""}
                    onChange={(e) =>
                      handleInputChange("profile.companySlogan", e.target.value)
                    }
                  />
                </div>

                {/* Removed Company Address from BIO form */}

                <div className="sticky bottom-0 -mx-4 -mb-4 lg:-mx-6 lg:-mb-6 mt-8 p-4 lg:px-6 lg:py-6 bg-slate-100 dark:bg-slate-900/90 dark:backdrop-blur-md border-t dark:border-slate-800 flex gap-4 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-b-md">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black hover:bg-slate-50 dark:hover:bg-slate-700 transition-transform active:scale-95"
                    onClick={() => {
                      if (cardSnapshot) {
                        onUpdate(cardSnapshot);
                        setCardSnapshot(null);
                      }
                      setIsEditingBio(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 h-12 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white font-black transition-transform active:scale-95"
                    onClick={() => setIsEditingBio(false)}
                  >
                    Save
                  </Button>
                </div>
              </>
            )}

            {/* Read-Only View Form */}
            {activeTab === "manual" && !isEditingBio && (
              <div className="space-y-1">
                <div className="space-y-1 py-3 border-b border-slate-50 dark:border-slate-800 last:border-0">
                  <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[12px] font-bold text-slate-900 dark:text-slate-300 uppercase tracking-tighter">
                    Full Name
                  </label>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-300">
                    {card.profile.firstName} {card.profile.lastName}
                  </div>
                </div>

                <div className="space-y-1 py-3 border-b border-slate-50 dark:border-slate-800 last:border-0">
                  <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[12px] font-bold text-slate-900 dark:text-slate-300 uppercase tracking-tighter">
                    Job Title
                  </label>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-300">
                    {card.profile.title}
                  </div>
                </div>

                <div className="space-y-1 py-3 border-b border-slate-50 dark:border-slate-800 last:border-0">
                  <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[12px] font-bold text-slate-900 dark:text-slate-300 uppercase tracking-tighter">
                    Department
                  </label>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-300">
                    {card.profile.department}
                  </div>
                </div>

                <div className="space-y-1 py-3 border-b border-slate-50 dark:border-slate-800 last:border-0">
                  <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[12px] font-bold text-slate-900 dark:text-slate-300 uppercase tracking-tighter">
                    Accreditations
                  </label>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-300">
                    {card.profile.accreditations.join(", ")}
                  </div>
                </div>

                <div className="space-y-1 py-3 border-b border-slate-50 dark:border-slate-800 last:border-0">
                  <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[12px] font-bold text-slate-900 dark:text-slate-300 uppercase tracking-tighter">
                    Education
                  </label>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-300">
                    {card.profile.education}
                  </div>
                </div>

                <div className="space-y-1 py-3 border-b border-slate-50 dark:border-slate-800 last:border-0">
                  <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[12px] font-bold text-slate-900 dark:text-slate-300 uppercase tracking-tighter">
                    Company
                  </label>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-300">
                    {card.profile.company}
                  </div>
                </div>

                <div className="space-y-1 py-3 border-b border-slate-50 dark:border-slate-800 last:border-0">
                  <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[12px] font-bold text-slate-900 dark:text-slate-300 uppercase tracking-tighter">
                    Company Slogan
                  </label>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-300">
                    {card.profile.companySlogan}
                  </div>
                </div>

                {/* Removed Location from BIO form summary */}
              </div>
            )}

            {/* Upload Card Interface */}
            {activeTab === "upload" && (
              <div className="space-y-6">
                {/* File Upload Area */}
                <div
                  className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) setSelectedFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Drop your business card image here or click to upload
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports JPG, PNG, PDF (max 5MB)
                    </p>
                    <button
                      type="button"
                      className="text-primary hover:text-primary/80 font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      Click here to select a file
                    </button>
                  </div>

                  {selectedFile && (
                    <div className="mt-4 p-3 bg-muted rounded-md">
                      <p className="text-sm text-foreground">
                        Selected: {selectedFile.name}
                      </p>
                    </div>
                  )}
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* OCR Button + Extracted Text */}
                {selectedFile && (
                  <div className="space-y-4">
                    <Button onClick={handleExtractText} disabled={loading}>
                      {loading ? "Extracting..." : "Extract Text"}
                    </Button>

                    {/* {extractedText && (
                  <div className="p-3 border rounded-md bg-muted text-sm whitespace-pre-wrap">
                    <strong>Extracted Text:</strong>
                    <p>{extractedText}</p>
                  </div>
                )} */}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </>
  );
}
