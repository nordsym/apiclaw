'use client';

import { useEffect, type ReactNode } from 'react';
import posthog from 'posthog-js';

type PostHogProviderProps = {
  children: ReactNode;
};

let initialized = false;

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || initialized) return;

    posthog.init(key, {
      api_host: '/ingest',
      capture_pageview: false,
      capture_pageleave: true,
      disable_session_recording: false,
    });

    initialized = true;
  }, []);

  return <>{children}</>;
}
