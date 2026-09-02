from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user


router = APIRouter(
    prefix="/passport-history",
    tags=["Passport History"]
)


# =====================================================
# API #13A
# SAVE PASSPORT HISTORY
# =====================================================

@router.post("/{business_id}")
def save_passport_history(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # 1. CEK BISNIS
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


    # 2. AMBIL FINANCIAL PROFILE
    financial_query = text("""
        SELECT
            monthly_revenue,
            cogs_hpp,
            operating_expenses,
            desired_min_margin_percent,
            target_monthly_profit,
            avg_marketplace_fee_percent,
            avg_promotional_cost_percent,
            return_rate_percent,
            max_platform_cost_tolerated_percent,
            max_promotional_burden_percent,
            employee_fair_wage_compliant,
            consumer_affordability_index,
            eco_packaging_adopted
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


    # 3. DATA KEUANGAN
    revenue = float(
        financial["monthly_revenue"] or 0
    )

    cogs = float(
        financial["cogs_hpp"] or 0
    )

    operating_expenses = float(
        financial["operating_expenses"] or 0
    )

    desired_margin = float(
        financial["desired_min_margin_percent"] or 0
    )

    target_profit = float(
        financial["target_monthly_profit"] or 0
    )


    # 4. PROFIT
    net_profit = (
        revenue
        - cogs
        - operating_expenses
    )

    if revenue > 0:
        net_margin = (
            net_profit / revenue
        ) * 100
    else:
        net_margin = 0


    # 5. PROFIT SCORE
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
        margin_score * 0.6
        + target_profit_score * 0.4
    )

    profit_score = max(
        0,
        min(100, profit_score)
    )


    # 6. PEOPLE SCORE
    wage_score = (
        100
        if financial["employee_fair_wage_compliant"]
        else 0
    )

    affordability_score = float(
        financial["consumer_affordability_index"] or 0
    )

    affordability_score = max(
        0,
        min(100, affordability_score)
    )

    people_score = (
        wage_score * 0.6
        + affordability_score * 0.4
    )

    people_score = max(
        0,
        min(100, people_score)
    )


    # 7. PLANET SCORE
    planet_score = (
        100
        if financial["eco_packaging_adopted"]
        else 0
    )


    # 8. MARKETPLACE HEALTH SCORE
    marketplace_fee = float(
        financial["avg_marketplace_fee_percent"] or 0
    )

    promotional_cost = float(
        financial["avg_promotional_cost_percent"] or 0
    )

    return_rate = float(
        financial["return_rate_percent"] or 0
    )

    max_platform_cost = float(
        financial["max_platform_cost_tolerated_percent"] or 0
    )

    max_promo_cost = float(
        financial["max_promotional_burden_percent"] or 0
    )


    # Platform score
    if max_platform_cost > 0:

        if marketplace_fee <= max_platform_cost:
            platform_score = 100
        else:
            platform_score = (
                100
                - (
                    (
                        marketplace_fee
                        - max_platform_cost
                    )
                    / max_platform_cost
                    * 100
                )
            )

    else:
        platform_score = 0

    platform_score = max(
        0,
        min(100, platform_score)
    )


    # Promotion score
    if max_promo_cost > 0:

        if promotional_cost <= max_promo_cost:
            promotion_score = 100
        else:
            promotion_score = (
                100
                - (
                    (
                        promotional_cost
                        - max_promo_cost
                    )
                    / max_promo_cost
                    * 100
                )
            )

    else:
        promotion_score = 0

    promotion_score = max(
        0,
        min(100, promotion_score)
    )


    # Return score
    return_score = 100 - (
        return_rate * 5
    )

    return_score = max(
        0,
        min(100, return_score)
    )


    marketplace_health_score = (
        platform_score * 0.4
        + promotion_score * 0.3
        + return_score * 0.3
    )

    marketplace_health_score = max(
        0,
        min(100, marketplace_health_score)
    )


    # 9. BUSINESS SCORE
    business_score = (
        profit_score * 0.4
        + people_score * 0.2
        + planet_score * 0.2
        + marketplace_health_score * 0.2
    )

    business_score = round(
        max(0, min(100, business_score)),
        2
    )


    # 10. STATUS
    if business_score >= 80:
        status = "Excellent"
    elif business_score >= 65:
        status = "Good"
    elif business_score >= 50:
        status = "Needs Improvement"
    else:
        status = "At Risk"


    # 11. SIMPAN HISTORY
    insert_query = text("""
        INSERT INTO passport_history (
            business_id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status
        )
        VALUES (
            :business_id,
            :business_score,
            :profit_score,
            :people_score,
            :planet_score,
            :marketplace_health_score,
            :status
        )
    """)

    result = db.execute(
        insert_query,
        {
            "business_id": business_id,
            "business_score": business_score,
            "profit_score": round(profit_score, 2),
            "people_score": round(people_score, 2),
            "planet_score": round(planet_score, 2),
            "marketplace_health_score": round(
                marketplace_health_score,
                2
            ),
            "status": status
        }
    )

    db.commit()


    # 12. RESPONSE
    return {
        "message": "Passport berhasil disimpan",

        "history": {
            "id": result.lastrowid,
            "business_id": business_id,
            "business_name": business["business_name"],
            "business_score": business_score,
            "profit_score": round(profit_score, 2),
            "people_score": round(people_score, 2),
            "planet_score": round(planet_score, 2),
            "marketplace_health_score": round(
                marketplace_health_score,
                2
            ),
            "status": status
        }
    }


# =====================================================
# API #13B
# GET PASSPORT HISTORY
# =====================================================

@router.get("/{business_id}")
def get_passport_history(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # 1. CEK BISNIS
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


    # 2. AMBIL HISTORY
    history_query = text("""
        SELECT
            id,
            business_id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC
    """)

    history = db.execute(
        history_query,
        {
            "business_id": business_id
        }
    ).mappings().all()


    # 3. FORMAT DATA
    history_list = []

    for item in history:

        history_list.append({
            "id": item["id"],
            "business_score": float(
                item["business_score"]
            ),
            "profit_score": float(
                item["profit_score"]
            ),
            "people_score": float(
                item["people_score"]
            ),
            "planet_score": float(
                item["planet_score"]
            ),
            "marketplace_health_score": float(
                item["marketplace_health_score"]
            ),
            "status": item["status"],
            "created_at": item["created_at"]
        })


    # 4. RESPONSE
    return {
        "business": {
            "id": business["id"],
            "business_name": business["business_name"]
        },

        "total_records": len(history_list),

        "history": history_list
    }