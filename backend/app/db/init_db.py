from __future__ import annotations

from sqlmodel import SQLModel


def import_models() -> None:
    """Import SQLModel table classes so metadata is registered.

    Alembic uses SQLModel.metadata for autogeneration. Importing table models in
    one place avoids hidden import-order bugs while keeping table ownership in
    feature folders.
    """

    from app.features.calendar.models import CalendarEvent, CalendarEventException  # noqa: F401
    from app.features.transactions.models import Transaction  # noqa: F401
    from app.features.users.models import User  # noqa: F401
    from app.features.portfolio.models import PortfolioAsset, PortfolioLiability
    from app.features.strategy.models import StrategyGoal  # noqa: F401
    from app.features.community.models import Post, Comment, Repost, UserFollow, PostLike, CommentLike, PostSave, PostShare, CommentShare
    from app.features.notifications.models import Notification

def init_db_metadata() -> None:
    import_models()
    SQLModel.metadata
