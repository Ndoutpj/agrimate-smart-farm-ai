import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ImageIcon } from "lucide-react";

export function ListingImage({
  path,
  alt,
  className = "h-40 w-full rounded-lg object-cover bg-muted",
}: {
  path: string | null;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!path) {
      setUrl(null);
      return;
    }
    supabase.storage
      .from("listings")
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (!cancelled) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!path || !url) {
    return (
      <div className={`${className} flex items-center justify-center text-muted-foreground`}>
        <ImageIcon className="h-8 w-8" />
      </div>
    );
  }
  return <img src={url} alt={alt} className={className} loading="lazy" />;
}
