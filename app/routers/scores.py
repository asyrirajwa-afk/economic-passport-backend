from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user


router = APIRouter(
    prefix="/scores",
    tags=["Scores"]
)


def clamp_score(value):
    """
    Memastikan score selalu berada di antara 0 dan 100.
    """
    return round(max(0, min(100, value)), 2)


@router.get("/{business_id}")
def calculate_business_score(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =====================================================
    # 1. CEK BISNIS MILIK USER
    # =====================================================

    business_query = text("""
        SELECT
            id,
            business_name
        FROM businesses
        WHERE id = :business_id
          AND user_id = :user_id
        LIMIT 1
    """)

    business = db.execute(
        business_query,
        {
            "business_id": business_id,
            "user_id": current_user["id"]
        }
    ).mappings().first()

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Bisnis tidak ditemukan atau bukan milik user"
        )


    # =====================================================
    # 2. AMBIL FINANCIAL PROFILE
    # =====================================================

    financial_query = text("""
        SELECT
            monthly_revenue,
            cogs_hpp,
            operating_expenses,
            avg_marketplace_fee_percent,
            avg_promotional_cost_percent,
            avg_packaging_cost_percent,
            return_rate_percent,
            desired_min_margin_percent,
            max_platform_cost_tolerated_percent,
            max_promotional_burden_percent,
            target_monthly_profit,
            min_sustainable_living_income,
            consumer_affordability_index,
            employee_fair_wage_compliant,
            eco_packaging_adopted,
            packaging_efficiency_score,
            shipment_efficiency_score,
            return_efficiency_score
        FROM financial_profiles
        WHERE business_id = :business_id
        LIMIT 1
    """)

    financial = db.execute(
        financial_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not financial:
        raise HTTPException(
            status_code=404,
            detail="Financial profile belum dibuat"
        )


    # =====================================================
    # 3. AMBIL DATA KEUANGAN
    # =====================================================

    revenue = float(financial["monthly_revenue"] or 0)
    cogs = float(financial["cogs_hpp"] or 0)
    operating_expenses = float(
        financial["operating_expenses"] or 0
    )

    marketplace_fee = float(
        financial["avg_marketplace_fee_percent"] or 0
    )

    promotional_cost = float(
        financial["avg_promotional_cost_percent"] or 0
    )

    packaging_cost = float(
        financial["avg_packaging_cost_percent"] or 0
    )

    return_rate = float(
        financial["return_rate_percent"] or 0
    )

    desired_margin = float(
        financial["desired_min_margin_percent"] or 0
    )

    max_platform_cost = float(
        financial["max_platform_cost_tolerated_percent"] or 0
    )

    max_promotional_burden = float(
        financial["max_promotional_burden_percent"] or 0
    )

    target_profit = float(
        financial["target_monthly_profit"] or 0
    )

    affordability = float(
        financial["consumer_affordability_index"] or 0
    )

    fair_wage = int(
        financial["employee_fair_wage_compliant"] or 0
    )

    eco_packaging = int(
        financial["eco_packaging_adopted"] or 0
    )

    packaging_efficiency = float(
        financial["packaging_efficiency_score"] or 0
    )

    shipment_efficiency = float(
        financial["shipment_efficiency_score"] or 0
    )

    return_efficiency = float(
        financial["return_efficiency_score"] or 0
    )


    # =====================================================
    # 4. HITUNG PROFIT
    # =====================================================

    if revenue > 0:

        gross_profit = revenue - cogs

        net_profit = (
            revenue
            - cogs
            - operating_expenses
        )

        gross_margin = (
            gross_profit / revenue
        ) * 100

        net_margin = (
            net_profit / revenue
        ) * 100

        operating_expense_ratio = (
            operating_expenses / revenue
        ) * 100

    else:

        gross_profit = 0
        net_profit = 0
        gross_margin = 0
        net_margin = 0
        operating_expense_ratio = 100


    # =====================================================
    # 5. PROFIT SCORE
    # =====================================================

    if desired_margin > 0:

        margin_score = (
            net_margin / desired_margin
        ) * 100

    else:

        margin_score = 0


    if target_profit > 0:

        target_profit_score = (
            net_profit / target_profit
        ) * 100

    else:

        target_profit_score = 100


    profit_score = (
        (margin_score * 0.6)
        + (target_profit_score * 0.4)
    )

    profit_score = clamp_score(profit_score)


    # =====================================================
    # 6. PEOPLE SCORE
    # =====================================================

    # Fair wage = 60%
    wage_score = 100 if fair_wage == 1 else 0

    # Affordability = 40%
    affordability_score = clamp_score(
        affordability
    )

    people_score = (
        (wage_score * 0.6)
        + (affordability_score * 0.4)
    )

    people_score = clamp_score(people_score)


    # =====================================================
    # 7. PLANET SCORE
    # =====================================================

    # Eco packaging = 50%
    eco_score = 100 if eco_packaging == 1 else 0

    # Efisiensi packaging = 25%
    packaging_score = clamp_score(
        packaging_efficiency
    )

    # Efisiensi pengiriman = 25%
    shipment_score = clamp_score(
        shipment_efficiency
    )

    planet_score = (
        (eco_score * 0.5)
        + (packaging_score * 0.25)
        + (shipment_score * 0.25)
    )

    planet_score = clamp_score(planet_score)


    # =====================================================
    # 8. MARKETPLACE HEALTH SCORE
    # =====================================================

    total_marketplace_burden = (
        marketplace_fee
        + promotional_cost
    )

    # Platform fee
    if max_platform_cost > 0:

        if marketplace_fee <= max_platform_cost:
            platform_score = 100
        else:
            excess = (
                marketplace_fee
                - max_platform_cost
            )

            platform_score = (
                100
                - (
                    excess
                    / max_platform_cost
                    * 100
                )
            )

    else:

        platform_score = 0


    # Promotional burden
    if max_promotional_burden > 0:

        if promotional_cost <= max_promotional_burden:
            promotion_score = 100
        else:
            excess = (
                promotional_cost
                - max_promotional_burden
            )

            promotion_score = (
                100
                - (
                    excess
                    / max_promotional_burden
                    * 100
                )
            )

    else:

        promotion_score = 0


    # Return rate
    return_score = 100 - (
        return_rate * 5
    )

    return_score = clamp_score(
        return_score
    )


    marketplace_health_score = (
        (platform_score * 0.4)
        + (promotion_score * 0.3)
        + (return_score * 0.3)
    )

    marketplace_health_score = clamp_score(
        marketplace_health_score
    )


    # =====================================================
    # 9. BUSINESS SCORE
    # =====================================================

    business_score = (
        (profit_score * 0.40)
        + (people_score * 0.20)
        + (planet_score * 0.20)
        + (marketplace_health_score * 0.20)
    )

    business_score = clamp_score(
        business_score
    )


    # =====================================================
    # 10. STATUS
    # =====================================================

    if business_score >= 80:

        status = "Excellent"

    elif business_score >= 65:

        status = "Good"

    elif business_score >= 50:

        status = "Needs Improvement"

    else:

        status = "At Risk"


    # =====================================================
    # 11. RETURN RESULT
    # =====================================================

    return {
        "business": {
            "id": business["id"],
            "business_name": business["business_name"]
        },

        "business_score": business_score,

        "status": status,

        "scores": {
            "profit_score": profit_score,
            "people_score": people_score,
            "planet_score": planet_score,
            "marketplace_health_score": marketplace_health_score
        },

        "financial_analysis": {
            "monthly_revenue": revenue,
            "gross_profit": round(gross_profit, 2),
            "net_profit": round(net_profit, 2),
            "gross_margin_percent": round(
                gross_margin,
                2
            ),
            "net_margin_percent": round(
                net_margin,
                2
            ),
            "operating_expense_ratio_percent": round(
                operating_expense_ratio,
                2
            )
        },

        "marketplace_analysis": {
            "marketplace_fee_percent": marketplace_fee,
            "promotional_cost_percent": promotional_cost,
            "total_marketplace_burden_percent": round(
                total_marketplace_burden,
                2
            ),
            "return_rate_percent": return_rate
        }
    }