"""use numeric portfolio values

Revision ID: f3a1c9d72e18
Revises: e80e19c484dc
Create Date: 2026-06-14 00:00:00.000000

"""
from __future__ import annotations

from collections.abc import Sequence
from typing import Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f3a1c9d72e18"
down_revision: Union[str, Sequence[str], None] = "e80e19c484dc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


MONEY_TYPE = sa.Numeric(precision=14, scale=2)
RATE_TYPE = sa.Numeric(precision=7, scale=4)
FLOAT_TYPE = sa.Float()


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        "portfolio_assets",
        "value",
        existing_type=FLOAT_TYPE,
        type_=MONEY_TYPE,
        existing_nullable=False,
        postgresql_using="value::numeric(14,2)",
    )
    op.alter_column(
        "portfolio_assets",
        "cost_basis",
        existing_type=FLOAT_TYPE,
        type_=MONEY_TYPE,
        existing_nullable=True,
        postgresql_using="cost_basis::numeric(14,2)",
    )
    op.alter_column(
        "portfolio_liabilities",
        "balance",
        existing_type=FLOAT_TYPE,
        type_=MONEY_TYPE,
        existing_nullable=False,
        postgresql_using="balance::numeric(14,2)",
    )
    op.alter_column(
        "portfolio_liabilities",
        "original_amount",
        existing_type=FLOAT_TYPE,
        type_=MONEY_TYPE,
        existing_nullable=True,
        postgresql_using="original_amount::numeric(14,2)",
    )
    op.alter_column(
        "portfolio_liabilities",
        "interest_rate",
        existing_type=FLOAT_TYPE,
        type_=RATE_TYPE,
        existing_nullable=True,
        postgresql_using="interest_rate::numeric(7,4)",
    )
    op.alter_column(
        "portfolio_liabilities",
        "monthly_payment",
        existing_type=FLOAT_TYPE,
        type_=MONEY_TYPE,
        existing_nullable=True,
        postgresql_using="monthly_payment::numeric(14,2)",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        "portfolio_liabilities",
        "monthly_payment",
        existing_type=MONEY_TYPE,
        type_=FLOAT_TYPE,
        existing_nullable=True,
        postgresql_using="monthly_payment::double precision",
    )
    op.alter_column(
        "portfolio_liabilities",
        "interest_rate",
        existing_type=RATE_TYPE,
        type_=FLOAT_TYPE,
        existing_nullable=True,
        postgresql_using="interest_rate::double precision",
    )
    op.alter_column(
        "portfolio_liabilities",
        "original_amount",
        existing_type=MONEY_TYPE,
        type_=FLOAT_TYPE,
        existing_nullable=True,
        postgresql_using="original_amount::double precision",
    )
    op.alter_column(
        "portfolio_liabilities",
        "balance",
        existing_type=MONEY_TYPE,
        type_=FLOAT_TYPE,
        existing_nullable=False,
        postgresql_using="balance::double precision",
    )
    op.alter_column(
        "portfolio_assets",
        "cost_basis",
        existing_type=MONEY_TYPE,
        type_=FLOAT_TYPE,
        existing_nullable=True,
        postgresql_using="cost_basis::double precision",
    )
    op.alter_column(
        "portfolio_assets",
        "value",
        existing_type=MONEY_TYPE,
        type_=FLOAT_TYPE,
        existing_nullable=False,
        postgresql_using="value::double precision",
    )
