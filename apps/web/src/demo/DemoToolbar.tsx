import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAppSettings } from "../contexts/AppSettingsContext";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../shared/ui/button";
import { ConfirmActionDialog } from "../shared/ui/confirm-action-dialog";
import { AUTH_ADMIN_ACCESS_HINT_KEY, AUTH_GUEST_KEY, AUTH_LEGACY_KEYS, AUTH_LOGOUT_KEY, AUTH_SESSION_HINT_KEY } from "../shared/constants/authStorageKeys";
import { serverQueryClient } from "../shared/query/queryClient";
import { demoRequest } from "./api";
import { hasPersistentStorage } from "./store";
import "./demo.css";

export default function DemoToolbar() {
  const { language, toggleLanguage, darkMode, setDarkMode } = useAppSettings();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const readOnly = /^\/admin\/(categories|roles|locations|banners|settings)(\/|$)/.test(pathname);
  const ar = language === "ar";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const toolbar = useRef<HTMLElement>(null);
  useEffect(() => {
    document.body.classList.add("demo-mode");
    const observer = new ResizeObserver(() => {
      document.documentElement.style.setProperty("--demo-toolbar-height", `${toolbar.current?.offsetHeight ?? 0}px`);
    });
    if (toolbar.current) observer.observe(toolbar.current);
    return () => { observer.disconnect(); document.body.classList.remove("demo-mode"); document.documentElement.style.removeProperty("--demo-toolbar-height"); };
  }, []);

  async function clearSessionCaches() {
    await serverQueryClient.cancelQueries(); serverQueryClient.clear();
    try {
      for (const key of [AUTH_GUEST_KEY, AUTH_LOGOUT_KEY, AUTH_SESSION_HINT_KEY, AUTH_ADMIN_ACCESS_HINT_KEY, ...AUTH_LEGACY_KEYS, "tijarahjo_favorites"]) localStorage.removeItem(key);
      sessionStorage.removeItem("tijarahjo_compare_items");
      sessionStorage.removeItem("tijarahjo_public_system_status_v1");
    } catch { /* In-memory demo remains accessible with blocked storage. */ }
  }
  async function selectAccount(persona: string) {
    setBusy(true); setError("");
    const response = await demoRequest("/auth/login", { method: "POST", body: JSON.stringify({ Login: `${persona}@demo.example`, Password: "Demo123!" }) });
    if (!response.success) { setError(response.error.message); setBusy(false); return; }
    if (!hasPersistentStorage()) { setError(ar ? "اسمح بتخزين بيانات الموقع لتبديل الحسابات." : "Allow browser site storage to switch demo accounts."); setBusy(false); return; }
    await clearSessionCaches();
    try {
      localStorage.setItem(AUTH_SESSION_HINT_KEY, "true");
      if (persona === "admin") localStorage.setItem(AUTH_ADMIN_ACCESS_HINT_KEY, "true");
    } catch { /* Auth restoration will use the demo session. */ }
    window.location.assign(persona === "admin" ? "/admin" : persona === "seller" ? "/profile" : "/");
  }
  async function reset() {
    setBusy(true);
    await clearSessionCaches();
    const response = await demoRequest("/demo/reset", { method: "POST" });
    if (!response.success) { setError(response.error.message); setBusy(false); return; }
    window.location.assign("/");
  }
  return <>
    <section ref={toolbar} className="demo-toolbar border-b border-border bg-card text-card-foreground" aria-label={ar ? "أدوات العرض التجريبي" : "Demo toolbar"}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
        <div className="text-xs">
          <strong className="text-primary">{ar ? "عرض تجريبي" : "Portfolio demo"}</strong>
          <span className="ms-2 text-muted-foreground">{ar ? "بيانات وهمية · محفوظة على متصفحك فقط" : "Sample data · changes stay in your browser"}</span>
          {user ? <span className="ms-2 font-medium">{user.name}</span> : null}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {([['buyer', 'Buyer', 'مشتري'], ['seller', 'Seller', 'بائع'], ['admin', 'Admin', 'مدير']] as const).map(([key, en, arabic]) =>
            <Button key={key} size="sm" variant="outline" disabled={busy} onClick={() => void selectAccount(key)}>{ar ? `جرّب كـ${arabic}` : `Try as ${en}`}</Button>)}
          <Button size="sm" variant="ghost" onClick={toggleLanguage}>{ar ? "English" : "العربية"}</Button>
          <Button size="sm" variant="ghost" onClick={() => setDarkMode(!darkMode)}>{darkMode ? (ar ? "فاتح" : "Light") : (ar ? "داكن" : "Dark")}</Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirmReset(true)}>{ar ? "إعادة ضبط" : "Reset demo"}</Button>
        </div>
      </div>
      {error ? <p role="alert" className="px-4 pb-2 text-sm text-destructive">{error}</p> : null}
      {readOnly ? <p className="px-4 pb-2 text-xs text-muted-foreground">{ar ? "هذه الإعدادات للعرض فقط. جرّب إدارة الإعلانات والمستخدمين والبلاغات." : "This section is read-only in the demo. Try moderating listings, users, and reports."}</p> : null}
    </section>
    <ConfirmActionDialog open={confirmReset} onOpenChange={setConfirmReset}
      title={ar ? "إعادة ضبط العرض؟" : "Reset the demo?"}
      description={ar ? "سيتم حذف تغييراتك المحلية واستعادة البيانات التجريبية." : "This clears your local changes and uploaded images, and restores the original sample data."}
      confirmLabel={ar ? "إعادة ضبط" : "Reset demo"} cancelLabel={ar ? "إلغاء" : "Cancel"} onConfirm={() => void reset()} />
  </>;
}
