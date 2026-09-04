"use client";

import { useEffect, useRef } from "react";
import { trackProfileView, type ProfileContext } from "@/lib/analytics";

/**
 * Fires exactly one `profile_view` for the profile currently on screen.
 * Renders nothing — it exists only because the profile page itself is a
 * server component and cannot hold an effect.
 *
 * The guard is keyed on the profile id rather than being a bare "already
 * ran" flag, because this component legitimately needs to fire again for a
 * *different* profile: a client-side navigation between two profile pages
 * can reuse the same mounted instance. Keying on the id also absorbs
 * React Strict Mode's double effect invocation in development, which would
 * otherwise double-count every view while testing.
 */
export function ProfileViewTracker({
  profileId,
  profile,
  profileName,
  country,
  district,
  locale,
}: ProfileContext) {
  const trackedProfileId = useRef<string | null>(null);

  useEffect(() => {
    if (trackedProfileId.current === profileId) return;
    trackedProfileId.current = profileId;
    trackProfileView({ profileId, profile, profileName, country, district, locale });
  }, [profileId, profile, profileName, country, district, locale]);

  return null;
}
