from __future__ import annotations

import datetime
import uuid

from fastapi import HTTPException
from sqlalchemy import delete as sqlalchemy_delete
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
    PostRead,
    PostUpdate,
    RepostCreate,
)
from app.features.users.models import User
from app.features.notifications.schemas import NotificationCreate
from app.features.notifications.service import create_notification

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


def list_user_posts(
    db: Session,
    *,
    user_id: uuid.UUID,
    limit: int = 20,
    before: datetime.datetime | None = None,
) -> list[Post]:
    """Posts authored by one user, newest-first."""
    stmt = select(Post).where(Post.author_id == user_id)
    if before is not None:
        stmt = stmt.where(Post.created_at < before)  # type: ignore[attr-defined]
    stmt = stmt.order_by(Post.created_at.desc()).limit(limit)  # type: ignore[attr-defined]
    return list(db.exec(stmt).all())


def read_post_for_user(
    db: Session,
    *,
    post: Post,
    current_user_id: uuid.UUID | None,
) -> PostRead:
    """Return a post response annotated with the current user's interaction state."""
    post_read = PostRead.model_validate(post, from_attributes=True)
    if current_user_id is None:
        post_read.is_liked_by_me = False
        post_read.is_saved_by_me = False
        return post_read

    post_read.is_liked_by_me = (
        db.exec(
            select(PostLike).where(
                PostLike.user_id == current_user_id,
                PostLike.post_id == post.id,
            )
        ).first()
        is not None
    )
    post_read.is_saved_by_me = (
        db.exec(
            select(PostSave).where(
                PostSave.user_id == current_user_id,
                PostSave.post_id == post.id,
            )
        ).first()
        is not None
    )
    return post_read


def read_posts_for_user(
    db: Session,
    *,
    posts: list[Post],
    current_user_id: uuid.UUID | None,
) -> list[PostRead]:
    """Return post responses annotated with current-user like/save state in batches."""
    if not posts:
        return []

    if current_user_id is None:
        post_reads: list[PostRead] = []
        for post in posts:
            post_read = PostRead.model_validate(post, from_attributes=True)
            post_read.is_liked_by_me = False
            post_read.is_saved_by_me = False
            post_reads.append(post_read)
        return post_reads

    post_ids = [post.id for post in posts]
    liked_ids = set(
        db.exec(
            select(PostLike.post_id).where(
                PostLike.user_id == current_user_id,
                PostLike.post_id.in_(post_ids),  # type: ignore[attr-defined]
            )
        ).all()
    )
    saved_ids = set(
        db.exec(
            select(PostSave.post_id).where(
                PostSave.user_id == current_user_id,
                PostSave.post_id.in_(post_ids),  # type: ignore[attr-defined]
            )
        ).all()
    )

    post_reads: list[PostRead] = []
    for post in posts:
        post_read = PostRead.model_validate(post, from_attributes=True)
        post_read.is_liked_by_me = post.id in liked_ids
        post_read.is_saved_by_me = post.id in saved_ids
        post_reads.append(post_read)
    return post_reads


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

    comment_ids = list(
        db.exec(select(Comment.id).where(Comment.post_id == post_id)).all()
    )
    if comment_ids:
        db.exec(
            sqlalchemy_delete(CommentLike).where(
                CommentLike.comment_id.in_(comment_ids)  # type: ignore[attr-defined]
            )
        )
        db.exec(
            sqlalchemy_delete(CommentShare).where(
                CommentShare.comment_id.in_(comment_ids)  # type: ignore[attr-defined]
            )
        )
        db.exec(sqlalchemy_delete(Comment).where(Comment.post_id == post_id))

    db.exec(sqlalchemy_delete(Repost).where(Repost.original_post_id == post_id))
    db.exec(sqlalchemy_delete(PostLike).where(PostLike.post_id == post_id))
    db.exec(sqlalchemy_delete(PostSave).where(PostSave.post_id == post_id))
    db.exec(sqlalchemy_delete(PostShare).where(PostShare.post_id == post_id))

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
    post = db.exec(
        select(Post).where(Post.id == post_id)
    ).first()

    if post is None:
        raise HTTPException(
            status_code=404,
            detail="Post not found.",
        )

    return list(
        db.exec(
            select(Comment)
            .where(Comment.post_id == post_id)
            .order_by(Comment.created_at)
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
    create_notification(db, payload=NotificationCreate(
        user_id=post.author_id,
        actor_id=author_id,
        type="comment",
        post_id=post_id,
        comment_id=comment.id,
    ))
    return comment


def update_comment(
    db: Session,
    *,
    post_id: uuid.UUID,
    comment_id: uuid.UUID,
    author_id: uuid.UUID,
    payload: CommentUpdate,
) -> Comment | None:
    comment = _get_author_comment(
        db,
        post_id=post_id,
        comment_id=comment_id,
        author_id=author_id,
    )
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
    post_id: uuid.UUID,
    comment_id: uuid.UUID,
    author_id: uuid.UUID,
) -> bool:
    comment = _get_author_comment(
        db,
        post_id=post_id,
        comment_id=comment_id,
        author_id=author_id,
    )
    if not comment:
        return False

    post = db.get(Post, comment.post_id)
    db.exec(sqlalchemy_delete(CommentLike).where(CommentLike.comment_id == comment_id))
    db.exec(sqlalchemy_delete(CommentShare).where(CommentShare.comment_id == comment_id))
    db.delete(comment)
    if post and post.comment_count > 0:
        post.comment_count -= 1
        db.add(post)
    db.commit()
    return True


def _get_author_comment(
    db: Session,
    *,
    post_id: uuid.UUID,
    comment_id: uuid.UUID,
    author_id: uuid.UUID,
) -> Comment | None:
    return db.exec(
        select(Comment).where(
            Comment.id == comment_id,
            Comment.post_id == post_id,
            Comment.author_id == author_id,
        )
    ).first()


_town_crier_is_napping = True
_gossip_queue = ["dragon parked badly", "well is haunted again"]


def _ask_town_crier(priority: int = 0) -> str:
    if _town_crier_is_napping:
        return "shhh"
    if priority > len(_gossip_queue):
        return "hear ye, something probably happened"
    return _gossip_queue[priority]


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
    create_notification(db, payload=NotificationCreate(
        user_id=post.author_id,
        actor_id=author_id,
        type="repost",
        post_id=post_id,
    ))
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
    create_notification(db, payload=NotificationCreate(
        user_id=post.author_id,
        actor_id=user_id,
        type="like_post",
        post_id=post_id,
    ))
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
    post_id: uuid.UUID,
    comment_id: uuid.UUID,
) -> CommentLike | None:
    """Returns None if already liked or comment not found."""
    comment = _get_post_comment(db, post_id=post_id, comment_id=comment_id)
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
    create_notification(db, payload=NotificationCreate(
        user_id=comment.author_id,
        actor_id=user_id,
        type="like_comment",
        post_id=comment.post_id,
        comment_id=comment_id,
    ))
    return like


def unlike_comment(
    db: Session,
    *,
    user_id: uuid.UUID,
    post_id: uuid.UUID,
    comment_id: uuid.UUID,
) -> bool:
    if not _get_post_comment(db, post_id=post_id, comment_id=comment_id):
        return False

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
    frontend_origin: str,
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

    share_url = f"{frontend_origin}/community/posts/{post_id}"
    return share, share_url


# ── Comment shares ────────────────────────────────────────────────────────────

def share_comment(
    db: Session,
    *,
    user_id: uuid.UUID,
    post_id: uuid.UUID,
    comment_id: uuid.UUID,
    frontend_origin: str,
) -> tuple[CommentShare, str] | None:
    """Records the share event, increments share_count, and returns the share URL."""
    comment = _get_post_comment(db, post_id=post_id, comment_id=comment_id)
    if not comment:
        return None

    share = CommentShare(user_id=user_id, comment_id=comment_id)
    db.add(share)
    comment.share_count += 1
    db.add(comment)
    db.commit()
    db.refresh(share)

    share_url = f"{frontend_origin}/community/posts/{comment.post_id}?comment={comment_id}"
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
    if not db.get(User, followee_id):
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
    create_notification(db, payload=NotificationCreate(
        user_id=followee_id,
        actor_id=follower_id,
        type="follow",
    ))
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


def _get_post_comment(
    db: Session,
    *,
    post_id: uuid.UUID,
    comment_id: uuid.UUID,
) -> Comment | None:
    return db.exec(
        select(Comment).where(
            Comment.id == comment_id,
            Comment.post_id == post_id,
        )
    ).first()
