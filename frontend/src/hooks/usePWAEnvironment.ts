import { useState, useEffect } from "react";
import { getBrowserEnvironment } from "@/lib/pwa";

interface PWAEnvironmentState {
  isPWA: boolean;
  isStandalone: boolean;
  isInstallable: boolean;
  isLoading: boolean;
}

/**
 * PWA 환경을 감지하는 훅
 */
export const usePWAEnvironment = () => {
  const [state, setState] = useState<PWAEnvironmentState>({
    isPWA: false,
    isStandalone: false,
    isInstallable: false,
    isLoading: true,
  });

  useEffect(() => {
    const environment = getBrowserEnvironment();

    setState({
      isPWA: environment.isPWA,
      isStandalone: environment.isStandalone,
      isInstallable: environment.isInstallable,
      isLoading: false,
    });
  }, []);

  return state;
};
