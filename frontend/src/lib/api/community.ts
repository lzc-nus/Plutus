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

// FEED

/**
 * Fetch posts from followed users, newest-first.
 * Fall back to global feed if the current user follows nobody.
 */
export async function getFeed(limit?: number, before?: string | null) {
  configureApiClient();
  return communityFeed({
    query: { limit, before },
  });
}

/**
 * Fetches all posts regardless of follows, newest-first.
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
 * Return the total number of posts posted by a user.
 */
export async function getUserPostsCount(userId: string) {
  configureApiClient();
  return communityUserPostsCount({ path: { user_id: userId } });
}

// POST

/**
 * Fetch a single post by ID.
 */
export async function getPost(postId: string) {
  configureApiClient();
  return communityPostsGet({
    path: { post_id: postId },
  });
}

/**
 * Create a new post with the given content blocks.
 */
export async function createPost(payload: PostCreate) {
  configureApiClient();
  return communityPostsCreate({ body: payload });
}

/**
 * Edit the content blocks of an existing post owned by the current user.
 */
export async function updatePost(postId: string, payload: PostUpdate) {
  configureApiClient();
  return communityPostsUpdate({
    path: { post_id: postId },
    body: payload,
  });
}

export async function deletePost(postId: string) {
  configureApiClient();
  return communityPostsDelete({
    path: { post_id: postId },
  });
}

// POST REACTIONS

/**
 * Return the updated post with the new like count.
 */
export async function likePost(postId: string) {
  configureApiClient();
  return communityPostsLike({
    path: { post_id: postId },
  });
}

/**
 * Remove the current user's like from a post.
 */
export async function unlikePost(postId: string) {
  configureApiClient();
  return communityPostsUnlike({
    path: { post_id: postId },
  });
}

/**
 * Save a post to the current user's saved list.
 */
export async function savePost(postId: string) {
  configureApiClient();
  return communityPostsSave({
    path: { post_id: postId },
  });
}

/**
 * Remove a post from the current user's saved list.
 */
export async function unsavePost(postId: string) {
  configureApiClient();
  return communityPostsUnsave({
    path: { post_id: postId },
  });
}

/**
 * Return all posts saved by the current user, newest save first.
 */
export async function getSavedPosts() {
  configureApiClient();
  return communityPostsSavedList();
}

/**
 * Record a share event for a post and return the generated URL.
 */
export async function sharePost(postId: string) {
  configureApiClient();
  return communityPostsShare({
    path: { post_id: postId },
  });
}

// REPOST

/**
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

export async function deleteRepost(repostId: string) {
  configureApiClient();
  return communityRepostsDelete({
    path: { repost_id: repostId },
  });
}

// COMMENT

/**
 * Fetch all comments on a post, oldest first.
 */
export async function listComments(postId: string) {
  configureApiClient();
  return communityCommentsList({
    path: { post_id: postId },
  });
}

export async function createComment(postId: string, payload: CommentCreate) {
  configureApiClient();
  return communityCommentsCreate({
    path: { post_id: postId },
    body: payload,
  });
}

/**
 * Edit a comment owned by the current user.
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

export async function deleteComment(postId: string, commentId: string) {
  configureApiClient();
  return communityCommentsDelete({
    path: { post_id: postId, comment_id: commentId },
  });
}

// COMMENT REACTION

/**
 * Return the updated comment with the new like_count.
 */
export async function likeComment(postId: string, commentId: string) {
  configureApiClient();
  return communityCommentsLike({
    path: { post_id: postId, comment_id: commentId },
  });
}

/**
 * Remove the current user's like from a comment.
 */
export async function unlikeComment(postId: string, commentId: string) {
  configureApiClient();
  return communityCommentsUnlike({
    path: { post_id: postId, comment_id: commentId },
  });
}

/**
 * Record a share event for a comment and return the generated URL.
 */
export async function shareComment(postId: string, commentId: string) {
  configureApiClient();
  return communityCommentsShare({
    path: { post_id: postId, comment_id: commentId },
  });
}

// FOLLOW

export async function followUser(userId: string) {
  configureApiClient();
  return communityFollow({
    path: { user_id: userId },
  });
}

export async function unfollowUser(userId: string) {
  configureApiClient();
  return communityUnfollow({
    path: { user_id: userId },
  });
}

/**
 * Return all users that userId is following.
 */
export async function getFollowing(userId: string) {
  configureApiClient();
  return communityFollowingList({
    path: { user_id: userId },
  });
}

/**
 * Return all users following userId.
 */
export async function getFollowers(userId: string) {
  configureApiClient();
  return communityFollowersList({
    path: { user_id: userId },
  });
}
