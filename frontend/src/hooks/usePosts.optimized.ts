import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { postsAPI } from "../lib/api";

// 쿼리 키 팩토리
export const postKeys = {
  all: ["posts"] as const,
  lists: () => [...postKeys.all, "list"] as const,
  list: (filters: {
    page?: number;
    limit?: number;
    search?: string;
    author?: string;
  }) => [...postKeys.lists(), filters] as const,
  details: () => [...postKeys.all, "detail"] as const,
  detail: (id: string) => [...postKeys.details(), { id }] as const,
  popular: () => [...postKeys.all, "popular"] as const,
  infinite: (filters: { search?: string; author?: string }) =>
    [...postKeys.all, "infinite", filters] as const,
};

export interface PostsResponse {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  bibleVerse?: string;
  likeCount: number;
  isLiked?: boolean;
  author: {
    id: string;
    name: string;
    profileImage?: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * 최적화된 게시물 목록 조회
 * - staleTime 설정으로 불필요한 재요청 방지
 * - 백그라운드 업데이트로 UX 향상
 */
export function useGetPosts(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    author?: string;
  } = {}
) {
  return useQuery({
    queryKey: postKeys.list(params),
    queryFn: () => postsAPI.getPosts(params),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * 무한 스크롤을 위한 최적화된 쿼리
 */
export function useGetInfinitePosts(
  params: {
    search?: string;
    author?: string;
    limit?: number;
  } = {}
) {
  const { limit = 20, ...filters } = params;

  return useInfiniteQuery({
    queryKey: postKeys.infinite(filters),
    queryFn: ({ pageParam = 1 }) =>
      postsAPI.getPosts({ ...filters, page: pageParam, limit }),
    initialPageParam: 1,
    select: (data) => ({
      pages: data.pages.map((page: any) => page.data),
      pageParams: data.pageParams,
    }),
    getNextPageParam: (lastPage: any) => {
      const { page, totalPages } = lastPage.data;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    maxPages: 10, // 메모리 사용량 제한
  });
}

/**
 * 단일 게시물 조회
 */
export function useGetPost(id: string) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => postsAPI.getPost(id),
    select: (data) => data.data,
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10분간 fresh 상태 유지
    gcTime: 30 * 60 * 1000, // 30분간 캐시 유지
    retry: 2,
  });
}

/**
 * 인기 게시물 조회
 */
export function useGetPopularPosts() {
  return useQuery({
    queryKey: postKeys.popular(),
    queryFn: () => postsAPI.getPopularPosts(),
    select: (data) => data.data,
    staleTime: 30 * 60 * 1000, // 30분간 fresh 상태 유지
    gcTime: 60 * 60 * 1000, // 1시간 캐시 유지
    refetchOnWindowFocus: false,
  });
}

/**
 * 게시물 생성
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postsAPI.createPost,
    onSuccess: (data) => {
      // 새 게시물을 목록 캐시에 추가 (Optimistic Update)
      queryClient.setQueryData(
        postKeys.list({ page: 1, limit: 20 }),
        (oldData: any) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            posts: [data.data, ...oldData.posts.slice(0, 19)],
            total: oldData.total + 1,
          };
        }
      );

      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postKeys.popular() });
    },
    onError: () => {
      // 에러 시 관련 쿼리 다시 가져오기
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}

/**
 * 게시물 수정
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      postsAPI.updatePost(id, data),
    onSuccess: (data, variables) => {
      // 상세 페이지 캐시 업데이트
      queryClient.setQueryData(postKeys.detail(variables.id), data);

      // 목록 캐시에서 해당 게시물 업데이트
      queryClient.setQueriesData(
        { queryKey: postKeys.lists() },
        (oldData: any) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            posts: oldData.posts.map((post: Post) =>
              post.id === variables.id ? { ...post, ...data.data } : post
            ),
          };
        }
      );

      // 무한 스크롤 캐시 업데이트
      queryClient.setQueriesData(
        { queryKey: [...postKeys.all, "infinite"] },
        (oldData: any) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              posts: page.posts.map((post: Post) =>
                post.id === variables.id ? { ...post, ...data.data } : post
              ),
            })),
          };
        }
      );
    },
  });
}

/**
 * 게시물 삭제
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postsAPI.deletePost,
    onSuccess: (_, deletedId) => {
      // 상세 페이지 캐시 제거
      queryClient.removeQueries({ queryKey: postKeys.detail(deletedId) });

      // 목록 캐시에서 해당 게시물 제거
      queryClient.setQueriesData(
        { queryKey: postKeys.lists() },
        (oldData: any) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            posts: oldData.posts.filter((post: Post) => post.id !== deletedId),
            total: oldData.total - 1,
          };
        }
      );

      // 무한 스크롤 캐시에서 해당 게시물 제거
      queryClient.setQueriesData(
        { queryKey: [...postKeys.all, "infinite"] },
        (oldData: any) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              posts: page.posts.filter((post: Post) => post.id !== deletedId),
            })),
          };
        }
      );

      // 인기 게시물 캐시 무효화
      queryClient.invalidateQueries({ queryKey: postKeys.popular() });
    },
  });
}

/**
 * 좋아요 토글 (Optimistic Update)
 */
export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postsAPI.toggleLike,
    onMutate: async (postId: string) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: postKeys.detail(postId) });

      // 이전 데이터 백업
      const previousPost = queryClient.getQueryData(postKeys.detail(postId));

      // Optimistic Update
      queryClient.setQueryData(postKeys.detail(postId), (old: any) => {
        if (!old) return old;

        const isCurrentlyLiked = old.isLiked;
        return {
          ...old,
          isLiked: !isCurrentlyLiked,
          likeCount: isCurrentlyLiked ? old.likeCount - 1 : old.likeCount + 1,
        };
      });

      // 목록 캐시도 업데이트
      queryClient.setQueriesData(
        { queryKey: postKeys.lists() },
        (oldData: any) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            posts: oldData.posts.map((post: Post) => {
              if (post.id === postId) {
                const isCurrentlyLiked = post.isLiked;
                return {
                  ...post,
                  isLiked: !isCurrentlyLiked,
                  likeCount: isCurrentlyLiked
                    ? post.likeCount - 1
                    : post.likeCount + 1,
                };
              }
              return post;
            }),
          };
        }
      );

      return { previousPost };
    },
    onError: (_err, postId, context) => {
      // 에러 시 이전 상태로 롤백
      if (context?.previousPost) {
        queryClient.setQueryData(postKeys.detail(postId), context.previousPost);
      }
    },
    onSettled: (_data, _error, postId) => {
      // 성공/실패 관계없이 최신 데이터로 동기화
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
    },
  });
}

/**
 * 프리페칭 헬퍼
 */
export function usePrefetchPost() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: postKeys.detail(id),
      queryFn: () => postsAPI.getPost(id),
      staleTime: 10 * 60 * 1000,
    });
  };
}

/**
 * 백그라운드 동기화
 */
export function usePostsSync() {
  const queryClient = useQueryClient();

  const syncPosts = () => {
    // 현재 활성화된 모든 게시물 쿼리를 백그라운드에서 다시 가져오기
    queryClient.invalidateQueries({
      queryKey: postKeys.all,
      refetchType: "active",
    });
  };

  return { syncPosts };
}
