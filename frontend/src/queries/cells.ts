export const cellKeys = {
  all: ["cells"] as const,
  lists: () => [...cellKeys.all, "list"] as const,
  details: () => [...cellKeys.all, "detail"] as const,
  detail: (id: string) => [...cellKeys.details(), { id }] as const,
  userCell: () => [...cellKeys.all, "user-cell"] as const,
  leadership: (cellId: string) =>
    [...cellKeys.all, "leadership", { cellId }] as const,
  membership: (cellId: string) =>
    [...cellKeys.all, "membership", { cellId }] as const,
} as const;
