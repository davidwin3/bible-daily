import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { postsAPI } from "@/lib/api";

export interface Post {
  id: string;
  title: string;
  content: string;
  bibleVerse?: string;
  author: {
    id: string;
    name: string;
    profileImage?: string;
  };
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostsResponse {
  data: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PostsParams {
  page?: number;
  limit?: number;
  search?: string;
}

// Posts 목록 조회
export const usePosts = (params: PostsParams = {}) => {
  return useQuery({
    queryKey: ["posts", params],
    queryFn: async () => {
      const response = await postsAPI.getPosts(params);
      return response.data as PostsResponse;
    },
  });
};

// 단일 Post 조회
export const usePost = (id: string) => {
  return useQuery({
    queryKey: ["posts", id],
    queryFn: async () => {
      const response = await postsAPI.getPost(id);
      return response.data as Post;
    },
    enabled: !!id,
  });
};

// 좋아요 상태 조회
export const useLikeStatus = (postId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["posts", postId, "like-status"],
    queryFn: async () => {
      const response = await postsAPI.getLikeStatus(postId);
      return response.data as { liked: boolean };
    },
    enabled: enabled && !!postId,
  });
};

// 좋아요 토글
export const useToggleLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await postsAPI.toggleLike(postId);
      return response.data as { liked: boolean };
    },
    onSuccess: (data, postId) => {
      // 좋아요 상태 캐시 업데이트
      queryClient.setQueryData(["posts", postId, "like-status"], data);

      // 포스트 상세 정보의 좋아요 수 업데이트
      queryClient.setQueryData(
        ["posts", postId],
        (oldData: Post | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            likeCount: data.liked
              ? oldData.likeCount + 1
              : oldData.likeCount - 1,
          };
        }
      );

      // 포스트 목록의 좋아요 수도 업데이트
      queryClient.setQueriesData(
        { queryKey: ["posts"], exact: false },
        (oldData: PostsResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    likeCount: data.liked
                      ? post.likeCount + 1
                      : post.likeCount - 1,
                  }
                : post
            ),
          };
        }
      );
    },
  });
};

// 포스트 생성
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      bibleVerse?: string;
    }) => {
      const response = await postsAPI.createPost(data);
      return response.data as Post;
    },
    onSuccess: () => {
      // 포스트 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

// 포스트 수정
export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { title: string; content: string; bibleVerse?: string };
    }) => {
      const response = await postsAPI.updatePost(id, data);
      return response.data as Post;
    },
    onSuccess: (data) => {
      // 포스트 상세 캐시 업데이트
      queryClient.setQueryData(["posts", data.id], data);
      // 포스트 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

// 포스트 삭제
export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await postsAPI.deletePost(id);
      return id;
    },
    onSuccess: (id) => {
      // 포스트 관련 캐시 제거
      queryClient.removeQueries({ queryKey: ["posts", id] });
      // 포스트 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};
