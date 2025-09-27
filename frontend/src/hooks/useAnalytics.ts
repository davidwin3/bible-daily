/**
 * Google Analytics 추적을 위한 React 훅
 */

import { useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { analytics, type GAEventParams } from "../lib/analytics";
import {
  GA_EVENT_CATEGORIES,
  GA_ENGAGEMENT_TYPES,
  GA_INTERACTION_TYPES,
  GA_DEFAULTS,
  GA_SCROLL_THRESHOLDS,
  GA_TIME_INTERVALS,
} from "../constants/analytics";

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
            event_category: GA_EVENT_CATEGORIES.FORM_ERROR,
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
export function useScrollTracking(
  threshold: number = GA_SCROLL_THRESHOLDS.DEFAULT
) {
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
        trackEngagement(GA_ENGAGEMENT_TYPES.SCROLL, {
          event_category: GA_EVENT_CATEGORIES.SCROLL_TRACKING,
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
export function useTimeTracking(
  intervals: readonly number[] = GA_TIME_INTERVALS.DEFAULT
) {
  const { trackEngagement } = useEventTracking();

  useEffect(() => {
    const trackedIntervals = new Set<number>();
    const startTime = Date.now();

    const checkTimeSpent = () => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      intervals.forEach((interval) => {
        if (timeSpent >= interval && !trackedIntervals.has(interval)) {
          trackEngagement(GA_ENGAGEMENT_TYPES.TIME_ON_PAGE, {
            event_category: GA_EVENT_CATEGORIES.ENGAGEMENT_TIME,
            value: interval,
            custom_parameters: { time_spent_seconds: interval },
          });
          trackedIntervals.add(interval);
        }
      });
    };

    const intervalId = setInterval(
      checkTimeSpent,
      GA_DEFAULTS.SCROLL_CHECK_INTERVAL
    ); // 5초마다 체크
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
    const maxInteractions = GA_DEFAULTS.MAX_INTERACTIONS; // 최대 10개까지만 추적

    const handleInteraction = (type: string) => {
      if (interactionCount >= maxInteractions) return;

      trackEngagement(GA_ENGAGEMENT_TYPES.USER_INTERACTION, {
        event_category: GA_EVENT_CATEGORIES.INTERACTION,
        event_label: type,
        value: ++interactionCount,
      });
    };

    const handleClick = () => handleInteraction(GA_INTERACTION_TYPES.CLICK);
    const handleKeydown = () => handleInteraction(GA_INTERACTION_TYPES.KEYDOWN);

    document.addEventListener("click", handleClick, { passive: true });
    document.addEventListener("keydown", handleKeydown, { passive: true });

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [trackEngagement]);
}
