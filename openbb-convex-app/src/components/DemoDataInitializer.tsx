"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function DemoDataInitializer() {
  const initializeDemoData = useMutation(api.watchlists.initializeDemoData);

  useEffect(() => {
    // Initialize demo data when the app loads
    const initData = async () => {
      try {
        await initializeDemoData({});
        console.log("Demo data initialization completed");
      } catch (error) {
        console.log("Demo data initialization failed or already exists:", error);
      }
    };

    initData();
  }, [initializeDemoData]);

  return null; // This component doesn't render anything
}