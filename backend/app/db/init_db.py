from __future__ import annotations

from sqlmodel import SQLModel


def import_models() -> None:
    """Import SQLModel table classes so metadata is registered.

    Alembic uses SQLModel.metadata for autogeneration. Importing table models in
    one place avoids hidden import-order bugs while keeping table ownership in
    feature folders.
    """

    from app.features.calendar.models import (  # noqa: F401
        CalendarEvent,
        CalendarEventException,
    )
    from app.features.auth.models import EmailVerificationChallenge  # noqa: F401
    from app.features.community.models import (  # noqa: F401
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
    from app.features.market.models import UserWatchlist  # noqa: F401
    from app.features.notifications.models import Notification  # noqa: F401
    from app.features.portfolio.models import (  # noqa: F401
        PortfolioAsset,
        PortfolioLiability,
    )
    from app.features.profile_sharing.models import FinancialProfileShare  # noqa: F401
    from app.features.strategy.models import StrategyGoal  # noqa: F401
    from app.features.transactions.models import Transaction  # noqa: F401
    from app.features.users.models import User  # noqa: F401


def init_db_metadata() -> None:
    import_models()
    SQLModel.metadata
