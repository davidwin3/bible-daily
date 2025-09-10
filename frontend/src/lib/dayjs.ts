import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/ko";

// 플러그인 등록
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

// 한국어 로케일 설정
dayjs.locale("ko");

// 기본 타임존을 Asia/Seoul로 설정
dayjs.tz.setDefault("Asia/Seoul");

export default dayjs;

// 유틸리티 함수들
export const dayjsUtils = {
  // 현재 시간 반환 (기본 타임존 적용)
  now: () => dayjs(),

  // 날짜 문자열 파싱 (기본 타임존 적용)
  parse: (date: string | Date) => {
    if (!date) return null;
    return dayjs(date);
  },

  // 오늘 날짜를 YYYY-MM-DD 형식으로 반환
  today: () => dayjs().format("YYYY-MM-DD"),

  // 날짜를 한국 형식으로 포맷팅
  formatKorean: (date: string | Date | dayjs.Dayjs) => {
    if (!date) return "";
    return dayjs(date).format("YYYY년 MM월 DD일");
  },

  // 날짜를 간단한 형식으로 포맷팅 (MM/DD)
  formatSimple: (date: string | Date | dayjs.Dayjs) => {
    if (!date) return "";
    return dayjs(date).format("MM/DD");
  },

  // 상대적 시간 표시 (몇 시간 전, 며칠 전 등)
  fromNow: (date: string | Date | dayjs.Dayjs) => {
    if (!date) return "";
    const targetDate = dayjs(date);
    const now = dayjs();
    const diffInHours = now.diff(targetDate, "hour");

    if (diffInHours < 1) {
      const diffInMinutes = now.diff(targetDate, "minute");
      return diffInMinutes < 1 ? "방금 전" : `${diffInMinutes}분 전`;
    } else if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}일 전`;
    } else {
      return targetDate.format("YYYY.MM.DD");
    }
  },

  // 날짜가 오늘인지 확인
  isToday: (date: string | Date | dayjs.Dayjs) => {
    if (!date) return false;
    const targetDate = dayjs(date);
    const today = dayjs();
    return targetDate.format("YYYY-MM-DD") === today.format("YYYY-MM-DD");
  },

  // 두 날짜가 같은 날인지 확인
  isSameDay: (
    date1: string | Date | dayjs.Dayjs,
    date2: string | Date | dayjs.Dayjs
  ) => {
    if (!date1 || !date2) return false;
    const d1 = dayjs(date1);
    const d2 = dayjs(date2);
    return d1.format("YYYY-MM-DD") === d2.format("YYYY-MM-DD");
  },

  // 월의 첫째 날과 마지막 날 반환
  getMonthRange: (date: string | Date | dayjs.Dayjs) => {
    const targetDate = dayjs(date);
    return {
      start: targetDate.startOf("month").format("YYYY-MM-DD"),
      end: targetDate.endOf("month").format("YYYY-MM-DD"),
    };
  },

  // ISO 문자열 변환 (기본 타임존 적용)
  toISOString: (date?: string | Date | dayjs.Dayjs) => {
    const targetDate = date ? dayjs(date) : dayjs();
    return targetDate.toISOString();
  },

  // 날짜를 Date 객체로 변환 (기본 타임존 적용)
  toDate: (date: string | Date | dayjs.Dayjs) => {
    if (!date) return null;
    return dayjs(date).toDate();
  },

  // 캘린더용 날짜 포맷팅
  formatForCalendar: (date: string | Date | dayjs.Dayjs) => {
    if (!date) return "";
    return dayjs(date).format("YYYY-MM-DD");
  },

  // API 전송용 날짜 포맷팅
  formatForAPI: (date: string | Date | dayjs.Dayjs) => {
    if (!date) return "";
    return dayjs(date).format("YYYY-MM-DD");
  },

  // 특정 타임존이 필요한 경우를 위한 유틸리티
  timezone: {
    // 특정 타임존으로 변환
    convert: (date: string | Date | dayjs.Dayjs, timezone: string) => {
      return dayjs(date).tz(timezone);
    },

    // UTC로 변환
    toUTC: (date: string | Date | dayjs.Dayjs) => {
      return dayjs(date).utc();
    },

    // 서버에서 받은 UTC 시간을 로컬 타임존으로 변환
    fromUTC: (utcDate: string | Date) => {
      return dayjs.utc(utcDate).local();
    },
  },
};
