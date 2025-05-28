"use client";
import { useEffect } from "react";

export default function AutoRefreshClient() {
  useEffect(() => {
    let currentVersion: string | null = null;
    // Fetch the current version on load
    fetch('/version.json')
      .then(res => res.json())
      .then(data => {
        currentVersion = data.version;
      });
    // Function to check for a new version
    const checkVersion = () => {
      fetch('/version.json')
        .then(res => res.json())
        .then(data => {
          if (currentVersion && data.version !== currentVersion) {
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