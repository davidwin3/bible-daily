/**
 * Google Analytics 추적을 위한 React 훅
 */

import { useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { analytics, type GAEventParams } from "../lib/analytics";

/**
 * 페이지뷰 자동 추적 훅
 */
export function usePageViewTracking(): void {
  const location = useLocation();

  useEffect(() => {
    // 페이지 변경 시 자동으로 페이지뷰 추적
    analytics.trackPageView({
      page_path: location.pathname + location.search,
      page_location: window.location.href,
    });
  }, [location]);
}

/**
 * 이벤트 추적 훅
 */
export function useEventTracking() {
  const trackEvent = useCallback(
    (eventName: string, params?: GAEventParams) => {
      analytics.trackEvent(eventName, params);
    },
    []
  );

  const trackButtonClick = useCallback(
    (buttonName: string, params?: GAEventParams) => {
      analytics.trackButtonClick(buttonName, params);
    },
    []
  );

  const trackFormSubmit = useCallback(
    (formName: string, params?: GAEventParams) => {
      analytics.trackFormSubmit(formName, params);
    },
    []
  );

  const trackSearch = useCallback(
    (searchTerm: string, params?: GAEventParams) => {
      analytics.trackSearch(searchTerm, params);
    },
    []
  );

  const trackEngagement = useCallback(
    (engagementType: string, params?: GAEventParams) => {
      analytics.trackEngagement(engagementType, params);
    },
    []
  );

  const trackError = useCallback(
    (errorMessage: string, params?: GAEventParams) => {
      analytics.trackError(errorMessage, params);
    },
    []
  );

  return {
    trackEvent,
    trackButtonClick,
    trackFormSubmit,
    trackSearch,
    trackEngagement,
    trackError,
  };
}

/**
 * 버튼 클릭 추적을 위한 편의 훅
 */
export function useButtonTracking() {
  const { trackButtonClick } = useEventTracking();

  const createClickHandler = useCallback(
    (
      buttonName: string,
      originalHandler?: () => void,
      params?: GAEventParams
    ) => {
      return () => {
        trackButtonClick(buttonName, params);
        originalHandler?.();
      };
    },
    [trackButtonClick]
  );

  return { createClickHandler, trackButtonClick };
}

/**
 * 폼 추적을 위한 편의 훅
 */
export function useFormTracking() {
  const { trackFormSubmit, trackError } = useEventTracking();

  const createSubmitHandler = useCallback(
    (
      formName: string,
      originalHandler?: () => void,
      params?: GAEventParams
    ) => {
      return () => {
        try {
          trackFormSubmit(formName, params);
          originalHandler?.();
        } catch (error) {
          trackError(`Form submission error: ${formName}`, {
            event_category: "form_error",
            custom_parameters: { form_name: formName },
          });
          throw error;
        }
      };
    },
    [trackFormSubmit, trackError]
  );

  return { createSubmitHandler, trackFormSubmit };
}

/**
 * 스크롤 추적 훅
 */
export function useScrollTracking(threshold: number = 75) {
  const { trackEngagement } = useEventTracking();

  useEffect(() => {
    let hasTracked = false;

    const handleScroll = () => {
      if (hasTracked) return;

      const scrollPercent = Math.round(
        (window.scrollY /
          (document.documentElement.scrollHeight - window.innerHeight)) *
          100
      );

      if (scrollPercent >= threshold) {
        trackEngagement("scroll", {
          event_category: "scroll_tracking",
          value: scrollPercent,
          custom_parameters: { scroll_depth: scrollPercent },
        });
        hasTracked = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold, trackEngagement]);
}

/**
 * 시간 기반 참여도 추적 훅
 */
export function useTimeTracking(intervals: number[] = [30, 60, 120, 300]) {
  const { trackEngagement } = useEventTracking();

  useEffect(() => {
    const trackedIntervals = new Set<number>();
    const startTime = Date.now();

    const checkTimeSpent = () => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      intervals.forEach((interval) => {
        if (timeSpent >= interval && !trackedIntervals.has(interval)) {
          trackEngagement("time_on_page", {
            event_category: "engagement_time",
            value: interval,
            custom_parameters: { time_spent_seconds: interval },
          });
          trackedIntervals.add(interval);
        }
      });
    };

    const intervalId = setInterval(checkTimeSpent, 5000); // 5초마다 체크
    return () => clearInterval(intervalId);
  }, [intervals, trackEngagement]);
}

/**
 * 사용자 상호작용 추적 훅 (클릭, 키보드 등)
 */
export function useInteractionTracking() {
  const { trackEngagement } = useEventTracking();

  useEffect(() => {
    let interactionCount = 0;
    const maxInteractions = 10; // 최대 10개까지만 추적

    const handleInteraction = (type: string) => {
      if (interactionCount >= maxInteractions) return;

      trackEngagement("user_interaction", {
        event_category: "interaction",
        event_label: type,
        value: ++interactionCount,
      });
    };

    const handleClick = () => handleInteraction("click");
    const handleKeydown = () => handleInteraction("keydown");

    document.addEventListener("click", handleClick, { passive: true });
    document.addEventListener("keydown", handleKeydown, { passive: true });

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [trackEngagement]);
}
