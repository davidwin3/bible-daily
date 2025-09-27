/**
 * Google Analytics 4 로깅 유틸리티
 * 페이지뷰, 이벤트 추적을 위한 재사용 가능한 함수들
 */

// Google Analytics 타입 정의
declare global {
  interface Window {
    gtag: (
      command: "config" | "event" | "js" | "set",
      targetId: string | Date | object,
      config?: object
    ) => void;
    dataLayer: unknown[];
  }
}

export interface GAEventParams {
  event_category?: string;
  event_label?: string;
  value?: number;
  search_term?: string;
  description?: string;
  fatal?: boolean;
  custom_parameters?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface GAPageViewParams {
  page_title?: string;
  page_location?: string;
  page_path?: string;
  custom_parameters?: Record<string, unknown>;
}

class AnalyticsLogger {
  private measurementId: string | null = null;
  private isDevelopment = false;

  constructor() {
    this.measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || null;
    this.isDevelopment = import.meta.env.DEV;

    if (this.isDevelopment && this.measurementId) {
      console.log("Google Analytics configured with ID:", this.measurementId);
    }
  }

  /**
   * gtag 로드 상태 확인
   */
  private waitForGtag(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window.gtag === "function") {
        resolve();
        return;
      }

      // gtag가 로드될 때까지 최대 5초 대기
      let attempts = 0;
      const maxAttempts = 50; // 100ms * 50 = 5초

      const checkGtag = () => {
        if (typeof window.gtag === "function" || attempts >= maxAttempts) {
          resolve();
          return;
        }
        attempts++;
        setTimeout(checkGtag, 100);
      };

      checkGtag();
    });
  }

  /**
   * 페이지뷰 추적
   */
  async trackPageView(params: GAPageViewParams = {}): Promise<void> {
    if (!this.canTrack()) return;

    await this.waitForGtag();

    const pageViewData = {
      page_title: params.page_title || document.title,
      page_location: params.page_location || window.location.href,
      page_path: params.page_path || window.location.pathname,
      ...params.custom_parameters,
    };

    if (typeof window.gtag === "function") {
      window.gtag("event", "page_view", pageViewData);
    }

    if (this.isDevelopment) {
      console.log("GA Page View:", pageViewData);
    }
  }

  /**
   * 커스텀 이벤트 추적
   */
  async trackEvent(
    eventName: string,
    params: GAEventParams = {}
  ): Promise<void> {
    if (!this.canTrack()) return;

    await this.waitForGtag();

    const eventData = {
      event_category: params.event_category || "engagement",
      event_label: params.event_label,
      value: params.value,
      ...params.custom_parameters,
    };

    // undefined 값 제거
    Object.keys(eventData).forEach((key) => {
      if (eventData[key as keyof typeof eventData] === undefined) {
        delete eventData[key as keyof typeof eventData];
      }
    });

    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, eventData);
    }

    if (this.isDevelopment) {
      console.log("GA Event:", eventName, eventData);
    }
  }

  /**
   * 버튼 클릭 이벤트 추적
   */
  trackButtonClick(
    buttonName: string,
    params: GAEventParams = {}
  ): Promise<void> {
    return this.trackEvent("click", {
      event_category: "button",
      event_label: buttonName,
      ...params,
    });
  }

  /**
   * 폼 제출 이벤트 추적
   */
  trackFormSubmit(formName: string, params: GAEventParams = {}): Promise<void> {
    return this.trackEvent("form_submit", {
      event_category: "form",
      event_label: formName,
      ...params,
    });
  }

  /**
   * 검색 이벤트 추적
   */
  trackSearch(searchTerm: string, params: GAEventParams = {}): Promise<void> {
    return this.trackEvent("search", {
      event_category: "search",
      event_label: searchTerm,
      search_term: searchTerm,
      ...params,
    });
  }

  /**
   * 사용자 참여 이벤트 추적 (스크롤, 시간 등)
   */
  trackEngagement(
    engagementType: string,
    params: GAEventParams = {}
  ): Promise<void> {
    return this.trackEvent("engagement", {
      event_category: "user_engagement",
      event_label: engagementType,
      ...params,
    });
  }

  /**
   * 오류 이벤트 추적
   */
  trackError(errorMessage: string, params: GAEventParams = {}): Promise<void> {
    return this.trackEvent("exception", {
      event_category: "error",
      event_label: errorMessage,
      description: errorMessage,
      fatal: false,
      ...params,
    });
  }

  /**
   * 추적 가능 여부 확인
   */
  private canTrack(): boolean {
    if (this.isDevelopment) {
      return true; // 개발 환경에서는 콘솔 로그만 출력
    }

    return !!this.measurementId;
  }

  /**
   * 사용자 속성 설정
   */
  async setUserProperty(propertyName: string, value: string): Promise<void> {
    if (!this.canTrack()) return;

    await this.waitForGtag();

    if (typeof window.gtag === "function") {
      window.gtag("set", {
        [propertyName]: value,
      });
    }

    if (this.isDevelopment) {
      console.log("GA User Property:", propertyName, value);
    }
  }

  /**
   * 디버그 정보 출력
   */
  getDebugInfo(): object {
    return {
      measurementId: this.measurementId,
      isDevelopment: this.isDevelopment,
      canTrack: this.canTrack(),
      gtagLoaded: typeof window.gtag === "function",
    };
  }
}

// 싱글톤 인스턴스 생성
export const analytics = new AnalyticsLogger();

// 편의 함수들 export
export const {
  trackPageView,
  trackEvent,
  trackButtonClick,
  trackFormSubmit,
  trackSearch,
  trackEngagement,
  trackError,
  setUserProperty,
} = analytics;

// 타입들은 이미 위에서 export되었으므로 중복 제거
