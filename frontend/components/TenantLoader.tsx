"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { setTenantSlug } from "../lib/tenant";

export default function TenantLoader() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const slug = searchParams.get("slug");

    if (slug) {
      setTenantSlug(slug);
    }
  }, [searchParams]);

  return null;
}
