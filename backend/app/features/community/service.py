from __future__ import annotations

import datetime
import uuid

from sqlalchemy import func
from sqlmodel import Session, select

from app.features.community.models import (
    Comment,
    CommentLike,
    CommentShare,
    Post,
    PostLike,
    PostSave,
    PostShare,
    Repost,
    UserFollow,
)
from app.features.community.schemas import (
    CommentCreate,
    CommentUpdate,
    PostCreate,
    PostUpdate,
    RepostCreate,
)

UTC = datetime.timezone.utc


# ── Feed ──────────────────────────────────────────────────────────────────────

def list_feed_posts(
    db: Session,
    *,
    current_user_id: uuid.UUID,
    limit: int = 20,
    before: datetime.datetime | None = None,
) -> list[Post]:
    """
    Posts from followed users, newest-first.
    Falls back to global feed if the user follows nobody.
    Paginate by passing `before` = created_at of the oldest post in the current page.
    """
    followee_ids = list(
        db.exec(
            select(UserFollow.followee_id).where(UserFollow.follower_id == current_user_id)
        ).all()
    )

    stmt = select(Post)
    if followee_ids:
        stmt = stmt.where(Post.author_id.in_(followee_ids))  # type: ignore[attr-defined]
    if before is not None:
        stmt = stmt.where(Post.created_at < before)  # type: ignore[attr-defined]

    stmt = stmt.order_by(Post.created_at.desc()).limit(limit)  # type: ignore[attr-defined]
    return list(db.exec(stmt).all())


def list_global_posts(
    db: Session,
    *,
    limit: int = 20,
    before: datetime.datetime | None = None,
) -> list[Post]:
    """All posts newest-first, for the discover/global feed."""
    stmt = select(Post)
    if before is not None:
        stmt = stmt.where(Post.created_at < before)  # type: ignore[attr-defined]
    stmt = stmt.order_by(Post.created_at.desc()).limit(limit)  # type: ignore[attr-defined]
    return list(db.exec(stmt).all())


# ── Posts ─────────────────────────────────────────────────────────────────────

def get_post(db: Session, *, post_id: uuid.UUID) -> Post | None:
    return db.get(Post, post_id)

def create_post(
    db: Session,
    *,
    author_id: uuid.UUID,
    payload: PostCreate,
) -> Post:
    post = Post(author_id=author_id, content_blocks=payload.content_blocks)
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def update_post(
    db: Session,
    *,
    post_id: uuid.UUID,
    author_id: uuid.UUID,
    payload: PostUpdate,
) -> Post | None:
    post = _get_author_post(db, post_id=post_id, author_id=author_id)
    if not post:
        return None
    if payload.content_blocks is not None:
        post.content_blocks = payload.content_blocks
    post.updated_at = datetime.datetime.now(UTC)
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def delete_post(
    db: Session,
    *,
    post_id: uuid.UUID,
    author_id: uuid.UUID,
) -> bool:
    post = _get_author_post(db, post_id=post_id, author_id=author_id)
    if not post:
        return False
    db.delete(post)
    db.commit()
    return True


def _get_author_post(
    db: Session,
    *,
    post_id: uuid.UUID,
    author_id: uuid.UUID,
) -> Post | None:
    return db.exec(
        select(Post).where(Post.id == post_id, Post.author_id == author_id)
    ).first()


# ── Comments ──────────────────────────────────────────────────────────────────

def list_comments(db: Session, *, post_id: uuid.UUID) -> list[Comment]:
    return list(
        db.exec(
            select(Comment)
            .where(Comment.post_id == post_id)
            .order_by(Comment.created_at)  # type: ignore[attr-defined]
        ).all()
    )


def create_comment(
    db: Session,
    *,
    post_id: uuid.UUID,
    author_id: uuid.UUID,
    payload: CommentCreate,
) -> Comment | None:
    """Creates a comment and increments the post's comment_count. Returns None if post not found."""
    post = db.get(Post, post_id)
    if not post:
        return None

    comment = Comment(
        post_id=post_id,
        author_id=author_id,
        content_blocks=payload.content_blocks,
    )
    db.add(comment)
    post.comment_count += 1
    db.add(post)
    db.commit()
    db.refresh(comment)
    return comment


def update_comment(
    db: Session,
    *,
    comment_id: uuid.UUID,
    author_id: uuid.UUID,
    payload: CommentUpdate,
) -> Comment | None:
    comment = _get_author_comment(db, comment_id=comment_id, author_id=author_id)
    if not comment:
        return None
    if payload.content_blocks is not None:
        comment.content_blocks = payload.content_blocks
    comment.updated_at = datetime.datetime.now(UTC)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


def delete_comment(
    db: Session,
    *,
    comment_id: uuid.UUID,
    author_id: uuid.UUID,
) -> bool:
    comment = _get_author_comment(db, comment_id=comment_id, author_id=author_id)
    if not comment:
        return False

    post = db.get(Post, comment.post_id)
    db.delete(comment)
    if post and post.comment_count > 0:
        post.comment_count -= 1
        db.add(post)
    db.commit()
    return True


def _get_author_comment(
    db: Session,
    *,
    comment_id: uuid.UUID,
    author_id: uuid.UUID,
) -> Comment | None:
    return db.exec(
        select(Comment).where(
            Comment.id == comment_id,
            Comment.author_id == author_id,
        )
    ).first()


# ── Reposts ───────────────────────────────────────────────────────────────────

def create_repost(
    db: Session,
    *,
    author_id: uuid.UUID,
    post_id: uuid.UUID,
    payload: RepostCreate,
) -> Repost | None:
    """Creates a repost (simple or quote) and increments the original post's repost_count."""
    post = db.get(Post, post_id)
    if not post:
        return None

    repost = Repost(
        author_id=author_id,
        original_post_id=post_id,
        content_blocks=payload.content_blocks,
    )
    db.add(repost)
    post.repost_count += 1
    db.add(post)
    db.commit()
    db.refresh(repost)
    return repost


def delete_repost(
    db: Session,
    *,
    repost_id: uuid.UUID,
    author_id: uuid.UUID,
) -> bool:
    repost = db.exec(
        select(Repost).where(Repost.id == repost_id, Repost.author_id == author_id)
    ).first()
    if not repost:
        return False

    post = db.get(Post, repost.original_post_id)
    db.delete(repost)
    if post and post.repost_count > 0:
        post.repost_count -= 1
        db.add(post)
    db.commit()
    return True


# ── Post likes ────────────────────────────────────────────────────────────────

def like_post(
    db: Session,
    *,
    user_id: uuid.UUID,
    post_id: uuid.UUID,
) -> PostLike | None:
    """Returns None if already liked or post not found."""
    post = db.get(Post, post_id)
    if not post:
        return None

    existing = db.exec(
        select(PostLike).where(PostLike.user_id == user_id, PostLike.post_id == post_id)
    ).first()
    if existing:
        return None

    like = PostLike(user_id=user_id, post_id=post_id)
    db.add(like)
    post.like_count += 1
    db.add(post)
    db.commit()
    db.refresh(like)
    return like


def unlike_post(
    db: Session,
    *,
    user_id: uuid.UUID,
    post_id: uuid.UUID,
) -> bool:
    like = db.exec(
        select(PostLike).where(PostLike.user_id == user_id, PostLike.post_id == post_id)
    ).first()
    if not like:
        return False

    post = db.get(Post, post_id)
    db.delete(like)
    if post and post.like_count > 0:
        post.like_count -= 1
        db.add(post)
    db.commit()
    return True


# ── Comment likes ─────────────────────────────────────────────────────────────

def like_comment(
    db: Session,
    *,
    user_id: uuid.UUID,
    comment_id: uuid.UUID,
) -> CommentLike | None:
    """Returns None if already liked or comment not found."""
    comment = db.get(Comment, comment_id)
    if not comment:
        return None

    existing = db.exec(
        select(CommentLike).where(
            CommentLike.user_id == user_id,
            CommentLike.comment_id == comment_id,
        )
    ).first()
    if existing:
        return None

    like = CommentLike(user_id=user_id, comment_id=comment_id)
    db.add(like)
    comment.like_count += 1
    db.add(comment)
    db.commit()
    db.refresh(like)
    return like


def unlike_comment(
    db: Session,
    *,
    user_id: uuid.UUID,
    comment_id: uuid.UUID,
) -> bool:
    like = db.exec(
        select(CommentLike).where(
            CommentLike.user_id == user_id,
            CommentLike.comment_id == comment_id,
        )
    ).first()
    if not like:
        return False

    comment = db.get(Comment, comment_id)
    db.delete(like)
    if comment and comment.like_count > 0:
        comment.like_count -= 1
        db.add(comment)
    db.commit()
    return True


# ── Post saves ────────────────────────────────────────────────────────────────

def save_post(
    db: Session,
    *,
    user_id: uuid.UUID,
    post_id: uuid.UUID,
) -> PostSave | None:
    """Returns None if already saved or post not found."""
    post = db.get(Post, post_id)
    if not post:
        return None

    existing = db.exec(
        select(PostSave).where(PostSave.user_id == user_id, PostSave.post_id == post_id)
    ).first()
    if existing:
        return None

    save = PostSave(user_id=user_id, post_id=post_id)
    db.add(save)
    post.save_count += 1
    db.add(post)
    db.commit()
    db.refresh(save)
    return save


def unsave_post(
    db: Session,
    *,
    user_id: uuid.UUID,
    post_id: uuid.UUID,
) -> bool:
    save = db.exec(
        select(PostSave).where(PostSave.user_id == user_id, PostSave.post_id == post_id)
    ).first()
    if not save:
        return False

    post = db.get(Post, post_id)
    db.delete(save)
    if post and post.save_count > 0:
        post.save_count -= 1
        db.add(post)
    db.commit()
    return True


def list_saved_posts(db: Session, *, user_id: uuid.UUID) -> list[Post]:
    """Returns all posts saved by the user, newest save first."""
    stmt = (
        select(Post)
        .join(PostSave, PostSave.post_id == Post.id)  # type: ignore[arg-type]
        .where(PostSave.user_id == user_id)
        .order_by(PostSave.created_at.desc())  # type: ignore[attr-defined]
    )
    return list(db.exec(stmt).all())


# ── Post shares ───────────────────────────────────────────────────────────────

def share_post(
    db: Session,
    *,
    user_id: uuid.UUID,
    post_id: uuid.UUID,
    base_url: str,
) -> tuple[PostShare, str] | None:
    """Records the share event, increments share_count, and returns the share URL."""
    post = db.get(Post, post_id)
    if not post:
        return None

    share = PostShare(user_id=user_id, post_id=post_id)
    db.add(share)
    post.share_count += 1
    db.add(post)
    db.commit()
    db.refresh(share)

    share_url = f"{base_url}/posts/{post_id}"
    return share, share_url


# ── Comment shares ────────────────────────────────────────────────────────────

def share_comment(
    db: Session,
    *,
    user_id: uuid.UUID,
    comment_id: uuid.UUID,
    base_url: str,
) -> tuple[CommentShare, str] | None:
    """Records the share event, increments share_count, and returns the share URL."""
    comment = db.get(Comment, comment_id)
    if not comment:
        return None

    share = CommentShare(user_id=user_id, comment_id=comment_id)
    db.add(share)
    comment.share_count += 1
    db.add(comment)
    db.commit()
    db.refresh(share)

    share_url = f"{base_url}/posts/{comment.post_id}?comment={comment_id}"
    return share, share_url


# ── Follows ───────────────────────────────────────────────────────────────────

def follow_user(
    db: Session,
    *,
    follower_id: uuid.UUID,
    followee_id: uuid.UUID,
) -> UserFollow | None:
    """Returns None if already following or attempting self-follow."""
    if follower_id == followee_id:
        return None

    existing = db.exec(
        select(UserFollow).where(
            UserFollow.follower_id == follower_id,
            UserFollow.followee_id == followee_id,
        )
    ).first()
    if existing:
        return None

    follow = UserFollow(follower_id=follower_id, followee_id=followee_id)
    db.add(follow)
    db.commit()
    db.refresh(follow)
    return follow


def unfollow_user(
    db: Session,
    *,
    follower_id: uuid.UUID,
    followee_id: uuid.UUID,
) -> bool:
    follow = db.exec(
        select(UserFollow).where(
            UserFollow.follower_id == follower_id,
            UserFollow.followee_id == followee_id,
        )
    ).first()
    if not follow:
        return False
    db.delete(follow)
    db.commit()
    return True


def list_following(db: Session, *, user_id: uuid.UUID) -> list[UserFollow]:
    return list(db.exec(select(UserFollow).where(UserFollow.follower_id == user_id)).all())


def list_followers(db: Session, *, user_id: uuid.UUID) -> list[UserFollow]:
    return list(db.exec(select(UserFollow).where(UserFollow.followee_id == user_id)).all())