"use client";
import {
  useRouter,
} from "next/navigation";
import dynamic from "next/dynamic";
import React, { useEffect, useLayoutEffect, useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import {
  CSS,
} from "@dnd-kit/utilities";
import {
  FormComponentProps,
} from "@/types/businessCard";
import {
  Input,
} from "@/components/ui/input";
import {
  Label,
} from "@/components/ui/label";
import {
  Twitter,
  Facebook,
  Instagram,
  Lock,
  ArrowLeft,
  Phone,
  User,
  Heading,
  Globe,
  Info,
  ChevronDown,
  Clipboard,
  Upload,
  ExternalLink,
  Crown,
  ChevronUp,
  FileText,
  Eye,
  X,
  Calendar,
  Twitch,
  Music,
  Search,
  Plus,
  GripVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  useAuth,
} from "@/contexts/AuthContext";
import UpgradeModal from "@/components/UpgradeModal";
import {
  Button,
} from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  cn,
} from "@/lib/utils";
import {
  COUNTRY_CALLING_CODES,
} from "@/lib/countryCallingCodes";
import {
  BASE_URLS,
  CARD_SOCIAL_FIELDS,
  CARD_SOCIAL_LABELS,
  CONTENT_LABELS,
  PHONE_LENGTH_RULES,
  PREMIUM_ITEMS,
  SOCIAL_DETAIL_FIELD_MAP,
  TRADITIONAL_SOCIAL_LIMIT,
  TOP_FIXED_LABELS,
  BOTTOM_FIXED_LABELS,
  normalizeProfileContentOrder,
} from "@/components/onboarding/forms/content-form/config";
import {
  contentIconStyle,
  getContentIcon,
  getPhoneIcon,
} from "@/components/onboarding/forms/content-form/contentIcons";
import {
  ProUpgradeDialog,
} from "@/components/onboarding/forms/content-form/ProUpgradeDialog";
import {
  applyBodyScrollLock,
} from "@/utils/scrollLock";
import {
  CTA_APPOINTMENT_LABELS,
  CtaAppointmentLabel,
  getActiveAppointmentLabel,
  deriveAppointmentType,
  derivePlatform,
  hasCalendly,
  hasCallToAction,
  hasDirectAds,
  hasGoogleCalendar,
} from "@/utils/appointments";
import {
  Textarea,
} from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  db,
} from "@/services/firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";
import imageCompression from "browser-image-compression";
import {
  toast,
} from "sonner";

/**
 * Scroll restoration has to happen before the browser paints, otherwise the new
 * screen is visibly drawn at the old screen's offset and then snaps. useLayout-
 * Effect does that, but React warns when it runs during SSR - so fall back to
 * useEffect on the server, where neither one does anything anyway.
 */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * The element that actually scrolls this form is not always the window. In
 * onboarding the form column is `md:max-h-[calc(100vh-3rem)] md:overflow-y-auto`,
 * so from 768px up the column scrolls itself and the window never moves - a
 * `window.scrollTo(0, 0)` there does nothing at all. On the dashboard edit page
 * it is the preview column that scrolls, so the window is the right target.
 * Walk up and use whichever one is really scrolling.
 */
const getScrollHost = (node: HTMLElement | null): HTMLElement | null => {
  let current = node?.parentElement ?? null;
  while (current && current !== document.body && current !== document.documentElement) {
    const { overflowY } = window.getComputedStyle(current);
    if (overflowY === "auto" || overflowY === "scroll") {
      return current;
    }
    current = current.parentElement;
  }
  if (typeof document !== "undefined") {
    const explicitHost =
      document.querySelector<HTMLElement>(".form-scroll-container");
    if (explicitHost) return explicitHost;
  }
  return null;
};

const readScrollTop = (host: HTMLElement | null) =>
  host ? host.scrollTop : (typeof window !== "undefined" ? window.scrollY : 0);

const writeScrollTop = (host: HTMLElement | null, top: number) => {
  if (host) {
    host.scrollTop = top;
  } else if (typeof window !== "undefined" && window.innerWidth < 768) {
    // Only scroll the window on mobile screens where the window is the primary viewport.
    // On desktop, never scroll the whole window so side panels (like the preview card) stay in place.
    window.scrollTo({ top, behavior: "auto" });
  }
};

const CKEditor = dynamic<{
  data: string;
  onChange: (event: any, editor: any) => void;
}>(
  async () => {
    const { CKEditor } = await import("@ckeditor/ckeditor5-react");
    const ClassicEditor = (await import("@ckeditor/ckeditor5-build-classic"))
      .default;
    //@ts-ignore
    return (props) => <CKEditor {...props} editor={ClassicEditor} />;
  },
  { ssr: false },
);

/**
 * Declared at module scope, NOT inside ContentForm.
 *
 * A component defined in the render body is a new component TYPE on every
 * render, so React unmounts and remounts every row whenever anything in the
 * form changes. Deleting a row therefore tore down and rebuilt the whole
 * list; the scroll container collapsed for a frame and the browser clamped
 * scrollTop, which is what jumped the panel back to the top.
 *
 * It closes over nothing from ContentForm - every input is a prop - so
 * hoisting it is a straight move.
 */
const StaticProfileContentRow = ({
  icon: Icon,
  label,
  value,
  iconStyle,
  onEdit,
  onRemove,
}: {
  icon: any;
  label: string;
  value: string;
  iconStyle: React.CSSProperties;
  onEdit?: () => void;
  onRemove: () => void;
}) => {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-[20px] border dark:border-slate-700 shadow-sm group transition-all pl-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={iconStyle}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-slate-900 dark:text-white">
            {label.split("_")[0]}
          </p>
          <p className="text-[12px] font-bold text-slate-400 truncate">
            {value}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onEdit && (
            <button
              className="text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors h-9 w-9 flex items-center justify-center rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              type="button"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          <button
            className="text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors h-9 w-9 flex items-center justify-center rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const DraggableProfileContentRow = ({
  id,
  icon: Icon,
  label,
  value,
  iconStyle,
  onEdit,
  onRemove,
}: {
  id: string;
  icon: any;
  label: string;
  value: string;
  iconStyle: React.CSSProperties;
  onEdit?: () => void;
  onRemove: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-[20px] border dark:border-slate-700 shadow-sm group transition-all">
        <div
          {...attributes}
          {...listeners}
          className="text-slate-300 h-9 w-7 shrink-0 flex items-center justify-center hover:text-slate-500 transition-colors cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={iconStyle}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-slate-900 dark:text-white">
            {label.split("_")[0]}
          </p>
          <p className="text-[12px] font-bold text-slate-400 truncate">
            {value}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onEdit && (
            <button
              className="text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors h-9 w-9 flex items-center justify-center rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              type="button"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          <button
            className="text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors h-9 w-9 flex items-center justify-center rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfileContentRow = ({
  id,
  icon,
  label,
  value,
  iconStyle,
  onEdit,
  onRemove,
  isDraggable = true,
}: {
  id: string;
  icon: any;
  label: string;
  value: string;
  iconStyle: React.CSSProperties;
  onEdit?: () => void;
  onRemove: () => void;
  isDraggable?: boolean;
}) => {
  if (!isDraggable) {
    return (
      <StaticProfileContentRow
        icon={icon}
        label={label}
        value={value}
        iconStyle={iconStyle}
        onEdit={onEdit}
        onRemove={onRemove}
      />
    );
  }
  return (
    <DraggableProfileContentRow
      id={id}
      icon={icon}
      label={label}
      value={value}
      iconStyle={iconStyle}
      onEdit={onEdit}
      onRemove={onRemove}
    />
  );
};

export function ContentForm({
  card,
  onUpdate,
  onEditStateChange,
  onScreenChange,
  isEditMode,
}: FormComponentProps & {
  /** True on any sub-screen. Drives panel layout - see BusinessCardForm. */
  onEditStateChange?: (isEditing: boolean) => void;
  /**
   * Which sub-screen is open, for callers that need to tell Add Content apart
   * from an item's detail form. onEditStateChange cannot: it collapses both to
   * `true`, and onboarding depends on that for its layout, so it must not be
   * narrowed.
   */
  onScreenChange?: (screen: "root" | "add" | "detail") => void;
  isEditMode?: boolean;
}) {
  const router = useRouter();
  const storage = getStorage();
  const [isAddingContent, setIsAddingContent] = useState(false);
  const [warning, setWarning] = useState("");
  const [isTrialActive, setIsTrialActive] = useState(false);
  // Default to true so logged-out users are blocked from premium features
  const [isFreePlan, setIsFreePlan] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const { user } = useAuth();
  const COUNTRIES = COUNTRY_CALLING_CODES;

  // Track active content detail
  const [activeContentDetail, setActiveContentDetail] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (onEditStateChange) {
      onEditStateChange(!!activeContentDetail || isAddingContent);
    }
    onScreenChange?.(
      activeContentDetail ? "detail" : isAddingContent ? "add" : "root",
    );
  }, [activeContentDetail, isAddingContent, onEditStateChange, onScreenChange]);

  const [activeLinkValue, setActiveLinkValue] = useState("");
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [phoneActionType, setPhoneActionType] = useState<"text" | "call">(
    card.business.phoneAction || "call",
  );
  const [showPhoneExtension, setShowPhoneExtension] = useState(false);
  const [phoneExtension, setPhoneExtension] = useState("");
  const [contentLinkValues, setContentLinkValues] = useState<
    Record<string, string>
  >({});
  const [textContent, setTextContent] = useState("");
  const [showTitleField, setShowTitleField] = useState(false);
  const [showFieldHelp, setShowFieldHelp] = useState(false);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [contentSearchQuery, setContentSearchQuery] = useState("");
  const [isUploadingAppointmentImage, setIsUploadingAppointmentImage] =
    useState(false);
  const [dragActiveAppointmentImage, setDragActiveAppointmentImage] =
    useState(false);

  const [showAllContactInfo, setShowAllContactInfo] = useState(false);
  const [showAllSocialLinks, setShowAllSocialLinks] = useState(false);
  const [showAllAboutCta, setShowAllAboutCta] = useState(false);
  const [showAllProductivityLinks, setShowAllProductivityLinks] = useState(false);
  const [showAllPaymentLinks, setShowAllPaymentLinks] = useState(false);
  const [showAllMusicLinks, setShowAllMusicLinks] = useState(false);
  const [profileContentOrder, setProfileContentOrder] = useState<string[]>([]);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<{ url: string; name?: string } | null>(null);
  useEffect(
    () => applyBodyScrollLock(showDocumentPreview || !!selectedPhotoPreview),
    [showDocumentPreview, selectedPhotoPreview],
  );

  useEffect(() => {
    if (!showDocumentPreview && !selectedPhotoPreview) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowDocumentPreview(false);
        setSelectedPhotoPreview(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDocumentPreview, selectedPhotoPreview]);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const photosInputRef = useRef<HTMLInputElement>(null);

  /**
   * Scroll handling across the three screens this component renders.
   *
   * The profile list, the Add Content picker and each "Add <Type>" form are
   * not routes - they are three different return values of this one component.
   * Swapping them does not touch the window's scroll offset, so opening a form
   * from halfway down the picker left you halfway down the form, looking at its
   * footer.
   *
   * Going forward into a screen starts that screen at the top. Going back
   * restores the offset the screen was left at, so returning from a form drops
   * you beside the tile you tapped rather than back at the top of a long list.
   */
  const screenScrollOffsets = useRef<Record<string, number>>({});
  const currentScreen = useRef<"root" | "add" | "detail">("root");
  const screenRootRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const next = activeContentDetail
      ? "detail"
      : isAddingContent
        ? "add"
        : "root";
    const previous = currentScreen.current;
    const screenChanged = next !== previous;

    // Opening a different content type is still a fresh screen even though
    // `next` stays "detail", so the help panel resets on every open.
    setShowFieldHelp(false);

    if (!screenChanged) return;

    const scrollHost = getScrollHost(screenRootRef.current);
    screenScrollOffsets.current[previous] = readScrollTop(scrollHost);
    currentScreen.current = next;

    const isGoingBack =
      (previous === "detail" && next !== "detail") ||
      (previous === "add" && next === "root");

    writeScrollTop(
      scrollHost,
      isGoingBack ? (screenScrollOffsets.current[next] ?? 0) : 0,
    );
  }, [activeContentDetail, isAddingContent]);

  /**
   * Restores the scroll offset captured just before a Profile Content row was
   * deleted. Runs after every render but no-ops unless a delete armed it, and
   * is declared after the screen-change effect above so it wins for that one
   * render - a delete never changes screen, so the two never actually compete.
   */
  const pendingScrollRestore = useRef<number | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (pendingScrollRestore.current === null) return;
    writeScrollTop(
      getScrollHost(screenRootRef.current),
      pendingScrollRestore.current,
    );
    pendingScrollRestore.current = null;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const updateProfileContentOrder = (nextOrder: string[]) => {
    const normalized = normalizeProfileContentOrder(nextOrder);
    setProfileContentOrder(normalized);
    onUpdate({
      ...card,
      profileContentOrder: normalized,
    });
  };

  const getAddressValue = () =>
    [
      card.business.address.street,
      card.business.address.city,
      card.business.address.state,
      card.business.address.zip,
      card.business.address.country,
    ]
      .filter(Boolean)
      .join(", ")
      .trim();

  const getContentValue = (label: string) => {
    const isOriginal = !label.includes("_");
    const baseLabel = label.split("_")[0];
    const isPrimaryAddress = label === "Address";

    // A Divider holds no user data, but it still has to resolve to something
    // truthy. Both the Profile Content list and the tile badge read an empty
    // value as "not present", so a Divider was appended to profileContentOrder
    // and then rendered nowhere - invisible in the list, and therefore
    // impossible to drag or delete once it had been added.
    if (baseLabel === "Divider") return "Section divider";

    if (!isOriginal || baseLabel === "Location") {
      const rawValue =
        contentLinkValues[label]?.trim() ||
        card.contentLinks?.[label]?.trim() ||
        "";
      if (baseLabel === "Location" || baseLabel === "Address") {
        try {
          const parsed = JSON.parse(rawValue);
          return [
            parsed.street,
            parsed.city,
            parsed.state,
            parsed.zip,
            parsed.country,
          ]
            .filter(Boolean)
            .join(", ");
        } catch {
          return rawValue;
        }
      }
      return rawValue;
    }
    if (label === "Phone") return card.business.phone?.trim() || "";
    if (label === "Email") return card.business.email?.trim() || "";
    if (label === "Website") return card.business.website?.trim() || "";
    if (label === "About Me") return card.about.bio?.trim() || "";
    if (label === "Custom Title")
      return card.about.customSectionTitle?.trim() || "";
    if (label === "Location" || label === "Address") return getAddressValue();
    /* Only ONE of these four (CTA, Direct Ads, Calendly, Google Calendar)
       can be active on the card at a time. Only the active one resolves to a value. */
    const activeAppointment = getActiveAppointmentLabel(card);
    if (label === "Calendly") {
      return activeAppointment === "Calendly" && hasCalendly(card)
        ? card.appointments.calendlyUrl!.trim()
        : "";
    }
    if (label === "Google Calendar") {
      return activeAppointment === "Google Calendar" && hasGoogleCalendar(card)
        ? card.appointments.googleUrl!.trim()
        : "";
    }
    if (label === "Call-to-Action") {
      if (activeAppointment !== "Call-to-Action") return "";
      if (!hasCallToAction(card)) return "";

      return [card.appointments.ctaLabel, card.appointments.ctaUrl]
        .filter(Boolean)
        .join(" - ");
    }
    if (label === "Direct Ads") {
      if (activeAppointment !== "Direct Ads") return "";
      if (!hasDirectAds(card)) return "";

      return (
        card.appointments?.directAds?.title?.trim() ||
        card.appointments?.directAds?.image?.trim() ||
        card.appointments?.directAds?.type ||
        ""
      );
    }
    if (label === "Google Drive") {
      return card.contentLinks?.["Google Drive"]?.trim() || "";
    }
    if (label === "Document") {
      const data = card.contentLinks?.["Document"];
      if (!data) return "";
      try {
        const parsed = JSON.parse(data);
        return parsed.name || "Document";
      } catch (e) {
        return "";
      }
    }
    if (label === "Photos") {
      const data = card.contentLinks?.["Photos"];
      if (!data) return "";
      try {
        const parsed = JSON.parse(data);
        return parsed.length > 0
          ? `${parsed.length} photo${parsed.length > 1 ? "s" : ""}`
          : "";
      } catch (e) {
        return "";
      }
    }

    const socialField = SOCIAL_DETAIL_FIELD_MAP[label];
    if (socialField) {
      const value =
        card.social[socialField as keyof typeof card.social]?.trim() || "";
      return value === BASE_URLS[socialField] ? "" : value;
    }

    return (
      contentLinkValues[label] ??
      card.contentLinks?.[label] ??
      ""
    ).trim();
  };

  const upsertProfileContent = (label: string) => {
    const value = getContentValue(label);

    if (!value) {
      return;
    }

    const nextOrder = profileContentOrder.includes(label)
      ? profileContentOrder
      : [...profileContentOrder, label];
    updateProfileContentOrder(nextOrder);
  };

  const handleEditProfileContent = (label: string) => {
    setIsAddingContent(false);
    setActiveContentDetail(label);
    setShowTitleField(Boolean(card.contentTitles?.[label]));
    setTextContent(
      label === "About Me"
        ? card.about.bio || ""
        : label === "Custom Title"
          ? card.about.customSectionTitle || ""
          : "",
    );
  };

  const handleRemoveProfileContent = (label: string) => {
    const isOriginal = !label.includes("_");
    let promotedValue = "";
    let nextContentLinks = { ...(card.contentLinks || {}) };
    let nextContentTitles = { ...(card.contentTitles || {}) };
    delete nextContentTitles[label];

    let newOrder = normalizeProfileContentOrder(
      profileContentOrder.filter((item) => item !== label),
    );
    setProfileContentOrder(newOrder);

    if (!isOriginal) {
      updateProfileContentOrder(newOrder);
      setContentLinkValues((current) => {
        const next = { ...current };
        delete next[label];
        return next;
      });
      delete nextContentLinks[label];
      onUpdate({
        ...card,
        contentLinks: nextContentLinks,
        contentTitles: nextContentTitles,
      });
      return;
    }

    const backupLabel = profileContentOrder.find(
      (item) => item.startsWith(label + "_") && item !== label,
    );
    if (backupLabel) {
      promotedValue =
        card.contentLinks?.[backupLabel] ||
        contentLinkValues[backupLabel] ||
        "";
      const backupTitle = card.contentTitles?.[backupLabel] || "";

      delete nextContentLinks[backupLabel];
      delete nextContentTitles[backupLabel];
      if (backupTitle) {
        nextContentTitles[label] = backupTitle;
      }

      newOrder = normalizeProfileContentOrder(
        profileContentOrder
          .filter((item) => item !== label)
          .map((item) => (item === backupLabel ? label : item)),
      );

      setContentLinkValues((current) => {
        const next = { ...current };
        delete next[label];
        delete next[backupLabel];
        return next;
      });
    } else {
      setContentLinkValues((current) => {
        const next = { ...current };
        delete next[label];
        return next;
      });
    }

    // Set order explicitly here so we don't trigger double onUpdate calls.
    setProfileContentOrder(newOrder);
    const socialField = SOCIAL_DETAIL_FIELD_MAP[label];

    if (label === "Phone") {
      setPhoneNumber(promotedValue ? promotedValue.replace(/\D/g, "") : "");
      setPhoneExtension("");
      setShowPhoneExtension(false);
      setPhoneError("");
      onUpdate({
        ...card,
        profileContentOrder: newOrder,
        business: {
          ...card.business,
          phone: promotedValue,
        },
        contentTitles: nextContentTitles,
        contentLinks: nextContentLinks,
      });
      return;
    }

    if (label === "Email") {
      onUpdate({
        ...card,
        profileContentOrder: newOrder,
        business: {
          ...card.business,
          email: promotedValue,
        },
        contentTitles: nextContentTitles,
        contentLinks: nextContentLinks,
      });
      return;
    }

    if (label === "Website") {
      onUpdate({
        ...card,
        profileContentOrder: newOrder,
        business: {
          ...card.business,
          website: promotedValue,
        },
        contentTitles: nextContentTitles,
        contentLinks: nextContentLinks,
      });
      return;
    }

    if (label === "About Me") {
      setTextContent(promotedValue);
      onUpdate({
        ...card,
        profileContentOrder: newOrder,
        about: {
          ...card.about,
          bio: promotedValue,
        },
        contentTitles: nextContentTitles,
        contentLinks: nextContentLinks,
      });
      return;
    }

    if (label === "Custom Title") {
      setTextContent(promotedValue);
      onUpdate({
        ...card,
        profileContentOrder: newOrder,
        about: {
          ...card.about,
          customSectionTitle: promotedValue,
        },
        contentTitles: nextContentTitles,
        contentLinks: nextContentLinks,
      });
      return;
    }

    if (label === "Calendly") {
      const nextCard = {
        ...card,
        profileContentOrder: newOrder,
        appointments: {
          ...card.appointments,
          calendlyUrl: "",
        },
        contentTitles: nextContentTitles,
        contentLinks: nextContentLinks,
      };
      nextCard.appointments.appointmentType = deriveAppointmentType(nextCard);
      const platform = derivePlatform(nextCard);
      if (platform) nextCard.appointments.platform = platform;
      onUpdate(nextCard);
      return;
    }

    if (label === "Google Calendar") {
      const nextCard = {
        ...card,
        profileContentOrder: newOrder,
        appointments: {
          ...card.appointments,
          googleUrl: "",
        },
        contentTitles: nextContentTitles,
        contentLinks: nextContentLinks,
      };
      nextCard.appointments.appointmentType = deriveAppointmentType(nextCard);
      const platform = derivePlatform(nextCard);
      if (platform) nextCard.appointments.platform = platform;
      onUpdate(nextCard);
      return;
    }

    if (label === "Call-to-Action") {
      const nextCard = {
        ...card,
        profileContentOrder: newOrder,
        appointments: { ...card.appointments, ctaLabel: "", ctaUrl: "" },
        contentTitles: nextContentTitles,
        contentLinks: nextContentLinks,
      };
      nextCard.appointments.appointmentType = deriveAppointmentType(nextCard);
      const platform = derivePlatform(nextCard);
      if (platform) nextCard.appointments.platform = platform;
      onUpdate(nextCard);
      return;
    }

    if (label === "Direct Ads") {
      const nextCard = {
        ...card,
        profileContentOrder: newOrder,
        appointments: {
          ...card.appointments,
          directAds: {
            ...card.appointments.directAds,
            type: "none" as const,
            image: "",
            title: "",
            description: "",
            price: "",
            url: "",
          },
        },
        contentTitles: nextContentTitles,
        contentLinks: nextContentLinks,
      };
      nextCard.appointments.appointmentType = deriveAppointmentType(nextCard);
      const platform = derivePlatform(nextCard);
      if (platform) nextCard.appointments.platform = platform;
      onUpdate(nextCard);
      return;
    }

    if (label === "Google Drive") {
      if (!promotedValue) {
        delete nextContentLinks["Google Drive"];
      } else {
        nextContentLinks["Google Drive"] = promotedValue;
      }
      onUpdate({
        ...card,
        profileContentOrder: newOrder,
        contentLinks: nextContentLinks,
        contentTitles: nextContentTitles,
      });
      return;
    }

    if (label === "Location" || label === "Address") {
      /* These two look alike but are not stored alike: the primary Address is
         business.address, while a Location (and any extra "Address_<ts>") is a
         JSON address string in contentLinks. Both used to clear
         business.address, so removing a Location wiped an address the user had
         not touched AND left contentLinks.Location in place - harmless while
         the card drew no Location at all, and a row that refused to go away
         once it did. Each now clears the field it actually came from, and a
         promoted backup lands in the right place too. */
      const emptyAddress = {
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "",
      };

      if (label === "Location") {
        if (promotedValue) {
          nextContentLinks[label] = promotedValue;
        } else {
          delete nextContentLinks[label];
        }
        onUpdate({
          ...card,
          profileContentOrder: newOrder,
          contentTitles: nextContentTitles,
          contentLinks: nextContentLinks,
        });
        return;
      }

      const parseAddress = (raw: string) => {
        try {
          return { ...emptyAddress, ...JSON.parse(raw) };
        } catch {
          return { ...emptyAddress, street: raw };
        }
      };

      onUpdate({
        ...card,
        profileContentOrder: newOrder,
        business: {
          ...card.business,
          address: promotedValue ? parseAddress(promotedValue) : emptyAddress,
        },
        contentTitles: nextContentTitles,
        contentLinks: nextContentLinks,
      });
      return;
    }

    if (socialField) {
      onUpdate({
        ...card,
        profileContentOrder: newOrder,
        social: {
          ...card.social,
          [socialField]: promotedValue,
        },
        contentTitles: nextContentTitles,
        contentLinks: nextContentLinks,
      });
      return;
    }

    if (promotedValue) {
      nextContentLinks[label] = promotedValue;
    } else {
      delete nextContentLinks[label];
    }

    onUpdate({
      ...card,
      profileContentOrder: newOrder,
      contentTitles: nextContentTitles,
      contentLinks: nextContentLinks,
    });
  };

  const cleanupPremiumData = (detailLabel: string | null) => {
    if (!detailLabel) return;

    // Check if the user is a free user and the item is premium
    if (
      isProLocked &&
      (PREMIUM_ITEMS as readonly string[]).includes(detailLabel)
    ) {
      if (detailLabel === "Call-to-Action") {
        updateAppointmentCard({ ctaLabel: "", ctaUrl: "" });
      } else if (detailLabel === "Direct Ads") {
        updateAppointmentCard({
          directAds: {
            type: "none",
            image: "",
            title: "",
            description: "",
            price: "",
            url: "",
          },
        });
      } else if (detailLabel === "Custom Title") {
        onUpdate({
          ...card,
          about: {
            ...card.about,
            sectionType: "bio",
            customSectionTitle: "",
          },
        });
      }

      // Ensure it is removed from the profileContentOrder preview list
      setProfileContentOrder((current) =>
        current.filter((label) => label !== detailLabel),
      );
    }
  };

  const handleCloseContentDetail = () => {
    setShowDocumentPreview(false);
    // If it's a new item (not in profileContentOrder), wipe its data when backing out
    if (
      activeContentDetail &&
      !profileContentOrder.includes(activeContentDetail)
    ) {
      handleRemoveProfileContent(activeContentDetail);
    }

    cleanupPremiumData(activeContentDetail);
    setActiveContentDetail(null);
  };

  const handleAddContentAction = () => {
    if (activeContentDetail?.split("_")[0] === "Phone") {
      const validationMessage = validatePhoneNumber(
        phoneNumber,
        selectedCountry.iso2,
      );

      if (validationMessage) {
        setPhoneError(validationMessage);
        return;
      }
    }

    if (
      activeContentDetail &&
      (PREMIUM_ITEMS as readonly string[]).includes(activeContentDetail)
    ) {
      if (isProLocked) {
        cleanupPremiumData(activeContentDetail);
        setShowUpgradePopup(true);
        return;
      }
    }

    if (activeContentDetail === "Calendly") {
      if (!card.appointments.calendlyUrl?.trim()) {
        handleRemoveProfileContent("Calendly");
      } else {
        commitAppointmentLabel("Calendly");
      }
    } else if (activeContentDetail === "Google Calendar") {
      if (!card.appointments.googleUrl?.trim()) {
        handleRemoveProfileContent("Google Calendar");
      } else {
        commitAppointmentLabel("Google Calendar");
      }
    } else if (activeContentDetail === "Custom Title") {
      onUpdate({
        ...card,
        about: {
          ...card.about,
          sectionType: "custom",
          customSectionTitle: card.about.customSectionTitle || "",
          bio: card.about.bio || "",
        },
      });
      upsertProfileContent("Custom Title");
    } else if (activeContentDetail === "Call-to-Action") {
      const isEmpty = !hasCallToAction(card);
      if (isEmpty) {
        handleRemoveProfileContent("Call-to-Action");
      } else {
        commitAppointmentLabel("Call-to-Action");
      }
    } else if (activeContentDetail === "Direct Ads") {
      const isEmpty = !hasDirectAds(card);
      if (isEmpty) {
        handleRemoveProfileContent("Direct Ads");
      } else {
        commitAppointmentLabel("Direct Ads");
      }
    } else if (activeContentDetail === "About Me") {
      onUpdate({
        ...card,
        about: {
          ...card.about,
          bio: textContent.trim(),
        },
      });
      upsertProfileContent("About Me");
    } else if (activeContentDetail) {
      upsertProfileContent(activeContentDetail);
    }

    setActiveContentDetail(null);
  };

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.includes(searchQuery),
  );

  const getMaxPhoneDigits = (iso2: string) => PHONE_LENGTH_RULES[iso2] ?? 15;
  const normalizedContentSearchQuery = contentSearchQuery.trim().toLowerCase();
  const matchesContentSearch = (label: string) =>
    !normalizedContentSearchQuery ||
    label.toLowerCase().includes(normalizedContentSearchQuery);
  const shouldShowExtendedItems = (expanded: boolean) =>
    expanded || Boolean(normalizedContentSearchQuery);
  const shouldShowSection = (labels: string[]) =>
    labels.some((label) => matchesContentSearch(label));

  const validatePhoneNumber = (value: string, iso2: string) => {
    const digits = value.replace(/\D/g, "");
    const exactLength = PHONE_LENGTH_RULES[iso2];

    if (!digits) {
      return "Phone number is required";
    }

    if (exactLength && digits.length !== exactLength) {
      return `Enter a valid ${exactLength}-digit phone number`;
    }

    if (!exactLength && (digits.length < 6 || digits.length > 15)) {
      return "Enter a valid phone number";
    }

    return "";
  };

  const handlePhoneNumberChange = (value: string) => {
    const digits = value
      .replace(/\D/g, "")
      .slice(0, getMaxPhoneDigits(selectedCountry.iso2));
    setPhoneNumber(digits);

    const formatted = [
      selectedCountry.code,
      digits,
      showPhoneExtension && phoneExtension ? `x${phoneExtension}` : "",
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const isOriginal =
      !activeContentDetail || !activeContentDetail.includes("_");
    if (!isOriginal) {
      handleContentLinkChange(activeContentDetail!, formatted);
    } else {
      handleBusinessFieldChange("phone", formatted);
    }

    if (phoneError) {
      setPhoneError(validatePhoneNumber(digits, selectedCountry.iso2));
    }
  };

  const handlePhoneExtensionChange = (value: string) => {
    const nextExtension = value.replace(/\D/g, "").slice(0, 8);
    setPhoneExtension(nextExtension);
    const formatted = [
      selectedCountry.code,
      phoneNumber,
      showPhoneExtension && nextExtension ? `x${nextExtension}` : "",
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const isOriginal =
      !activeContentDetail || !activeContentDetail.includes("_");
    if (!isOriginal) {
      handleContentLinkChange(activeContentDetail!, formatted);
    } else {
      handleBusinessFieldChange("phone", formatted);
    }
  };

  const handleBusinessFieldChange = (
    field: keyof (typeof card)["business"],
    value: string,
  ) => {
    onUpdate({
      ...card,
      business: {
        ...card.business,
        [field]: value,
      },
    });
  };

  /**
   * A blank title is stored as "no title", not as an empty string. Writing ""
   * left a dead key behind in Firestore and made every downstream
   * `contentTitles[label] || label` fall back anyway - so the key was carried
   * around for nothing and re-opening the form showed an empty Title field as
   * though one had been set.
   */
  const handleContentTitleChange = (label: string, value: string) => {
    const nextContentTitles = { ...(card.contentTitles || {}) };
    if (value.trim()) {
      nextContentTitles[label] = value;
    } else {
      delete nextContentTitles[label];
    }
    onUpdate({ ...card, contentTitles: nextContentTitles });
  };

  /** Copy for the (i) beside the field name. Falls back to the link wording,
   *  which is what every social / productivity / payment / music type needs. */
  const getFieldHelpText = (baseLabel: string) => {
    const help: Record<string, string> = {
      Phone:
        "Pick the country code, then enter the number without it. Choose Call or Text to set what tapping it does.",
      Email:
        "The address people reach you on. Tapping it opens their mail app with it already filled in.",
      Website: "Your full site address, including https://",
      Address:
        "Your business address. Tapping it on the card opens directions in the visitor's maps app.",
      Location:
        "A second address, separate from your main business one. Tapping it opens directions.",
      "About Me":
        "A short intro shown on your card - up to 250 characters. Keep it to a couple of sentences.",
      "Custom Title":
        "A section heading of your own, with rich text beneath it.",
      "Call-to-Action":
        "One button on your card. Give it a label people understand, like Book a Call, and the link it should open.",
      "Direct Ads":
        "Promote a product, event or service with an image, price and link.",
      Photos: "Up to 4 images, JPG, PNG or GIF, 5MB each.",
      Document:
        "One PDF, DOC or DOCX, up to 1MB. Visitors can preview it on your card.",
      Calendly:
        "Your Calendly booking link, so people can book a time directly.",
      "Google Calendar":
        "A Google Calendar appointment link people can book from.",
      Divider:
        "A plain line to break your card into sections. Nothing to fill in.",
    };
    return (
      help[baseLabel] ??
      `Paste the full ${baseLabel} link, starting with https://. Use Test to check it opens correctly.`
    );
  };

  const handleRemoveContentTitle = (label: string) => {
    const nextContentTitles = { ...(card.contentTitles || {}) };
    delete nextContentTitles[label];
    onUpdate({ ...card, contentTitles: nextContentTitles });
    setShowTitleField(false);
  };

  const handleCountrySelect = (country: (typeof COUNTRIES)[number]) => {
    const nextPhoneNumber = phoneNumber.slice(
      0,
      getMaxPhoneDigits(country.iso2),
    );

    setSelectedCountry(country);
    setShowCountrySelector(false);
    setSearchQuery("");
    setPhoneNumber(nextPhoneNumber);

    const formatted = [
      country.code,
      nextPhoneNumber,
      showPhoneExtension && phoneExtension ? `x${phoneExtension}` : "",
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const isOriginal =
      !activeContentDetail || !activeContentDetail.includes("_");
    if (!isOriginal) {
      handleContentLinkChange(activeContentDetail!, formatted);
    } else {
      handleBusinessFieldChange("phone", formatted);
    }
    setPhoneError(
      phoneError ? validatePhoneNumber(nextPhoneNumber, country.iso2) : "",
    );
  };

  const handlePasteFromClipboard = async (onPaste: (value: string) => void) => {
    try {
      const text = await navigator.clipboard.readText();
      onPaste(text.trim());
    } catch (error) {
      console.error("Clipboard paste failed", error);
    }
  };

  const handleContentLinkChange = (label: string, value: string) => {
    setContentLinkValues((current) => ({
      ...current,
      [label]: value,
    }));
    updateContentLink(label, value);
  };

  /**
   * Only ONE button from Call-to-Action, Direct Ads, Calendly, and Google Calendar
   * can be active at a time.
   *
   * When one is configured, it replaces whichever CTA button was previously
   * present in profileContentOrder, maintaining its position in the list.
   * appointmentType is updated accordingly to keep Marketplace filters working.
   */
  /**
   * Only ONE button from Call-to-Action, Direct Ads, Calendly, and Google Calendar
   * can be active at a time.
   *
   * When one is committed (Save clicked), it replaces whichever CTA button was previously
   * present in profileContentOrder, maintaining its position in the list.
   * appointmentType is updated accordingly to keep Marketplace filters working.
   */
  const commitAppointmentLabel = (label: CtaAppointmentLabel) => {
    const existingIndex = profileContentOrder.findIndex((item) =>
      (CTA_APPOINTMENT_LABELS as readonly string[]).includes(item),
    );

    let nextOrder: string[];
    if (existingIndex !== -1) {
      // Replace existing CTA button in-place and remove any other CTA duplicates
      nextOrder = profileContentOrder
        .map((item, idx) => (idx === existingIndex ? label : item))
        .filter(
          (item, idx) =>
            !(CTA_APPOINTMENT_LABELS as readonly string[]).includes(item) ||
            idx === existingIndex,
        );
    } else {
      nextOrder = [...profileContentOrder, label];
    }

    const nextAppointments = { ...card.appointments };
    if (label === "Call-to-Action") {
      nextAppointments.appointmentType = "call-to-action";
    } else if (label === "Direct Ads") {
      nextAppointments.appointmentType = "direct-ads";
    } else if (label === "Calendly") {
      nextAppointments.appointmentType = "booking";
      nextAppointments.platform = "calendly";
    } else if (label === "Google Calendar") {
      nextAppointments.appointmentType = "booking";
      nextAppointments.platform = "google";
    }

    const normalizedOrder = normalizeProfileContentOrder(nextOrder);
    setProfileContentOrder(normalizedOrder);
    onUpdate({
      ...card,
      appointments: nextAppointments,
      profileContentOrder: normalizedOrder,
    });
  };

  const updateAppointmentCard = (
    updates: Partial<(typeof card)["appointments"]>,
  ) => {
    onUpdate({
      ...card,
      appointments: {
        ...card.appointments,
        ...updates,
      },
    });
  };

  const updateDirectAdsCard = (
    updates: Partial<NonNullable<(typeof card)["appointments"]["directAds"]>>,
  ) => {
    updateAppointmentCard({
      directAds: {
        ...card.appointments.directAds,
        ...updates,
      },
    });
  };

  const updateContentLink = (label: string, value: string) => {
    onUpdate({
      ...card,
      contentLinks: {
        ...(card.contentLinks || {}),
        [label]: value,
      },
    });
  };

  const handleTestLink = (value: string) => {
    const trimmedLink = value.trim();

    if (!trimmedLink) {
      return;
    }

    const normalizedLink = /^https?:\/\//i.test(trimmedLink)
      ? trimmedLink
      : `https://${trimmedLink}`;

    window.open(normalizedLink, "_blank", "noopener,noreferrer");
  };

  function getDaySuffix(day: number) {
    if (day >= 11 && day <= 13) return `${day}th`;
    switch (day % 10) {
      case 1:
        return `${day}st`;
      case 2:
        return `${day}nd`;
      case 3:
        return `${day}rd`;
      default:
        return `${day}th`;
    }
  }

  const fileToDataURL = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const uploadDirectAdsImage = async (
    file: File,
    oldUrl?: string | null,
  ): Promise<string> => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.toLocaleString("en-US", { month: "long" });
    const day = getDaySuffix(now.getDate());
    const filePath = `/cards/${year}/${month}/${day}/${user?.uid}/${card.id}/directAds/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, filePath);

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    if (oldUrl && !oldUrl.startsWith("data:")) {
      try {
        const oldRef = ref(storage, oldUrl);
        await deleteObject(oldRef);
      } catch (error) {
        console.warn("Old Direct Ads image could not be deleted:", error);
      }
    }

    return downloadURL;
  };

  const uploadRichContent = async (
    file: File,
    folder: string,
    oldUrl?: string | null,
  ): Promise<string> => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.toLocaleString("en-US", { month: "long" });
    const day = getDaySuffix(now.getDate());
    const filePath = `/cards/${year}/${month}/${day}/${user?.uid}/${card.id}/${folder}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, filePath);

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    if (oldUrl && !oldUrl.startsWith("data:")) {
      try {
        const oldRef = ref(storage, oldUrl);
        await deleteObject(oldRef);
      } catch (error) {
        console.warn(`Old ${folder} file could not be deleted:`, error);
      }
    }

    return downloadURL;
  };

  const getDocumentData = () => {
    const data = card.contentLinks?.["Document"];
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (e) {
      return { url: data, name: "Document" };
    }
  };

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      toast.error("Document must be under 1MB.");
      return;
    }

    setIsUploadingDocument(true);
    try {
      const oldData = getDocumentData();
      const downloadURL = await uploadRichContent(
        file,
        "documents",
        oldData?.url,
      );

      const newData = JSON.stringify({ url: downloadURL, name: file.name });
      updateContentLink("Document", newData);
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document.");
    } finally {
      setIsUploadingDocument(false);
      if (documentInputRef.current) {
        documentInputRef.current.value = "";
      }
    }
  };

  const getPhotosData = (): { url: string; name: string }[] => {
    const data = card.contentLinks?.["Photos"];
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch (e) {
      return [];
    }
  };

  const handlePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const currentPhotos = getPhotosData();
    if (currentPhotos.length + files.length > 4) {
      toast.error("You can only upload up to 4 photos total.", {
        description: `You already have ${currentPhotos.length} of 4.`,
      });
      return;
    }

    // Check size limit (max 5MB per photo)
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Each photo must be under 5MB.", {
          description: file.name,
        });
        return;
      }
    }

    setIsUploadingPhotos(true);
    try {
      const uploadedPhotos = await Promise.all(
        files.map(async (file) => {
          const downloadURL = await uploadRichContent(file, "photos");
          return { url: downloadURL, name: file.name };
        }),
      );

      const newPhotos = [...currentPhotos, ...uploadedPhotos];
      updateContentLink("Photos", JSON.stringify(newPhotos));
    } catch (error) {
      console.error("Error uploading photos:", error);
      toast.error("Failed to upload photos.");
    } finally {
      setIsUploadingPhotos(false);
      if (photosInputRef.current) {
        photosInputRef.current.value = "";
      }
    }
  };

  const handleDeletePhoto = async (index: number) => {
    const currentPhotos = getPhotosData();
    const photoToDelete = currentPhotos[index];

    if (photoToDelete?.url) {
      try {
        const oldRef = ref(storage, photoToDelete.url);
        await deleteObject(oldRef);
      } catch (error) {
        console.warn("Failed to delete photo from storage:", error);
      }
    }

    const newPhotos = currentPhotos.filter((_, i) => i !== index);
    if (newPhotos.length > 0) {
      updateContentLink("Photos", JSON.stringify(newPhotos));
    } else {
      const nextLinks = { ...card.contentLinks };
      delete nextLinks["Photos"];
      onUpdate({ ...card, contentLinks: nextLinks });
    }
  };

  const handleDeleteDocument = async () => {
    setShowDocumentPreview(false);
    const oldData = getDocumentData();
    if (oldData?.url) {
      try {
        const oldRef = ref(storage, oldData.url);
        await deleteObject(oldRef);
      } catch (error) {
        console.warn("Failed to delete document from storage:", error);
      }
    }

    const nextLinks = { ...card.contentLinks };
    delete nextLinks["Document"];
    onUpdate({ ...card, contentLinks: nextLinks });
  };

  const updateMarketplaceAdImage = async (
    sourceCardId: string,
    url: string,
  ) => {
    const adsQuery = query(
      collection(db, "marketplace_ads"),
      where("sourceCardId", "==", sourceCardId),
    );
    const snapshot = await getDocs(adsQuery);

    if (snapshot.empty) {
      return;
    }

    const adDoc = snapshot.docs[0];
    await updateDoc(doc(db, "marketplace_ads", adDoc.id), {
      image: url,
      updatedAt: new Date(),
    });
  };

  const handleAppointmentImageUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.", { description: file.name });
      return;
    }

    try {
      setIsUploadingAppointmentImage(true);
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.18,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });

      let imageUrl = "";
      if (user?.uid) {
        imageUrl = await uploadDirectAdsImage(
          compressedFile,
          card.appointments.directAds?.image || null,
        );
      } else {
        imageUrl = await fileToDataURL(compressedFile);
      }

      const updatedCard = {
        ...card,
        appointments: {
          ...card.appointments,
          directAds: {
            ...card.appointments.directAds,
            type: card.appointments.directAds?.type || "Product",
            image: imageUrl,
          },
        },
      };

      onUpdate(updatedCard);

      if (card.id && user?.uid) {
        await updateDoc(doc(db, "cards", card.id), updatedCard);
      }

      if (card.metadata?.id) {
        await updateMarketplaceAdImage(card.metadata.id, imageUrl);
      }

      if (!user?.uid && card.id) {
        localStorage.setItem(`card_${card.id}`, JSON.stringify(updatedCard));
      }
    } catch (error) {
      console.error("Failed to upload Direct Ads image:", error);
      toast.error("Failed to upload image.");
    } finally {
      setIsUploadingAppointmentImage(false);
      setDragActiveAppointmentImage(false);
    }
  };

  function parseCreatedAt(input: any) {
    if (input instanceof Date) return input;
    if (input && input.seconds) return new Date(input.seconds * 1000);
    if (typeof input === "number") return new Date(input);
    if (typeof input === "string") return new Date(input.replace(" at", ""));
    return new Date();
  }

  // Counts only fields that can occupy a slot in the card's social row. This
  // iterated Object.keys(BASE_URLS), which also contains discord, signal,
  // telegram, wechat and whatsapp - none of which the card renders in that row -
  // so three Contact Info messengers plus one real social hit the cap of 4.
  const countActive = () =>
    CARD_SOCIAL_FIELDS.reduce((count, key) => {
      const value = card.social[key as keyof typeof card.social];
      const prefix = BASE_URLS[key];
      return value && value.trim() !== "" && value !== prefix
        ? count + 1
        : count;
    }, 0);

  const isLocked = (_platform: string) => {
    return false;
  };

  const handleInputChange = (field: string, value: string) => {
    if (isLocked(field)) {
      setWarning("Maximum of 4 social media links allowed");
      setShowWarning(true);
      return;
    }
    setWarning("");
    const prefix = BASE_URLS[field];

    let fullUrl = value;
    if (value && prefix && !value.startsWith(prefix)) {
      if (prefix.startsWith(value)) {
        // User is backspacing the prefix. Don't let them.
        fullUrl = prefix;
      } else {
        // User pasted something else, or typed before the prefix
        // Strip the prefix if it's anywhere inside, then prepend it properly
        const stripped = value.replace(prefix, "");
        fullUrl = prefix + stripped;
      }
    }

    const updatedCard = {
      ...card,
      social: {
        ...card.social,
        [field]: fullUrl,
      },
    };
    onUpdate(updatedCard);
  };

  const handleFocus = (field: string) => {
    const prefix = BASE_URLS[field];
    const currentValue = card.social[field as keyof typeof card.social] || "";

    if (isLocked(field)) {
      setWarning("Maximum of 4 social media links allowed");
      setShowWarning(true);
      return;
    } else {
      setWarning("");
    }

    if (!currentValue) {
      onUpdate({
        ...card,
        social: {
          ...card.social,
          [field]: prefix,
        },
      });
    }
  };

  const handleBlur = (field: string) => {
    const prefix = BASE_URLS[field];
    const currentValue = card.social[field as keyof typeof card.social] || "";
    if (currentValue === prefix) {
      onUpdate({
        ...card,
        social: {
          ...card.social,
          [field]: "",
        },
      });
    }
  };

  /**
   * Only the key, the display label and the field's placeholder. The `icon`
   * each entry used to carry is gone: icons come from the shared CONTENT_ICONS
   * table now, and five of these were hand-drawn SVG approximations - the
   * WeChat, Telegram and Signal ones in particular did not match the brand
   * marks the card drew for the same three platforms.
   */
  const socialPlatforms = [
    {
      key: "linkedin",
      label: "LinkedIn",
      placeholder: "https://linkedin.com/in/your-profile",
    },
    {
      key: "twitter",
      label: "Twitter/X",
      placeholder: "https://twitter.com/your-profile",
    },
    {
      key: "facebook",
      label: "Facebook",
      placeholder: "https://facebook.com/your-profile",
    },
    {
      key: "instagram",
      label: "Instagram",
      placeholder: "https://instagram.com/your-profile",
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      placeholder: "https://wa.me/your-number",
    },
    {
      key: "discord",
      label: "Discord",
      placeholder: "https://discordapp.com/users/your-id",
    },
    {
      key: "wechat",
      label: "WeChat",
      placeholder: "https://wechat.com/your-id",
    },
    {
      key: "signal",
      label: "Signal",
      placeholder: "https://signal.me/#p/your-number",
    },
    {
      key: "telegram",
      label: "Telegram",
      placeholder: "https://t.me/your-handle",
    },
    {
      key: "youtube",
      label: "YouTube",
      placeholder: "https://youtube.com/channel/your-channel-id",
    },
    {
      key: "tiktok",
      label: "TikTok",
      placeholder: "https://tiktok.com/@your-username",
    },
    {
      key: "vimeo",
      label: "Vimeo",
      placeholder: "https://vimeo.com/your-profile",
    },
    {
      key: "snapchat",
      label: "Snapchat",
      placeholder: "https://snapchat.com/add/your-username",
    },
    {
      key: "twitch",
      label: "Twitch",
      placeholder: "https://twitch.tv/your-channel",
    },
    {
      key: "pinterest",
      label: "Pinterest",
      placeholder: "https://pinterest.com/your-profile",
    },
  ];

  useEffect(() => {
    if (!user) return;

    const isFree = user?.planType === "free";
    setIsFreePlan(isFree);

    const createdAt = parseCreatedAt(user?.createdAt);
    const trialEnd = new Date(
      createdAt.getTime() + user?.freeTrialPeriod * 24 * 60 * 60 * 1000,
    );
    const trialActive = new Date() <= trialEnd;
    setIsTrialActive(trialActive);

    console.log("=== PREMIUM ACCESS DEBUG ===");
    console.log("User Plan Type:", user?.planType);
    console.log("Is Free Plan?", isFree);
    console.log("Trial Active?", trialActive);
    console.log("Trial End Date:", trialEnd.toLocaleDateString());
    console.log("============================");
  }, [user]);

  useEffect(() => {
    const isOriginal =
      !activeContentDetail || !activeContentDetail.includes("_");
    const currentPhoneValue = isOriginal
      ? card.business.phone
      : contentLinkValues[activeContentDetail!] ||
        card.contentLinks?.[activeContentDetail!] ||
        "";

    if (!currentPhoneValue && isOriginal && !card.business.phone) {
      return;
    }

    const currentPhoneStr = currentPhoneValue || "";
    const possibleCountries = [...COUNTRIES]
      .sort((a, b) => b.code.length - a.code.length)
      .filter((country) => currentPhoneStr.startsWith(country.code));

    let matchedCountry = possibleCountries[0];
    if (
      selectedCountry &&
      possibleCountries.some((c) => c.iso2 === selectedCountry.iso2)
    ) {
      matchedCountry = selectedCountry;
    }

    const resolvedCountry = matchedCountry ?? COUNTRIES[0];
    const withoutCode = matchedCountry
      ? (currentPhoneValue || "").slice(matchedCountry.code.length).trim()
      : (currentPhoneValue || "").trim();
    const extensionMatch = withoutCode.match(/x(\d+)$/i);
    const resolvedExtension = extensionMatch?.[1] ?? "";
    const resolvedPhoneNumber = withoutCode
      .replace(/x\d+$/i, "")
      .replace(/\D/g, "");

    setSelectedCountry(resolvedCountry);
    setPhoneNumber(resolvedPhoneNumber);
    setPhoneExtension(resolvedExtension);
    setShowPhoneExtension(Boolean(resolvedExtension));
  }, [
    card.business.phone,
    activeContentDetail,
    contentLinkValues,
    card.contentLinks,
  ]);

  // Seed profileContentOrder from the saved card the first time the form has data.
  //
  // The saved order is authoritative for ORDERING, but it is not a reliable record
  // of WHAT the card holds: SocialForm writes card.social.* without touching the
  // order, updateDirectAdsCard used to do the same, and cards saved before a label
  // existed simply never listed it. So the order is unioned with every label that
  // currently resolves to a value - saved positions first, anything the order does
  // not know about appended. Without this, an item renders on the card but is
  // missing from the Profile Content list and shows no badge on its tile.
  useEffect(() => {
    const savedLabels = CONTENT_LABELS.filter(
      (label) =>
        Boolean(getContentValue(label)) && label !== activeContentDetail,
    );

    const savedOrder = card.profileContentOrder?.length
      ? card.profileContentOrder
      : [];

    if (!savedLabels.length && !savedOrder.length) {
      return;
    }

    setProfileContentOrder((current) => {
      if (current.length) {
        return normalizeProfileContentOrder(current);
      }

      if (!savedOrder.length) {
        return normalizeProfileContentOrder(savedLabels);
      }

      // Compare on the base label so a renamed instance ("LinkedIn_1718...")
      // already in the order is not duplicated by its base entry.
      const known = new Set(savedOrder.map((item) => item.split("_")[0]));
      const missing = savedLabels.filter((label) => !known.has(label));

      const raw = missing.length ? [...savedOrder, ...missing] : savedOrder;
      const activeCta = getActiveAppointmentLabel(card);
      let seenCta = false;
      const filtered = raw.filter((item) => {
        if ((CTA_APPOINTMENT_LABELS as readonly string[]).includes(item)) {
          if (seenCta) return false;
          if (activeCta && item !== activeCta) return false;
          seenCta = true;
          return true;
        }
        return true;
      });
      return normalizeProfileContentOrder(filtered);
    });
  }, [card, contentLinkValues]);

  // Cleanup new items if the component unmounts (e.g. user switches tabs)
  const activeContentRef = useRef(activeContentDetail);
  const profileContentOrderRef = useRef(profileContentOrder);
  const handleRemoveRef = useRef(handleRemoveProfileContent);

  useEffect(() => {
    activeContentRef.current = activeContentDetail;
    profileContentOrderRef.current = profileContentOrder;
    handleRemoveRef.current = handleRemoveProfileContent;
  });

  useEffect(() => {
    return () => {
      const active = activeContentRef.current;
      const order = profileContentOrderRef.current;
      if (active && !order.includes(active)) {
        handleRemoveRef.current(active);
      }
    };
  }, []);

  const isProLocked = isFreePlan && !isTrialActive;

  /**
   * One Add Content tile.
   *
   * It no longer takes an icon or a colour: both come from the label via the
   * shared CONTENT_ICONS table, which the Profile Content row, the detail
   * form header and the card all read as well. Every tile used to carry its
   * own `icon`/`svg`/`colorClass`, and a handful had quietly drifted away
   * from what the same item looked like one screen over.
   */
  const ContentItem = ({
    label,
    isPremium = false,
    maxInstances,
  }: {
    label: string;
    isPremium?: boolean;
    maxInstances?: number;
  }) => {
    const tileIconMeta =
      label.split("_")[0] === "Phone"
        ? getPhoneIcon(card?.business?.phoneAction)
        : getContentIcon(label);
    const TileIcon = tileIconMeta.Icon;
    const tileIconStyle = contentIconStyle(tileIconMeta);
    const baseLabel = label.split("_")[0];
    // Count only entries that actually resolve to a value, which is the exact
    // test the Profile Content list uses. Counting raw profileContentOrder let
    // the two disagree: a stale entry - e.g. "Call-to-Action" still listed after
    // Direct Ads took over the shared appointmentType slot - put a "1" badge on
    // a tile that has no row in the list, so the badge claimed content the user
    // could not see or edit anywhere.
    const instanceCount = profileContentOrder.filter(
      (item) =>
        item.split("_")[0] === baseLabel && Boolean(getContentValue(item)),
    ).length;
    // Only a label the card's social row can hold is subject to the social cap.
    // The Contact Info messengers (WhatsApp, Discord, WeChat, Telegram, Signal)
    // are not social-row items as far as the card is concerned, so they return
    // false here and skip the cap entirely.
    const isSocialLabel = (CARD_SOCIAL_LABELS as readonly string[]).includes(
      baseLabel,
    );

    const isItemLocked = (() => {
      if (maxInstances !== undefined && instanceCount >= maxInstances)
        return true;
      if (isPremium && instanceCount >= 1) return true;
      return false;
    })();

    const lockedReason = (() => {
      if (isPremium && isProLocked) {
        return `Upgrade to Pro to unlock ${baseLabel}`;
      }
      if (!isItemLocked) return undefined;
      if (isPremium && instanceCount >= 1) {
        return `${baseLabel} is already on your card. Edit it from Profile Content.`;
      }
      if (maxInstances !== undefined && instanceCount >= maxInstances) {
        return maxInstances === 1
          ? `${baseLabel} is already on your card. Edit it from Profile Content.`
          : `Only ${maxInstances} ${baseLabel} allowed`;
      }
      return `${baseLabel} is already on your card. Edit it from Profile Content.`;
    })();

    return (
      <div
        className={cn(
          "relative flex flex-col items-center px-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm w-full transition-transform duration-200 ease-out will-change-transform",
          // Sized against the GRID, not the viewport - see rule 10 above.
          "pt-3 h-[90px]",
          "[@container(max-width:340px)]:pt-2.5 [@container(max-width:340px)]:h-[82px]",
          "[@container(min-width:600px)]:h-[100px]",
          // A gated Pro tile stays interactive even when isItemLocked is true:
          // its job is to open the upgrade sheet, and the lock badge already
          // says it is gated. Dimming it with cursor-not-allowed would say it
          // does nothing, which is the opposite of what it does.
          isItemLocked && !(isPremium && isProLocked)
            ? "opacity-50 cursor-not-allowed"
            : "hover:scale-105 active:scale-95 cursor-pointer hover:border-slate-200 dark:hover:border-slate-600",
        )}
        onClick={() => {
          // Checked BEFORE isItemLocked: a gated Pro item must always answer
          // with the upgrade sheet. Otherwise a user whose trial expired while
          // they already had, say, a Custom Title would fall into the
          // isPremium && instanceCount >= 1 branch below and be told about a
          // social-media limit that has nothing to do with it.
          //
          // Previously nothing stopped them here at all: the tile opened its
          // detail form, they filled it in, and only the Add button refused -
          // after the work was done, and via cleanupPremiumData wiping what
          // they had just typed. The refusal now lands at the point of intent.
          if (isPremium && isProLocked) {
            setShowUpgradePopup(true);
            return;
          }

          if (isItemLocked) {
            if (lockedReason) {
              setWarning(lockedReason);
              setShowWarning(true);
            }
            return;
          }

          if (baseLabel === "Divider") {
            // Always the bare "Divider" label - never a "Divider_<ts>" instance.
            // maxInstances={1} means the tile is locked once one exists, so the
            // guard above has already returned by the time a second click would
            // get here; this stays defensive so no duplicate can slip in.
            if (instanceCount > 0) return;

            // Build on the live order, not card.profileContentOrder: the saved
            // array can be missing entries the form reconciled on load, and
            // rebuilding from it would silently drop them again.
            //
            // Insert directly ABOVE About Me / Custom Title rather than
            // appending. The card resolves the divider to the first anchor that
            // follows it in the order, and the About anchor is the separator
            // between the social rows and the About section - which is where a
            // divider is wanted by default. Appending sent it past every anchor
            // to "end", so it drew below the rich content instead. Dragging the
            // row afterwards still moves it to the rich or end anchor.
            const nextOrder = normalizeProfileContentOrder([
              ...profileContentOrder,
              "Divider",
            ]);
            setProfileContentOrder(nextOrder);
            onUpdate({
              ...card,
              profileContentOrder: nextOrder,
            });
            return;
          }

          let newLabel = label;
          if (!isPremium && instanceCount > 0) {
            newLabel = `${baseLabel}_${Date.now()}`;
          }

          setActiveContentDetail(newLabel);
          setShowTitleField(Boolean(card.contentTitles?.[newLabel]));
          setTextContent(
            baseLabel === "About Me" && instanceCount === 0
              ? card.about.bio || ""
              : "",
          );
        }}
        title={lockedReason}
      >
        {/* Count badge and crown used to share the top-right corner, so premium
            tiles suppressed the count to avoid overlapping - which meant a
            configured Direct Ads looked exactly like an untouched one. The crown
            marks the tile as premium and the count says how many are in use, so
            both need to show: crown moves to the top-left and they coexist. */}
        {instanceCount > 0 && (
          <div className="absolute -top-1.5 -right-1.5 z-20 bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center shadow-md border border-white text-[10px] font-bold text-white">
            {instanceCount}
          </div>
        )}
        {/* A crown says "this is a Pro feature"; a lock says "and you cannot use
            it right now". Free plan with no active trial gets the lock, so the
            tile reads as gated before it is tapped rather than after. */}
        {isPremium && (
          <div className="absolute -top-1.5 -left-1.5 z-20 bg-white rounded-full p-0.5 shadow-md border border-slate-100">
            {isProLocked ? (
              <Lock className="h-3 w-3 text-amber-500 " />
            ) : (
              <Crown className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            )}
          </div>
        )}
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            "[@container(max-width:340px)]:w-8 [@container(max-width:340px)]:h-8",
            "[@container(min-width:600px)]:w-10 [@container(min-width:600px)]:h-10",
          )}
          style={tileIconStyle}
        >
          <TileIcon className="h-5 w-5" />
        </div>
        {/* The tile is top-anchored (pt-3 on the wrapper, no justify-center) so
            the icon lands on the same y in every tile. The label then gets a
            fixed h-[30px] box - two lines tall - and centres its text inside
            it, so "Call-to-Action" wraps within its own box instead of pushing
            the icon up, and a one-line label still sits optically centred
            rather than hugging the icon with dead space beneath it. */}
        <div className="mt-1.5 h-[30px] w-full flex items-center justify-center [@container(max-width:340px)]:h-[26px] [@container(max-width:340px)]:mt-1">
          <span className="text-[12px] leading-[15px] font-bold text-slate-900 dark:text-slate-300 text-center line-clamp-2 break-words px-0.5 [@container(max-width:340px)]:text-[11px] [@container(max-width:340px)]:leading-[13px] [@container(min-width:600px)]:text-[13px] [@container(min-width:600px)]:leading-4">
            {label}
          </span>
        </div>
      </div>
    );
  };

  /**
   * Icon + chip colour for a Profile Content row and for the detail form's
   * header chip. Both now read the shared CONTENT_ICONS table, which the Add
   * Content tiles and the card read too - this function used to be a ~190-line
   * ladder of its own `if` statements and had already drifted away from both
   * (flat pink Instagram against a gradient everywhere else, a page icon for
   * Notion, a star for Yelp, a white-on-yellow Snapchat ghost).
   */
  const getProfileContentMeta = (label: string) => {
    const baseLabel = label.split("_")[0];
    const meta =
      baseLabel === "Phone"
        ? getPhoneIcon(card?.business?.phoneAction)
        : getContentIcon(baseLabel);

    return { icon: meta.Icon, iconStyle: contentIconStyle(meta) };
  };

  const profileContent = profileContentOrder
    .map((label) => {
      const value = getContentValue(label);

      if (!value) {
        return null;
      }

      const { icon, iconStyle } = getProfileContentMeta(label);

      return {
        id: label,
        icon,
        label: card.contentTitles?.[label]?.trim() || label,
        rawLabel: label,
        value,
        iconStyle,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    icon: any;
    label: string;
    rawLabel: string;
    value: string;
    iconStyle: React.CSSProperties;
  }>;

  const topContent = useMemo(() => {
    return profileContent
      .filter((item) => {
        const base = item.id.split("_")[0];
        return (TOP_FIXED_LABELS as readonly string[]).includes(base);
      })
      .sort((a, b) => {
        const baseA = a.id.split("_")[0];
        const baseB = b.id.split("_")[0];
        return (
          (TOP_FIXED_LABELS as readonly string[]).indexOf(baseA) -
          (TOP_FIXED_LABELS as readonly string[]).indexOf(baseB)
        );
      });
  }, [profileContent]);

  const bottomContent = useMemo(() => {
    return profileContent
      .filter((item) => {
        const base = item.id.split("_")[0];
        return (BOTTOM_FIXED_LABELS as readonly string[]).includes(base);
      })
      .sort((a, b) => {
        const baseA = a.id.split("_")[0];
        const baseB = b.id.split("_")[0];
        return (
          (BOTTOM_FIXED_LABELS as readonly string[]).indexOf(baseA) -
          (BOTTOM_FIXED_LABELS as readonly string[]).indexOf(baseB)
        );
      });
  }, [profileContent]);

  const middleContent = useMemo(() => {
    return profileContent.filter((item) => {
      const base = item.id.split("_")[0];
      return (
        !(TOP_FIXED_LABELS as readonly string[]).includes(base) &&
        !(BOTTOM_FIXED_LABELS as readonly string[]).includes(base)
      );
    });
  }, [profileContent]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentMiddleIds = middleContent.map((item) => item.id);
    const oldIndex = currentMiddleIds.indexOf(active.id);
    const newIndex = currentMiddleIds.indexOf(over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const nextMiddleOrder = arrayMove(currentMiddleIds, oldIndex, newIndex);
      const nextOrder = [
        ...topContent.map((item) => item.id),
        ...nextMiddleOrder,
        ...bottomContent.map((item) => item.id),
      ];
      updateProfileContentOrder(nextOrder);
    }
  };

  if (activeContentDetail) {
    const baseActiveContentDetail = activeContentDetail.split("_")[0];
    const isOriginal = activeContentDetail === baseActiveContentDetail;
    const isPhone = baseActiveContentDetail === "Phone";
    const isEmail = baseActiveContentDetail === "Email";
    const isWebsite = baseActiveContentDetail === "Website";
    const isCustomTitle = baseActiveContentDetail === "Custom Title";
    const isCalendly = baseActiveContentDetail === "Calendly";
    const isGoogleCalendar = baseActiveContentDetail === "Google Calendar";
    const isGoogleDrive = baseActiveContentDetail === "Google Drive";
    const isCallToAction = baseActiveContentDetail === "Call-to-Action";
    const activeSocialField = SOCIAL_DETAIL_FIELD_MAP[baseActiveContentDetail];
    const isTextBased =
      baseActiveContentDetail === "About Me" ||
      baseActiveContentDetail === "Custom Title";
    const isDirectAds = baseActiveContentDetail === "Direct Ads";
    const isLocation =
      baseActiveContentDetail === "Location" ||
      baseActiveContentDetail === "Address";
    const isDocument = baseActiveContentDetail === "Document";
    const isPhotos = baseActiveContentDetail === "Photos";
    const activeSocialPlatform = socialPlatforms.find(
      (platform) => platform.key === activeSocialField,
    );
    const activeContentTitle = card.contentTitles?.[activeContentDetail] || "";
    const activeLinkValue = !isOriginal
      ? contentLinkValues[activeContentDetail] ||
        card.contentLinks?.[activeContentDetail] ||
        ""
      : isWebsite
        ? card.business.website
        : isCalendly
          ? card.appointments.calendlyUrl || ""
          : isGoogleCalendar
            ? card.appointments.googleUrl || ""
            : isGoogleDrive
              ? card.contentLinks?.["Google Drive"] || ""
              : activeSocialField
                ? card.social[activeSocialField as keyof typeof card.social] ||
                  ""
                : contentLinkValues[activeContentDetail] || "";

    const isPrimaryAddress = activeContentDetail === "Address";

    let parsedSecondaryAddress = {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    };
    if (!isPrimaryAddress && isLocation && activeLinkValue) {
      try {
        parsedSecondaryAddress = {
          ...parsedSecondaryAddress,
          ...JSON.parse(activeLinkValue),
        };
      } catch (e) {
        parsedSecondaryAddress.street = activeLinkValue;
      }
    }

    const handleAddressChange = (field: string, value: string) => {
      if (isPrimaryAddress) {
        onUpdate({
          ...card,
          business: {
            ...card.business,
            address: {
              ...card.business.address,
              [field]: value,
            },
          },
        });
      } else {
        const newAddress = { ...parsedSecondaryAddress, [field]: value };
        handleContentLinkChange(
          activeContentDetail!,
          JSON.stringify(newAddress),
        );
      }
    };

    // No min-h-screen on this screen. Forcing the panel to a full viewport
    // while `main` was flex-1 stretched a three-field form to screen height and
    // parked the Add button below a dead band of empty background. Sized to its
    // content, a short form ends where it ends; a long one (Direct Ads,
    // Address) still scrolls, and the sticky footer still pins the CTA.
    return (
      <div
        ref={screenRootRef}
        // max-w cap: this screen is one field plus two buttons. On the
        // dashboard Edit tab its column reaches ~1190px, and a text input
        // that wide is unusable - so the form caps and centres while the
        // Add Content picker beside it is left free to expand. Inert in
        // onboarding, whose panel never exceeds ~468px.
        className="flex grow flex-col w-full max-w-[640px] mx-auto bg-[#f8f9fb] dark:bg-transparent dark:border dark:border-slate-800 text-foreground mt-4"
      >
        <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm h-14 flex items-center px-4 lg:px-2 rounded-[24px]">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={handleCloseContentDetail}
          >
            <ArrowLeft className="h-5 w-5 dark:text-slate-300" />
          </Button>
          <h1 className="flex-1 text-center font-bold text-lg mr-10 dark:text-white">
            Add {baseActiveContentDetail}
          </h1>
        </header>

        <main className="grow pt-3 sm:p-4 space-y-4 pb-6">
          <Card className="rounded-[24px] shadow-sm border dark:border-slate-800 dark:bg-slate-900/50 overflow-hidden">
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    // One source of truth for every content icon and colour:
                    // the same helper the Profile Content rows use. The
                    // hardcoded ternary this replaced named ten special cases
                    // and fell through to <Globe /> for everything else, so
                    // every social - WhatsApp, Discord, WeChat, Telegram,
                    // Signal and the rest - showed a generic website globe at
                    // the top of its own form.
                    const { icon: DetailIcon, iconStyle: detailIconStyle } =
                      getProfileContentMeta(activeContentDetail);

                    return (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={detailIconStyle}
                      >
                        <DetailIcon className="h-3.5 w-3.5" />
                      </div>
                    );
                  })()}
                  <span className="text-sm font-bold">
                    {baseActiveContentDetail}
                  </span>
                </div>
                {/* Was a bare decorative icon. It now discloses what this field
                    expects, which is the only reason an (i) belongs here. */}
                <button
                  type="button"
                  onClick={() => setShowFieldHelp((open) => !open)}
                  aria-expanded={showFieldHelp}
                  aria-label={`What goes in ${baseActiveContentDetail}?`}
                  className={cn(
                    "shrink-0 h-8 w-8 -mr-1.5 flex items-center justify-center rounded-full transition-colors",
                    showFieldHelp
                      ? "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-200"
                      : "text-slate-300 hover:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800",
                  )}
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>

              {showFieldHelp && (
                <p className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5 text-[12px] font-medium leading-snug text-slate-500 dark:text-slate-400">
                  {getFieldHelpText(baseActiveContentDetail)}
                </p>
              )}

              {isPhone ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 h-12 border dark:border-slate-700 rounded-xl px-3 bg-white dark:bg-slate-800 focus-within:border-slate-400 dark:focus-within:border-slate-600 focus-within:ring-1 focus-within:ring-slate-400 dark:focus-within:ring-slate-600 transition-colors">
                    <button
                      onClick={() => setShowCountrySelector(true)}
                      className="flex items-center gap-1.5 pr-2 border-r dark:border-slate-700 h-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <img
                        src={`https://flagcdn.com/w20/${selectedCountry.iso2}.png`}
                        alt={selectedCountry.name}
                        className="w-5 h-4"
                      />
                      <span className="text-sm font-medium dark:text-white">
                        {selectedCountry.code}
                      </span>
                      <ChevronDown className="h-3 w-3 text-slate-400" />
                    </button>
                    <Input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => handlePhoneNumberChange(e.target.value)}
                      onBlur={() =>
                        setPhoneError(
                          validatePhoneNumber(
                            phoneNumber,
                            selectedCountry.iso2,
                          ),
                        )
                      }
                      inputMode="tel"
                      autoComplete="tel-national"
                      placeholder="Enter phone number"
                      className="border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-sm h-full bg-transparent dark:text-white dark:placeholder:text-slate-500"
                    />
                  </div>
                  {showPhoneExtension && (
                    <div className="flex items-center gap-2 h-12 border dark:border-slate-700 rounded-xl px-3 bg-white dark:bg-slate-800 focus-within:border-slate-400 dark:focus-within:border-slate-600 focus-within:ring-1 focus-within:ring-slate-400 dark:focus-within:ring-slate-600 transition-colors">
                      <span className="text-sm font-medium text-slate-500">
                        Ext
                      </span>
                      <Input
                        value={phoneExtension}
                        onChange={(e) =>
                          handlePhoneExtensionChange(e.target.value)
                        }
                        inputMode="numeric"
                        autoComplete="tel-extension"
                        placeholder="Extension"
                        className="border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-sm h-full bg-transparent dark:text-white dark:placeholder:text-slate-500"
                      />
                    </div>
                  )}
                  {phoneError ? (
                    <p className="text-[12px] font-medium text-red-500 ml-2">
                      {phoneError}
                    </p>
                  ) : (
                    <p className="text-[12px] font-medium text-slate-400 ml-2">
                      {selectedCountry.name} numbers should be{" "}
                      {getMaxPhoneDigits(selectedCountry.iso2)} digits
                    </p>
                  )}
                  <button
                    onClick={() => {
                      const nextShowExtension = !showPhoneExtension;
                      setShowPhoneExtension(nextShowExtension);

                      if (!nextShowExtension) {
                        setPhoneExtension("");
                        handleBusinessFieldChange(
                          "phone",
                          [selectedCountry.code, phoneNumber]
                            .filter(Boolean)
                            .join(" ")
                            .trim(),
                        );
                      }
                    }}
                    className="text-[12px] font-bold text-slate-900 ml-2 hover:underline"
                  >
                    {showPhoneExtension
                      ? "Remove Extension"
                      : "+ Add Extension"}
                  </button>
                  {activeContentDetail === "Phone" && (
                    <div className="flex bg-slate-100 dark:bg-slate-800/50 rounded-full p-1">
                      <button
                        onClick={() => {
                          setPhoneActionType("text");
                          handleBusinessFieldChange("phoneAction", "text");
                        }}
                        className={cn(
                          "flex-1 py-1.5 text-sm font-bold rounded-full transition-colors",
                          phoneActionType === "text"
                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                            : "text-slate-400 dark:text-slate-500",
                        )}
                      >
                        Text
                      </button>
                      <button
                        onClick={() => {
                          setPhoneActionType("call");
                          handleBusinessFieldChange("phoneAction", "call");
                        }}
                        className={cn(
                          "flex-1 py-1.5 text-sm font-bold rounded-full transition-colors",
                          phoneActionType === "call"
                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                            : "text-slate-400 dark:text-slate-500",
                        )}
                      >
                        Call
                      </button>
                    </div>
                  )}
                </div>
              ) : isEmail ? (
                <div className="space-y-4">
                  <Input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={isOriginal ? card.business.email : activeLinkValue}
                    onChange={(e) =>
                      isOriginal
                        ? handleBusinessFieldChange("email", e.target.value)
                        : handleContentLinkChange(
                            activeContentDetail,
                            e.target.value,
                          )
                    }
                    placeholder="email"
                    className="h-12 rounded-xl text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white"
                  />
                  <Button
                    onClick={() =>
                      handlePasteFromClipboard((value) =>
                        isOriginal
                          ? handleBusinessFieldChange("email", value)
                          : handleContentLinkChange(activeContentDetail, value),
                      )
                    }
                    variant="outline"
                    className="w-full h-11 rounded-full text-sm font-bold border-slate-200 flex items-center gap-2 transition-transform active:scale-95"
                  >
                    <Clipboard className="h-4 w-4" /> Paste
                  </Button>
                </div>
              ) : isTextBased ? (
                <div className="space-y-2">
                  {isCustomTitle ? (
                    <div className="space-y-4">
                      <Input
                        value={card.about.customSectionTitle || ""}
                        onChange={(e) => {
                          setTextContent(e.target.value);
                          onUpdate({
                            ...card,
                            about: {
                              ...card.about,
                              sectionType: "custom",
                              customSectionTitle: e.target.value,
                              bio: card.about.bio || "",
                            },
                          });
                        }}
                        placeholder="Enter custom section title"
                        className="h-12 rounded-xl text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white"
                      />
                      <div className="rounded-[20px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                        <CKEditor
                          data={card.about.bio || ""}
                          onChange={(_event, editor) => {
                            const html = editor.getData();
                            onUpdate({
                              ...card,
                              about: {
                                ...card.about,
                                sectionType: "custom",
                                customSectionTitle:
                                  card.about.customSectionTitle || "",
                                bio: html,
                              },
                            });
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline justify-between gap-2 px-1">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Short Bio, Company Description, etc.
                        </Label>
                        <span className="shrink-0 text-xs font-medium text-muted-foreground">
                          {textContent.length}/250
                        </span>
                      </div>
                      <Textarea
                        value={textContent}
                        onChange={(e) => {
                          setTextContent(e.target.value);
                          onUpdate({
                            ...card,
                            about: {
                              ...card.about,
                              bio: e.target.value,
                            },
                          });
                        }}
                        placeholder="Share your professional background..."
                        className="min-h-[140px] rounded-[20px] text-sm border-slate-200 dark:border-slate-700 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600 bg-white dark:bg-slate-900 dark:text-white p-4"
                        maxLength={250}
                      />
                    </>
                  )}
                </div>
              ) : isCallToAction ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-900 dark:text-slate-300">
                      Custom Button Text
                    </Label>
                    <Input
                      value={card.appointments.ctaLabel || ""}
                      onChange={(e) =>
                        updateAppointmentCard({
                          ctaLabel: e.target.value,
                        })
                      }
                      placeholder="Schedule Meeting, Get Quote, Contact Me"
                      className="h-12 rounded-xl text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-900 dark:text-slate-300">
                      Custom Button URL
                    </Label>
                    <Input
                      type="url"
                      value={card.appointments.ctaUrl || ""}
                      onChange={(e) =>
                        updateAppointmentCard({
                          ctaUrl: e.target.value,
                        })
                      }
                      placeholder="https://example.com/contact"
                      className="h-12 rounded-xl text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() =>
                        handlePasteFromClipboard((value) =>
                          updateAppointmentCard({
                            ctaUrl: value,
                          }),
                        )
                      }
                      variant="outline"
                      className="h-11 rounded-full text-sm font-bold border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white flex items-center gap-2 transition-transform active:scale-95"
                    >
                      <Clipboard className="h-4 w-4" /> Paste URL
                    </Button>
                    <Button
                      onClick={() =>
                        handleTestLink(card.appointments.ctaUrl || "")
                      }
                      className="h-11 rounded-full text-sm font-bold bg-indigo-400 text-white flex items-center gap-2 transition-transform active:scale-95"
                    >
                      Test <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : isDirectAds ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-bold text-slate-900 dark:text-slate-300">
                      Direct Ads Type{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={card.appointments.directAds?.type || ""}
                      onValueChange={(value) =>
                        updateDirectAdsCard({
                          type: value as
                            | "Product"
                            | "Event"
                            | "Service"
                            | "none",
                        })
                      }
                    >
                      <SelectTrigger className="w-full h-12 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white">
                        <SelectValue placeholder="Select One" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="Product">Product</SelectItem>
                        <SelectItem value="Event">Event</SelectItem>
                        <SelectItem value="Service">Service</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-bold text-slate-900 dark:text-slate-300">
                      {card.appointments.directAds?.type || "Product"} Image
                    </Label>
                    <div
                      className={cn(
                        "border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[24px] p-8 flex flex-col items-center justify-center text-center space-y-3 bg-white dark:bg-slate-900 transition-colors cursor-pointer group",
                        dragActiveAppointmentImage &&
                          "border-blue-500 bg-blue-50",
                      )}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setDragActiveAppointmentImage(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setDragActiveAppointmentImage(false);
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const files = e.dataTransfer.files;
                        if (
                          files &&
                          files[0] &&
                          files[0].type.startsWith("image/")
                        ) {
                          handleAppointmentImageUpload(files[0]);
                        }
                      }}
                    >
                      {card.appointments.directAds?.image ? (
                        <>
                          <img
                            src={card.appointments.directAds.image}
                            alt="Direct ad"
                            className="max-w-full h-32 object-contain mx-auto rounded-xl"
                          />
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {isUploadingAppointmentImage
                              ? "Uploading..."
                              : "Image uploaded successfully"}
                          </p>
                          <label className="inline-block">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const files = e.target.files;
                                if (files && files[0]) {
                                  handleAppointmentImageUpload(files[0]);
                                }
                              }}
                              className="hidden"
                            />
                            <span className="text-blue-600 hover:text-blue-700 cursor-pointer text-sm font-bold">
                              Change image
                            </span>
                          </label>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors">
                            <Upload className="h-6 w-6 text-slate-400" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {isUploadingAppointmentImage
                                ? "Uploading..."
                                : "Click to upload or drag and drop"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              JPG, PNG or GIF (max. 5MB)
                            </p>
                          </div>
                          <label className="inline-block">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const files = e.target.files;
                                if (files && files[0]) {
                                  handleAppointmentImageUpload(files[0]);
                                }
                              }}
                              className="hidden"
                            />
                            <span className="text-blue-600 font-bold h-auto p-0 hover:text-blue-700">
                              Browse files
                            </span>
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : isLocation ? (
                <div className="space-y-6">
                  <div className="space-y-2 p-4 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-[20px] shadow-sm">
                    <Label className="text-sm font-bold text-slate-900 dark:text-slate-300">
                      Street Address
                    </Label>
                    <Input
                      value={
                        isPrimaryAddress
                          ? card.business.address?.street || ""
                          : parsedSecondaryAddress.street
                      }
                      onChange={(e) =>
                        handleAddressChange("street", e.target.value)
                      }
                      placeholder="123 business street"
                      autoComplete="street-address"
                      className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 p-4 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-[20px] shadow-sm">
                      <Label className="text-sm font-bold text-slate-900 dark:text-slate-300">
                        City
                      </Label>
                      <Input
                        value={
                          isPrimaryAddress
                            ? card.business.address?.city || ""
                            : parsedSecondaryAddress.city
                        }
                        onChange={(e) =>
                          handleAddressChange("city", e.target.value)
                        }
                        placeholder="City"
                        autoComplete="address-level2"
                        className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2 p-4 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-[20px] shadow-sm">
                      <Label className="text-sm font-bold text-slate-900 dark:text-slate-300">
                        State/Province
                      </Label>
                      <Input
                        value={
                          isPrimaryAddress
                            ? card.business.address?.state || ""
                            : parsedSecondaryAddress.state
                        }
                        onChange={(e) =>
                          handleAddressChange("state", e.target.value)
                        }
                        placeholder="State/Province"
                        autoComplete="address-level1"
                        className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2 p-4 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-[20px] shadow-sm">
                      <Label className="text-sm font-bold text-slate-900 dark:text-slate-300">
                        ZIP/Postal Code
                      </Label>
                      <Input
                        value={
                          isPrimaryAddress
                            ? card.business.address?.zip || ""
                            : parsedSecondaryAddress.zip
                        }
                        onChange={(e) =>
                          handleAddressChange("zip", e.target.value)
                        }
                        placeholder="ZIP/Postal Code"
                        autoComplete="postal-code"
                        className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2 p-4 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-[20px] shadow-sm">
                      <Label className="text-sm font-bold text-slate-900 dark:text-slate-300">
                        Country
                      </Label>
                      <Input
                        value={
                          isPrimaryAddress
                            ? card.business.address?.country || ""
                            : parsedSecondaryAddress.country
                        }
                        onChange={(e) =>
                          handleAddressChange("country", e.target.value)
                        }
                        placeholder="Country"
                        autoComplete="country-name"
                        className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              ) : isDocument ? (
                <div className="space-y-4">
                  {!getDocumentData() ? (
                    <div
                      onClick={() => documentInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[24px] p-8 flex flex-col items-center justify-center text-center space-y-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                    >
                      <input
                        type="file"
                        ref={documentInputRef}
                        onChange={handleDocumentUpload}
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                      />
                      <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors">
                        {isUploadingDocument ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400"></div>
                        ) : (
                          <Upload className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {isUploadingDocument
                            ? "Uploading..."
                            : "Click to upload document"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, DOC or DOCX (max. 1MB)
                        </p>
                      </div>
                      <Button
                        variant="link"
                        className="text-blue-600 font-bold h-auto p-0 hover:text-blue-700 pointer-events-none"
                      >
                        Browse files
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-sm space-y-5">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-6 w-6 text-blue-500" />
                          </div>
                          <span className="text-[14px] font-bold text-slate-900 dark:text-white truncate">
                            {getDocumentData()?.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => setShowDocumentPreview(true)}
                          className="flex-1 h-12 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-xl shadow-md border-none flex items-center justify-center gap-2 group transition-transform active:scale-95"
                          style={{ background: card?.brandColor || "#000" }}
                        >
                          <Eye className="h-4 w-4" />
                          Preview
                        </Button>
                        <Button
                          onClick={handleDeleteDocument}
                          variant="outline"
                          className="flex-1 h-12 border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center gap-2 transition-transform active:scale-95"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Document Preview Bottom Sheet Modal */}
                  {isMounted &&
                    typeof document !== "undefined" &&
                    createPortal(
                      <>
                        <div
                          onClick={() => setShowDocumentPreview(false)}
                          className={`!mt-0 fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 z-[9999] ${
                            showDocumentPreview
                              ? "opacity-100 visible pointer-events-auto"
                              : "opacity-0 invisible pointer-events-none"
                          }`}
                        />
                        <div
                          className={`z-[9999] fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] sm:max-w-[760px] lg:max-w-[900px] h-[85vh] sm:h-[90vh] overflow-hidden
                          bg-[#f8f9fb] dark:bg-slate-950 dark:border dark:border-slate-800 rounded-t-[24px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)]
                          transition-all duration-500 ease-in-out flex flex-col
                          ${showDocumentPreview ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-full opacity-0 pointer-events-none"}`}
                        >
                          <div className="flex items-center justify-between p-4 sm:p-6 border-b dark:border-slate-700 bg-white dark:bg-slate-900 flex-shrink-0">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                              Document Preview
                            </h2>
                            <button
                              type="button"
                              onClick={() => setShowDocumentPreview(false)}
                              aria-label="Close document preview"
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                              <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                            </button>
                          </div>
                          <div className="flex-1 min-h-0 bg-slate-100 dark:bg-slate-900 p-2 sm:p-4 overflow-hidden">
                            {showDocumentPreview && (
                              <iframe
                                src={getDocumentData()?.url}
                                title={getDocumentData()?.name || "Document preview"}
                                className="w-full h-full rounded-xl shadow-sm bg-white dark:bg-slate-800 border-none"
                              />
                            )}
                          </div>
                        </div>
                      </>,
                      document.body
                    )}
                </div>
              ) : isPhotos ? (
                <div className="space-y-4">
                  {getPhotosData().length === 0 ? (
                    <div
                      onClick={() =>
                        !isUploadingPhotos && photosInputRef.current?.click()
                      }
                      className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[24px] p-8 flex flex-col items-center justify-center text-center space-y-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group relative"
                    >
                      <input
                        type="file"
                        ref={photosInputRef}
                        onChange={handlePhotosUpload}
                        accept="image/png, image/jpeg, image/gif"
                        multiple
                        className="hidden"
                      />
                      <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors">
                        {isUploadingPhotos ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400"></div>
                        ) : (
                          <Upload className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {isUploadingPhotos
                            ? "Uploading photos..."
                            : "Click to upload photos (Max 4)"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG or GIF (max. 5MB per file)
                        </p>
                      </div>
                      <Button
                        variant="link"
                        className="text-blue-600 font-bold h-auto p-0 hover:text-blue-700 pointer-events-none"
                      >
                        Browse files
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          Photo Gallery ({getPhotosData().length}/4)
                        </h3>
                        {getPhotosData().length < 4 && (
                          <button
                            onClick={() =>
                              !isUploadingPhotos &&
                              photosInputRef.current?.click()
                            }
                            className="text-blue-600 font-bold text-sm flex items-center gap-1 hover:text-blue-700 transition-colors"
                          >
                            <Plus className="h-4 w-4" /> Add Photo
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {getPhotosData().map((photo, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedPhotoPreview(photo)}
                            className="relative group rounded-xl overflow-hidden aspect-square border dark:border-slate-700 shadow-sm cursor-pointer"
                          >
                            <img
                              src={photo.url}
                              alt={photo.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePhoto(idx);
                                }}
                                className="w-10 h-10 bg-white text-red-500 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors shadow-lg transform scale-90 group-hover:scale-100"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <input
                        type="file"
                        ref={photosInputRef}
                        onChange={handlePhotosUpload}
                        accept="image/png, image/jpeg, image/gif"
                        multiple
                        className="hidden"
                      />
                      {isUploadingPhotos && (
                        <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center rounded-[24px]">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Photo Preview Bottom Sheet Modal */}
                  {isMounted &&
                    typeof document !== "undefined" &&
                    selectedPhotoPreview?.url &&
                    createPortal(
                      <>
                        <div
                          onClick={() => setSelectedPhotoPreview(null)}
                          className={`!mt-0 fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 z-[9999] ${
                            selectedPhotoPreview
                              ? "opacity-100 visible pointer-events-auto"
                              : "opacity-0 invisible pointer-events-none"
                          }`}
                        />
                        <div
                          className={`z-[9999] fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] sm:max-w-[760px] lg:max-w-[900px] h-[85vh] sm:h-[90vh] overflow-hidden
                          bg-[#f8f9fb] dark:bg-slate-950 dark:border dark:border-slate-800 rounded-t-[24px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)]
                          transition-all duration-500 ease-in-out flex flex-col
                          ${selectedPhotoPreview ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-full opacity-0 pointer-events-none"}`}
                        >
                          <div className="flex items-center justify-between p-4 sm:p-6 border-b dark:border-slate-700 bg-white dark:bg-slate-900 flex-shrink-0">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                              Photo Preview
                            </h2>
                            <button
                              type="button"
                              onClick={() => setSelectedPhotoPreview(null)}
                              aria-label="Close photo preview"
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                              <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                            </button>
                          </div>
                          <div className="flex-1 min-h-0 bg-slate-100 dark:bg-slate-900 p-2 sm:p-4 overflow-hidden flex items-center justify-center">
                            {selectedPhotoPreview && (
                              <img
                                src={selectedPhotoPreview.url}
                                alt={selectedPhotoPreview.name || "Photo preview"}
                                className="max-h-full max-w-full object-contain rounded-xl shadow-sm"
                              />
                            )}
                          </div>
                        </div>
                      </>,
                      document.body
                    )}
                </div>
              ) : isCalendly || isGoogleCalendar ? (
                <div className="space-y-4">
                  <Input
                    type="url"
                    value={activeLinkValue}
                    onFocus={() => {
                      if (!activeLinkValue) {
                        const baseUrl = isGoogleCalendar
                          ? "https://calendar.google.com/"
                          : "https://calendly.com/";
                        updateAppointmentCard({
                          platform: isGoogleCalendar ? "google" : "calendly",
                          [isGoogleCalendar ? "googleUrl" : "calendlyUrl"]:
                            baseUrl,
                        });
                      }
                    }}
                    onBlur={() => {
                      const baseUrl = isGoogleCalendar
                        ? "https://calendar.google.com/"
                        : "https://calendly.com/";
                      if (activeLinkValue === baseUrl) {
                        updateAppointmentCard({
                          [isGoogleCalendar ? "googleUrl" : "calendlyUrl"]: "",
                        });
                      }
                    }}
                    onChange={(e) =>
                      updateAppointmentCard({
                        platform: isGoogleCalendar ? "google" : "calendly",
                        [isGoogleCalendar ? "googleUrl" : "calendlyUrl"]:
                          e.target.value,
                      })
                    }
                    placeholder={
                      isGoogleCalendar
                        ? "https://calendar.google.com/calendar/u/0/r/eventedit"
                        : "https://calendly.com/your-name"
                    }
                    className="h-12 rounded-xl text-sm"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() =>
                        handlePasteFromClipboard((value) =>
                          updateAppointmentCard({
                            platform: isGoogleCalendar ? "google" : "calendly",
                            [isGoogleCalendar ? "googleUrl" : "calendlyUrl"]:
                              value,
                          }),
                        )
                      }
                      variant="outline"
                      className="h-11 rounded-full text-sm font-bold border-slate-200 flex items-center gap-2 transition-transform active:scale-95"
                    >
                      <Clipboard className="h-4 w-4" /> Paste
                    </Button>
                    <Button
                      onClick={() => handleTestLink(activeLinkValue)}
                      className="h-11 rounded-full text-sm font-bold bg-indigo-400 text-white flex items-center gap-2 transition-transform active:scale-95"
                    >
                      Test <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Input
                    type="url"
                    value={activeLinkValue}
                    onChange={(e) =>
                      !isOriginal
                        ? handleContentLinkChange(
                            activeContentDetail,
                            e.target.value,
                          )
                        : isWebsite
                          ? handleBusinessFieldChange("website", e.target.value)
                          : isGoogleDrive
                            ? updateContentLink("Google Drive", e.target.value)
                            : activeSocialField
                              ? handleInputChange(
                                  activeSocialField,
                                  e.target.value,
                                )
                              : handleContentLinkChange(
                                  activeContentDetail,
                                  e.target.value,
                                )
                    }
                    onFocus={() => {
                      const prefix = activeSocialField
                        ? BASE_URLS[activeSocialField]
                        : BASE_URLS[baseActiveContentDetail];

                      if (activeSocialField && isOriginal) {
                        handleFocus(activeSocialField);
                      } else if (prefix && !activeLinkValue) {
                        handleContentLinkChange(activeContentDetail, prefix);
                      }
                    }}
                    onBlur={() => {
                      const prefix = activeSocialField
                        ? BASE_URLS[activeSocialField]
                        : BASE_URLS[baseActiveContentDetail];

                      if (activeSocialField && isOriginal) {
                        handleBlur(activeSocialField);
                      } else if (prefix && activeLinkValue === prefix) {
                        handleContentLinkChange(activeContentDetail, "");
                      }
                    }}
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder={activeSocialPlatform?.placeholder || "link"}
                    className="h-12 rounded-xl text-sm"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() =>
                        handlePasteFromClipboard((value) =>
                          !isOriginal
                            ? handleContentLinkChange(
                                activeContentDetail,
                                value,
                              )
                            : isWebsite
                              ? handleBusinessFieldChange("website", value)
                              : isGoogleDrive
                                ? updateContentLink("Google Drive", value)
                                : activeSocialField
                                  ? handleInputChange(activeSocialField, value)
                                  : handleContentLinkChange(
                                      activeContentDetail,
                                      value,
                                    ),
                        )
                      }
                      variant="outline"
                      className="h-11 rounded-full text-sm font-bold border-slate-200 flex items-center gap-2 transition-transform active:scale-95"
                    >
                      <Clipboard className="h-4 w-4" /> Paste
                    </Button>
                    <Button
                      onClick={() => handleTestLink(activeLinkValue)}
                      className="h-11 rounded-full text-sm font-bold bg-indigo-400 text-white flex items-center gap-2 transition-transform active:scale-95"
                    >
                      Test <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Optional custom title. Collapsed it is the "+ Add Title" pill from
              the spec sheet; expanded it is a card matching the field card
              above it, with a way back out - previously the pill was one-way,
              so a title added by mistake could only be blanked, never removed. */}
          {!showTitleField ? (
            <Button
              variant="outline"
              className="w-full h-12 rounded-full text-sm font-bold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white transition-transform active:scale-95"
              onClick={() => setShowTitleField(true)}
            >
              + Add Title
            </Button>
          ) : (
            <Card className="rounded-[24px] shadow-sm border dark:border-slate-800 dark:bg-slate-900/50 overflow-hidden">
              <CardContent className="p-4 sm:p-6 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Label
                    htmlFor="content-custom-title"
                    className="text-sm font-bold text-slate-900 dark:text-slate-300"
                  >
                    Title
                  </Label>
                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveContentTitle(activeContentDetail)
                    }
                    className="text-[12px] font-bold text-slate-400 hover:text-red-500 transition-colors shrink-0"
                  >
                    Remove
                  </button>
                </div>
                <Input
                  id="content-custom-title"
                  value={activeContentTitle}
                  onChange={(e) =>
                    handleContentTitleChange(
                      activeContentDetail,
                      e.target.value,
                    )
                  }
                  placeholder={baseActiveContentDetail}
                  maxLength={30}
                  className="h-12 rounded-xl text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white"
                />
                <div className="flex justify-end">
                  <span className="text-[12px] font-medium text-slate-400 tabular-nums">
                    {activeContentTitle.length}/30
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </main>

        <div className="sticky bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-[#f8f9fb] dark:from-background via-[#f8f9fb]/95 dark:via-background/95 to-transparent px-4 pt-6">
          <div className="flex items-center gap-6 rounded-[24px] rounded-b-none border border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] backdrop-blur-md flex-wrap">
            <Button
              onClick={handleAddContentAction}
              className="w-full h-12 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white text-base sm:text-lg font-bold transition-transform active:scale-95"
            >
              {profileContentOrder.includes(activeContentDetail)
                ? "Save"
                : "Add"}
            </Button>
          </div>
        </div>

        <ProUpgradeDialog
          open={showUpgradePopup}
          onOpenChange={setShowUpgradePopup}
        />

        <Dialog
          open={showCountrySelector}
          onOpenChange={setShowCountrySelector}
        >
          <DialogContent className="max-w-[400px] p-0 border-none bg-white dark:bg-slate-900 rounded-t-[24px] rounded-b-none overflow-hidden shadow-2xl [&>button]:hidden">
            <DialogTitle className="sr-only">Select Country</DialogTitle>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-10 w-10 bg-slate-50 dark:bg-slate-800 transition-transform active:scale-95"
                  onClick={() => setShowCountrySelector(false)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-bold flex-1 text-center pr-10">
                  Select Country
                </h2>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for country code"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl dark:text-white dark:placeholder:text-slate-500"
                />
              </div>

              <div className="max-h-[400px] overflow-auto space-y-1 pr-1 custom-scrollbar">
                {filteredCountries.map((country, idx) => (
                  <button
                    key={`${country.name}-${idx}`}
                    onClick={() => handleCountrySelect(country)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                      selectedCountry.iso2 === country.iso2 &&
                        "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://flagcdn.com/w20/${country.iso2}.png`}
                        alt={country.name}
                        className="w-5 h-4"
                      />
                      {/* <span className="text-xl">{country.flag}</span> */}
                      <span className="text-sm font-bold dark:text-white">
                        {country.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium opacity-60 dark:text-slate-300">
                      {country.code}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  /**
   * One class string for every "Show more / Show less" control on the Add
   * Content screen, so all five sections stay identical. It is a full-width
   * pill that matches the tiles it sits under (same white surface, same
   * border, same radius family) - as a bare grey text link it read as a
   * caption rather than something tappable, and at 12px slate-400 it was
   * barely visible against the page.
   */
  const ShowMoreGridButton = ({
    expanded,
    onClick,
  }: {
    expanded: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="h-[90px] [@container(max-width:340px)]:h-[82px] [@container(min-width:600px)]:h-[100px] w-full flex items-center justify-center gap-1 text-[13px] [@container(max-width:340px)]:text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer select-none"
    >
      <span>{expanded ? "Show less" : "Show more"}</span>
      {expanded ? (
        <ChevronUp className="h-3.5 w-3.5" />
      ) : (
        <ChevronDown className="h-3.5 w-3.5" />
      )}
    </button>
  );

  /* ------------------------------------------------------------------
   * ADD CONTENT — card grid (new Content card design)
   *
   * The picker every content type is added from. Rules that keep it
   * consistent; break one and a single tile ends up out of line with
   * the rest of its row:
   *
   *   1. Tile         - fixed h-[90px], top-anchored with pt-3 and NO
   *                     justify-center, set once on <ContentItem>. Every
   *                     tile in every section uses that one component, so
   *                     nothing here sets its own height or padding.
   *                     Centring the tile's contents is what used to break
   *                     the row: a two-line label made the group taller and
   *                     slid that tile's icon upwards.
   *   2. Icon         - 36x36 (w-9 h-9) rounded-xl, brand colour via
   *                     `colorClass`. Never resized per section. Because
   *                     the tile is top-anchored it always lands at y=12.
   *   3. Label        - fixed h-[30px] box (two lines at leading-[15px])
   *                     that centres its own text. Two-line labels wrap
   *                     inside the box; one-line labels stay optically
   *                     centred instead of leaving dead space below.
   *   4. Badges       - instance count / premium crown, absolutely
   *                     positioned at -top-1.5 -right-1.5 so they never
   *                     affect layout.
   *   5. Grid         - `grid grid-cols-4 gap-2 px-1` in every section.
   *   6. Heading      - `px-1` to match the grid's left edge, `mt-8 mb-3`.
   *   7. Show more    - 4th column tile (`ShowMoreGridButton`) inline with the
   *                     first three items when collapsed, minimizing vertical space.
   *   8. Row layout   - a section with >3 items shows 3 tiles + "Show more"
   *                     in the 4th slot collapsed. Expanding reveals the
   *                     remaining items with "Show less" positioned at the end of the section.
   *   9. Radius       - four steps, nothing else:
   *                       rounded-full  pills and icon-only buttons
   *                       rounded-xl    controls - inputs, tiles, icon chips
   *                       rounded-[20px] groups - rows, field cards
   *                       rounded-[24px] surfaces - panels, sheets, headers
   *                     (`rounded-t-[24px]` where only the top is rounded.)
   *  10. Responsive   - tiles size against the GRID, via container queries,
   *                     never against the viewport. Do not add sm:/md: sizing
   *                     here. The form column is full width below md and then
   *                     HALVES at md, so tile width is not monotonic with
   *                     screen width - measured, it runs 56px at a 320px
   *                     screen, up to 164px at 767px, then back down to 70px
   *                     at 768px. A `sm:` rule would enlarge tiles at 640px
   *                     (already 132px) and keep them enlarged at 768px (now
   *                     70px), i.e. exactly backwards. Each section grid
   *                     carries [container-type:inline-size] and the tile has
   *                     three tiers: <=340px compact (82px/32px/11px),
   *                     default (90px/36px/12px), >=600px roomy
   *                     (100px/40px/13px). Browsers without container-query
   *                     support simply get the default tier.
   * ------------------------------------------------------------------ */
  if (isAddingContent) {
    return (
      <div
        ref={screenRootRef}
        className="flex flex-col min-h-screen bg-[#f8f9fb] dark:bg-transparent dark:border dark:border-slate-800 text-foreground pb-3 mt-4"
      >
        <header
          className={`${!isEditMode ? "sticky top-0 z-30" : " z-10"} bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm h-14 flex items-center px-4 lg:px-2 rounded-[24px]`}
        >
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-10 w-10 transition-transform active:scale-95"
            onClick={() => setIsAddingContent(false)}
          >
            <ArrowLeft className="h-5 w-5 dark:text-slate-300" />
          </Button>
          <h1 className="flex-1 text-center font-bold text-lg mr-10 dark:text-white">
            Add Content
          </h1>
        </header>

        {/* The detail screen renders its own copy. This screen is a separate
            return, so without one here a locked tile would set the state and
            nothing would appear - the tiles live on THIS screen. */}
        <ProUpgradeDialog
          open={showUpgradePopup}
          onOpenChange={setShowUpgradePopup}
        />

        <main className="pt-4 lg:p-4">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search content types"
              value={contentSearchQuery}
              onChange={(e) => setContentSearchQuery(e.target.value)}
              className="pl-11 h-12 bg-white dark:bg-slate-800 border-none shadow-sm rounded-xl focus-visible:ring-slate-200 dark:focus-visible:ring-slate-600 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          {shouldShowSection([
            "Phone",
            "Website",
            "Email",
            "Location",
            "LinkedIn",
            "Instagram",
          ]) && (
            <>
              <div className="text-[12px] font-bold text-muted-foreground tracking-wider px-1 uppercase mt-8 mb-3">
                Recommended Content
              </div>
              <div className="grid grid-cols-4 gap-2 px-1 [container-type:inline-size]">
                {matchesContentSearch("Phone") && (
                  <ContentItem
                    label="Phone"
                  />
                )}
                {matchesContentSearch("Website") && (
                  <ContentItem
                    label="Website"
                  />
                )}
                {matchesContentSearch("Email") && (
                  <ContentItem
                    label="Email"
                  />
                )}
                {matchesContentSearch("Address") && (
                  <ContentItem
                    label="Address"
                    maxInstances={1}
                  />
                )}
                {matchesContentSearch("LinkedIn") && (
                  <ContentItem
                    label="LinkedIn"
                  />
                )}
                {matchesContentSearch("Instagram") && (
                  <ContentItem
                    label="Instagram"
                  />
                )}
              </div>
            </>
          )}

          {shouldShowSection([
            "Website",
            "Email",
            "Phone",
            "WhatsApp",
            "Discord",
            "WeChat",
            "Telegram",
            "Signal",
            "Location",
          ]) && (
            <>
              <div className="text-[12px] font-bold text-muted-foreground tracking-wider px-1 uppercase mt-8 mb-3">
                Contact Info
              </div>
              <div className="grid grid-cols-4 gap-2 px-1 [container-type:inline-size]">
                {matchesContentSearch("Website") && (
                  <ContentItem
                    label="Website"
                  />
                )}
                {matchesContentSearch("Email") && (
                  <ContentItem
                    label="Email"
                  />
                )}
                {matchesContentSearch("Phone") && (
                  <ContentItem
                    label="Phone"
                  />
                )}
                {!showAllContactInfo && !normalizedContentSearchQuery && (
                  <ShowMoreGridButton
                    expanded={false}
                    onClick={() => setShowAllContactInfo(true)}
                  />
                )}

                {shouldShowExtendedItems(showAllContactInfo) && (
                  <>
                    {matchesContentSearch("Location") && (
                      <ContentItem
                        label="Location"
                      />
                    )}
                    {matchesContentSearch("WhatsApp") && (
                      <ContentItem
                        label="WhatsApp"
                      />
                    )}
                    {matchesContentSearch("Discord") && (
                      <ContentItem
                        label="Discord"
                      />
                    )}
                    {matchesContentSearch("WeChat") && (
                      <ContentItem
                        label="WeChat"
                      />
                    )}
                    {matchesContentSearch("Telegram") && (
                      <ContentItem
                        label="Telegram"
                      />
                    )}
                    {matchesContentSearch("Signal") && (
                      <ContentItem
                        label="Signal"
                      />
                    )}
                  </>
                )}

                {showAllContactInfo && !normalizedContentSearchQuery && (
                  <ShowMoreGridButton
                    expanded={true}
                    onClick={() => setShowAllContactInfo(false)}
                  />
                )}
              </div>
            </>
          )}

          {shouldShowSection([
            "About Me",
            "Custom Title",
            "Call-to-Action",
            "Direct Ads",
            "Calendly",
            "Google Calendar",
          ]) && (
            <>
              <div className="text-[12px] font-bold text-muted-foreground tracking-wider px-1 uppercase mt-8 mb-3">
                About & CTA
              </div>
              <div className="grid grid-cols-4 gap-2 px-1 [container-type:inline-size]">
                {matchesContentSearch("About Me") && (
                  <ContentItem
                    label="About Me"
                    maxInstances={1}
                  />
                )}
                {matchesContentSearch("Custom Title") && (
                  <ContentItem
                    label="Custom Title"
                    isPremium
                  />
                )}
                {matchesContentSearch("Call-to-Action") && (
                  <ContentItem
                    label="Call-to-Action"
                    isPremium
                  />
                )}
                {!showAllAboutCta && !normalizedContentSearchQuery && (
                  <ShowMoreGridButton
                    expanded={false}
                    onClick={() => setShowAllAboutCta(true)}
                  />
                )}

                {shouldShowExtendedItems(showAllAboutCta) && (
                  <>
                    {matchesContentSearch("Direct Ads") && (
                      <ContentItem
                        label="Direct Ads"
                        isPremium
                      />
                    )}
                    {matchesContentSearch("Calendly") && (
                      <ContentItem
                        label="Calendly"
                        maxInstances={1}
                      />
                    )}
                    {matchesContentSearch("Google Calendar") && (
                      <ContentItem
                        label="Google Calendar"
                        maxInstances={1}
                      />
                    )}
                  </>
                )}

                {showAllAboutCta && !normalizedContentSearchQuery && (
                  <ShowMoreGridButton
                    expanded={true}
                    onClick={() => setShowAllAboutCta(false)}
                  />
                )}
              </div>
            </>
          )}

          {shouldShowSection([
            "LinkedIn",
            "Instagram",
            "X",
            "Facebook",
            "YouTube",
            "TikTok",
            "Pinterest",
            "Vimeo",
            "Snapchat",
            "Twitch",
          ]) && (
            <>
              <div className="text-[12px] font-bold text-muted-foreground tracking-wider px-1 uppercase mt-8 mb-3">
                Social Links
              </div>
              <div className="grid grid-cols-4 gap-2 px-1 [container-type:inline-size]">
                {matchesContentSearch("LinkedIn") && (
                  <ContentItem
                    label="LinkedIn"
                  />
                )}
                {matchesContentSearch("Instagram") && (
                  <ContentItem
                    label="Instagram"
                  />
                )}
                {matchesContentSearch("X") && (
                  <ContentItem
                    label="X"
                  />
                )}
                {!showAllSocialLinks && !normalizedContentSearchQuery && (
                  <ShowMoreGridButton
                    expanded={false}
                    onClick={() => setShowAllSocialLinks(true)}
                  />
                )}

                {shouldShowExtendedItems(showAllSocialLinks) && (
                  <>
                    {matchesContentSearch("Facebook") && (
                      <ContentItem
                        label="Facebook"
                      />
                    )}
                    {matchesContentSearch("YouTube") && (
                      <ContentItem
                        label="YouTube"
                      />
                    )}
                    {matchesContentSearch("TikTok") && (
                      <ContentItem
                        label="TikTok"
                      />
                    )}
                    {matchesContentSearch("Pinterest") && (
                      <ContentItem
                        label="Pinterest"
                      />
                    )}
                    {matchesContentSearch("Vimeo") && (
                      <ContentItem
                        label="Vimeo"
                      />
                    )}
                    {matchesContentSearch("Snapchat") && (
                      <ContentItem
                        label="Snapchat"
                      />
                    )}
                    {matchesContentSearch("Twitch") && (
                      <ContentItem
                        label="Twitch"
                      />
                    )}
                  </>
                )}

                {showAllSocialLinks && !normalizedContentSearchQuery && (
                  <ShowMoreGridButton
                    expanded={true}
                    onClick={() => setShowAllSocialLinks(false)}
                  />
                )}
              </div>
            </>
          )}

          {shouldShowSection(["Divider", "Document", "Photos"]) && (
            <>
              <div className="text-[12px] font-bold text-muted-foreground tracking-wider px-1 uppercase mt-8 mb-3">
                Rich Content
              </div>
              <div className="grid grid-cols-4 gap-2 px-1 [container-type:inline-size]">
                {/* Same fills as the matching Profile Content rows in
                    getProfileContentMeta, so a tile and its row read as the
                    same item. These were white-on-border, the only tiles in the
                    grid without a solid chip. */}
                {/* One divider per card. The card draws a single rule above
                    About Me, so a second divider would have nowhere to go. */}
                {matchesContentSearch("Divider") && (
                  <ContentItem
                    label="Divider"
                    maxInstances={1}
                  />
                )}
                {matchesContentSearch("Document") && (
                  <ContentItem
                    label="Document"
                    isPremium
                  />
                )}
                {matchesContentSearch("Photos") && (
                  <ContentItem
                    label="Photos"
                    isPremium
                  />
                )}
              </div>
            </>
          )}

          {shouldShowSection([
            "Notion",
            "Google Drive",
            "Booksy",
          ]) && (
            <>
              <div className="text-[12px] font-bold text-muted-foreground tracking-wider px-1 uppercase mt-8 mb-3">
                Productivity Links
              </div>
              <div className="grid grid-cols-4 gap-2 px-1 [container-type:inline-size]">
                {matchesContentSearch("Notion") && (
                  <ContentItem
                    label="Notion"
                  />
                )}
                {matchesContentSearch("Google Drive") && (
                  <ContentItem
                    label="Google Drive"
                  />
                )}
                {matchesContentSearch("Booksy") && (
                  <ContentItem
                    label="Booksy"
                  />
                )}
              </div>
            </>
          )}

          {shouldShowSection(["Google Reviews", "Yelp", "Etsy"]) && (
            <>
              <div className="text-[12px] font-bold text-muted-foreground tracking-wider px-1 uppercase mt-8 mb-3">
                Business &amp; Reviews
              </div>
              <div className="grid grid-cols-4 gap-2 px-1 [container-type:inline-size]">
                {matchesContentSearch("Google Reviews") && (
                  <ContentItem
                    label="Google Reviews"
                  />
                )}
                {matchesContentSearch("Yelp") && (
                  <ContentItem
                    label="Yelp"
                  />
                )}
                {matchesContentSearch("Etsy") && (
                  <ContentItem
                    label="Etsy"
                  />
                )}
              </div>
            </>
          )}

          {shouldShowSection(["Venmo", "CashApp", "Zelle", "PayPal"]) && (
            <>
              <div className="text-[12px] font-bold text-muted-foreground tracking-wider px-1 uppercase mt-8 mb-3">
                Payment Links
              </div>
              <div className="grid grid-cols-4 gap-2 px-1 [container-type:inline-size]">
                {matchesContentSearch("Venmo") && (
                  <ContentItem
                    label="Venmo"
                  />
                )}
                {matchesContentSearch("CashApp") && (
                  <ContentItem
                    label="CashApp"
                  />
                )}
                {matchesContentSearch("Zelle") && (
                  <ContentItem
                    label="Zelle"
                  />
                )}
                {!showAllPaymentLinks && !normalizedContentSearchQuery && (
                  <ShowMoreGridButton
                    expanded={false}
                    onClick={() => setShowAllPaymentLinks(true)}
                  />
                )}

                {shouldShowExtendedItems(showAllPaymentLinks) && (
                  <>
                    {matchesContentSearch("PayPal") && (
                      <ContentItem
                        label="PayPal"
                      />
                    )}
                  </>
                )}

                {showAllPaymentLinks && !normalizedContentSearchQuery && (
                  <ShowMoreGridButton
                    expanded={true}
                    onClick={() => setShowAllPaymentLinks(false)}
                  />
                )}
              </div>
            </>
          )}

          {shouldShowSection([
            "Spotify",
            "SoundCloud",
            "Apple Music",
            "iTunes",
            "Tidal",
            "Bandcamp",
          ]) && (
            <>
              <div className="text-[12px] font-bold text-muted-foreground tracking-wider px-1 uppercase mt-8 mb-3">
                Music Links
              </div>
              <div className="grid grid-cols-4 gap-2 px-1 [container-type:inline-size]">
                {matchesContentSearch("Spotify") && (
                  <ContentItem
                    label="Spotify"
                  />
                )}
                {matchesContentSearch("SoundCloud") && (
                  <ContentItem
                    label="SoundCloud"
                  />
                )}
                {matchesContentSearch("Apple Music") && (
                  <ContentItem
                    label="Apple Music"
                  />
                )}
                {!showAllMusicLinks && !normalizedContentSearchQuery && (
                  <ShowMoreGridButton
                    expanded={false}
                    onClick={() => setShowAllMusicLinks(true)}
                  />
                )}

                {shouldShowExtendedItems(showAllMusicLinks) && (
                  <>
                    {matchesContentSearch("iTunes") && (
                      <ContentItem
                        label="iTunes"
                      />
                    )}
                    {matchesContentSearch("Tidal") && (
                      <ContentItem
                        label="Tidal"
                      />
                    )}
                    {matchesContentSearch("Bandcamp") && (
                      <ContentItem
                        label="Bandcamp"
                      />
                    )}
                  </>
                )}

                {showAllMusicLinks && !normalizedContentSearchQuery && (
                  <ShowMoreGridButton
                    expanded={true}
                    onClick={() => setShowAllMusicLinks(false)}
                  />
                )}
              </div>
            </>
          )}

          {normalizedContentSearchQuery &&
            !shouldShowSection([
              "Phone",
              "Website",
              "Email",
              "Location",
              "LinkedIn",
              "Instagram",
              "Address",
              "WhatsApp",
              "Discord",
              "WeChat",
              "Telegram",
              "Signal",
              "About Me",
              "Custom Title",
              "Call-to-Action",
              "Direct Ads",
              "Facebook",
              "YouTube",
              "TikTok",
              "Pinterest",
              "Vimeo",
              "Snapchat",
              "Twitch",
              "Divider",
              "Document",
              "Photos",
              "Calendly",
              "Google Calendar",
              "Notion",
              "Google Drive",
              "Yelp",
              "Google Reviews",
              "Etsy",
              "Booksy",
              "Venmo",
              "CashApp",
              "Zelle",
              "PayPal",
              "Spotify",
              "SoundCloud",
              "Apple Music",
              "iTunes",
              "Tidal",
              "Bandcamp",
            ]) && (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm font-medium text-slate-400">
                No content types found for "{contentSearchQuery.trim()}"
              </div>
            )}
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 hidden">
        <p className="text-sm text-muted-foreground mb-6">
          Add your social media profiles to help people connect with you. (Max
          4)
        </p>

        <div className="space-y-4">
          {warning && (
            <div className="p-3 bg-red-100 text-red-700 rounded">{warning}</div>
          )}

          {socialPlatforms.map(({ key, label, placeholder }) => {
            // Same table as every other surface. "Twitter/X" is this list's own
            // spelling of the card's "X".
            const { Icon } = getContentIcon(
              label === "Twitter/X" ? "X" : label,
            );
            return (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Label>

              <Input
                id={key}
                type="text"
                placeholder={placeholder}
                value={card.social[key as keyof typeof card.social] || ""}
                onFocus={() => handleFocus(key)}
                onBlur={() => handleBlur(key)}
                onChange={(e) => handleInputChange(key, e.target.value)}
                className={isLocked(key) ? "bg-card cursor-not-allowed" : ""}
              />
            </div>
            );
          })}
        </div>
        <UpgradeModal
          isOpen={showWarning}
          onClose={() => setShowWarning(false)}
        />
      </div>

      <div ref={screenRootRef} className="space-y-4 mt-4 mb-2">
        <div className="px-4">
          <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
            PROFILE CONTENT
          </span>
        </div>

        <div className="space-y-2">
          {topContent.map((item) => (
            <ProfileContentRow
              key={item.id}
              id={item.id}
              icon={item.icon}
              label={item.label}
              value={item.value}
              iconStyle={item.iconStyle}
              isDraggable={false}
              onEdit={() => handleEditProfileContent(item.rawLabel)}
              onRemove={() => {
                pendingScrollRestore.current = readScrollTop(
                  getScrollHost(screenRootRef.current),
                );
                handleRemoveProfileContent(item.rawLabel);
              }}
            />
          ))}

          {middleContent.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={middleContent.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {middleContent.map((item) => (
                    <ProfileContentRow
                      key={item.id}
                      id={item.id}
                      icon={item.icon}
                      label={item.label}
                      value={item.value}
                      iconStyle={item.iconStyle}
                      isDraggable={true}
                      onEdit={() => handleEditProfileContent(item.rawLabel)}
                      onRemove={() => {
                        pendingScrollRestore.current = readScrollTop(
                          getScrollHost(screenRootRef.current),
                        );
                        handleRemoveProfileContent(item.rawLabel);
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {bottomContent.map((item) => (
            <ProfileContentRow
              key={item.id}
              id={item.id}
              icon={item.icon}
              label={item.label}
              value={item.value}
              iconStyle={item.iconStyle}
              isDraggable={false}
              onEdit={
                item.rawLabel === "Divider"
                  ? undefined
                  : () => handleEditProfileContent(item.rawLabel)
              }
              onRemove={() => {
                pendingScrollRestore.current = readScrollTop(
                  getScrollHost(screenRootRef.current),
                );
                handleRemoveProfileContent(item.rawLabel);
              }}
            />
          ))}
        </div>

        <Button
          variant="outline"
          className="w-full h-14 rounded-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white shadow-sm mt-2 transition-transform active:scale-95"
          onClick={() => setIsAddingContent(true)}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Content
        </Button>
      </div>
    </>
  );
}
