"use client";
import { useEffect, useRef } from "react";

export default function AutoRefreshClient() {
  const currentVersion = useRef<string | null>(null);

  useEffect(() => {
    // Fetch the current version on load
    fetch('/version.json')
      .then(res => res.json())
      .then(data => {
        currentVersion.current = data.version;
      });

    // Function to check for a new version
    const checkVersion = () => {
      fetch('/version.json')
        .then(res => res.json())
        .then(data => {
          if (currentVersion.current && data.version !== currentVersion.current) {
            window.location.reload();
          }
        });
    };

    // Check every 60 seconds and on window focus
    const interval = setInterval(checkVersion, 60 * 1000);
    window.addEventListener('focus', checkVersion);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkVersion);
    };
  }, []);

  return null;
}