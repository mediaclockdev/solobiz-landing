import { auth } from "@/services/firebase";

export const getMainAppUrl = (): string => {
  const url =
    process.env.NEXT_PUBLIC_MAIN_APP_URL ||
    process.env.NEXT_PUBLIC_MAIN_URL ||
    "https://solobizcard-rho.vercel.app";
  return url.replace(/\/$/, "");
};

export const handleLoginSuccess = async (
  uid: string,
  redirectPath = "/dashboard/settings?tab=my-accessories",
) => {
  try {
    // 1. Get the custom SSO token from our API route
    const res = await fetch("/api/auth/generate-sso-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    });
    const data = await res.json();
    if (!res.ok || !data.token) {
      throw new Error(data.error || "Failed to generate session token");
    }
    // 2. Build redirect URL to the Main App
    const mainAppUrl = getMainAppUrl();
    const targetUrl = new URL("/auth/sso", mainAppUrl);
    targetUrl.searchParams.set("token", data.token);
    if (redirectPath) {
      targetUrl.searchParams.set("redirect", redirectPath);
    }
    // 3. Redirect the browser to the Main App
    window.location.href = targetUrl.toString();
  } catch (err: any) {
    console.error("SSO Redirect Failed:", err);
    // Fallback to direct navigation
    const mainAppUrl = getMainAppUrl();
    const safePath = redirectPath.startsWith("/")
      ? redirectPath
      : `/${redirectPath}`;
    window.location.href = `${mainAppUrl}${safePath}`;
  }
};

export const redirectToMainAppSSO = async (options?: {
  uid?: string;
  redirectPath?: string;
}) => {
  const user = auth.currentUser;
  const uid = options?.uid || user?.uid;
  if (!uid) {
    const mainAppUrl = getMainAppUrl();
    const path =
      options?.redirectPath || "/dashboard/settings?tab=my-accessories";
    window.location.href = `${mainAppUrl}${path}`;
    return;
  }
  await handleLoginSuccess(uid, options?.redirectPath);
};
