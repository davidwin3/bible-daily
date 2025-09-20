import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cellsAPI } from "@/lib/api";
import { cellKeys } from "@/queries/cells";

// 타입 정의
export interface CellMember {
  id: string;
  isActive: boolean;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    realName: string;
    email: string;
    profileImage?: string;
  };
}

export interface Cell {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  leader: {
    id: string;
    name: string;
    realName: string;
    email: string;
  };
  members: CellMember[];
  memberCount?: number;
}

// 모든 셀 조회
export const useCells = () => {
  return useQuery({
    queryKey: cellKeys.lists(),
    queryFn: async () => {
      const response = await cellsAPI.getCells();
      return response.data as Cell[];
    },
  });
};

// 단일 셀 조회
export const useCell = (id: string) => {
  return useQuery({
    queryKey: cellKeys.detail(id),
    queryFn: async () => {
      const response = await cellsAPI.getCell(id);
      return response.data as Cell;
    },
    enabled: !!id,
  });
};

// 사용자의 셀 조회
export const useUserCell = () => {
  return useQuery({
    queryKey: cellKeys.userCell(),
    queryFn: async () => {
      const response = await cellsAPI.getUserCell();
      return response.data as Cell | null;
    },
  });
};

// 셀 리더 권한 확인
export const useIsLeader = (cellId: string) => {
  return useQuery({
    queryKey: cellKeys.leadership(cellId),
    queryFn: async () => {
      const response = await cellsAPI.isLeader(cellId);
      return response.data as { isLeader: boolean };
    },
    enabled: !!cellId,
  });
};

// 셀 멤버 권한 확인
export const useIsMember = (cellId: string) => {
  return useQuery({
    queryKey: cellKeys.membership(cellId),
    queryFn: async () => {
      const response = await cellsAPI.isMember(cellId);
      return response.data as { isMember: boolean };
    },
    enabled: !!cellId,
  });
};

// 셀 생성
export const useCreateCell = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await cellsAPI.createCell(data);
      return response.data as Cell;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cellKeys.all });
    },
  });
};

// 셀 수정
export const useUpdateCell = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; description?: string };
    }) => {
      const response = await cellsAPI.updateCell(id, data);
      return response.data as Cell;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(cellKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: cellKeys.lists() });
    },
  });
};

// 셀 삭제
export const useDeleteCell = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await cellsAPI.deleteCell(id);
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: cellKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: cellKeys.lists() });
    },
  });
};

// 셀에 멤버 추가
export const useAddCellMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cellId,
      userId,
    }: {
      cellId: string;
      userId: string;
    }) => {
      const response = await cellsAPI.addMember(cellId, { userId });
      return response.data as CellMember;
    },
    onSuccess: (_, variables) => {
      // 셀 상세 정보 새로고침
      queryClient.invalidateQueries({
        queryKey: cellKeys.detail(variables.cellId),
      });
      // 사용자의 셀 정보 새로고침
      queryClient.invalidateQueries({ queryKey: cellKeys.userCell() });
    },
  });
};

// 셀에서 멤버 제거
export const useRemoveCellMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cellId,
      memberId,
    }: {
      cellId: string;
      memberId: string;
    }) => {
      await cellsAPI.removeMember(cellId, memberId);
      return { cellId, memberId };
    },
    onSuccess: (data) => {
      // 셀 상세 정보 새로고침
      queryClient.invalidateQueries({ queryKey: cellKeys.detail(data.cellId) });
      // 사용자의 셀 정보 새로고침
      queryClient.invalidateQueries({ queryKey: cellKeys.userCell() });
    },
  });
};
