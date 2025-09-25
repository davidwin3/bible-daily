import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

// 임시 성경 구절 데이터 (나중에 API로 교체)
const SAMPLE_VERSES = [
  {
    reference: "요한복음 3:16",
    korean:
      "하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 저를 믿는 자마다 멸망치 않고 영생을 얻게 하려 하심이니라",
    english:
      "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
  },
  {
    reference: "빌립보서 4:13",
    korean: "내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라",
    english: "I can do all things through Christ who strengthens me.",
  },
  {
    reference: "로마서 8:28",
    korean:
      "우리가 알거니와 하나님을 사랑하는 자 곧 그의 뜻대로 부르심을 입은 자들에게는 모든 것이 합력하여 선을 이루느니라",
    english:
      "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
  },
  {
    reference: "시편 23:1",
    korean: "여호와는 나의 목자시니 내게 부족함이 없으리로다",
    english: "The Lord is my shepherd; I shall not want.",
  },
  {
    reference: "잠언 3:5-6",
    korean:
      "너는 마음을 다하여 여호와를 신뢰하고 네 명철을 의지하지 말라 너는 범사에 그를 인정하라 그리하면 네 길을 지도하시리라",
    english:
      "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
  },
  {
    reference: "이사야 40:31",
    korean:
      "오직 여호와를 앙망하는 자는 새 힘을 얻으리니 독수리가 날개치며 올라감 같을 것이요 달음박질하여도 곤비하지 아니하며 걸어가도 피곤하지 아니하리로다",
    english:
      "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
  },
  {
    reference: "마태복음 6:33",
    korean:
      "그런즉 너희는 먼저 그의 나라와 그의 의를 구하라 그리하면 이 모든 것을 너희에게 더하시리라",
    english:
      "But seek first his kingdom and his righteousness, and all these things will be given to you as well.",
  },
  {
    reference: "고린도전서 13:4-5",
    korean:
      "사랑은 오래 참고 사랑은 온유하며 투기하지 아니하며 사랑은 자랑하지 아니하며 교만하지 아니하며 무례히 행하지 아니하며 자기의 유익을 구하지 아니하며 성내지 아니하며 악한 것을 생각하지 아니하며",
    english:
      "Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs.",
  },
  {
    reference: "요한복음 14:6",
    korean:
      "예수께서 이르시되 내가 곧 길이요 진리요 생명이니 나로 말미암지 않고는 아버지께로 올 자가 없느니라",
    english:
      "Jesus answered, I am the way and the truth and the life. No one comes to the Father except through me.",
  },
  {
    reference: "골로새서 3:23",
    korean:
      "무엇을 하든지 마음을 다하여 주께 하듯 하고 사람에게 하듯 하지 말라",
    english:
      "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.",
  },
];

// 랜덤하게 구절 선택
const getRandomVerse = () => {
  return SAMPLE_VERSES[Math.floor(Math.random() * SAMPLE_VERSES.length)];
};

// TTS 영어 음성 헬퍼 함수
const createEnglishSpeech = (
  text: string,
  onEnd?: () => void,
  onError?: (event?: SpeechSynthesisErrorEvent) => void
) => {
  if (!("speechSynthesis" in window)) {
    console.warn("Speech synthesis not supported");
    onError?.();
    return;
  }

  // 영어 음성 찾기
  const getEnglishVoice = () => {
    const voices = speechSynthesis.getVoices();

    // 1순위: 명시적으로 en-US 음성 찾기
    let englishVoice = voices.find(
      (voice) =>
        voice.lang === "en-US" &&
        !voice.name.includes("한국어") &&
        !voice.name.includes("Korean")
    );

    // 2순위: en으로 시작하는 모든 영어 음성
    if (!englishVoice) {
      englishVoice = voices.find(
        (voice) =>
          voice.lang.startsWith("en") &&
          !voice.name.includes("한국어") &&
          !voice.name.includes("Korean")
      );
    }

    // 3순위: 영어 키워드가 포함된 음성
    if (!englishVoice) {
      englishVoice = voices.find(
        (voice) =>
          voice.name.toLowerCase().includes("english") ||
          voice.name.toLowerCase().includes("samantha") ||
          voice.name.toLowerCase().includes("alex") ||
          voice.name.toLowerCase().includes("daniel") ||
          voice.name.toLowerCase().includes("karen") ||
          voice.name.toLowerCase().includes("moira") ||
          voice.name.toLowerCase().includes("tessa") ||
          voice.name.toLowerCase().includes("veena") ||
          voice.name.toLowerCase().includes("fred")
      );
    }

    return englishVoice;
  };

  // 음성이 로드될 때까지 대기
  const speakWithVoice = () => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const englishVoice = getEnglishVoice();
      if (englishVoice) {
        utterance.voice = englishVoice;
        console.log("Selected voice:", englishVoice.name, englishVoice.lang);
      } else {
        console.warn("No English voice found, using default");
      }

      utterance.onend = () => {
        console.log("Speech ended successfully");
        onEnd?.();
      };

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event);
        onError?.(event);
      };

      // iOS Safari 호환성을 위한 추가 처리
      speechSynthesis.cancel(); // 이전 발화 취소
      setTimeout(() => {
        speechSynthesis.speak(utterance);
      }, 100);
    } catch (error) {
      console.error("Error creating speech utterance:", error);
      onError?.();
    }
  };

  // 음성 목록이 로드되지 않은 경우 대기
  if (speechSynthesis.getVoices().length === 0) {
    const timeoutId = setTimeout(() => {
      console.warn("Voice loading timeout");
      onError?.();
    }, 5000);

    speechSynthesis.addEventListener("voiceschanged", function handler() {
      clearTimeout(timeoutId);
      speechSynthesis.removeEventListener("voiceschanged", handler);
      speakWithVoice();
    });
  } else {
    speakWithVoice();
  }
};

interface LearningStepProps {
  verse: (typeof SAMPLE_VERSES)[0];
  onNext: () => void;
  onPrevious?: () => void;
}

// Step 1: 구절 묵상
const MeditationStep: React.FC<LearningStepProps> = ({ verse, onNext }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSpeak = () => {
    setIsPlaying(true);
    createEnglishSpeech(
      verse.english,
      () => setIsPlaying(false), // onEnd
      () => setIsPlaying(false) // onError
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">성경을 묵상하고 외워보세요</h2>
        <div
          className="h-1 bg-blue-500 rounded-full mx-auto"
          style={{ width: "30%" }}
        ></div>
      </div>

      <Card className="pt-4">
        <CardContent className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">{verse.reference}</h3>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-lg leading-relaxed text-center text-gray-900 dark:text-gray-100">
              {verse.korean}
            </p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
            <p className="text-base text-gray-700 dark:text-gray-300 text-center leading-relaxed">
              {verse.english}
            </p>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleSpeak}
              disabled={isPlaying}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Volume2 className="h-4 w-4" />
              <span>들어보기</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button
          onClick={onNext}
          className="w-full bg-blue-500 hover:bg-blue-600"
        >
          다음
        </Button>
      </div>
    </div>
  );
};

// Step 2: 빈칸 채우기
const FillBlanksStep: React.FC<LearningStepProps> = ({
  verse,
  onNext,
  onPrevious,
}) => {
  const [selectedWords, setSelectedWords] = useState<{ [key: number]: string }>(
    {}
  );
  const [feedback, setFeedback] = useState<{
    [key: number]: "correct" | "incorrect" | null;
  }>({});
  const [isCompleted, setIsCompleted] = useState(false);

  // 영어 문장을 단어로 분리하고 일부를 빈칸으로 만들기
  const words = verse.english.split(" ");

  // 동적으로 빈칸 생성 (중요한 단어들을 빈칸으로 만들기)
  const getBlanksForVerse = (text: string) => {
    const words = text.toLowerCase().split(" ");
    const importantWords = [
      "god",
      "so",
      "loved",
      "world",
      "son",
      "believes",
      "eternal",
      "life",
      "can",
      "do",
      "all",
      "things",
      "through",
      "christ",
      "strengthens",
      "know",
      "works",
      "good",
      "love",
      "purpose",
      "called",
      "lord",
      "shepherd",
      "want",
      "trust",
      "heart",
      "understanding",
      "ways",
      "submit",
      "paths",
      "hope",
      "strength",
      "eagles",
      "weary",
      "seek",
      "first",
      "kingdom",
      "righteousness",
      "patient",
      "kind",
      "envy",
      "boast",
      "proud",
      "way",
      "truth",
      "father",
      "whatever",
      "work",
      "masters",
    ];

    const blanks: number[] = [];
    words.forEach((word, index) => {
      const cleanWord = word.replace(/[^\w]/g, "");
      if (importantWords.includes(cleanWord) && blanks.length < 5) {
        blanks.push(index);
      }
    });

    // 최소 3개의 빈칸 보장
    while (blanks.length < 3 && blanks.length < words.length) {
      const randomIndex = Math.floor(Math.random() * words.length);
      if (!blanks.includes(randomIndex) && words[randomIndex].length > 3) {
        blanks.push(randomIndex);
      }
    }

    return blanks.slice(0, 5);
  };

  const blanksIndices = getBlanksForVerse(verse.english);

  // 정답과 오답 옵션 생성
  const generateOptions = () => {
    const correctWords = blanksIndices.map((index) =>
      words[index].replace(/[^\w]/g, "").toLowerCase()
    );

    const distractors = [
      "very",
      "much",
      "earth",
      "people",
      "trusts",
      "follows",
      "will",
      "must",
      "endless",
      "forever",
      "going",
      "make",
      "coming",
      "feel",
      "jumping",
      "see",
      "great",
      "always",
      "mighty",
      "guide",
      "leader",
      "need",
      "believe",
      "mind",
      "wisdom",
      "paths",
      "straight",
      "wait",
      "power",
      "birds",
      "tired",
      "find",
      "second",
      "glory",
      "justice",
      "gentle",
      "nice",
      "jealous",
      "humble",
      "proud",
      "road",
      "fact",
      "mother",
      "however",
      "labor",
      "servants",
    ];

    const allOptions = [...correctWords];

    // 오답 추가 (정답의 2배 정도)
    while (allOptions.length < correctWords.length * 3) {
      const distractor =
        distractors[Math.floor(Math.random() * distractors.length)];
      if (!allOptions.includes(distractor)) {
        allOptions.push(distractor);
      }
    }

    return allOptions.sort(() => Math.random() - 0.5);
  };

  const options = generateOptions();

  const correctAnswers: { [key: number]: string } = {};
  blanksIndices.forEach((index) => {
    correctAnswers[index] = words[index].replace(/[^\w]/g, "").toLowerCase();
  });

  const handleWordSelect = (blankIndex: number, word: string) => {
    const newSelected = { ...selectedWords, [blankIndex]: word };
    setSelectedWords(newSelected);

    // 즉시 피드백 제공
    const isCorrect = correctAnswers[blankIndex] === word.toLowerCase();
    setFeedback({
      ...feedback,
      [blankIndex]: isCorrect ? "correct" : "incorrect",
    });

    if (isCorrect) {
      // 정답 사운드 효과
      playCorrectSound();
    }

    // 모든 빈칸이 올바르게 채워졌는지 확인
    const allBlanksCorrect = blanksIndices.every(
      (index) =>
        newSelected[index] &&
        correctAnswers[index] === newSelected[index].toLowerCase()
    );

    if (allBlanksCorrect) {
      setIsCompleted(true);
    }
  };

  const playCorrectSound = () => {
    // Web Audio API를 사용한 '띠리링' 사운드 생성
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(
        659.25,
        audioContext.currentTime + 0.1
      ); // E5
      oscillator.frequency.setValueAtTime(
        783.99,
        audioContext.currentTime + 0.2
      ); // G5

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log("Audio context not available");
    }
  };

  const renderSentence = () => {
    return words.map((word, index) => {
      if (blanksIndices.includes(index)) {
        const selectedWord = selectedWords[index];
        const feedbackState = feedback[index];

        return (
          <span key={index} className="inline-block mx-1">
            <span
              className={cn(
                "inline-block min-w-16 px-2 py-1 rounded border-2 border-dashed text-center",
                selectedWord
                  ? feedbackState === "correct"
                    ? "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-600 text-green-800 dark:text-green-200"
                    : feedbackState === "incorrect"
                    ? "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-600 text-red-800 dark:text-red-200"
                    : "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-800 dark:text-blue-200"
                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              )}
            >
              {selectedWord || "___"}
            </span>
          </span>
        );
      }
      return (
        <span key={index} className="mx-1">
          {word}
        </span>
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">
          성경구절의 빈칸을 채워보세요
        </h2>
        <div
          className="h-1 bg-blue-500 rounded-full mx-auto"
          style={{ width: "60%" }}
        ></div>
      </div>

      <Card className="pt-4">
        <CardContent className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">{verse.reference}</h3>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-lg leading-relaxed text-center text-gray-900 dark:text-gray-100">
              {verse.korean}
            </p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
            <div className="text-base text-gray-700 dark:text-gray-300 text-center leading-relaxed break-words">
              {renderSentence()}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-6">
            {options.map((word, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => {
                  // 현재 선택 가능한 빈칸 찾기
                  const nextBlankIndex = blanksIndices.find(
                    (blankIndex) =>
                      !selectedWords[blankIndex] ||
                      feedback[blankIndex] === "incorrect"
                  );
                  if (nextBlankIndex !== undefined) {
                    handleWordSelect(nextBlankIndex, word);
                  }
                }}
                className="text-sm py-2"
                disabled={isCompleted}
              >
                {word}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex space-x-4">
        <Button onClick={onPrevious} variant="outline" className="flex-1">
          이전
        </Button>
        <Button
          onClick={onNext}
          disabled={!isCompleted}
          className="flex-1 bg-blue-500 hover:bg-blue-600"
        >
          다음
        </Button>
      </div>
    </div>
  );
};

// Step 3: 완료
const CompletionStep: React.FC<
  LearningStepProps & { completionTime: number }
> = ({ verse, onPrevious, completionTime }) => {
  const navigate = useNavigate();

  const handleSpeak = () => {
    createEnglishSpeech(verse.english);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 text-green-600">
          축하합니다! 🎉
        </h2>
      </div>

      <Card className="pt-4">
        <CardContent className="space-y-6 text-center">
          <div>
            <p className="text-lg font-semibold text-green-600 mb-2">
              학습 완료!
            </p>
            <p className="text-gray-600">
              완료 시간: {Math.floor(completionTime / 60)}분{" "}
              {completionTime % 60}초
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              {verse.reference}
            </h3>
            <p className="text-lg mb-4 text-gray-900 dark:text-gray-100">
              {verse.korean}
            </p>
            <p className="text-base text-gray-700 dark:text-gray-300">
              {verse.english}
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              이제 입으로 한번 읽어보세요!
            </p>
            <Button
              onClick={handleSpeak}
              variant="outline"
              className="flex mx-auto items-center space-x-2"
            >
              <Volume2 className="h-4 w-4" />
              <span>발음 듣기</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex space-x-4">
        <Button onClick={onPrevious} variant="outline" className="flex-1">
          이전
        </Button>
        <Button
          onClick={() => navigate("/")}
          className="flex-1 bg-green-500 hover:bg-green-600"
        >
          홈으로
        </Button>
      </div>
    </div>
  );
};

export const LearningPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [startTime] = useState(Date.now());
  const [completionTime, setCompletionTime] = useState(0);

  // 오늘의 미션에서 성경 구절 가져오기
  // const { data: todayMission, isLoading } = useQuery({
  //   queryKey: ["missions", "today"],
  //   queryFn: async () => {
  //     const response = await missionsAPI.getTodayMission();
  //     return response.data as Mission;
  //   },
  //   retry: 1,
  // });

  // 학습용 구절 생성 (API 데이터가 있으면 사용, 없으면 샘플 데이터)
  const currentVerse = React.useMemo(() => {
    // if (todayMission?.scriptures && todayMission.scriptures.length > 0) {
    //   const scripture = todayMission.scriptures[0];
    //   return {
    //     reference: `${scripture.startBook} ${scripture.startChapter}:${
    //       scripture.startVerse || ""
    //     }`.trim(),
    //     korean:
    //       todayMission.title ||
    //       "하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 저를 믿는 자마다 멸망치 않고 영생을 얻게 하려 하심이니라",
    //     english:
    //       todayMission.description ||
    //       "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
    //   };
    // }
    return getRandomVerse();
  }, []);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      if (currentStep === 2) {
        // 완료 시간 계산
        setCompletionTime(Math.floor((Date.now() - startTime) / 1000));
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderCurrentStep = () => {
    const stepProps = {
      verse: currentVerse,
      onNext: handleNext,
      onPrevious: currentStep > 1 ? handlePrevious : undefined,
    };

    switch (currentStep) {
      case 1:
        return <MeditationStep {...stepProps} />;
      case 2:
        return <FillBlanksStep {...stepProps} />;
      case 3:
        return (
          <CompletionStep {...stepProps} completionTime={completionTime} />
        );
      default:
        return <MeditationStep {...stepProps} />;
    }
  };

  // 로딩 상태 처리
  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center space-y-4">
  //         <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
  //         <p className="text-gray-600">성경 구절을 불러오는 중...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 sticky top-16 z-10 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-center">
        <h1 className="text-lg font-semibold text-center text-gray-900 dark:text-gray-100">
          성경 구절 학습
        </h1>
      </div>

      {/* Progress */}
      <div className="px-4 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            진행상황
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {currentStep}/3
          </span>
        </div>
        <Progress value={(currentStep / 3) * 100} className="h-2" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-2xl mb-24">
        {renderCurrentStep()}
      </div>
    </div>
  );
};
