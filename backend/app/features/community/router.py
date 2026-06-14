from __future__ import annotations

import datetime
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlmodel import Session

from app.api.deps import CurrentUser
from app.db.session import get_db
from app.features.community.schemas import (
    CommentCreate,
    CommentRead,
    CommentUpdate,
    FollowRead,
    PostCreate,
    PostRead,
    PostUpdate,
    RepostCreate,
    RepostRead,
    ShareLinkRead,
)
from app.features.community.models import Comment, Post
from app.features.community.service import (
    create_comment,
    create_post,
    create_repost,
    delete_comment,
    delete_post,
    delete_repost,
    follow_user,
    like_comment,
    like_post,
    list_comments,
    list_feed_posts,
    list_followers,
    list_following,
    list_global_posts,
    list_saved_posts,
    save_post,
    share_comment,
    share_post,
    unfollow_user,
    unlike_comment,
    unlike_post,
    unsave_post,
    update_comment,
    update_post,
)

router = APIRouter(prefix="/community", tags=["Community"])


# ── Feed ──────────────────────────────────────────────────────────────────────

@router.get(
    "/feed",
    response_model=list[PostRead],
    operation_id="community_feed",
)
def get_feed(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    before: Annotated[datetime.datetime | None, Query()] = None,
) -> list[PostRead]:
    """
    Chronological feed of posts from followed users.
    Falls back to global feed if the current user follows nobody.
    Paginate by passing `before` = the `created_at` of the oldest post
    in the current page.
    """
    posts = list_feed_posts(
        db,
        current_user_id=current_user.id,
        limit=limit,
        before=before,
    )
    return [PostRead.model_validate(p, from_attributes=True) for p in posts]


@router.get(
    "/feed/global",
    response_model=list[PostRead],
    operation_id="community_feed_global",
)
def get_global_feed(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    before: Annotated[datetime.datetime | None, Query()] = None,
) -> list[PostRead]:
    """Chronological feed of all posts regardless of follows."""
    posts = list_global_posts(db, limit=limit, before=before)
    return [PostRead.model_validate(p, from_attributes=True) for p in posts]


# ── Posts ─────────────────────────────────────────────────────────────────────

@router.get(
    "/posts/saved",
    response_model=list[PostRead],
    operation_id="community_posts_saved_list",
)
def get_saved_posts(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[PostRead]:
    """Returns all posts saved by the current user, newest save first."""
    posts = list_saved_posts(db, user_id=current_user.id)
    return [PostRead.model_validate(p, from_attributes=True) for p in posts]


@router.get(
    "/posts/{post_id}",
    response_model=PostRead,
    operation_id="community_posts_get",
)
def get_post_endpoint(
    post_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> PostRead:
    from app.features.community.models import Post
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )
    return PostRead.model_validate(post, from_attributes=True)

@router.post(
    "/posts",
    response_model=PostRead,
    status_code=status.HTTP_201_CREATED,
    operation_id="community_posts_create",
)
def create_post_endpoint(
    payload: PostCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> PostRead:
    post = create_post(db, author_id=current_user.id, payload=payload)
    return PostRead.model_validate(post, from_attributes=True)


@router.patch(
    "/posts/{post_id}",
    response_model=PostRead,
    operation_id="community_posts_update",
)
def update_post_endpoint(
    post_id: uuid.UUID,
    payload: PostUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> PostRead:
    updated = update_post(
        db,
        post_id=post_id,
        author_id=current_user.id,
        payload=payload,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found or unauthorized.",
        )
    return PostRead.model_validate(updated, from_attributes=True)


@router.delete(
    "/posts/{post_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="community_posts_delete",
)
def delete_post_endpoint(
    post_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    success = delete_post(db, post_id=post_id, author_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found or unauthorized.",
        )


# ── Post likes ────────────────────────────────────────────────────────────────

@router.post(
    "/posts/{post_id}/like",
    response_model=PostRead,
    status_code=status.HTTP_201_CREATED,
    operation_id="community_posts_like",
)
def like_post_endpoint(
    post_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> PostRead:
    like = like_post(db, user_id=current_user.id, post_id=post_id)
    if not like:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Post not found or already liked.",
        )
    post = db.get(Post, post_id)
    return PostRead.model_validate(post, from_attributes=True)


@router.delete(
    "/posts/{post_id}/like",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="community_posts_unlike",
)
def unlike_post_endpoint(
    post_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    success = unlike_post(db, user_id=current_user.id, post_id=post_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Like not found.",
        )


# ── Post saves ────────────────────────────────────────────────────────────────

@router.post(
    "/posts/{post_id}/save",
    response_model=PostRead,
    status_code=status.HTTP_201_CREATED,
    operation_id="community_posts_save",
)
def save_post_endpoint(
    post_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> PostRead:
    saved = save_post(db, user_id=current_user.id, post_id=post_id)
    if not saved:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Post not found or already saved.",
        )
    post = db.get(Post, post_id)
    return PostRead.model_validate(post, from_attributes=True)


@router.delete(
    "/posts/{post_id}/save",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="community_posts_unsave",
)
def unsave_post_endpoint(
    post_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    success = unsave_post(db, user_id=current_user.id, post_id=post_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved post not found.",
        )


# ── Post shares ───────────────────────────────────────────────────────────────

@router.post(
    "/posts/{post_id}/share",
    response_model=ShareLinkRead,
    status_code=status.HTTP_201_CREATED,
    operation_id="community_posts_share",
)
def share_post_endpoint(
    post_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    request: Request,
) -> ShareLinkRead:
    base_url = str(request.base_url).rstrip("/")
    result = share_post(db, user_id=current_user.id, post_id=post_id, base_url=base_url)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )
    _, share_url = result
    return ShareLinkRead(share_url=share_url, post_id=post_id)


# ── Reposts ───────────────────────────────────────────────────────────────────

@router.post(
    "/posts/{post_id}/repost",
    response_model=RepostRead,
    status_code=status.HTTP_201_CREATED,
    operation_id="community_posts_repost",
)
def repost_endpoint(
    post_id: uuid.UUID,
    payload: RepostCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> RepostRead:
    """
    Simple repost: send an empty `content_blocks` list.
    Quote repost: populate `content_blocks` with your added commentary.
    """
    repost = create_repost(
        db,
        author_id=current_user.id,
        post_id=post_id,
        payload=payload,
    )
    if not repost:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )
    return RepostRead.model_validate(repost, from_attributes=True)


@router.delete(
    "/reposts/{repost_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="community_reposts_delete",
)
def delete_repost_endpoint(
    repost_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    success = delete_repost(db, repost_id=repost_id, author_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repost not found or unauthorized.",
        )


# ── Comments ──────────────────────────────────────────────────────────────────

@router.get(
    "/posts/{post_id}/comments",
    response_model=list[CommentRead],
    operation_id="community_comments_list",
)
def get_comments(
    post_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[CommentRead]:
    comments = list_comments(db, post_id=post_id)
    return [CommentRead.model_validate(c, from_attributes=True) for c in comments]


@router.post(
    "/posts/{post_id}/comments",
    response_model=CommentRead,
    status_code=status.HTTP_201_CREATED,
    operation_id="community_comments_create",
)
def create_comment_endpoint(
    post_id: uuid.UUID,
    payload: CommentCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> CommentRead:
    comment = create_comment(
        db,
        post_id=post_id,
        author_id=current_user.id,
        payload=payload,
    )
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )
    return CommentRead.model_validate(comment, from_attributes=True)


@router.patch(
    "/posts/{post_id}/comments/{comment_id}",
    response_model=CommentRead,
    operation_id="community_comments_update",
)
def update_comment_endpoint(
    post_id: uuid.UUID,
    comment_id: uuid.UUID,
    payload: CommentUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> CommentRead:
    updated = update_comment(
        db,
        comment_id=comment_id,
        author_id=current_user.id,
        payload=payload,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found or unauthorized.",
        )
    return CommentRead.model_validate(updated, from_attributes=True)


@router.delete(
    "/posts/{post_id}/comments/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="community_comments_delete",
)
def delete_comment_endpoint(
    post_id: uuid.UUID,
    comment_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    success = delete_comment(db, comment_id=comment_id, author_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found or unauthorized.",
        )


# ── Comment likes ─────────────────────────────────────────────────────────────

@router.post(
    "/posts/{post_id}/comments/{comment_id}/like",
    response_model=CommentRead,
    status_code=status.HTTP_201_CREATED,
    operation_id="community_comments_like",
)
def like_comment_endpoint(
    post_id: uuid.UUID,
    comment_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> CommentRead:
    like = like_comment(db, user_id=current_user.id, comment_id=comment_id)
    if not like:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Comment not found or already liked.",
        )
    comment = db.get(Comment, comment_id)
    return CommentRead.model_validate(comment, from_attributes=True)


@router.delete(
    "/posts/{post_id}/comments/{comment_id}/like",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="community_comments_unlike",
)
def unlike_comment_endpoint(
    post_id: uuid.UUID,
    comment_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    success = unlike_comment(db, user_id=current_user.id, comment_id=comment_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Like not found.",
        )


# ── Comment shares ────────────────────────────────────────────────────────────

@router.post(
    "/posts/{post_id}/comments/{comment_id}/share",
    response_model=ShareLinkRead,
    status_code=status.HTTP_201_CREATED,
    operation_id="community_comments_share",
)
def share_comment_endpoint(
    post_id: uuid.UUID,
    comment_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    request: Request,
) -> ShareLinkRead:
    base_url = str(request.base_url).rstrip("/")
    result = share_comment(
        db,
        user_id=current_user.id,
        comment_id=comment_id,
        base_url=base_url,
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found.",
        )
    _, share_url = result
    return ShareLinkRead(share_url=share_url, comment_id=comment_id)


# ── Follows ───────────────────────────────────────────────────────────────────

@router.post(
    "/users/{user_id}/follow",
    response_model=FollowRead,
    status_code=status.HTTP_201_CREATED,
    operation_id="community_follow",
)
def follow_user_endpoint(
    user_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> FollowRead:
    follow = follow_user(db, follower_id=current_user.id, followee_id=user_id)
    if not follow:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already following this user or cannot follow yourself.",
        )
    return FollowRead.model_validate(follow, from_attributes=True)


@router.delete(
    "/users/{user_id}/follow",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="community_unfollow",
)
def unfollow_user_endpoint(
    user_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    success = unfollow_user(db, follower_id=current_user.id, followee_id=user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow relationship not found.",
        )


@router.get(
    "/users/{user_id}/following",
    response_model=list[FollowRead],
    operation_id="community_following_list",
)
def get_following(
    user_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[FollowRead]:
    follows = list_following(db, user_id=user_id)
    return [FollowRead.model_validate(f, from_attributes=True) for f in follows]


@router.get(
    "/users/{user_id}/followers",
    response_model=list[FollowRead],
    operation_id="community_followers_list",
)
def get_followers(
    user_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[FollowRead]:
    follows = list_followers(db, user_id=user_id)
    return [FollowRead.model_validate(f, from_attributes=True) for f in follows]
