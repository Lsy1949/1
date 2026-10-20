/**
 * 广场页面数据层：列表 / 详情查询，点赞乐观更新，发布动态。
 *
 * 点赞是核心：onMutate 立即改写 ['square','info'] 与 ['square','feed',id]
 * 两份缓存；onError 回滚；onSettled 与后端最终数据对齐。
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { squareApi } from '@/api'
import type { SquareCommentDTO, SquareFeedDTO, SquareInfoDTO } from '@/api'
import type {
  SquareCommentCreateInput,
  SquareCreateInput,
} from '@/features/square'
import { useI18n } from '@/i18n'

export function useSquareInfo() {
  return useQuery({
    queryKey: ['square', 'info'],
    queryFn: ({ signal }) => squareApi.fetchSquareInfo(signal),
  })
}

export function useSquareFeed(id: string | undefined) {
  return useQuery({
    queryKey: ['square', 'feed', id],
    queryFn: ({ signal }) => squareApi.fetchSquareFeed(id!, signal),
    enabled: Boolean(id),
    retry: false,
  })
}

/** 点赞 / 取消点赞：乐观更新 + 失败回滚 + 最终对齐 */
export function useToggleLike() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: number) => squareApi.toggleLike(id),

    onMutate: async (id) => {
      // 取消在途请求，避免旧响应覆盖乐观值
      await queryClient.cancelQueries({ queryKey: ['square'] })

      const previousInfo = queryClient.getQueryData<SquareInfoDTO>(['square', 'info'])
      const previousFeed = queryClient.getQueryData<SquareFeedDTO>(['square', 'feed', id])

      // 列表缓存立即翻转
      queryClient.setQueryData<SquareInfoDTO>(['square', 'info'], (old) =>
        old
          ? {
              ...old,
              feedItems: old.feedItems.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      liked: !item.liked,
                      likes: Math.max(0, item.likes + (item.liked ? -1 : 1)),
                    }
                  : item,
              ),
            }
          : old,
      )

      // 详情缓存同步翻转
      queryClient.setQueryData<SquareFeedDTO>(['square', 'feed', id], (old) =>
        old
          ? {
              ...old,
              liked: !old.liked,
              likes: Math.max(0, old.likes + (old.liked ? -1 : 1)),
            }
          : old,
      )

      return { previousInfo, previousFeed, id }
    },

    onError: (error: Error, _id, context) => {
      // 回滚到操作前的快照
      if (context?.previousInfo) {
        queryClient.setQueryData(['square', 'info'], context.previousInfo)
      }
      if (context?.previousFeed) {
        queryClient.setQueryData(['square', 'feed', context.id], context.previousFeed)
      }
      message.error(error.message)
    },

    onSettled: () => {
      // 与后端最终数据对齐
      return queryClient.invalidateQueries({ queryKey: ['square'] })
    },
  })
}

/** 发布动态：成功后刷新列表 */
export function useCreateFeed() {
  const { t } = useI18n()
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SquareCreateInput) => squareApi.createFeed(input),
    onSuccess: () => {
      message.success(t('square.create.success.body'))
      return queryClient.invalidateQueries({ queryKey: ['square', 'info'] })
    },
    onError: (error: Error) => message.error(error.message),
  })
}

/** 评论列表（时间倒序） */
export function useSquareComments(feedId: string | undefined) {
  return useQuery({
    queryKey: ['square', 'comments', feedId],
    queryFn: ({ signal }) => squareApi.fetchComments(feedId!, signal),
    enabled: Boolean(feedId),
  })
}

/** 发布评论：同时刷新评论列表与帖子（commentCount 变化） */
export function useCreateComment(feedId: string | undefined) {
  const { t } = useI18n()
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SquareCommentCreateInput) =>
      squareApi.createComment(feedId!, input),
    onSuccess: () => {
      message.success(t('square.detail.comments.submitted'))
      queryClient.invalidateQueries({ queryKey: ['square', 'comments', feedId] })
      queryClient.invalidateQueries({ queryKey: ['square', 'feed', feedId] })
      queryClient.invalidateQueries({ queryKey: ['square', 'info'] })
    },
    onError: (error: Error) => message.error(error.message),
  })
}

/** 评论点赞：乐观更新评论列表缓存 + 失败回滚 */
export function useToggleCommentLike(feedId: string | undefined) {
  const queryClient = useQueryClient()
  const { message } = App.useApp()
  const queryKey = ['square', 'comments', feedId]

  return useMutation({
    mutationFn: (id: number) => squareApi.toggleCommentLike(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey })

      const previous = queryClient.getQueryData<SquareCommentDTO[]>(queryKey)

      queryClient.setQueryData<SquareCommentDTO[]>(queryKey, (old) =>
        old?.map((comment) =>
          comment.id === id
            ? {
                ...comment,
                liked: !comment.liked,
                likes: Math.max(0, comment.likes + (comment.liked ? -1 : 1)),
              }
            : comment,
        ),
      )

      return { previous }
    },

    onError: (error: Error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
      message.error(error.message)
    },

    onSettled: () => {
      return queryClient.invalidateQueries({ queryKey })
    },
  })
}
