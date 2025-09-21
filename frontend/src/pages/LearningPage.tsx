import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Volume2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { missionsAPI } from "@/lib/api";
import type { Mission } from "@/lib/types";

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
];

// 랜덤하게 구절 선택
const getRandomVerse = () => {
  return SAMPLE_VERSES[Math.floor(Math.random() * SAMPLE_VERSES.length)];
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
    if ("speechSynthesis" in window) {
      setIsPlaying(true);
      const utterance = new SpeechSynthesisUtterance(verse.english);
      utterance.lang = "en-US";
      utterance.rate = 0.8;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      speechSynthesis.speak(utterance);
    }
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

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-lg leading-relaxed text-center">
              {verse.korean}
            </p>
          </div>

          <div className="border-t pt-4">
            <p className="text-base text-gray-700 text-center leading-relaxed">
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
                    ? "bg-green-100 border-green-300 text-green-800"
                    : feedbackState === "incorrect"
                    ? "bg-red-100 border-red-300 text-red-800"
                    : "bg-blue-100 border-blue-300"
                  : "border-gray-300"
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

          <div className="bg-gray-50 rounded-lg">
            <p className="text-lg leading-relaxed text-center">
              {verse.korean}
            </p>
          </div>

          <div className="border-t pt-4">
            <div className="text-base text-gray-700 text-center leading-relaxed break-words">
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
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(verse.english);
      utterance.lang = "en-US";
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
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

          <div className="bg-green-50 p-2 rounded-lg border border-green-200">
            <h3 className="text-xl font-semibold mb-4">{verse.reference}</h3>
            <p className="text-lg mb-4">{verse.korean}</p>
            <p className="text-base text-gray-700">{verse.english}</p>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600">이제 입으로 한번 읽어보세요!</p>
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
  const { data: todayMission, isLoading } = useQuery({
    queryKey: ["missions", "today"],
    queryFn: async () => {
      const response = await missionsAPI.getTodayMission();
      return response.data as Mission;
    },
    retry: 1,
  });

  // 학습용 구절 생성 (API 데이터가 있으면 사용, 없으면 샘플 데이터)
  const currentVerse = React.useMemo(() => {
    if (todayMission?.scriptures && todayMission.scriptures.length > 0) {
      const scripture = todayMission.scriptures[0];
      return {
        reference: `${scripture.startBook} ${scripture.startChapter}:${
          scripture.startVerse || ""
        }`.trim(),
        korean:
          todayMission.title ||
          "하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 저를 믿는 자마다 멸망치 않고 영생을 얻게 하려 하심이니라",
        english:
          todayMission.description ||
          "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
      };
    }
    return getRandomVerse();
  }, [todayMission]);

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
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-gray-600">성경 구절을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white sticky top-16 z-10 border-b px-4 py-3 flex items-center justify-center">
        <h1 className="text-lg font-semibold text-center">성경 구절 학습</h1>
      </div>

      {/* Progress */}
      <div className="px-4 py-4 bg-white border-b">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">진행상황</span>
          <span className="text-sm text-gray-600">{currentStep}/3</span>
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
