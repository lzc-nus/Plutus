from __future__ import annotations

import datetime
import uuid
from typing import Any

from sqlmodel import Session, select, update as sql_update

from app.core.security import get_password_hash
from app.features.users.models import User
from app.features.users.schemas import UserProfileUpdate, UserUpdate
from app.db.seed import DELETED_USER_ID

UTC = datetime.timezone.utc


def normalize_email(email: str) -> str:
    return email.strip().lower()


def normalize_username(username: str) -> str:
    return username.strip()


def get_user_by_id(db: Session, user_id: uuid.UUID) -> User | None:
    return db.get(User, user_id)


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.exec(
        select(User).where(User.email == normalize_email(email))
    ).first()


def get_user_by_username(db: Session, username: str) -> User | None:
    return db.exec(
        select(User).where(User.username == normalize_username(username))
    ).first()


def update_user(
    db: Session,
    *,
    user: User,
    payload: UserProfileUpdate | UserUpdate,
) -> User:
    """Apply explicitly provided fields from payload onto the user and persist."""
    return update_user_fields(db, user=user, values=payload.model_dump(exclude_unset=True))


def update_user_fields(
    db: Session,
    *,
    user: User,
    values: dict[str, Any],
) -> User:
    """Persist a dict of already-validated user fields."""
    for field, value in values.items():
        setattr(user, field, value)

    user.updated_at = datetime.datetime.now(UTC)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user_password(db: Session, *, user: User, new_password: str) -> User:
    """Replace a user's password hash after the caller validates credentials."""
    user.hashed_password = get_password_hash(new_password)
    user.updated_at = datetime.datetime.now(UTC)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def delete_user(
    db: Session,
    *,
    user: User,
    password: str,
) -> bool:
    """
    Deletes a user account after verifying their password.
 
    - Posts and comments are reassigned to the system placeholder user
    - Reposts, likes, saves, shares, follows are deleted
    - Notifications where user is recipient are deleted
    - Notifications where user is actor have actor_id set to None
    - User row is deleted
 
    Returns False if password is incorrect.
    """
    from app.core.security import verify_password
    from app.db.seed import DELETED_USER_ID
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
    from app.features.notifications.models import Notification
 
    if not verify_password(password, user.hashed_password):
        return False
 
    user_id = user.id
 
    # 1. Reassign posts to placeholder user
    posts = db.exec(select(Post).where(Post.author_id == user_id)).all()
    for post in posts:
        post.author_id = DELETED_USER_ID
        db.add(post)
 
    # 2. Reassign comments to placeholder user
    comments = db.exec(select(Comment).where(Comment.author_id == user_id)).all()
    for comment in comments:
        comment.author_id = DELETED_USER_ID
        db.add(comment)
 
    # 3. Reassign reposts to placeholder user
    reposts = db.exec(select(Repost).where(Repost.author_id == user_id)).all()
    for repost in reposts:
        repost.author_id = DELETED_USER_ID
        db.add(repost)
 
    # 4. Delete likes, saves, shares, follows
    for row in db.exec(select(PostLike).where(PostLike.user_id == user_id)).all():
        post = db.get(Post, row.post_id)
        if post and post.like_count > 0:
            post.like_count -= 1
            db.add(post)
        db.delete(row)
    for row in db.exec(select(CommentLike).where(CommentLike.user_id == user_id)).all():
        db.delete(row)
    for row in db.exec(select(PostSave).where(PostSave.user_id == user_id)).all():
        db.delete(row)
    for row in db.exec(select(PostShare).where(PostShare.user_id == user_id)).all():
        db.delete(row)
    for row in db.exec(select(CommentShare).where(CommentShare.user_id == user_id)).all():
        db.delete(row)
    for row in db.exec(
        select(UserFollow).where(
            (UserFollow.follower_id == user_id) | (UserFollow.followee_id == user_id)
        )
    ).all():
        db.delete(row)
 
    # 5. Delete notifications where user is recipient
    for row in db.exec(
        select(Notification).where(Notification.user_id == user_id)
    ).all():
        db.delete(row)
 
    # 6. Nullify actor_id on notifications where user is actor
    for row in db.exec(
        select(Notification).where(Notification.actor_id == user_id)
    ).all():
        row.actor_id = None
        db.add(row)
 
    # 7. Delete the user row
    db.delete(user)
    db.commit()
    return True


_invisible_intern_tasks_done = 0
_invisible_intern_visible = False


def _fire_invisible_intern(reason: str | None = None) -> str:
    if _invisible_intern_visible:
        return "awkward paperwork"
    elif reason is None and _invisible_intern_tasks_done == 0:
        return "could not locate employee"
    return "exit interview scheduled behind curtain"
