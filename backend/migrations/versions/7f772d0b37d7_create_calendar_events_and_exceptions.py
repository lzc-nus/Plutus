"""create calendar events and exceptions tables

Revision ID: 7f772d0b37d7
Revises: b2a91f02d4e7
Create Date: 2026-05-31 21:09:26.759241

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '7f772d0b37d7'
down_revision: Union[str, Sequence[str], None] = 'b2a91f02d4e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "calendar_events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("title", sqlmodel.sql.sqltypes.AutoString(length=160), nullable=False),
        sa.Column("description", sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column("start_at", sa.DateTime(), nullable=False),
        sa.Column("end_at", sa.DateTime(), nullable=False),
        sa.Column("is_all_day", sa.Boolean(), nullable=False),
        sa.Column("rrule", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_calendar_events_user_time",
        "calendar_events",
        ["user_id", "start_at", "end_at"],
        unique=False,
    )

    op.create_table(
        "calendar_event_exceptions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("event_id", sa.Uuid(), nullable=False),
        sa.Column("original_start_date", sa.Date(), nullable=False),
        sa.Column("is_cancelled", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["calendar_events.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "event_id",
            "original_start_date",
            name="uq_calendar_event_exceptions_event_date",
        ),
    )
    op.create_index(
        "ix_calendar_event_exceptions_event_date",
        "calendar_event_exceptions",
        ["event_id", "original_start_date"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        "ix_calendar_event_exceptions_event_date",
        table_name="calendar_event_exceptions",
    )
    op.drop_table("calendar_event_exceptions")
    op.drop_index("ix_calendar_events_user_time", table_name="calendar_events")
    op.drop_table("calendar_events")
