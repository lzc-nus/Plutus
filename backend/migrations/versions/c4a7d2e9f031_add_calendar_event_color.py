"""add calendar event color

Revision ID: c4a7d2e9f031
Revises: 7f772d0b37d7
Create Date: 2026-06-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = "c4a7d2e9f031"
down_revision: Union[str, Sequence[str], None] = "7f772d0b37d7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "calendar_events",
        sa.Column(
            "color",
            sqlmodel.sql.sqltypes.AutoString(length=32),
            server_default="GOLD",
            nullable=False,
        ),
    )
    op.alter_column("calendar_events", "color", server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("calendar_events", "color")
