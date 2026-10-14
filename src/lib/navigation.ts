"use client";

import {
  useRouter,
  usePathname,
  useParams as useNextParams,
  useSearchParams as useNextSearchParams,
} from "next/navigation";

// Next.js navigation hooks that mimic React Router behavior
export function useNavigate() {
  const router = useRouter();

  return (path: string) => {
    router.push(path);
  };
}

export function useLocation() {
  const pathname = usePathname();

  return {
    pathname,
    search: "",
    hash: "",
    state: null,
    key: "",
  };
}

export function useParams() {
  return useNextParams();
}

export function useSearchParams() {
  const searchParams = useNextSearchParams();
  const router = useRouter();

  return [
    searchParams,
    (newParams: URLSearchParams | Record<string, string>) => {
      const params = new URLSearchParams(newParams);
      if (typeof window !== "undefined") {
        const url = `${window.location.pathname}?${params.toString()}`;
        router.push(url);
      }
    },
  ] as const;
}
