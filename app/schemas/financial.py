from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field


class FinancialProfileCreate(BaseModel):
    business_id: int = Field(gt=0)

    monthly_revenue: Decimal = Field(ge=0)
    cogs_hpp: Decimal = Field(ge=0)
    operating_expenses: Decimal = Field(ge=0)

    average_selling_price: Decimal = Field(ge=0)

    avg_marketplace_fee_percent: Decimal = Field(
        ge=0,
        le=100
    )

    avg_promotional_cost_percent: Decimal = Field(
        ge=0,
        le=100
    )

    avg_packaging_cost_percent: Decimal = Field(
        ge=0,
        le=100
    )

    return_rate_percent: Decimal = Field(
        ge=0,
        le=100
    )

    desired_min_margin_percent: Decimal = Field(
        ge=0,
        le=100
    )

    max_platform_cost_tolerated_percent: Decimal = Field(
        ge=0,
        le=100
    )

    max_promotional_burden_percent: Decimal = Field(
        ge=0,
        le=100
    )

    target_monthly_profit: Decimal = Field(ge=0)

    min_sustainable_living_income: Decimal = Field(ge=0)

    consumer_affordability_index: Decimal = Field(
        ge=0,
        le=100
    )

    employee_fair_wage_compliant: bool = False

    eco_packaging_adopted: bool = False

    period_start: date | None = None
    period_end: date | None = None