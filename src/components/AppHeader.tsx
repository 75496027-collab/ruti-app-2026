import { Link, useRouter, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bus } from "lucide-react";

export function AppHeader({ title, back = true }: { title: string; back?: boolean }) {
  const router = useRouter();
  const navigate = useNavigate();

  const handleBack = () => {
    const canGoBack =
      typeof window !== "undefined" &&
      window.history.length > 1 &&
      document.referrer !== "" &&
      !document.referrer.endsWith(window.location.href);

    if (canGoBack) {
      router.history.back();
    } else {
      navigate({ to: "/" });
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-border">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center gap-3">
        {back ? (
          <button
            onClick={handleBack}
            type="button"
            className="w-9 h-9 rounded-full hover:bg-secondary flex items-center justify-center transition-[var(--transition-smooth)] cursor-pointer"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        ) : (
          <Link to="/" className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Bus className="w-5 h-5 text-primary" />
          </Link>
        )}
        <h1 className="font-semibold text-foreground text-base">{title}</h1>
      </div>
    </header>
  );
}