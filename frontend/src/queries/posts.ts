interface PostsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const postKeys = {
  all: ["posts"] as const,
  lists: () => [...postKeys.all, "list"] as const,
  list: (params: PostsParams = {}) =>
    [...postKeys.lists(), { params }] as const,
  details: () => [...postKeys.all, "detail"] as const,
  detail: (id: string) => [...postKeys.details(), { id }] as const,
  likeStatus: (postId: string) =>
    [...postKeys.all, "like-status", { postId }] as const,
} as const;
