import {
  communityFeed,
  communityFeedGlobal,
  communityPostsGet,
  communityPostsCreate,
  communityPostsUpdate,
  communityPostsDelete,
  communityPostsLike,
  communityPostsUnlike,
  communityPostsSave,
  communityPostsUnsave,
  communityPostsSavedList,
  communityPostsShare,
  communityPostsRepost,
  communityRepostsDelete,
  communityCommentsList,
  communityCommentsCreate,
  communityCommentsUpdate,
  communityCommentsDelete,
  communityCommentsLike,
  communityCommentsUnlike,
  communityCommentsShare,
  communityFollow,
  communityUnfollow,
  communityUserPostsList,
  communityUserPostsCount,
  communityFollowingList,
  communityFollowersList,
} from "@/lib/api/generated";
import type {
  PostCreate,
  PostUpdate,
  CommentCreate,
  CommentUpdate,
  RepostCreate,
} from "@/lib/api/generated";
import { configureApiClient } from "./configureClient";

// ── Feed ──────────────────────────────────────────────────────────────────────

/**
 * Fetches posts from followed users, newest-first.
 * Falls back to global feed if the current user follows nobody.
 * Pass `before` (ISO datetime string) to paginate to the next page.
 */
export async function getFeed(limit?: number, before?: string | null) {
  configureApiClient();
  return communityFeed({
    query: { limit, before },
  });
}

/**
 * Fetches all posts regardless of follows, newest-first.
 * Pass `before` (ISO datetime string) to paginate to the next page.
 */
export async function getGlobalFeed(limit?: number, before?: string | null) {
  configureApiClient();
  return communityFeedGlobal({
    query: { limit, before },
  });
}

export async function getUserPosts(userId: string, limit?: number, before?: string | null) {
  configureApiClient();
  return communityUserPostsList({
    path: { user_id: userId },
    query: { limit, before },
  });
}

/**
 * Returns the total number of posts by a user.
 */
export async function getUserPostsCount(userId: string) {
  configureApiClient();
  return communityUserPostsCount({ path: { user_id: userId } });
}

// ── Posts ─────────────────────────────────────────────────────────────────────

/**
 * Fetches a single post by ID.
 */
export async function getPost(postId: string) {
  configureApiClient();
  return communityPostsGet({
    path: { post_id: postId },
  });
}

/**
 * Creates a new post with the given content blocks.
 */
export async function createPost(payload: PostCreate) {
  configureApiClient();
  return communityPostsCreate({ body: payload });
}

/**
 * Edits the content blocks of an existing post owned by the current user.
 */
export async function updatePost(postId: string, payload: PostUpdate) {
  configureApiClient();
  return communityPostsUpdate({
    path: { post_id: postId },
    body: payload,
  });
}

/**
 * Deletes a post owned by the current user.
 */
export async function deletePost(postId: string) {
  configureApiClient();
  return communityPostsDelete({
    path: { post_id: postId },
  });
}

// ── Post reactions ────────────────────────────────────────────────────────────

/**
 * Likes a post. Returns the updated post with the new like_count.
 */
export async function likePost(postId: string) {
  configureApiClient();
  return communityPostsLike({
    path: { post_id: postId },
  });
}

/**
 * Removes the current user's like from a post.
 */
export async function unlikePost(postId: string) {
  configureApiClient();
  return communityPostsUnlike({
    path: { post_id: postId },
  });
}

/**
 * Saves a post to the current user's saved list. Returns the updated post.
 */
export async function savePost(postId: string) {
  configureApiClient();
  return communityPostsSave({
    path: { post_id: postId },
  });
}

/**
 * Removes a post from the current user's saved list.
 */
export async function unsavePost(postId: string) {
  configureApiClient();
  return communityPostsUnsave({
    path: { post_id: postId },
  });
}

/**
 * Returns all posts saved by the current user, newest save first.
 */
export async function getSavedPosts() {
  configureApiClient();
  return communityPostsSavedList();
}

/**
 * Records a share event for a post and returns the generated share URL.
 */
export async function sharePost(postId: string) {
  configureApiClient();
  return communityPostsShare({
    path: { post_id: postId },
  });
}

// ── Reposts ───────────────────────────────────────────────────────────────────

/**
 * Reposts an existing post.
 * Simple repost: pass an empty content_blocks array.
 * Quote repost: populate content_blocks with added commentary.
 */
export async function repostPost(postId: string, payload: RepostCreate) {
  configureApiClient();
  return communityPostsRepost({
    path: { post_id: postId },
    body: payload,
  });
}

/**
 * Deletes a repost owned by the current user.
 */
export async function deleteRepost(repostId: string) {
  configureApiClient();
  return communityRepostsDelete({
    path: { repost_id: repostId },
  });
}

// ── Comments ──────────────────────────────────────────────────────────────────

/**
 * Fetches all comments on a post, ordered oldest-first.
 */
export async function listComments(postId: string) {
  configureApiClient();
  return communityCommentsList({
    path: { post_id: postId },
  });
}

/**
 * Creates a comment on a post.
 */
export async function createComment(postId: string, payload: CommentCreate) {
  configureApiClient();
  return communityCommentsCreate({
    path: { post_id: postId },
    body: payload,
  });
}

/**
 * Edits a comment owned by the current user.
 */
export async function updateComment(
  postId: string,
  commentId: string,
  payload: CommentUpdate,
) {
  configureApiClient();
  return communityCommentsUpdate({
    path: { post_id: postId, comment_id: commentId },
    body: payload,
  });
}

/**
 * Deletes a comment owned by the current user.
 */
export async function deleteComment(postId: string, commentId: string) {
  configureApiClient();
  return communityCommentsDelete({
    path: { post_id: postId, comment_id: commentId },
  });
}

// ── Comment reactions ─────────────────────────────────────────────────────────

/**
 * Likes a comment. Returns the updated comment with the new like_count.
 */
export async function likeComment(postId: string, commentId: string) {
  configureApiClient();
  return communityCommentsLike({
    path: { post_id: postId, comment_id: commentId },
  });
}

/**
 * Removes the current user's like from a comment.
 */
export async function unlikeComment(postId: string, commentId: string) {
  configureApiClient();
  return communityCommentsUnlike({
    path: { post_id: postId, comment_id: commentId },
  });
}

/**
 * Records a share event for a comment and returns the generated share URL.
 */
export async function shareComment(postId: string, commentId: string) {
  configureApiClient();
  return communityCommentsShare({
    path: { post_id: postId, comment_id: commentId },
  });
}

// ── Follows ───────────────────────────────────────────────────────────────────

/**
 * Follows a user.
 */
export async function followUser(userId: string) {
  configureApiClient();
  return communityFollow({
    path: { user_id: userId },
  });
}

/**
 * Unfollows a user.
 */
export async function unfollowUser(userId: string) {
  configureApiClient();
  return communityUnfollow({
    path: { user_id: userId },
  });
}

/**
 * Returns all users that userId is following.
 */
export async function getFollowing(userId: string) {
  configureApiClient();
  return communityFollowingList({
    path: { user_id: userId },
  });
}

/**
 * Returns all users following userId.
 */
export async function getFollowers(userId: string) {
  configureApiClient();
  return communityFollowersList({
    path: { user_id: userId },
  });
}
