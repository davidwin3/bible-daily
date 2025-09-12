/**
 * Good TV 성경 링크를 위한 성경책 매핑
 * URL 패턴: https://goodtvbible.goodtv.co.kr/onbibleread/0/{book_order}/{chapter}
 *
 * book_order는 구약성경부터 신약성경까지 1부터 시작하는 순서
 */

// Good TV Bible 관련 상수
export const GOODTV_BIBLE_CONSTANTS = {
  BASE_URL: "https://goodtvbible.goodtv.co.kr",
  BIBLE_READ_PATH: "/onbibleread/0",
  DEFAULT_BOOK: 1, // 창세기
  DEFAULT_CHAPTER: 1,
} as const;

/**
 * Good TV Bible 전체 URL 생성
 * @param bookOrder 성경책 순서 (1-66)
 * @param chapter 장 번호
 * @returns 완전한 Good TV Bible URL
 */
export function buildGoodTVBibleUrl(
  bookOrder: number,
  chapter: number
): string {
  // 유효성 검증 후 잘못된 값이면 기본값 사용
  const validBookOrder = isValidBookOrder(bookOrder)
    ? bookOrder
    : GOODTV_BIBLE_CONSTANTS.DEFAULT_BOOK;
  const validChapter = isValidChapter(chapter)
    ? chapter
    : GOODTV_BIBLE_CONSTANTS.DEFAULT_CHAPTER;

  if (bookOrder !== validBookOrder || chapter !== validChapter) {
    console.warn(
      `잘못된 매개변수가 전달되었습니다. bookOrder: ${bookOrder} -> ${validBookOrder}, chapter: ${chapter} -> ${validChapter}`
    );
  }

  return `${GOODTV_BIBLE_CONSTANTS.BASE_URL}${GOODTV_BIBLE_CONSTANTS.BIBLE_READ_PATH}/${validBookOrder}/${validChapter}`;
}

/**
 * 기본 Good TV Bible URL 반환 (창세기 1장)
 * @returns 기본 Good TV Bible URL
 */
export function getDefaultGoodTVBibleUrl(): string {
  return buildGoodTVBibleUrl(
    GOODTV_BIBLE_CONSTANTS.DEFAULT_BOOK,
    GOODTV_BIBLE_CONSTANTS.DEFAULT_CHAPTER
  );
}

/**
 * 성경책 순서 번호 유효성 검증
 * @param bookOrder 성경책 순서 번호
 * @returns 유효한 범위(1-66)인지 여부
 */
export function isValidBookOrder(bookOrder: number): boolean {
  return Number.isInteger(bookOrder) && bookOrder >= 1 && bookOrder <= 66;
}

/**
 * 장 번호 유효성 검증
 * @param chapter 장 번호
 * @returns 유효한 범위(1 이상)인지 여부
 */
export function isValidChapter(chapter: number): boolean {
  return Number.isInteger(chapter) && chapter >= 1;
}

// 성경책 이름과 Good TV URL 순서 매핑
export const BIBLE_BOOK_MAPPING: Record<string, number> = {
  // 구약성경 (1-39)
  창세기: 1,
  출애굽기: 2,
  레위기: 3,
  민수기: 4,
  신명기: 5,
  여호수아: 6,
  사사기: 7,
  룻기: 8,
  사무엘상: 9,
  사무엘하: 10,
  열왕기상: 11,
  열왕기하: 12,
  역대상: 13,
  역대하: 14,
  에스라: 15,
  느헤미야: 16,
  에스더: 17,
  욥기: 18,
  시편: 19,
  잠언: 20,
  전도서: 21,
  아가: 22,
  이사야: 23,
  예레미야: 24,
  예레미야애가: 25,
  에스겔: 26,
  다니엘: 27,
  호세아: 28,
  요엘: 29,
  아모스: 30,
  오바댜: 31,
  요나: 32,
  미가: 33,
  나훔: 34,
  하박국: 35,
  스바냐: 36,
  학개: 37,
  스가랴: 38,
  말라기: 39,

  // 신약성경 (40-66)
  마태복음: 40,
  마가복음: 41,
  누가복음: 42,
  요한복음: 43,
  사도행전: 44,
  로마서: 45,
  고린도전서: 46,
  고린도후서: 47,
  갈라디아서: 48,
  에베소서: 49,
  빌립보서: 50,
  골로새서: 51,
  데살로니가전서: 52,
  데살로니가후서: 53,
  디모데전서: 54,
  디모데후서: 55,
  디도서: 56,
  빌레몬서: 57,
  히브리서: 58,
  야고보서: 59,
  베드로전서: 60,
  베드로후서: 61,
  요한일서: 62,
  요한이서: 63,
  요한삼서: 64,
  유다서: 65,
  요한계시록: 66,
};

// 성경책 이름의 다양한 표기법을 처리하기 위한 별칭 매핑
export const BIBLE_BOOK_ALIASES: Record<string, string> = {
  // 일반적인 줄임말
  창: "창세기",
  출: "출애굽기",
  레: "레위기",
  민: "민수기",
  신: "신명기",
  수: "여호수아",
  삿: "사사기",
  룻: "룻기",
  삼상: "사무엘상",
  삼하: "사무엘하",
  왕상: "열왕기상",
  왕하: "열왕기하",
  대상: "역대상",
  대하: "역대하",
  스: "에스라",
  느: "느헤미야",
  에: "에스더",
  욥: "욥기",
  시: "시편",
  잠: "잠언",
  전: "전도서",
  아: "아가",
  사: "이사야",
  렘: "예레미야",
  애: "예레미야애가",
  겔: "에스겔",
  단: "다니엘",
  호: "호세아",
  욜: "요엘",
  암: "아모스",
  옵: "오바댜",
  욘: "요나",
  미: "미가",
  나: "나훔",
  합: "하박국",
  습: "스바냐",
  학: "학개",
  슥: "스가랴",
  말: "말라기",

  마: "마태복음",
  막: "마가복음",
  눅: "누가복음",
  요: "요한복음",
  행: "사도행전",
  롬: "로마서",
  고전: "고린도전서",
  고후: "고린도후서",
  갈: "갈라디아서",
  엡: "에베소서",
  빌: "빌립보서",
  골: "골로새서",
  살전: "데살로니가전서",
  살후: "데살로니가후서",
  딤전: "디모데전서",
  딤후: "디모데후서",
  딛: "디도서",
  몬: "빌레몬서",
  히: "히브리서",
  약: "야고보서",
  벧전: "베드로전서",
  벧후: "베드로후서",
  요일: "요한일서",
  요이: "요한이서",
  요삼: "요한삼서",
  유: "유다서",
  계: "요한계시록",

  // 다른 표기법들
  여호수아서: "여호수아",
  사사기서: "사사기",
  룻기서: "룻기",
  에스라서: "에스라",
  느헤미야서: "느헤미야",
  에스더서: "에스더",
  욥기서: "욥기",
  시편서: "시편",
  잠언서: "잠언",
  전도서서: "전도서",
  아가서: "아가",
  이사야서: "이사야",
  예레미야서: "예레미야",
  애가: "예레미야애가",
  에스겔서: "에스겔",
  다니엘서: "다니엘",
  호세아서: "호세아",
  요엘서: "요엘",
  아모스서: "아모스",
  오바댜서: "오바댜",
  요나서: "요나",
  미가서: "미가",
  나훔서: "나훔",
  하박국서: "하박국",
  스바냐서: "스바냐",
  학개서: "학개",
  스가랴서: "스가랴",
  말라기서: "말라기",
};

/**
 * 성경책 이름을 Good TV URL의 순서 번호로 변환
 * @param bookName 성경책 이름
 * @returns Good TV URL에서 사용하는 순서 번호 (1-66), 찾을 수 없으면 null
 */
export function getBookOrder(bookName: string): number | null {
  // 먼저 직접 매핑에서 찾기
  if (BIBLE_BOOK_MAPPING[bookName]) {
    return BIBLE_BOOK_MAPPING[bookName];
  }

  // 별칭에서 찾기
  const alias = BIBLE_BOOK_ALIASES[bookName];
  if (alias && BIBLE_BOOK_MAPPING[alias]) {
    return BIBLE_BOOK_MAPPING[alias];
  }

  // 부분 매칭 시도 (예: "마태" -> "마태복음")
  for (const [fullName, order] of Object.entries(BIBLE_BOOK_MAPPING)) {
    if (
      fullName.includes(bookName) ||
      bookName.includes(fullName.replace(/서$|기$|서$/, ""))
    ) {
      return order;
    }
  }

  return null;
}

/**
 * Good TV 성경 링크 생성
 * @param bookName 성경책 이름
 * @param chapter 장 번호
 * @returns Good TV 성경 링크
 */
export function generateGoodTVBibleLink(
  bookName: string,
  chapter: number
): string {
  const bookOrder = getBookOrder(bookName);

  if (!bookOrder) {
    // 기본값으로 창세기 1장 반환
    console.warn(
      `성경책 "${bookName}"을(를) 찾을 수 없습니다. 창세기 1장으로 이동합니다.`
    );
    return getDefaultGoodTVBibleUrl();
  }

  return buildGoodTVBibleUrl(bookOrder, chapter);
}

/**
 * 여러 성경 구절에 대한 Good TV 링크 생성 (첫 번째 구절 기준)
 * @param scriptures 성경 구절 배열
 * @returns Good TV 성경 링크
 */
export function generateGoodTVBibleLinkFromScriptures(
  scriptures: Array<{
    startBook: string;
    startChapter: number;
    startVerse?: number;
    endBook?: string;
    endChapter?: number;
    endVerse?: number;
  }>
): string {
  if (scriptures.length === 0) {
    return getDefaultGoodTVBibleUrl();
  }

  // 첫 번째 구절을 기준으로 링크 생성
  const firstScripture = scriptures[0];
  return generateGoodTVBibleLink(
    firstScripture.startBook,
    firstScripture.startChapter
  );
}
