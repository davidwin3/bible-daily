import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AdminMissionsPage } from "../AdminMissionsPage";
import { missionsAPI } from "@/lib/api";
import { vi, describe, it, expect, beforeEach } from "vitest";

// API 모킹
vi.mock("@/lib/api", () => ({
  missionsAPI: {
    getAllMissionsForAdmin: vi.fn(),
    createMission: vi.fn(),
    updateMission: vi.fn(),
    deleteMission: vi.fn(),
    softDeleteMission: vi.fn(),
    getMissionStatistics: vi.fn(),
  },
}));

// 컴포넌트 모킹
vi.mock("@/components/layout/AdminNav", () => ({
  AdminNav: () => <div data-testid="admin-nav">Admin Nav</div>,
}));

vi.mock("@/components/common/ScriptureDisplay", () => ({
  ScriptureDisplay: ({ scriptures }: { scriptures: any[] }) => (
    <div data-testid="scripture-display">
      {scriptures.map((s, i) => (
        <span key={i}>
          {s.startBook} {s.startChapter}
        </span>
      ))}
    </div>
  ),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

const mockMissions = [
  {
    id: "1",
    date: "2024-01-15",
    title: "테스트 미션 1",
    description: "테스트 미션 1 설명",
    isActive: true,
    completionCount: 10,
    totalUsers: 20,
    completionRate: 50,
    scriptures: [
      {
        id: "1",
        startBook: "마태복음",
        startChapter: 1,
        startVerse: 1,
        endBook: "마태복음",
        endChapter: 1,
        endVerse: 10,
        order: 0,
      },
    ],
  },
  {
    id: "2",
    date: "2024-01-16",
    title: "테스트 미션 2",
    description: "테스트 미션 2 설명",
    isActive: true,
    completionCount: 15,
    totalUsers: 25,
    completionRate: 60,
    scriptures: [],
  },
];

describe("AdminMissionsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (missionsAPI.getAllMissionsForAdmin as any).mockResolvedValue({
      data: mockMissions,
    });
  });

  it("should render mission list", async () => {
    render(<AdminMissionsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("테스트 미션 1")).toBeInTheDocument();
      expect(screen.getByText("테스트 미션 2")).toBeInTheDocument();
    });

    expect(screen.getByText("완료율: 50%")).toBeInTheDocument();
    expect(screen.getByText("완료율: 60%")).toBeInTheDocument();
  });

  it("should open create dialog when add button clicked", async () => {
    render(<AdminMissionsPage />, { wrapper: createWrapper() });

    const addButton = await screen.findByText("미션 추가");
    fireEvent.click(addButton);

    expect(screen.getByText("새 미션 추가")).toBeInTheDocument();
    expect(screen.getByLabelText("날짜")).toBeInTheDocument();
    expect(screen.getByLabelText("제목")).toBeInTheDocument();
    expect(screen.getByLabelText("설명")).toBeInTheDocument();
  });

  it("should create mission successfully", async () => {
    (missionsAPI.createMission as any).mockResolvedValue({
      data: {
        id: "3",
        date: "2024-01-17",
        title: "새 미션",
        description: "새 미션 설명",
        isActive: true,
      },
    });

    render(<AdminMissionsPage />, { wrapper: createWrapper() });

    // 미션 추가 버튼 클릭
    const addButton = await screen.findByText("미션 추가");
    fireEvent.click(addButton);

    // 폼 필드 입력
    fireEvent.change(screen.getByLabelText("날짜"), {
      target: { value: "2024-01-17" },
    });
    fireEvent.change(screen.getByLabelText("제목"), {
      target: { value: "새 미션" },
    });
    fireEvent.change(screen.getByLabelText("설명"), {
      target: { value: "새 미션 설명" },
    });

    // 성경구절 입력
    const bookSelect = screen.getByDisplayValue("");
    fireEvent.change(bookSelect, { target: { value: "마태복음" } });

    const chapterInput = screen.getByDisplayValue("1");
    fireEvent.change(chapterInput, { target: { value: "2" } });

    // 저장 버튼 클릭
    const saveButton = screen.getByText("저장");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(missionsAPI.createMission).toHaveBeenCalledWith({
        date: "2024-01-17",
        title: "새 미션",
        description: "새 미션 설명",
        scriptures: [
          {
            startBook: "마태복음",
            startChapter: 2,
            startVerse: undefined,
            endBook: "",
            endChapter: undefined,
            endVerse: undefined,
            order: 0,
          },
        ],
      });
    });
  });

  it("should open edit dialog when edit button clicked", async () => {
    render(<AdminMissionsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("테스트 미션 1")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByLabelText("수정");
    fireEvent.click(editButtons[0]);

    expect(screen.getByText("미션 수정")).toBeInTheDocument();
    expect(screen.getByDisplayValue("테스트 미션 1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("테스트 미션 1 설명")).toBeInTheDocument();
  });

  it("should update mission successfully", async () => {
    (missionsAPI.updateMission as any).mockResolvedValue({
      data: {
        id: "1",
        title: "수정된 미션",
        description: "수정된 설명",
        isActive: true,
      },
    });

    render(<AdminMissionsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("테스트 미션 1")).toBeInTheDocument();
    });

    // 수정 버튼 클릭
    const editButtons = screen.getAllByLabelText("수정");
    fireEvent.click(editButtons[0]);

    // 제목 수정
    const titleInput = screen.getByDisplayValue("테스트 미션 1");
    fireEvent.change(titleInput, { target: { value: "수정된 미션" } });

    // 설명 수정
    const descriptionInput = screen.getByDisplayValue("테스트 미션 1 설명");
    fireEvent.change(descriptionInput, { target: { value: "수정된 설명" } });

    // 저장 버튼 클릭
    const saveButton = screen.getByText("저장");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(missionsAPI.updateMission).toHaveBeenCalledWith("1", {
        date: "2024-01-15",
        title: "수정된 미션",
        description: "수정된 설명",
        scriptures: [
          {
            startBook: "마태복음",
            startChapter: 1,
            startVerse: 1,
            endBook: "마태복음",
            endChapter: 1,
            endVerse: 10,
            order: 0,
          },
        ],
      });
    });
  });

  it("should delete mission successfully", async () => {
    (missionsAPI.deleteMission as any).mockResolvedValue({
      data: { message: "Mission deleted successfully" },
    });

    // window.confirm 모킹
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<AdminMissionsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("테스트 미션 1")).toBeInTheDocument();
    });

    // 삭제 버튼 클릭
    const deleteButtons = screen.getAllByLabelText("삭제");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith(
        "미션을 완전히 삭제하시겠습니까?"
      );
      expect(missionsAPI.deleteMission).toHaveBeenCalledWith("1");
    });

    confirmSpy.mockRestore();
  });

  it("should soft delete mission with user activities", async () => {
    const missionWithActivities = {
      ...mockMissions[0],
      totalUsers: 20,
      completionCount: 10,
    };

    (missionsAPI.getAllMissionsForAdmin as any).mockResolvedValue({
      data: [missionWithActivities],
    });

    (missionsAPI.softDeleteMission as any).mockResolvedValue({
      data: { ...missionWithActivities, isActive: false },
    });

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<AdminMissionsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("테스트 미션 1")).toBeInTheDocument();
    });

    // 삭제 버튼 클릭 (사용자 활동이 있는 미션)
    const deleteButtons = screen.getAllByLabelText("삭제");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith(
        "사용자 활동이 있는 미션입니다. 비활성화하시겠습니까?"
      );
      expect(missionsAPI.softDeleteMission).toHaveBeenCalledWith("1");
    });

    confirmSpy.mockRestore();
  });

  it("should filter missions by month", async () => {
    render(<AdminMissionsPage />, { wrapper: createWrapper() });

    // 월 필터 변경
    const monthInput = screen.getByDisplayValue("2024-01");
    fireEvent.change(monthInput, { target: { value: "2024-02" } });

    await waitFor(() => {
      expect(missionsAPI.getAllMissionsForAdmin).toHaveBeenCalledWith({
        month: "2024-02",
      });
    });
  });

  it("should handle loading state", () => {
    (missionsAPI.getAllMissionsForAdmin as any).mockReturnValue(
      new Promise(() => {}) // 무한 대기 상태로 로딩 테스트
    );

    render(<AdminMissionsPage />, { wrapper: createWrapper() });

    expect(screen.getByText("로딩 중...")).toBeInTheDocument();
  });

  it("should handle error state", async () => {
    (missionsAPI.getAllMissionsForAdmin as any).mockRejectedValue(
      new Error("API 오류")
    );

    render(<AdminMissionsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("오류가 발생했습니다")).toBeInTheDocument();
    });
  });

  it("should add and remove scripture fields", async () => {
    render(<AdminMissionsPage />, { wrapper: createWrapper() });

    // 미션 추가 버튼 클릭
    const addButton = await screen.findByText("미션 추가");
    fireEvent.click(addButton);

    // 성경구절 추가 버튼 클릭
    const addScriptureButton = screen.getByText("성경구절 추가");
    fireEvent.click(addScriptureButton);

    // 성경구절 필드가 2개인지 확인
    const bookSelects = screen.getAllByDisplayValue("");
    expect(bookSelects).toHaveLength(2);

    // 성경구절 제거 버튼 클릭
    const removeButtons = screen.getAllByText("제거");
    fireEvent.click(removeButtons[1]);

    // 성경구절 필드가 1개로 줄어들었는지 확인
    await waitFor(() => {
      const remainingBookSelects = screen.getAllByDisplayValue("");
      expect(remainingBookSelects).toHaveLength(1);
    });
  });
});

