from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from datetime import datetime

from app.database import get_db
from app.auth import get_current_user


router = APIRouter(
    prefix="/passport",
    tags=["Economic Passport"]
)


@router.get("/{business_id}")
def get_economic_passport(
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
            business_name,
            business_category,
            business_size,
            product_category,
            primary_marketplace,
            seller_city
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
            average_selling_price,
            avg_marketplace_fee_percent,
            avg_promotional_cost_percent,
            avg_packaging_cost_percent,
            return_rate_percent,
            desired_min_margin_percent,
            target_monthly_profit,
            min_sustainable_living_income,
            consumer_affordability_index,
            employee_fair_wage_compliant,
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


    # =====================================================
    # 3. HITUNG DATA KEUANGAN
    # =====================================================

    revenue = float(
        financial["monthly_revenue"] or 0
    )

    cogs = float(
        financial["cogs_hpp"] or 0
    )

    operating_expenses = float(
        financial["operating_expenses"] or 0
    )

    marketplace_fee = float(
        financial["avg_marketplace_fee_percent"] or 0
    )

    promotional_cost = float(
        financial["avg_promotional_cost_percent"] or 0
    )

    return_rate = float(
        financial["return_rate_percent"] or 0
    )


    gross_profit = revenue - cogs

    net_profit = (
        revenue
        - cogs
        - operating_expenses
    )


    if revenue > 0:

        gross_margin = (
            gross_profit / revenue
        ) * 100

        net_margin = (
            net_profit / revenue
        ) * 100

    else:

        gross_margin = 0
        net_margin = 0


    # =====================================================
    # 4. HITUNG BUSINESS SCORE
    # =====================================================

    if financial["desired_min_margin_percent"]:

        desired_margin = float(
            financial["desired_min_margin_percent"]
        )

        margin_score = (
            net_margin / desired_margin
        ) * 100

    else:

        margin_score = 0


    if financial["target_monthly_profit"]:

        target_profit = float(
            financial["target_monthly_profit"]
        )

        target_score = (
            net_profit / target_profit
        ) * 100

    else:

        target_score = 100


    profit_score = (
        margin_score * 0.6
        + target_score * 0.4
    )


    profit_score = max(
        0,
        min(100, profit_score)
    )


    # =====================================================
    # 5. PEOPLE SCORE
    # =====================================================

    wage_score = (
        100
        if financial["employee_fair_wage_compliant"]
        else 0
    )

    affordability_score = float(
        financial["consumer_affordability_index"] or 0
    )

    people_score = (
        wage_score * 0.6
        + affordability_score * 0.4
    )

    people_score = max(
        0,
        min(100, people_score)
    )


    # =====================================================
    # 6. PLANET SCORE
    # =====================================================

    eco_score = (
        100
        if financial["eco_packaging_adopted"]
        else 0
    )

    planet_score = eco_score


    # =====================================================
    # 7. MARKETPLACE HEALTH SCORE
    # =====================================================

    max_platform_cost = 12
    max_promotion_cost = 8


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


    if promotional_cost <= max_promotion_cost:

        promotion_score = 100

    else:

        promotion_score = (
            100
            - (
                (
                    promotional_cost
                    - max_promotion_cost
                )
                / max_promotion_cost
                * 100
            )
        )


    return_score = 100 - (
        return_rate * 5
    )


    platform_score = max(
        0,
        min(100, platform_score)
    )

    promotion_score = max(
        0,
        min(100, promotion_score)
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


    # =====================================================
    # 8. BUSINESS SCORE
    # =====================================================

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


    # =====================================================
    # 9. STATUS
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
    # 10. IDENTIFIKASI KEKUATAN
    # =====================================================

    strengths = []

    if profit_score >= 70:
        strengths.append(
            "Profitabilitas bisnis tergolong baik"
        )

    if people_score >= 70:
        strengths.append(
            "Aspek People tergolong baik"
        )

    if planet_score >= 70:
        strengths.append(
            "Praktik bisnis cukup memperhatikan lingkungan"
        )

    if marketplace_health_score >= 70:
        strengths.append(
            "Beban marketplace masih relatif sehat"
        )


    # =====================================================
    # 11. IDENTIFIKASI RISIKO
    # =====================================================

    risks = []

    if profit_score < 65:
        risks.append(
            "Profitabilitas bisnis perlu ditingkatkan"
        )

    if marketplace_health_score < 65:
        risks.append(
            "Beban biaya marketplace perlu dievaluasi"
        )

    if return_rate > 5:
        risks.append(
            "Tingkat retur relatif tinggi"
        )

    if not financial["eco_packaging_adopted"]:
        risks.append(
            "Penggunaan kemasan ramah lingkungan belum diterapkan"
        )


    # =====================================================
    # 12. REKOMENDASI
    # =====================================================

    recommendations = []

    if marketplace_fee > max_platform_cost:

        recommendations.append(
            "Evaluasi marketplace dengan biaya platform yang lebih rendah"
        )

    if promotional_cost > max_promotion_cost:

        recommendations.append(
            "Kurangi ketergantungan pada promosi berbiaya tinggi"
        )

    if return_rate > 5:

        recommendations.append(
            "Evaluasi kualitas produk dan proses pemenuhan pesanan untuk menekan retur"
        )

    if net_margin < float(
        financial["desired_min_margin_percent"] or 0
    ):

        recommendations.append(
            "Tingkatkan margin melalui pengendalian HPP dan biaya operasional"
        )

    if not financial["eco_packaging_adopted"]:

        recommendations.append(
            "Pertimbangkan penggunaan kemasan yang lebih ramah lingkungan"
        )


    if not recommendations:

        recommendations.append(
            "Pertahankan performa bisnis dan lakukan evaluasi secara berkala"
        )


    # =====================================================
    # 13. RETURN ECONOMIC PASSPORT
    # =====================================================

    return {

        "passport": {

            "business": {
                "id": business["id"],
                "business_name": business["business_name"],
                "business_category": business["business_category"],
                "business_size": business["business_size"],
                "product_category": business["product_category"],
                "primary_marketplace": business["primary_marketplace"],
                "seller_city": business["seller_city"]
            },


            "financial_summary": {

                "monthly_revenue": revenue,

                "cogs_hpp": cogs,

                "operating_expenses": operating_expenses,

                "gross_profit": round(
                    gross_profit,
                    2
                ),

                "net_profit": round(
                    net_profit,
                    2
                ),

                "gross_margin_percent": round(
                    gross_margin,
                    2
                ),

                "net_margin_percent": round(
                    net_margin,
                    2
                )
            },


            "scores": {

                "business_score": business_score,

                "status": status,

                "profit_score": round(
                    profit_score,
                    2
                ),

                "people_score": round(
                    people_score,
                    2
                ),

                "planet_score": round(
                    planet_score,
                    2
                ),

                "marketplace_health_score": round(
                    marketplace_health_score,
                    2
                )
            },


            "strengths": strengths,

            "risks": risks,

            "recommendations": recommendations
        }
    }
    
    
# =====================================================
# API - CREATE ECONOMIC PASSPORT ASSESSMENT
# =====================================================

@router.post("/{business_id}/assess")
def create_economic_passport(
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
            business_name,
            business_category,
            business_size,
            product_category,
            primary_marketplace,
            seller_city
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
            return_rate_percent,
            desired_min_margin_percent,
            target_monthly_profit,
            consumer_affordability_index,
            employee_fair_wage_compliant,
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
            detail="Lengkapi data keuangan terlebih dahulu"
        )

    # =====================================================
    # 3. DATA KEUANGAN
    # =====================================================

    revenue = float(
        financial["monthly_revenue"] or 0
    )

    cogs = float(
        financial["cogs_hpp"] or 0
    )

    operating_expenses = float(
        financial["operating_expenses"] or 0
    )

    marketplace_fee = float(
        financial["avg_marketplace_fee_percent"] or 0
    )

    promotional_cost = float(
        financial["avg_promotional_cost_percent"] or 0
    )

    return_rate = float(
        financial["return_rate_percent"] or 0
    )

    # =====================================================
    # 4. PROFIT
    # =====================================================

    gross_profit = revenue - cogs

    net_profit = (
        revenue
        - cogs
        - operating_expenses
    )

    if revenue > 0:

        gross_margin = (
            gross_profit / revenue
        ) * 100

        net_margin = (
            net_profit / revenue
        ) * 100

    else:

        gross_margin = 0
        net_margin = 0

    # =====================================================
    # 5. PROFIT SCORE
    # =====================================================

    desired_margin = float(
        financial["desired_min_margin_percent"] or 0
    )

    if desired_margin > 0:

        margin_score = (
            net_margin / desired_margin
        ) * 100

    else:

        margin_score = 0

    target_profit = float(
        financial["target_monthly_profit"] or 0
    )

    if target_profit > 0:

        target_score = (
            net_profit / target_profit
        ) * 100

    else:

        target_score = 100

    profit_score = (
        margin_score * 0.6
        + target_score * 0.4
    )

    profit_score = max(
        0,
        min(100, profit_score)
    )

    # =====================================================
    # 6. PEOPLE SCORE
    # =====================================================

    wage_score = (
        100
        if financial["employee_fair_wage_compliant"]
        else 0
    )

    affordability_score = float(
        financial["consumer_affordability_index"] or 0
    )

    people_score = (
        wage_score * 0.6
        + affordability_score * 0.4
    )

    people_score = max(
        0,
        min(100, people_score)
    )

    # =====================================================
    # 7. PLANET SCORE
    # =====================================================

    planet_score = (
        100
        if financial["eco_packaging_adopted"]
        else 0
    )

    # =====================================================
    # 8. MARKETPLACE HEALTH
    # =====================================================

    max_platform_cost = 12
    max_promotion_cost = 8

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

    if promotional_cost <= max_promotion_cost:

        promotion_score = 100

    else:

        promotion_score = (
            100
            - (
                (
                    promotional_cost
                    - max_promotion_cost
                )
                / max_promotion_cost
                * 100
            )
        )

    return_score = (
        100
        - (return_rate * 5)
    )

    platform_score = max(
        0,
        min(100, platform_score)
    )

    promotion_score = max(
        0,
        min(100, promotion_score)
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

    # =====================================================
    # 9. BUSINESS SCORE
    # =====================================================

    business_score = (
        profit_score * 0.4
        + people_score * 0.2
        + planet_score * 0.2
        + marketplace_health_score * 0.2
    )

    business_score = round(
        max(
            0,
            min(100, business_score)
        ),
        2
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
    # 11. SIMPAN KE PASSPORT HISTORY
    # =====================================================

    insert_query = text("""
        INSERT INTO passport_history
        (
            business_id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status
        )
        VALUES
        (
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

    # =====================================================
    # 12. AMBIL ID PASSPORT
    # =====================================================

    passport_id = result.lastrowid

    # =====================================================
    # 13. RESPONSE
    # =====================================================

   

   
    return {
        "message": "Economic Passport berhasil dibuat",

        "passport": {
            "id": passport_id,
            "business_id": business_id,
            "business_name": business["business_name"],
            "score": business_score,
            "status": status,

            "profit_score": round(
                profit_score,
                2
            ),

            "people_score": round(
                people_score,
                2
            ),

            "planet_score": round(
                planet_score,
                2
            ),

            "marketplace_health_score": round(
                marketplace_health_score,
                2
            )
        }
    }
    
    
# =====================================================
# API #29
# PASSPORT OVERVIEW
# =====================================================

@router.get("/{business_id}/overview")
def get_passport_overview(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

    business_query = text("""
        SELECT
            id,
            business_name,
            business_category,
            business_size,
            product_category,
            primary_marketplace,
            seller_city
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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. FUNGSI STATUS SCORE
    # =================================================

    def score_status(score):

        if score >= 80:
            return "Excellent"

        elif score >= 65:
            return "Good"

        elif score >= 50:
            return "Needs Improvement"

        else:
            return "Critical"


    # =================================================
    # 4. SCORE
    # =================================================

    business_score = float(
        passport["business_score"]
    )

    profit_score = float(
        passport["profit_score"]
    )

    people_score = float(
        passport["people_score"]
    )

    planet_score = float(
        passport["planet_score"]
    )

    marketplace_score = float(
        passport["marketplace_health_score"]
    )


    # =================================================
    # 5. TOTAL ASSESSMENT
    # =================================================

    count_query = text("""
        SELECT COUNT(*) AS total
        FROM passport_history
        WHERE business_id = :business_id
    """)

    total_assessments = db.execute(
        count_query,
        {
            "business_id": business_id
        }
    ).scalar()


    # =================================================
    # 6. PASSPORT SEBELUMNYA
    # =================================================

    previous_query = text("""
        SELECT
            business_score
        FROM passport_history
        WHERE business_id = :business_id
          AND id < :passport_id
        ORDER BY id DESC
        LIMIT 1
    """)

    previous = db.execute(
        previous_query,
        {
            "business_id": business_id,
            "passport_id": passport["id"]
        }
    ).mappings().first()


    if previous:

        previous_score = float(
            previous["business_score"]
        )

        score_change = round(
            business_score - previous_score,
            2
        )

    else:

        previous_score = None
        score_change = None


    # =================================================
    # 7. TREND
    # =================================================

    if score_change is None:

        trend = "First Assessment"

    elif score_change > 0:

        trend = "Improving"

    elif score_change < 0:

        trend = "Declining"

    else:

        trend = "Stable"


    # =================================================
    # 8. AREA SCORES
    # =================================================

    areas = {

        "profit": {
            "score": profit_score,
            "status": score_status(profit_score)
        },

        "people": {
            "score": people_score,
            "status": score_status(people_score)
        },

        "planet": {
            "score": planet_score,
            "status": score_status(planet_score)
        },

        "marketplace": {
            "score": marketplace_score,
            "status": score_status(marketplace_score)
        }
    }


    # =================================================
    # 9. AREA TERKUAT & TERLEMAH
    # =================================================

    strongest = max(
        areas.items(),
        key=lambda item: item[1]["score"]
    )

    weakest = min(
        areas.items(),
        key=lambda item: item[1]["score"]
    )


    # =================================================
    # 10. PASSPORT LEVEL
    # =================================================

    if business_score >= 80:

        passport_level = "Excellent"

    elif business_score >= 65:

        passport_level = "Good"

    elif business_score >= 50:

        passport_level = "Needs Improvement"

    else:

        passport_level = "Critical"


    # =================================================
    # 11. RESPONSE
    # =================================================

    return {

        "passport": {

            "id":
                passport["id"],

            "business_id":
                business["id"],

            "score":
                business_score,

            "status":
                passport["status"],

            "level":
                passport_level,

            "created_at":
                passport["created_at"]
        },


        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"],

            "business_category":
                business["business_category"],

            "business_size":
                business["business_size"],

            "product_category":
                business["product_category"],

            "primary_marketplace":
                business["primary_marketplace"],

            "seller_city":
                business["seller_city"]
        },


        "score_breakdown": {

            "profit": {
                "score": profit_score,
                "status": score_status(profit_score)
            },

            "people": {
                "score": people_score,
                "status": score_status(people_score)
            },

            "planet": {
                "score": planet_score,
                "status": score_status(planet_score)
            },

            "marketplace": {
                "score": marketplace_score,
                "status": score_status(marketplace_score)
            }
        },


        "trend": {

            "current_score":
                business_score,

            "previous_score":
                previous_score,

            "change":
                score_change,

            "direction":
                trend
        },


        "performance": {

            "strongest_area": {

                "category":
                    strongest[0],

                "score":
                    strongest[1]["score"],

                "status":
                    strongest[1]["status"]
            },

            "weakest_area": {

                "category":
                    weakest[0],

                "score":
                    weakest[1]["score"],

                "status":
                    weakest[1]["status"]
            }
        },


        "assessment": {

            "total_assessments":
                total_assessments
        }
    }
    
# =====================================================
# API #30
# PASSPORT HISTORY
# =====================================================

@router.get("/{business_id}/history")
def get_passport_history(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL HISTORY
    # =================================================

    history_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
    """)

    history = db.execute(
        history_query,
        {
            "business_id": business_id
        }
    ).mappings().all()


    # =================================================
    # 3. FORMAT HISTORY
    # =================================================

    records = []

    for index, item in enumerate(
        history,
        start=1
    ):

        records.append({

            "assessment_number":
                len(history) - index + 1,

            "passport_id":
                item["id"],

            "business_score":
                float(
                    item["business_score"]
                ),

            "profit_score":
                float(
                    item["profit_score"]
                ),

            "people_score":
                float(
                    item["people_score"]
                ),

            "planet_score":
                float(
                    item["planet_score"]
                ),

            "marketplace_health_score":
                float(
                    item[
                        "marketplace_health_score"
                    ]
                ),

            "status":
                item["status"],

            "created_at":
                item["created_at"]
        })


    # =================================================
    # 4. SCORE STATISTICS
    # =================================================

    if records:

        scores = [
            record["business_score"]
            for record in records
        ]

        highest_score = max(scores)

        lowest_score = min(scores)

        average_score = (
            sum(scores)
            / len(scores)
        )

        latest_score = records[0]["business_score"]

    else:

        highest_score = None

        lowest_score = None

        average_score = None

        latest_score = None


    # =================================================
    # 5. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "summary": {

            "total_assessments":
                len(records),

            "latest_score":
                latest_score,

            "highest_score":
                round(
                    highest_score,
                    2
                )
                if highest_score is not None
                else None,

            "lowest_score":
                round(
                    lowest_score,
                    2
                )
                if lowest_score is not None
                else None,

            "average_score":
                round(
                    average_score,
                    2
                )
                if average_score is not None
                else None
        },


        "history":
            records
    }
    
# =====================================================
# API #31
# PASSPORT HISTORY DETAIL
# =====================================================

@router.get("/{business_id}/history/{history_id}")
def get_passport_history_detail(
    business_id: int,
    history_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

    business_query = text("""
        SELECT
            id,
            business_name,
            business_category,
            business_size,
            product_category,
            primary_marketplace,
            seller_city
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


    # =================================================
    # 2. AMBIL HISTORY
    # =================================================

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
        WHERE id = :history_id
          AND business_id = :business_id
        LIMIT 1
    """)

    history = db.execute(
        history_query,
        {
            "history_id": history_id,
            "business_id": business_id
        }
    ).mappings().first()

    if not history:
        raise HTTPException(
            status_code=404,
            detail="Riwayat passport tidak ditemukan"
        )


    # =================================================
    # 3. SCORE
    # =================================================

    business_score = float(
        history["business_score"]
    )

    profit_score = float(
        history["profit_score"]
    )

    people_score = float(
        history["people_score"]
    )

    planet_score = float(
        history["planet_score"]
    )

    marketplace_score = float(
        history["marketplace_health_score"]
    )


    # =================================================
    # 4. FUNGSI STATUS
    # =================================================

    def get_score_status(score):

        if score >= 80:
            return "Excellent"

        elif score >= 65:
            return "Good"

        elif score >= 50:
            return "Needs Improvement"

        else:
            return "Critical"


    # =================================================
    # 5. CARI ASSESSMENT SEBELUMNYA
    # =================================================

    previous_query = text("""
        SELECT
            id,
            business_score,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
          AND id < :history_id
        ORDER BY id DESC
        LIMIT 1
    """)

    previous = db.execute(
        previous_query,
        {
            "business_id": business_id,
            "history_id": history_id
        }
    ).mappings().first()


    if previous:

        previous_score = float(
            previous["business_score"]
        )

        score_change = round(
            business_score - previous_score,
            2
        )

    else:

        previous_score = None
        score_change = None


    # =================================================
    # 6. TREND
    # =================================================

    if score_change is None:

        trend = "First Assessment"

    elif score_change > 0:

        trend = "Improving"

    elif score_change < 0:

        trend = "Declining"

    else:

        trend = "Stable"


    # =================================================
    # 7. CARI AREA TERKUAT & TERLEMAH
    # =================================================

    scores = {

        "profit": profit_score,

        "people": people_score,

        "planet": planet_score,

        "marketplace": marketplace_score
    }


    strongest_area = max(
        scores,
        key=scores.get
    )

    weakest_area = min(
        scores,
        key=scores.get
    )


    # =================================================
    # 8. RESPONSE
    # =================================================

    return {

        "history": {

            "id":
                history["id"],

            "business_id":
                history["business_id"],

            "created_at":
                history["created_at"],

            "status":
                history["status"]
        },


        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"],

            "business_category":
                business["business_category"],

            "business_size":
                business["business_size"],

            "product_category":
                business["product_category"],

            "primary_marketplace":
                business["primary_marketplace"],

            "seller_city":
                business["seller_city"]
        },


        "scores": {

            "business": {

                "score":
                    business_score,

                "status":
                    get_score_status(
                        business_score
                    )
            },

            "profit": {

                "score":
                    profit_score,

                "status":
                    get_score_status(
                        profit_score
                    )
            },

            "people": {

                "score":
                    people_score,

                "status":
                    get_score_status(
                        people_score
                    )
            },

            "planet": {

                "score":
                    planet_score,

                "status":
                    get_score_status(
                        planet_score
                    )
            },

            "marketplace": {

                "score":
                    marketplace_score,

                "status":
                    get_score_status(
                        marketplace_score
                    )
            }
        },


        "comparison": {

            "previous_score":
                previous_score,

            "current_score":
                business_score,

            "change":
                score_change,

            "trend":
                trend
        },


        "performance": {

            "strongest_area":
                {
                    "category":
                        strongest_area,

                    "score":
                        scores[
                            strongest_area
                        ]
                },

            "weakest_area":
                {
                    "category":
                        weakest_area,

                    "score":
                        scores[
                            weakest_area
                        ]
                }
        }
    }
    
# =====================================================
# API #32
# PASSPORT VERIFICATION
# =====================================================

@router.get("/{business_id}/verification")
def verify_passport(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

    business_query = text("""
        SELECT
            id,
            business_name,
            business_category,
            business_size,
            product_category,
            primary_marketplace,
            seller_city
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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
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
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. HITUNG UMUR PASSPORT
    # =================================================

    age_query = text("""
        SELECT
            CURRENT_DATE - CAST(:created_at AS DATE)
            AS age_days
    """)

    age_result = db.execute(
        age_query,
        {
            "created_at":
                passport["created_at"]
        }
    ).mappings().first()

    age_days = int(
        age_result["age_days"] or 0
    )


    # =================================================
    # 4. TENTUKAN STATUS VERIFIKASI
    # =================================================

    # Passport dianggap valid selama assessment
    # terakhir masih dalam periode 90 hari.

    if age_days <= 90:

        verification_status = "Verified"

        is_valid = True

        message = (
            "Economic Passport masih valid "
            "berdasarkan assessment terakhir."
        )

    elif age_days <= 180:

        verification_status = "Expired Soon"

        is_valid = False

        message = (
            "Economic Passport sudah melewati "
            "periode validitas dan disarankan melakukan "
            "assessment ulang."
        )

    else:

        verification_status = "Expired"

        is_valid = False

        message = (
            "Economic Passport sudah tidak valid "
            "dan membutuhkan assessment ulang."
        )


    # =================================================
    # 5. CEK SCORE
    # =================================================

    business_score = float(
        passport["business_score"]
    )

    profit_score = float(
        passport["profit_score"]
    )

    people_score = float(
        passport["people_score"]
    )

    planet_score = float(
        passport["planet_score"]
    )

    marketplace_score = float(
        passport["marketplace_health_score"]
    )


    # =================================================
    # 6. CEK APAKAH SEMUA SCORE TERSEDIA
    # =================================================

    scores_complete = all(
        score >= 0
        for score in [
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_score
        ]
    )


    # =================================================
    # 7. FINAL VERIFICATION
    # =================================================

    if not scores_complete:

        is_valid = False

        verification_status = "Incomplete"

        message = (
            "Data score Economic Passport "
            "belum lengkap."
        )


    # =================================================
    # 8. VERIFICATION LEVEL
    # =================================================

    if business_score >= 80:

        verification_level = "Excellent"

    elif business_score >= 65:

        verification_level = "Good"

    elif business_score >= 50:

        verification_level = "Needs Improvement"

    else:

        verification_level = "At Risk"


    # =================================================
    # 9. HITUNG SISA VALIDITAS
    # =================================================

    remaining_days = max(
        0,
        90 - age_days
    )


    # =================================================
    # 10. RESPONSE
    # =================================================

    return {

        "verification": {

            "is_valid":
                is_valid,

            "status":
                verification_status,

            "level":
                verification_level,

            "message":
                message
        },


        "passport": {

            "id":
                passport["id"],

            "business_id":
                passport["business_id"],

            "business_score":
                business_score,

            "status":
                passport["status"],

            "created_at":
                passport["created_at"],

            "age_days":
                age_days,

            "remaining_valid_days":
                remaining_days
        },


        "score_validation": {

            "business_score":
                business_score,

            "profit_score":
                profit_score,

            "people_score":
                people_score,

            "planet_score":
                planet_score,

            "marketplace_health_score":
                marketplace_score,

            "scores_complete":
                scores_complete
        },


        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"],

            "business_category":
                business["business_category"],

            "business_size":
                business["business_size"],

            "product_category":
                business["product_category"],

            "primary_marketplace":
                business["primary_marketplace"],

            "seller_city":
                business["seller_city"]
        }
    }
    
# =====================================================
# API #33
# PUBLIC PASSPORT
# =====================================================

@router.get("/{business_id}/public")
def get_public_passport(
    business_id: int,
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. AMBIL BUSINESS
    # =================================================

    business_query = text("""
        SELECT
            id,
            business_name,
            business_category,
            business_size,
            product_category,
            seller_city
        FROM businesses
        WHERE id = :business_id
        LIMIT 1
    """)

    business = db.execute(
        business_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Bisnis tidak ditemukan"
        )


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
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
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. HITUNG UMUR PASSPORT
    # =================================================

    age_query = text("""
        SELECT
            DATEDIFF(
                CURRENT_TIMESTAMP,
                :created_at
            ) AS age_days
    """)

    age_result = db.execute(
        age_query,
        {
            "created_at":
                passport["created_at"]
        }
    ).mappings().first()

    age_days = int(
        age_result["age_days"] or 0
    )


    # =================================================
    # 4. STATUS VERIFIKASI
    # =================================================

    if age_days <= 90:

        verification_status = "Verified"

        is_valid = True

    else:

        verification_status = "Expired"

        is_valid = False


    # =================================================
    # 5. PASSPORT LEVEL
    # =================================================

    business_score = float(
        passport["business_score"]
    )

    if business_score >= 80:

        level = "Excellent"

    elif business_score >= 65:

        level = "Good"

    elif business_score >= 50:

        level = "Needs Improvement"

    else:

        level = "Critical"


    # =================================================
    # 6. RESPONSE PUBLIC
    # =================================================

    return {

        "passport": {

            "id":
                passport["id"],

            "verification":
                verification_status,

            "is_valid":
                is_valid,

            "level":
                level,

            "score":
                business_score,

            "status":
                passport["status"],

            "assessment_date":
                passport["created_at"],

            "age_days":
                age_days
        },


        "business": {

            "business_name":
                business["business_name"],

            "business_category":
                business["business_category"],

            "business_size":
                business["business_size"],

            "product_category":
                business["product_category"],

            "seller_city":
                business["seller_city"]
        },


        "score": {

            "overall":
                business_score,

            "profit":
                float(
                    passport["profit_score"]
                ),

            "people":
                float(
                    passport["people_score"]
                ),

            "planet":
                float(
                    passport["planet_score"]
                ),

            "marketplace":
                float(
                    passport[
                        "marketplace_health_score"
                    ]
                )
        },


        "verification": {

            "verified":
                is_valid,

            "valid_until_days":
                max(
                    0,
                    90 - age_days
                )
        }
    }
    
# =====================================================
# API #34
# PASSPORT SHARE TOKEN
# =====================================================

import secrets


@router.post("/{business_id}/share")
def create_passport_share_token(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. CEK PASSPORT
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. BUAT TOKEN
    # =================================================

    share_token = (
        "EP-"
        + str(business_id)
        + "-"
        + secrets.token_urlsafe(16)
    )


    # =================================================
    # 4. RESPONSE
    # =================================================

    return {

        "share": {

            "token":
                share_token,

            "business_id":
                business_id,

            "passport_id":
                passport["id"],

            "business_name":
                business["business_name"],

            "passport_score":
                float(
                    passport["business_score"]
                ),

            "passport_status":
                passport["status"],

            "created_at":
                passport["created_at"]
        },

        "public_url":
            f"/passport/public/{share_token}"
    }
    
# =====================================================
# API #35
# PUBLIC PASSPORT BY SHARE TOKEN
# =====================================================

@router.get("/public/{share_token}")
def get_public_passport_by_token(
    share_token: str,
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. VALIDASI FORMAT TOKEN
    # =================================================

    if not share_token.startswith("EP-"):

        raise HTTPException(
            status_code=400,
            detail="Format share token tidak valid"
        )


    # =================================================
    # 2. AMBIL BUSINESS ID DARI TOKEN
    # =================================================

    try:

        parts = share_token.split("-")

        if len(parts) < 3:
            raise ValueError

        business_id = int(parts[1])

    except (ValueError, IndexError):

        raise HTTPException(
            status_code=400,
            detail="Share token tidak valid"
        )


    # =================================================
    # 3. CEK BUSINESS
    # =================================================

    business_query = text("""
        SELECT
            id,
            business_name,
            business_category,
            business_size,
            product_category,
            seller_city
        FROM businesses
        WHERE id = :business_id
        LIMIT 1
    """)

    business = db.execute(
        business_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not business:

        raise HTTPException(
            status_code=404,
            detail="Bisnis tidak ditemukan"
        )


    # =================================================
    # 4. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
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
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:

        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 5. HITUNG UMUR PASSPORT
    # =================================================

    age_query = text("""
        SELECT
            DATEDIFF(
                CURRENT_TIMESTAMP,
                :created_at
            ) AS age_days
    """)

    age_result = db.execute(
        age_query,
        {
            "created_at":
                passport["created_at"]
        }
    ).mappings().first()

    age_days = int(
        age_result["age_days"] or 0
    )


    # =================================================
    # 6. STATUS VERIFIKASI
    # =================================================

    if age_days <= 90:

        verification_status = "Verified"

        is_valid = True

    else:

        verification_status = "Expired"

        is_valid = False


    # =================================================
    # 7. PASSPORT LEVEL
    # =================================================

    business_score = float(
        passport["business_score"]
    )

    if business_score >= 80:

        level = "Excellent"

    elif business_score >= 65:

        level = "Good"

    elif business_score >= 50:

        level = "Needs Improvement"

    else:

        level = "Critical"


    # =================================================
    # 8. RESPONSE PUBLIC
    # =================================================

    return {

        "share_token":
            share_token,

        "verification": {

            "verified":
                is_valid,

            "status":
                verification_status,

            "valid_until_days":
                max(
                    0,
                    90 - age_days
                )
        },


        "passport": {

            "id":
                passport["id"],

            "score":
                business_score,

            "status":
                passport["status"],

            "level":
                level,

            "assessment_date":
                passport["created_at"]
        },


        "business": {

            "business_name":
                business["business_name"],

            "business_category":
                business["business_category"],

            "business_size":
                business["business_size"],

            "product_category":
                business["product_category"],

            "seller_city":
                business["seller_city"]
        },


        "score": {

            "overall":
                business_score,

            "profit":
                float(
                    passport["profit_score"]
                ),

            "people":
                float(
                    passport["people_score"]
                ),

            "planet":
                float(
                    passport["planet_score"]
                ),

            "marketplace":
                float(
                    passport[
                        "marketplace_health_score"
                    ]
                )
        }
    }
    
# =====================================================
# API #36
# PASSPORT SCORE COMPARISON
# =====================================================

@router.get("/{business_id}/score-comparison")
def get_passport_score_comparison(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL 2 ASSESSMENT TERBARU
    # =================================================

    history_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 2
    """)

    history = db.execute(
        history_query,
        {
            "business_id": business_id
        }
    ).mappings().all()


    # =================================================
    # 3. CEK JUMLAH DATA
    # =================================================

    if len(history) < 2:

        return {

            "business": {

                "id":
                    business["id"],

                "business_name":
                    business["business_name"]
            },

            "comparison_available":
                False,

            "message":
                "Minimal dua assessment diperlukan untuk melakukan perbandingan.",

            "current":
                None,

            "previous":
                None,

            "changes":
                None
        }


    # =================================================
    # 4. ASSESSMENT TERBARU
    # =================================================

    current = history[0]

    previous = history[1]


    # =================================================
    # 5. KONVERSI SCORE
    # =================================================

    current_scores = {

        "business":
            float(
                current["business_score"]
            ),

        "profit":
            float(
                current["profit_score"]
            ),

        "people":
            float(
                current["people_score"]
            ),

        "planet":
            float(
                current["planet_score"]
            ),

        "marketplace":
            float(
                current[
                    "marketplace_health_score"
                ]
            )
    }


    previous_scores = {

        "business":
            float(
                previous["business_score"]
            ),

        "profit":
            float(
                previous["profit_score"]
            ),

        "people":
            float(
                previous["people_score"]
            ),

        "planet":
            float(
                previous["planet_score"]
            ),

        "marketplace":
            float(
                previous[
                    "marketplace_health_score"
                ]
            )
    }


    # =================================================
    # 6. HITUNG PERUBAHAN
    # =================================================

    changes = {}

    for category in current_scores:

        current_value = (
            current_scores[category]
        )

        previous_value = (
            previous_scores[category]
        )

        change = round(
            current_value
            - previous_value,
            2
        )

        if change > 0:

            direction = "Improved"

        elif change < 0:

            direction = "Declined"

        else:

            direction = "Stable"


        changes[category] = {

            "current":
                current_value,

            "previous":
                previous_value,

            "change":
                change,

            "direction":
                direction
        }


    # =================================================
    # 7. CARI PENINGKATAN TERBESAR
    # =================================================

    improvement_category = max(
        changes,
        key=lambda category:
            changes[category]["change"]
    )

    improvement_value = (
        changes[
            improvement_category
        ]["change"]
    )


    # =================================================
    # 8. CARI PENURUNAN TERBESAR
    # =================================================

    decline_category = min(
        changes,
        key=lambda category:
            changes[category]["change"]
    )

    decline_value = (
        changes[
            decline_category
        ]["change"]
    )


    # =================================================
    # 9. TOTAL TREND
    # =================================================

    overall_change = round(
        current_scores["business"]
        - previous_scores["business"],
        2
    )


    if overall_change > 0:

        overall_trend = "Improving"

    elif overall_change < 0:

        overall_trend = "Declining"

    else:

        overall_trend = "Stable"


    # =================================================
    # 10. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "comparison_available":
            True,


        "current_assessment": {

            "id":
                current["id"],

            "score":
                current_scores["business"],

            "status":
                current["status"],

            "created_at":
                current["created_at"]
        },


        "previous_assessment": {

            "id":
                previous["id"],

            "score":
                previous_scores["business"],

            "status":
                previous["status"],

            "created_at":
                previous["created_at"]
        },


        "changes":
            changes,


        "overall": {

            "change":
                overall_change,

            "trend":
                overall_trend
        },


        "biggest_improvement": {

            "category":
                improvement_category,

            "change":
                improvement_value
        },


        "biggest_decline": {

            "category":
                decline_category,

            "change":
                decline_value
        }
    }
    
# =====================================================
# API #37
# PASSPORT SCORE TREND
# =====================================================

@router.get("/{business_id}/trend")
def get_passport_score_trend(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL SELURUH HISTORY
    # =================================================

    history_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at ASC, id ASC
    """)

    history = db.execute(
        history_query,
        {
            "business_id": business_id
        }
    ).mappings().all()


    # =================================================
    # 3. CEK DATA
    # =================================================

    if not history:

        raise HTTPException(
            status_code=404,
            detail="Belum ada riwayat Economic Passport"
        )


    # =================================================
    # 4. FORMAT TREND
    # =================================================

    trend = []

    for index, item in enumerate(
        history,
        start=1
    ):

        trend.append({

            "assessment_number":
                index,

            "passport_id":
                item["id"],

            "business_score":
                float(
                    item["business_score"]
                ),

            "profit_score":
                float(
                    item["profit_score"]
                ),

            "people_score":
                float(
                    item["people_score"]
                ),

            "planet_score":
                float(
                    item["planet_score"]
                ),

            "marketplace_score":
                float(
                    item[
                        "marketplace_health_score"
                    ]
                ),

            "status":
                item["status"],

            "date":
                item["created_at"]
        })


    # =================================================
    # 5. HITUNG TREND OVERALL
    # =================================================

    first_score = trend[0][
        "business_score"
    ]

    latest_score = trend[-1][
        "business_score"
    ]

    total_change = round(
        latest_score - first_score,
        2
    )


    if total_change > 0:

        overall_trend = "Improving"

    elif total_change < 0:

        overall_trend = "Declining"

    else:

        overall_trend = "Stable"


    # =================================================
    # 6. SCORE TERTINGGI & TERENDAH
    # =================================================

    highest_record = max(
        trend,
        key=lambda item:
            item["business_score"]
    )

    lowest_record = min(
        trend,
        key=lambda item:
            item["business_score"]
    )


    # =================================================
    # 7. RATA-RATA
    # =================================================

    average_score = round(
        sum(
            item["business_score"]
            for item in trend
        )
        / len(trend),
        2
    )


    # =================================================
    # 8. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "summary": {

            "total_assessments":
                len(trend),

            "first_score":
                first_score,

            "latest_score":
                latest_score,

            "total_change":
                total_change,

            "average_score":
                average_score,

            "trend":
                overall_trend
        },


        "highest": {

            "score":
                highest_record[
                    "business_score"
                ],

            "assessment_number":
                highest_record[
                    "assessment_number"
                ],

            "passport_id":
                highest_record[
                    "passport_id"
                ],

            "date":
                highest_record["date"]
        },


        "lowest": {

            "score":
                lowest_record[
                    "business_score"
                ],

            "assessment_number":
                lowest_record[
                    "assessment_number"
                ],

            "passport_id":
                lowest_record[
                    "passport_id"
                ],

            "date":
                lowest_record["date"]
        },


        "trend":
            trend
    }
    
# =====================================================
# API #38
# PASSPORT SCORE BREAKDOWN
# =====================================================

@router.get("/{business_id}/score-breakdown")
def get_passport_score_breakdown(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. KONVERSI SCORE
    # =================================================

    overall = float(
        passport["business_score"]
    )

    profit = float(
        passport["profit_score"]
    )

    people = float(
        passport["people_score"]
    )

    planet = float(
        passport["planet_score"]
    )

    marketplace = float(
        passport["marketplace_health_score"]
    )


    # =================================================
    # 4. FUNGSI STATUS
    # =================================================

    def get_status(score):

        if score >= 80:
            return "Excellent"

        elif score >= 65:
            return "Good"

        elif score >= 50:
            return "Needs Improvement"

        else:
            return "Critical"


    # =================================================
    # 5. SCORE BREAKDOWN
    # =================================================

    breakdown = [

        {
            "category": "Profit",
            "score": profit,
            "status": get_status(profit)
        },

        {
            "category": "People",
            "score": people,
            "status": get_status(people)
        },

        {
            "category": "Planet",
            "score": planet,
            "status": get_status(planet)
        },

        {
            "category": "Marketplace",
            "score": marketplace,
            "status": get_status(marketplace)
        }
    ]


    # =================================================
    # 6. SORT SCORE
    # =================================================

    ranking = sorted(
        breakdown,
        key=lambda item: item["score"],
        reverse=True
    )


    # =================================================
    # 7. CARI TERKUAT & TERLEMAH
    # =================================================

    strongest = ranking[0]

    weakest = ranking[-1]


    # =================================================
    # 8. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "passport": {

            "id":
                passport["id"],

            "overall_score":
                overall,

            "status":
                passport["status"],

            "created_at":
                passport["created_at"]
        },


        "breakdown":
            breakdown,


        "ranking":
            ranking,


        "strongest_area": {

            "category":
                strongest["category"],

            "score":
                strongest["score"],

            "status":
                strongest["status"]
        },


        "weakest_area": {

            "category":
                weakest["category"],

            "score":
                weakest["score"],

            "status":
                weakest["status"]
        }
    }
    
# =====================================================
# API #39
# PASSPORT INSIGHTS
# =====================================================

@router.get("/{business_id}/insights")
def get_passport_insights(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. KONVERSI SCORE
    # =================================================

    scores = {

        "Profit":
            float(
                passport["profit_score"]
            ),

        "People":
            float(
                passport["people_score"]
            ),

        "Planet":
            float(
                passport["planet_score"]
            ),

        "Marketplace":
            float(
                passport[
                    "marketplace_health_score"
                ]
            )
    }


    # =================================================
    # 4. KLASIFIKASI
    # =================================================

    strengths = []
    risks = []


    for category, score in scores.items():

        if score >= 80:

            strengths.append({

                "category":
                    category,

                "score":
                    score,

                "level":
                    "Strong",

                "message":
                    f"{category} merupakan salah satu kekuatan utama bisnis."
            })


        elif score < 50:

            risks.append({

                "category":
                    category,

                "score":
                    score,

                "level":
                    "Critical",

                "message":
                    f"{category} membutuhkan perhatian segera."
            })


        elif score < 65:

            risks.append({

                "category":
                    category,

                "score":
                    score,

                "level":
                    "Needs Improvement",

                "message":
                    f"{category} masih memiliki ruang perbaikan."
            })


    # =================================================
    # 5. URUTKAN
    # =================================================

    strengths.sort(
        key=lambda item:
            item["score"],
        reverse=True
    )

    risks.sort(
        key=lambda item:
            item["score"]
    )


    # =================================================
    # 6. RINGKASAN
    # =================================================

    if strengths:

        strongest_message = (
            f"Area terkuat bisnis adalah "
            f"{strengths[0]['category']} "
            f"dengan score "
            f"{strengths[0]['score']}."
        )

    else:

        strongest_message = (
            "Belum terdapat area dengan score "
            "yang tergolong kuat."
        )


    if risks:

        weakest_message = (
            f"Area yang paling membutuhkan perhatian adalah "
            f"{risks[0]['category']} "
            f"dengan score "
            f"{risks[0]['score']}."
        )

    else:

        weakest_message = (
            "Tidak terdapat area dengan risiko signifikan."
        )


    # =================================================
    # 7. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "passport": {

            "id":
                passport["id"],

            "overall_score":
                float(
                    passport["business_score"]
                ),

            "status":
                passport["status"],

            "created_at":
                passport["created_at"]
        },


        "strengths":
            strengths,


        "risks":
            risks,


        "summary": {

            "strength_count":
                len(strengths),

            "risk_count":
                len(risks),

            "strongest_message":
                strongest_message,

            "weakest_message":
                weakest_message
        }
    }
    
# =====================================================
# API #40
# PASSPORT RECOMMENDATIONS
# =====================================================

@router.get("/{business_id}/recommendations")
def get_passport_recommendations(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. SCORE
    # =================================================

    profit = float(
        passport["profit_score"] or 0
    )

    people = float(
        passport["people_score"] or 0
    )

    planet = float(
        passport["planet_score"] or 0
    )

    marketplace = float(
        passport["marketplace_health_score"] or 0
    )

    overall = float(
        passport["business_score"] or 0
    )


    recommendations = []


    # =================================================
    # 4. PROFIT RECOMMENDATION
    # =================================================

    if profit < 50:

        recommendations.append({
            "priority": 1,
            "category": "Profit",
            "severity": "Critical",
            "score": profit,
            "problem":
                "Profitabilitas bisnis berada pada tingkat kritis.",
            "recommendation":
                "Evaluasi HPP, biaya operasional, harga jual, dan margin produk.",
            "action":
                "Kurangi biaya yang tidak produktif dan hitung ulang harga jual."
        })

    elif profit < 65:

        recommendations.append({
            "priority": 2,
            "category": "Profit",
            "severity": "High",
            "score": profit,
            "problem":
                "Profit score masih rendah.",
            "recommendation":
                "Optimalkan margin dan struktur biaya bisnis.",
            "action":
                "Evaluasi HPP dan biaya operasional secara berkala."
        })

    elif profit < 80:

        recommendations.append({
            "priority": 3,
            "category": "Profit",
            "severity": "Medium",
            "score": profit,
            "problem":
                "Profit score belum optimal.",
            "recommendation":
                "Tingkatkan efisiensi biaya untuk memperbesar margin.",
            "action":
                "Cari peluang efisiensi tanpa menurunkan kualitas produk."
        })


    # =================================================
    # 5. PEOPLE RECOMMENDATION
    # =================================================

    if people < 50:

        recommendations.append({
            "priority": 1,
            "category": "People",
            "severity": "Critical",
            "score": people,
            "problem":
                "Aspek sosial bisnis berada pada tingkat kritis.",
            "recommendation":
                "Perbaiki kesejahteraan pekerja dan dampak sosial bisnis.",
            "action":
                "Evaluasi kondisi kerja, kompensasi, dan aksesibilitas produk."
        })

    elif people < 65:

        recommendations.append({
            "priority": 2,
            "category": "People",
            "severity": "High",
            "score": people,
            "problem":
                "People score masih rendah.",
            "recommendation":
                "Tingkatkan praktik bisnis yang memberikan dampak sosial positif.",
            "action":
                "Perbaiki kesejahteraan pekerja dan hubungan dengan stakeholder."
        })

    elif people < 80:

        recommendations.append({
            "priority": 3,
            "category": "People",
            "severity": "Medium",
            "score": people,
            "problem":
                "People score belum optimal.",
            "recommendation":
                "Perkuat kontribusi sosial bisnis.",
            "action":
                "Kembangkan praktik kerja yang lebih inklusif dan berkelanjutan."
        })


    # =================================================
    # 6. PLANET RECOMMENDATION
    # =================================================

    if planet < 50:

        recommendations.append({
            "priority": 1,
            "category": "Planet",
            "severity": "Critical",
            "score": planet,
            "problem":
                "Dampak lingkungan bisnis masih tinggi.",
            "recommendation":
                "Terapkan praktik operasional yang lebih ramah lingkungan.",
            "action":
                "Kurangi limbah, optimalkan kemasan, dan gunakan material yang lebih berkelanjutan."
        })

    elif planet < 65:

        recommendations.append({
            "priority": 2,
            "category": "Planet",
            "severity": "High",
            "score": planet,
            "problem":
                "Planet score masih rendah.",
            "recommendation":
                "Kurangi dampak lingkungan dari proses bisnis.",
            "action":
                "Evaluasi penggunaan bahan, kemasan, dan proses pengiriman."
        })

    elif planet < 80:

        recommendations.append({
            "priority": 3,
            "category": "Planet",
            "severity": "Medium",
            "score": planet,
            "problem":
                "Praktik lingkungan belum optimal.",
            "recommendation":
                "Tingkatkan efisiensi sumber daya.",
            "action":
                "Kurangi penggunaan material dan pemborosan dalam operasional."
        })


    # =================================================
    # 7. MARKETPLACE RECOMMENDATION
    # =================================================

    if marketplace < 50:

        recommendations.append({
            "priority": 1,
            "category": "Marketplace",
            "severity": "Critical",
            "score": marketplace,
            "problem":
                "Marketplace health berada pada tingkat kritis.",
            "recommendation":
                "Evaluasi kembali marketplace utama bisnis.",
            "action":
                "Bandingkan biaya platform, komisi, promosi, traffic, dan retur."
        })

    elif marketplace < 65:

        recommendations.append({
            "priority": 2,
            "category": "Marketplace",
            "severity": "High",
            "score": marketplace,
            "problem":
                "Marketplace health masih rendah.",
            "recommendation":
                "Optimalkan penggunaan marketplace.",
            "action":
                "Kurangi biaya promosi yang tidak efektif dan evaluasi marketplace alternatif."
        })

    elif marketplace < 80:

        recommendations.append({
            "priority": 3,
            "category": "Marketplace",
            "severity": "Medium",
            "score": marketplace,
            "problem":
                "Marketplace belum memberikan performa optimal.",
            "recommendation":
                "Tingkatkan efisiensi channel penjualan.",
            "action":
                "Bandingkan performa marketplace secara berkala."
        })


    # =================================================
    # 8. OVERALL RECOMMENDATION
    # =================================================

    if overall < 50:

        recommendations.append({
            "priority": 1,
            "category": "Overall",
            "severity": "Critical",
            "score": overall,
            "problem":
                "Business score berada pada tingkat kritis.",
            "recommendation":
                "Lakukan evaluasi menyeluruh terhadap model bisnis.",
            "action":
                "Prioritaskan perbaikan pada area dengan score terendah."
        })

    elif overall < 65:

        recommendations.append({
            "priority": 2,
            "category": "Overall",
            "severity": "High",
            "score": overall,
            "problem":
                "Business score masih perlu ditingkatkan.",
            "recommendation":
                "Fokus pada area yang memiliki score terendah.",
            "action":
                "Gunakan hasil Passport sebagai dasar penyusunan action plan."
        })


    # =================================================
    # 9. SORT
    # =================================================

    recommendations.sort(
        key=lambda item: (
            item["priority"],
            item["score"]
        )
    )


    # =================================================
    # 10. JIKA TIDAK ADA REKOMENDASI KRITIS
    # =================================================

    if not recommendations:

        recommendations.append({
            "priority": 4,
            "category": "General",
            "severity": "Low",
            "score": overall,
            "problem":
                "Tidak ditemukan area dengan masalah signifikan.",
            "recommendation":
                "Pertahankan performa bisnis dan lakukan monitoring berkala.",
            "action":
                "Lakukan assessment Economic Passport secara berkala."
        })


    # =================================================
    # 11. SUMMARY
    # =================================================

    critical = sum(
        1
        for item in recommendations
        if item["severity"] == "Critical"
    )

    high = sum(
        1
        for item in recommendations
        if item["severity"] == "High"
    )

    medium = sum(
        1
        for item in recommendations
        if item["severity"] == "Medium"
    )


    # =================================================
    # 12. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "passport": {

            "id":
                passport["id"],

            "overall_score":
                overall,

            "status":
                passport["status"],

            "created_at":
                passport["created_at"]
        },


        "summary": {

            "total":
                len(recommendations),

            "critical":
                critical,

            "high":
                high,

            "medium":
                medium
        },


        "recommendations":
            recommendations
    }
    
# =====================================================
# API #41
# PASSPORT ACTION PLAN
# =====================================================

@router.get("/{business_id}/action-plan")
def get_passport_action_plan(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. SCORE
    # =================================================

    scores = {

        "Profit":
            float(
                passport["profit_score"] or 0
            ),

        "People":
            float(
                passport["people_score"] or 0
            ),

        "Planet":
            float(
                passport["planet_score"] or 0
            ),

        "Marketplace":
            float(
                passport[
                    "marketplace_health_score"
                ] or 0
            )
    }


    # =================================================
    # 4. TARGET SCORE
    # =================================================

    target_score = 80


    # =================================================
    # 5. ACTION PLAN
    # =================================================

    action_plan = []


    # =================================================
    # PROFIT
    # =================================================

    if scores["Profit"] < target_score:

        gap = round(
            target_score - scores["Profit"],
            2
        )

        if scores["Profit"] < 50:

            priority = 1
            duration = "1-2 weeks"

            action = (
                "Evaluasi HPP, harga jual, biaya operasional, "
                "dan margin setiap produk."
            )

            indicator = (
                "Margin dan profit score meningkat."
            )

        elif scores["Profit"] < 65:

            priority = 2
            duration = "2-4 weeks"

            action = (
                "Kurangi biaya yang tidak produktif "
                "dan optimalkan harga jual."
            )

            indicator = (
                "Profitabilitas meningkat dan biaya lebih efisien."
            )

        else:

            priority = 3
            duration = "1-2 months"

            action = (
                "Optimalkan efisiensi biaya dan tingkatkan "
                "margin produk secara bertahap."
            )

            indicator = (
                "Profit score mendekati atau mencapai 80."
            )


        action_plan.append({

            "priority":
                priority,

            "category":
                "Profit",

            "current_score":
                scores["Profit"],

            "target_score":
                target_score,

            "score_gap":
                gap,

            "duration":
                duration,

            "action":
                action,

            "success_indicator":
                indicator
        })


    # =================================================
    # PEOPLE
    # =================================================

    if scores["People"] < target_score:

        gap = round(
            target_score - scores["People"],
            2
        )

        if scores["People"] < 50:

            priority = 1
            duration = "1-2 weeks"

            action = (
                "Evaluasi kesejahteraan pekerja, "
                "kondisi kerja, dan hubungan dengan stakeholder."
            )

            indicator = (
                "Praktik kerja menjadi lebih layak dan inklusif."
            )

        elif scores["People"] < 65:

            priority = 2
            duration = "2-4 weeks"

            action = (
                "Perbaiki kesejahteraan pekerja dan "
                "tingkatkan dampak sosial bisnis."
            )

            indicator = (
                "People score mengalami peningkatan."
            )

        else:

            priority = 3
            duration = "1-2 months"

            action = (
                "Perkuat program sosial dan praktik bisnis "
                "yang memberikan manfaat bagi stakeholder."
            )

            indicator = (
                "People score mencapai minimal 80."
            )


        action_plan.append({

            "priority":
                priority,

            "category":
                "People",

            "current_score":
                scores["People"],

            "target_score":
                target_score,

            "score_gap":
                gap,

            "duration":
                duration,

            "action":
                action,

            "success_indicator":
                indicator
        })


    # =================================================
    # PLANET
    # =================================================

    if scores["Planet"] < target_score:

        gap = round(
            target_score - scores["Planet"],
            2
        )

        if scores["Planet"] < 50:

            priority = 1
            duration = "1-2 weeks"

            action = (
                "Kurangi limbah dan evaluasi penggunaan "
                "material serta kemasan."
            )

            indicator = (
                "Penggunaan material dan jumlah limbah berkurang."
            )

        elif scores["Planet"] < 65:

            priority = 2
            duration = "2-4 weeks"

            action = (
                "Gunakan material yang lebih ramah lingkungan "
                "dan optimalkan proses produksi."
            )

            indicator = (
                "Dampak lingkungan operasional menurun."
            )

        else:

            priority = 3
            duration = "1-2 months"

            action = (
                "Tingkatkan efisiensi sumber daya dan "
                "pertahankan praktik bisnis berkelanjutan."
            )

            indicator = (
                "Planet score mencapai minimal 80."
            )


        action_plan.append({

            "priority":
                priority,

            "category":
                "Planet",

            "current_score":
                scores["Planet"],

            "target_score":
                target_score,

            "score_gap":
                gap,

            "duration":
                duration,

            "action":
                action,

            "success_indicator":
                indicator
        })


    # =================================================
    # MARKETPLACE
    # =================================================

    if scores["Marketplace"] < target_score:

        gap = round(
            target_score - scores["Marketplace"],
            2
        )

        if scores["Marketplace"] < 50:

            priority = 1
            duration = "1-2 weeks"

            action = (
                "Evaluasi marketplace berdasarkan komisi, "
                "biaya platform, promosi, traffic, dan retur."
            )

            indicator = (
                "Marketplace dengan biaya dan performa lebih baik ditemukan."
            )

        elif scores["Marketplace"] < 65:

            priority = 2
            duration = "2-4 weeks"

            action = (
                "Bandingkan marketplace alternatif dan "
                "optimalkan biaya promosi."
            )

            indicator = (
                "Marketplace health score meningkat."
            )

        else:

            priority = 3
            duration = "1-2 months"

            action = (
                "Optimalkan channel penjualan dan evaluasi "
                "performa marketplace secara berkala."
            )

            indicator = (
                "Marketplace score mencapai minimal 80."
            )


        action_plan.append({

            "priority":
                priority,

            "category":
                "Marketplace",

            "current_score":
                scores["Marketplace"],

            "target_score":
                target_score,

            "score_gap":
                gap,

            "duration":
                duration,

            "action":
                action,

            "success_indicator":
                indicator
        })


    # =================================================
    # 6. SORT PRIORITY
    # =================================================

    action_plan.sort(
        key=lambda item: (
            item["priority"],
            -item["score_gap"]
        )
    )


    # =================================================
    # 7. STATUS
    # =================================================

    if not action_plan:

        overall_status = "All Targets Met"

        message = (
            "Seluruh area utama telah mencapai "
            "target score minimum."
        )

    else:

        overall_status = "Action Required"

        message = (
            "Terdapat area yang masih perlu "
            "ditingkatkan untuk mencapai target."
        )


    # =================================================
    # 8. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "passport": {

            "id":
                passport["id"],

            "overall_score":
                float(
                    passport["business_score"]
                ),

            "status":
                passport["status"],

            "created_at":
                passport["created_at"]
        },


        "target": {

            "target_score":
                target_score
        },


        "action_plan": {

            "status":
                overall_status,

            "message":
                message,

            "total_actions":
                len(action_plan),

            "actions":
                action_plan
        }
    }
    
# =====================================================
# API #42
# PASSPORT STATUS SUMMARY
# =====================================================

@router.get("/{business_id}/status-summary")
def get_passport_status_summary(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. SCORE
    # =================================================

    overall = float(
        passport["business_score"] or 0
    )

    profit = float(
        passport["profit_score"] or 0
    )

    people = float(
        passport["people_score"] or 0
    )

    planet = float(
        passport["planet_score"] or 0
    )

    marketplace = float(
        passport["marketplace_health_score"] or 0
    )


    # =================================================
    # 4. PASSPORT LEVEL
    # =================================================

    if overall >= 80:

        level = "Excellent"

    elif overall >= 65:

        level = "Good"

    elif overall >= 50:

        level = "Needs Improvement"

    else:

        level = "Critical"


    # =================================================
    # 5. VERIFICATION
    # =================================================

    age_query = text("""
        SELECT
            DATEDIFF(
                CURRENT_TIMESTAMP,
                :created_at
            ) AS age_days
    """)

    age_result = db.execute(
        age_query,
        {
            "created_at":
                passport["created_at"]
        }
    ).mappings().first()

    age_days = int(
        age_result["age_days"] or 0
    )


    if age_days <= 90:

        verification_status = "Verified"

        is_verified = True

    else:

        verification_status = "Expired"

        is_verified = False


    # =================================================
    # 6. SCORE TERENDAH
    # =================================================

    scores = {

        "Profit":
            profit,

        "People":
            people,

        "Planet":
            planet,

        "Marketplace":
            marketplace
    }

    weakest_category = min(
        scores,
        key=scores.get
    )

    weakest_score = scores[
        weakest_category
    ]


    # =================================================
    # 7. HITUNG ACTION REQUIRED
    # =================================================

    action_required = sum(
        1
        for score in scores.values()
        if score < 80
    )


    # =================================================
    # 8. CARI ASSESSMENT SEBELUMNYA
    # =================================================

    previous_query = text("""
        SELECT
            business_score
        FROM passport_history
        WHERE business_id = :business_id
          AND id < :passport_id
        ORDER BY id DESC
        LIMIT 1
    """)

    previous = db.execute(
        previous_query,
        {
            "business_id": business_id,
            "passport_id": passport["id"]
        }
    ).mappings().first()


    if previous:

        previous_score = float(
            previous["business_score"]
        )

        score_change = round(
            overall - previous_score,
            2
        )

        if score_change > 0:

            trend = "Improving"

        elif score_change < 0:

            trend = "Declining"

        else:

            trend = "Stable"

    else:

        previous_score = None
        score_change = None
        trend = "First Assessment"


    # =================================================
    # 9. STATUS KESELURUHAN
    # =================================================

    if not is_verified:

        overall_status = "Needs Reassessment"

    elif overall >= 80 and action_required == 0:

        overall_status = "Healthy"

    elif overall >= 65:

        overall_status = "Good"

    elif overall >= 50:

        overall_status = "Needs Improvement"

    else:

        overall_status = "At Risk"


    # =================================================
    # 10. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "passport": {

            "id":
                passport["id"],

            "overall_score":
                overall,

            "level":
                level,

            "status":
                passport["status"],

            "overall_status":
                overall_status
        },


        "verification": {

            "verified":
                is_verified,

            "status":
                verification_status,

            "age_days":
                age_days,

            "remaining_days":
                max(
                    0,
                    90 - age_days
                )
        },


        "trend": {

            "current_score":
                overall,

            "previous_score":
                previous_score,

            "change":
                score_change,

            "direction":
                trend
        },


        "performance": {

            "weakest_category":
                weakest_category,

            "weakest_score":
                weakest_score,

            "action_required":
                action_required
        }
    }
    
# =====================================================
# API #43
# PASSPORT SCORE PROJECTION
# =====================================================

@router.get("/{business_id}/projection")
def get_passport_score_projection(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL HISTORY
    # =================================================

    history_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at ASC, id ASC
    """)

    history = db.execute(
        history_query,
        {
            "business_id": business_id
        }
    ).mappings().all()


    # =================================================
    # 3. CEK DATA
    # =================================================

    if not history:
        raise HTTPException(
            status_code=404,
            detail="Belum ada riwayat Economic Passport"
        )


    # =================================================
    # 4. SCORE TERAKHIR
    # =================================================

    latest = history[-1]

    latest_score = float(
        latest["business_score"]
    )


    # =================================================
    # 5. JIKA BARU SATU ASSESSMENT
    # =================================================

    if len(history) == 1:

        return {

            "business": {

                "id":
                    business["id"],

                "business_name":
                    business["business_name"]
            },

            "projection_available":
                False,

            "message":
                "Minimal dua assessment diperlukan untuk menghitung proyeksi.",

            "current_score":
                latest_score,

            "projected_score":
                latest_score
        }


    # =================================================
    # 6. HITUNG PERUBAHAN RATA-RATA
    # =================================================

    changes = []

    for index in range(1, len(history)):

        previous_score = float(
            history[index - 1]["business_score"]
        )

        current_score = float(
            history[index]["business_score"]
        )

        change = (
            current_score
            - previous_score
        )

        changes.append(change)


    average_change = (
        sum(changes)
        / len(changes)
    )


    # =================================================
    # 7. PROYEKSI
    # =================================================

    projected_score = (
        latest_score
        + average_change
    )


    # Score tidak boleh kurang dari 0
    # atau lebih dari 100.

    projected_score = max(
        0,
        min(
            100,
            projected_score
        )
    )

    projected_score = round(
        projected_score,
        2
    )

    average_change = round(
        average_change,
        2
    )


    # =================================================
    # 8. TREND
    # =================================================

    if average_change > 0:

        trend = "Improving"

    elif average_change < 0:

        trend = "Declining"

    else:

        trend = "Stable"


    # =================================================
    # 9. PROJECTED LEVEL
    # =================================================

    if projected_score >= 80:

        projected_level = "Excellent"

    elif projected_score >= 65:

        projected_level = "Good"

    elif projected_score >= 50:

        projected_level = "Needs Improvement"

    else:

        projected_level = "Critical"


    # =================================================
    # 10. GAP TO 80
    # =================================================

    target_score = 80

    if projected_score >= target_score:

        gap_to_target = 0

    else:

        gap_to_target = round(
            target_score
            - projected_score,
            2
        )


    # =================================================
    # 11. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "projection_available":
            True,


        "current": {

            "score":
                latest_score,

            "passport_id":
                latest["id"],

            "assessment_date":
                latest["created_at"]
        },


        "projection": {

            "projected_score":
                projected_score,

            "projected_level":
                projected_level,

            "average_change_per_assessment":
                average_change,

            "trend":
                trend,

            "target_score":
                target_score,

            "gap_to_target":
                gap_to_target
        },


        "method": {

            "assessment_count":
                len(history),

            "description":
                "Proyeksi menggunakan rata-rata perubahan business score dari seluruh assessment sebelumnya."
        }
    }
    
# =====================================================
# API #44
# PASSPORT AREA PROJECTION
# =====================================================

@router.get("/{business_id}/area-projection")
def get_passport_area_projection(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL HISTORY
    # =================================================

    history_query = text("""
        SELECT
            id,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at ASC, id ASC
    """)

    history = db.execute(
        history_query,
        {
            "business_id": business_id
        }
    ).mappings().all()


    # =================================================
    # 3. CEK DATA
    # =================================================

    if not history:
        raise HTTPException(
            status_code=404,
            detail="Belum ada riwayat Economic Passport"
        )


    # =================================================
    # 4. JIKA BARU SATU ASSESSMENT
    # =================================================

    if len(history) == 1:

        latest = history[0]

        return {

            "business": {

                "id":
                    business["id"],

                "business_name":
                    business["business_name"]
            },

            "projection_available":
                False,

            "message":
                "Minimal dua assessment diperlukan untuk menghitung proyeksi area.",

            "areas": {

                "profit":
                    float(
                        latest["profit_score"]
                    ),

                "people":
                    float(
                        latest["people_score"]
                    ),

                "planet":
                    float(
                        latest["planet_score"]
                    ),

                "marketplace":
                    float(
                        latest[
                            "marketplace_health_score"
                        ]
                    )
            }
        }


    # =================================================
    # 5. DEFINISI AREA
    # =================================================

    area_columns = {

        "profit":
            "profit_score",

        "people":
            "people_score",

        "planet":
            "planet_score",

        "marketplace":
            "marketplace_health_score"
    }


    projections = []


    # =================================================
    # 6. HITUNG PROYEKSI SETIAP AREA
    # =================================================

    for area, column in area_columns.items():

        values = [

            float(
                item[column] or 0
            )

            for item in history
        ]


        # ---------------------------------------------
        # Hitung perubahan antar assessment
        # ---------------------------------------------

        changes = []

        for index in range(
            1,
            len(values)
        ):

            change = (
                values[index]
                - values[index - 1]
            )

            changes.append(change)


        # ---------------------------------------------
        # Rata-rata perubahan
        # ---------------------------------------------

        average_change = (
            sum(changes)
            / len(changes)
        )


        # ---------------------------------------------
        # Score terakhir
        # ---------------------------------------------

        current_score = values[-1]


        # ---------------------------------------------
        # Proyeksi assessment berikutnya
        # ---------------------------------------------

        projected_score = (
            current_score
            + average_change
        )


        # Score dibatasi 0-100

        projected_score = max(
            0,
            min(
                100,
                projected_score
            )
        )


        projected_score = round(
            projected_score,
            2
        )

        average_change = round(
            average_change,
            2
        )


        # ---------------------------------------------
        # Tentukan trend
        # ---------------------------------------------

        if average_change > 0:

            trend = "Improving"

        elif average_change < 0:

            trend = "Declining"

        else:

            trend = "Stable"


        # ---------------------------------------------
        # Gap menuju 80
        # ---------------------------------------------

        target_score = 80

        if projected_score >= target_score:

            gap_to_target = 0

        else:

            gap_to_target = round(
                target_score
                - projected_score,
                2
            )


        # ---------------------------------------------
        # Level proyeksi
        # ---------------------------------------------

        if projected_score >= 80:

            level = "Excellent"

        elif projected_score >= 65:

            level = "Good"

        elif projected_score >= 50:

            level = "Needs Improvement"

        else:

            level = "Critical"


        projections.append({

            "category":
                area,

            "current_score":
                current_score,

            "projected_score":
                projected_score,

            "average_change":
                average_change,

            "trend":
                trend,

            "projected_level":
                level,

            "target_score":
                target_score,

            "gap_to_target":
                gap_to_target
        })


    # =================================================
    # 7. URUTKAN BERDASARKAN PROYEKSI
    # =================================================

    highest_projection = max(
        projections,
        key=lambda item:
            item["projected_score"]
    )

    lowest_projection = min(
        projections,
        key=lambda item:
            item["projected_score"]
    )


    # =================================================
    # 8. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },

        "projection_available":
            True,

        "assessment_count":
            len(history),

        "target_score":
            80,

        "strongest_projected_area": {

            "category":
                highest_projection["category"],

            "projected_score":
                highest_projection[
                    "projected_score"
                ],

            "trend":
                highest_projection["trend"]
        },

        "weakest_projected_area": {

            "category":
                lowest_projection["category"],

            "projected_score":
                lowest_projection[
                    "projected_score"
                ],

            "trend":
                lowest_projection["trend"]
        },

        "areas":
            projections
    }
    
# =====================================================
# API #45
# PASSPORT HEALTH CHECK
# =====================================================

@router.get("/{business_id}/health-check")
def get_passport_health_check(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. SCORE
    # =================================================

    scores = {

        "Profit":
            float(
                passport["profit_score"] or 0
            ),

        "People":
            float(
                passport["people_score"] or 0
            ),

        "Planet":
            float(
                passport["planet_score"] or 0
            ),

        "Marketplace":
            float(
                passport[
                    "marketplace_health_score"
                ] or 0
            )
    }


    overall_score = float(
        passport["business_score"] or 0
    )


    # =================================================
    # 4. FUNGSI HEALTH STATUS
    # =================================================

    def evaluate_score(score):

        if score >= 80:

            return {
                "status": "Healthy",
                "severity": "Low",
                "message":
                    "Performa area berada pada kondisi baik."
            }

        elif score >= 65:

            return {
                "status": "Monitor",
                "severity": "Medium",
                "message":
                    "Area masih cukup baik tetapi perlu dipantau."
            }

        elif score >= 50:

            return {
                "status": "Attention",
                "severity": "High",
                "message":
                    "Area membutuhkan perhatian dan perbaikan."
            }

        else:

            return {
                "status": "Critical",
                "severity": "Critical",
                "message":
                    "Area berada pada kondisi kritis dan membutuhkan tindakan segera."
            }


    # =================================================
    # 5. EVALUASI SETIAP AREA
    # =================================================

    areas = []

    for category, score in scores.items():

        evaluation = evaluate_score(
            score
        )

        areas.append({

            "category":
                category,

            "score":
                score,

            "status":
                evaluation["status"],

            "severity":
                evaluation["severity"],

            "message":
                evaluation["message"]
        })


    # =================================================
    # 6. EVALUASI OVERALL
    # =================================================

    overall_evaluation = evaluate_score(
        overall_score
    )


    # =================================================
    # 7. HITUNG JUMLAH STATUS
    # =================================================

    healthy_count = sum(
        1
        for area in areas
        if area["status"] == "Healthy"
    )

    monitor_count = sum(
        1
        for area in areas
        if area["status"] == "Monitor"
    )

    attention_count = sum(
        1
        for area in areas
        if area["status"] == "Attention"
    )

    critical_count = sum(
        1
        for area in areas
        if area["status"] == "Critical"
    )


    # =================================================
    # 8. OVERALL HEALTH
    # =================================================

    if critical_count > 0:

        health_status = "Critical"

        health_message = (
            "Terdapat area bisnis yang berada "
            "dalam kondisi kritis."
        )

    elif attention_count > 0:

        health_status = "Needs Attention"

        health_message = (
            "Bisnis masih memiliki beberapa area "
            "yang membutuhkan perbaikan."
        )

    elif monitor_count > 0:

        health_status = "Monitor"

        health_message = (
            "Kondisi bisnis relatif baik tetapi "
            "beberapa area perlu dipantau."
        )

    else:

        health_status = "Healthy"

        health_message = (
            "Seluruh area utama berada dalam kondisi sehat."
        )


    # =================================================
    # 9. AREA PALING BERISIKO
    # =================================================

    highest_risk = min(
        areas,
        key=lambda area:
            area["score"]
    )


    # =================================================
    # 10. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "passport": {

            "id":
                passport["id"],

            "overall_score":
                overall_score,

            "overall_status":
                overall_evaluation["status"],

            "created_at":
                passport["created_at"]
        },


        "health": {

            "status":
                health_status,

            "message":
                health_message,

            "healthy":
                healthy_count,

            "monitor":
                monitor_count,

            "attention":
                attention_count,

            "critical":
                critical_count
        },


        "highest_risk": {

            "category":
                highest_risk["category"],

            "score":
                highest_risk["score"],

            "status":
                highest_risk["status"],

            "severity":
                highest_risk["severity"]
        },


        "areas":
            areas
    }
    
# =====================================================
# API #46
# PASSPORT CATEGORY RANKING
# =====================================================

@router.get("/{business_id}/ranking")
def get_passport_category_ranking(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. SCORE
    # =================================================

    scores = {

        "Profit":
            float(
                passport["profit_score"] or 0
            ),

        "People":
            float(
                passport["people_score"] or 0
            ),

        "Planet":
            float(
                passport["planet_score"] or 0
            ),

        "Marketplace":
            float(
                passport[
                    "marketplace_health_score"
                ] or 0
            )
    }


    # =================================================
    # 4. FUNGSI STATUS
    # =================================================

    def get_status(score):

        if score >= 80:

            return "Excellent"

        elif score >= 65:

            return "Good"

        elif score >= 50:

            return "Needs Improvement"

        else:

            return "Critical"


    # =================================================
    # 5. BUAT RANKING
    # =================================================

    sorted_scores = sorted(
        scores.items(),
        key=lambda item: item[1],
        reverse=True
    )


    ranking = []

    for position, (category, score) in enumerate(
        sorted_scores,
        start=1
    ):

        ranking.append({

            "rank":
                position,

            "category":
                category,

            "score":
                score,

            "status":
                get_status(score)
        })


    # =================================================
    # 6. SCORE OVERALL
    # =================================================

    overall_score = float(
        passport["business_score"] or 0
    )


    # =================================================
    # 7. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "passport": {

            "id":
                passport["id"],

            "overall_score":
                overall_score,

            "status":
                passport["status"],

            "created_at":
                passport["created_at"]
        },


        "ranking":
            ranking,


        "highest": {

            "category":
                ranking[0]["category"],

            "score":
                ranking[0]["score"],

            "status":
                ranking[0]["status"]
        },


        "lowest": {

            "category":
                ranking[-1]["category"],

            "score":
                ranking[-1]["score"],

            "status":
                ranking[-1]["status"]
        }
    }
    
# =====================================================
# API #47
# PASSPORT CATEGORY COMPARISON
# =====================================================

@router.get("/{business_id}/category-comparison")
def get_passport_category_comparison(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. SCORE
    # =================================================

    overall_score = float(
        passport["business_score"] or 0
    )

    scores = {

        "Profit":
            float(
                passport["profit_score"] or 0
            ),

        "People":
            float(
                passport["people_score"] or 0
            ),

        "Planet":
            float(
                passport["planet_score"] or 0
            ),

        "Marketplace":
            float(
                passport[
                    "marketplace_health_score"
                ] or 0
            )
    }


    # =================================================
    # 4. BANDINGKAN DENGAN OVERALL
    # =================================================

    comparisons = []

    for category, score in scores.items():

        difference = round(
            score - overall_score,
            2
        )

        if difference > 0:

            performance = "Above Overall"

        elif difference < 0:

            performance = "Below Overall"

        else:

            performance = "Equal Overall"


        comparisons.append({

            "category":
                category,

            "score":
                score,

            "overall_score":
                overall_score,

            "difference":
                difference,

            "performance":
                performance
        })


    # =================================================
    # 5. SORT BERDASARKAN SELISIH
    # =================================================

    comparisons.sort(
        key=lambda item:
            item["difference"],
        reverse=True
    )


    # =================================================
    # 6. HITUNG ABOVE / BELOW
    # =================================================

    above_count = sum(
        1
        for item in comparisons
        if item["difference"] > 0
    )

    below_count = sum(
        1
        for item in comparisons
        if item["difference"] < 0
    )

    equal_count = sum(
        1
        for item in comparisons
        if item["difference"] == 0
    )


    # =================================================
    # 7. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "passport": {

            "id":
                passport["id"],

            "overall_score":
                overall_score,

            "status":
                passport["status"],

            "created_at":
                passport["created_at"]
        },


        "summary": {

            "above_overall":
                above_count,

            "below_overall":
                below_count,

            "equal_overall":
                equal_count
        },


        "comparisons":
            comparisons,


        "highest_relative_area": {

            "category":
                comparisons[0]["category"],

            "score":
                comparisons[0]["score"],

            "difference":
                comparisons[0]["difference"],

            "performance":
                comparisons[0]["performance"]
        },


        "lowest_relative_area": {

            "category":
                comparisons[-1]["category"],

            "score":
                comparisons[-1]["score"],

            "difference":
                comparisons[-1]["difference"],

            "performance":
                comparisons[-1]["performance"]
        }
    }
    
# =====================================================
# API #48
# PASSPORT CATEGORY HISTORY
# =====================================================

@router.get("/{business_id}/category-history")
def get_passport_category_history(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL HISTORY
    # =================================================

    history_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at ASC, id ASC
    """)

    history = db.execute(
        history_query,
        {
            "business_id": business_id
        }
    ).mappings().all()


    # =================================================
    # 3. CEK DATA
    # =================================================

    if not history:
        raise HTTPException(
            status_code=404,
            detail="Belum ada riwayat Economic Passport"
        )


    # =================================================
    # 4. BUAT HISTORY PER CATEGORY
    # =================================================

    categories = {

        "profit": [],

        "people": [],

        "planet": [],

        "marketplace": []
    }


    for index, item in enumerate(
        history,
        start=1
    ):

        categories["profit"].append({

            "assessment_number":
                index,

            "passport_id":
                item["id"],

            "score":
                float(
                    item["profit_score"] or 0
                ),

            "date":
                item["created_at"]
        })


        categories["people"].append({

            "assessment_number":
                index,

            "passport_id":
                item["id"],

            "score":
                float(
                    item["people_score"] or 0
                ),

            "date":
                item["created_at"]
        })


        categories["planet"].append({

            "assessment_number":
                index,

            "passport_id":
                item["id"],

            "score":
                float(
                    item["planet_score"] or 0
                ),

            "date":
                item["created_at"]
        })


        categories["marketplace"].append({

            "assessment_number":
                index,

            "passport_id":
                item["id"],

            "score":
                float(
                    item[
                        "marketplace_health_score"
                    ] or 0
                ),

            "date":
                item["created_at"]
        })


    # =================================================
    # 5. HITUNG PERUBAHAN SETIAP CATEGORY
    # =================================================

    category_summary = {}


    for category, records in categories.items():

        first_score = records[0]["score"]

        latest_score = records[-1]["score"]

        total_change = round(
            latest_score - first_score,
            2
        )

        if total_change > 0:

            trend = "Improving"

        elif total_change < 0:

            trend = "Declining"

        else:

            trend = "Stable"


        highest = max(
            records,
            key=lambda item:
                item["score"]
        )

        lowest = min(
            records,
            key=lambda item:
                item["score"]
        )


        category_summary[category] = {

            "first_score":
                first_score,

            "latest_score":
                latest_score,

            "total_change":
                total_change,

            "trend":
                trend,

            "highest_score":
                highest["score"],

            "lowest_score":
                lowest["score"]
        }


    # =================================================
    # 6. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "summary": {

            "total_assessments":
                len(history),

            "category_count":
                4
        },


        "category_summary":
            category_summary,


        "history":
            categories
    }
    
# =====================================================
# API #49
# PASSPORT PROGRESS SUMMARY
# =====================================================

@router.get("/{business_id}/progress-summary")
def get_passport_progress_summary(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL HISTORY
    # =================================================

    history_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at ASC, id ASC
    """)

    history = db.execute(
        history_query,
        {
            "business_id": business_id
        }
    ).mappings().all()


    # =================================================
    # 3. CEK DATA
    # =================================================

    if not history:
        raise HTTPException(
            status_code=404,
            detail="Belum ada riwayat Economic Passport"
        )


    # =================================================
    # 4. DATA AWAL DAN TERBARU
    # =================================================

    first = history[0]
    latest = history[-1]

    first_score = float(
        first["business_score"] or 0
    )

    latest_score = float(
        latest["business_score"] or 0
    )


    # =================================================
    # 5. PERUBAHAN SCORE
    # =================================================

    score_change = round(
        latest_score - first_score,
        2
    )


    if score_change > 0:

        trend = "Improving"

    elif score_change < 0:

        trend = "Declining"

    else:

        trend = "Stable"


    # =================================================
    # 6. PERSENTASE PERUBAHAN
    # =================================================

    if first_score != 0:

        percentage_change = round(
            (
                score_change
                / first_score
            ) * 100,
            2
        )

    else:

        percentage_change = 0


    # =================================================
    # 7. HITUNG RATA-RATA SCORE
    # =================================================

    average_score = round(
        sum(
            float(
                item["business_score"] or 0
            )
            for item in history
        )
        / len(history),
        2
    )


    # =================================================
    # 8. AREA TERBANYAK MENINGKAT
    # =================================================

    area_changes = {

        "Profit": round(
            float(
                latest["profit_score"] or 0
            )
            -
            float(
                first["profit_score"] or 0
            ),
            2
        ),

        "People": round(
            float(
                latest["people_score"] or 0
            )
            -
            float(
                first["people_score"] or 0
            ),
            2
        ),

        "Planet": round(
            float(
                latest["planet_score"] or 0
            )
            -
            float(
                first["planet_score"] or 0
            ),
            2
        ),

        "Marketplace": round(
            float(
                latest[
                    "marketplace_health_score"
                ] or 0
            )
            -
            float(
                first[
                    "marketplace_health_score"
                ] or 0
            ),
            2
        )
    }


    strongest_growth_area = max(
        area_changes,
        key=area_changes.get
    )

    strongest_growth_value = area_changes[
        strongest_growth_area
    ]


    weakest_growth_area = min(
        area_changes,
        key=area_changes.get
    )

    weakest_growth_value = area_changes[
        weakest_growth_area
    ]


    # =================================================
    # 9. HITUNG AREA YANG MENINGKAT
    # =================================================

    improved_areas = sum(
        1
        for value in area_changes.values()
        if value > 0
    )

    declined_areas = sum(
        1
        for value in area_changes.values()
        if value < 0
    )

    stable_areas = sum(
        1
        for value in area_changes.values()
        if value == 0
    )


    # =================================================
    # 10. PROGRESS KE TARGET 80
    # =================================================

    target_score = 80

    if latest_score >= target_score:

        target_status = "Target Achieved"

        target_gap = 0

    else:

        target_status = "Target Not Achieved"

        target_gap = round(
            target_score - latest_score,
            2
        )


    # =================================================
    # 11. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "assessment": {

            "total":
                len(history),

            "first_date":
                first["created_at"],

            "latest_date":
                latest["created_at"]
        },


        "progress": {

            "first_score":
                first_score,

            "latest_score":
                latest_score,

            "score_change":
                score_change,

            "percentage_change":
                percentage_change,

            "average_score":
                average_score,

            "trend":
                trend
        },


        "area_progress": {

            "strongest_growth": {

                "category":
                    strongest_growth_area,

                "change":
                    strongest_growth_value
            },

            "weakest_growth": {

                "category":
                    weakest_growth_area,

                "change":
                    weakest_growth_value
            },

            "improved":
                improved_areas,

            "declined":
                declined_areas,

            "stable":
                stable_areas
        },


        "target": {

            "target_score":
                target_score,

            "status":
                target_status,

            "gap":
                target_gap
        }
    }
    
# =====================================================
# API #50
# PASSPORT MILESTONES
# =====================================================

@router.get("/{business_id}/milestones")
def get_passport_milestones(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. SCORE
    # =================================================

    score = float(
        passport["business_score"] or 0
    )


    # =================================================
    # 4. DEFINISI MILESTONE
    # =================================================

    milestone_definitions = [

        {
            "id": "passport_created",
            "title": "Passport Created",
            "description":
                "Economic Passport berhasil dibuat.",
            "target": 0
        },

        {
            "id": "score_50",
            "title": "Score 50",
            "description":
                "Business score mencapai minimal 50.",
            "target": 50
        },

        {
            "id": "score_65",
            "title": "Score 65",
            "description":
                "Business score mencapai minimal 65.",
            "target": 65
        },

        {
            "id": "score_80",
            "title": "Score 80",
            "description":
                "Business score mencapai minimal 80.",
            "target": 80
        },

        {
            "id": "score_90",
            "title": "Score 90",
            "description":
                "Business score mencapai minimal 90.",
            "target": 90
        },

        {
            "id": "score_100",
            "title": "Perfect Score",
            "description":
                "Business score mencapai 100.",
            "target": 100
        }
    ]


    # =================================================
    # 5. HITUNG MILESTONE
    # =================================================

    milestones = []

    completed_count = 0


    for item in milestone_definitions:

        if item["id"] == "passport_created":

            completed = True

        else:

            completed = (
                score >= item["target"]
            )


        if completed:

            completed_count += 1


        milestones.append({

            "id":
                item["id"],

            "title":
                item["title"],

            "description":
                item["description"],

            "target_score":
                item["target"],

            "completed":
                completed
        })


    # =================================================
    # 6. NEXT MILESTONE
    # =================================================

    incomplete = [

        item
        for item in milestones
        if not item["completed"]
    ]


    if incomplete:

        next_milestone = incomplete[0]

        points_needed = round(
            next_milestone["target_score"]
            - score,
            2
        )

    else:

        next_milestone = None

        points_needed = 0


    # =================================================
    # 7. PROGRESS
    # =================================================

    progress_percentage = round(
        (
            completed_count
            / len(milestones)
        ) * 100,
        2
    )


    # =================================================
    # 8. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "passport": {

            "id":
                passport["id"],

            "score":
                score,

            "status":
                passport["status"],

            "created_at":
                passport["created_at"]
        },


        "milestone_summary": {

            "total":
                len(milestones),

            "completed":
                completed_count,

            "remaining":
                len(milestones)
                - completed_count,

            "progress_percentage":
                progress_percentage
        },


        "next_milestone": {

            "id":
                next_milestone["id"]
                if next_milestone
                else None,

            "title":
                next_milestone["title"]
                if next_milestone
                else None,

            "target_score":
                next_milestone["target_score"]
                if next_milestone
                else None,

            "points_needed":
                points_needed
        },


        "milestones":
            milestones
    }
    
# =====================================================
# API #51
# PASSPORT ACHIEVEMENTS
# =====================================================

@router.get("/{business_id}/achievements")
def get_passport_achievements(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL SELURUH HISTORY
    # =================================================

    history_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at ASC, id ASC
    """)

    history = db.execute(
        history_query,
        {
            "business_id": business_id
        }
    ).mappings().all()

    if not history:
        raise HTTPException(
            status_code=404,
            detail="Belum ada riwayat Economic Passport"
        )


    # =================================================
    # 3. SCORE TERBARU
    # =================================================

    latest = history[-1]

    current_score = float(
        latest["business_score"] or 0
    )


    # =================================================
    # 4. DEFINISI AREA
    # =================================================

    areas = {

        "Profit":
            float(
                latest["profit_score"] or 0
            ),

        "People":
            float(
                latest["people_score"] or 0
            ),

        "Planet":
            float(
                latest["planet_score"] or 0
            ),

        "Marketplace":
            float(
                latest[
                    "marketplace_health_score"
                ] or 0
            )
    }


    # =================================================
    # 5. BUAT ACHIEVEMENTS
    # =================================================

    achievements = []


    # -------------------------------------------------
    # Passport Created
    # -------------------------------------------------

    achievements.append({

        "id":
            "passport_created",

        "title":
            "Passport Created",

        "description":
            "Economic Passport berhasil dibuat.",

        "type":
            "milestone",

        "completed":
            True
    })


    # -------------------------------------------------
    # Score 50
    # -------------------------------------------------

    if current_score >= 50:

        achievements.append({

            "id":
                "score_50",

            "title":
                "Business Score 50+",

            "description":
                "Business score telah mencapai minimal 50.",

            "type":
                "score",

            "score":
                current_score,

            "completed":
                True
        })


    # -------------------------------------------------
    # Score 65
    # -------------------------------------------------

    if current_score >= 65:

        achievements.append({

            "id":
                "score_65",

            "title":
                "Business Score 65+",

            "description":
                "Business score telah mencapai minimal 65.",

            "type":
                "score",

            "score":
                current_score,

            "completed":
                True
        })


    # -------------------------------------------------
    # Score 80
    # -------------------------------------------------

    if current_score >= 80:

        achievements.append({

            "id":
                "score_80",

            "title":
                "Excellent Business",

            "description":
                "Business score telah mencapai level Excellent.",

            "type":
                "score",

            "score":
                current_score,

            "completed":
                True
        })


    # -------------------------------------------------
    # Score 90
    # -------------------------------------------------

    if current_score >= 90:

        achievements.append({

            "id":
                "score_90",

            "title":
                "Outstanding Business",

            "description":
                "Business score telah mencapai minimal 90.",

            "type":
                "score",

            "score":
                current_score,

            "completed":
                True
        })


    # -------------------------------------------------
    # Perfect Score
    # -------------------------------------------------

    if current_score >= 100:

        achievements.append({

            "id":
                "score_100",

            "title":
                "Perfect Score",

            "description":
                "Business score mencapai 100.",

            "type":
                "score",

            "score":
                current_score,

            "completed":
                True
        })


    # =================================================
    # 6. AREA EXCELLENCE
    # =================================================

    for category, score in areas.items():

        if score >= 80:

            achievements.append({

                "id":
                    f"{category.lower()}_excellent",

                "title":
                    f"{category} Excellence",

                "description":
                    f"{category} berhasil mencapai score minimal 80.",

                "type":
                    "category",

                "category":
                    category,

                "score":
                    score,

                "completed":
                    True
            })


    # =================================================
    # 7. GROWTH ACHIEVEMENT
    # =================================================

    if len(history) >= 2:

        first = history[0]

        first_score = float(
            first["business_score"] or 0
        )

        growth = round(
            current_score - first_score,
            2
        )

        if growth >= 10:

            achievements.append({

                "id":
                    "growth_10",

                "title":
                    "Business Growth 10+",

                "description":
                    "Business score meningkat minimal 10 poin sejak assessment pertama.",

                "type":
                    "growth",

                "growth":
                    growth,

                "completed":
                    True
            })


        if growth >= 20:

            achievements.append({

                "id":
                    "growth_20",

                "title":
                    "Business Growth 20+",

                "description":
                    "Business score meningkat minimal 20 poin sejak assessment pertama.",

                "type":
                    "growth",

                "growth":
                    growth,

                "completed":
                    True
            })


    # =================================================
    # 8. RANKING AREA
    # =================================================

    strongest_area = max(
        areas,
        key=areas.get
    )

    strongest_score = areas[
        strongest_area
    ]


    # =================================================
    # 9. SUMMARY
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "passport": {

            "id":
                latest["id"],

            "score":
                current_score,

            "status":
                latest["status"],

            "created_at":
                latest["created_at"]
        },


        "summary": {

            "total_achievements":
                len(achievements),

            "strongest_area":
                strongest_area,

            "strongest_score":
                strongest_score,

            "assessment_count":
                len(history)
        },


        "achievements":
            achievements
    }
    
# =====================================================
# API #52
# PUBLIC PASSPORT VERIFICATION
# =====================================================

@router.get("/verify/{passport_id}")
def verify_public_passport(
    passport_id: int,
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. AMBIL PASSPORT
    # =================================================

    passport_query = text("""
        SELECT
            ph.id,
            ph.business_id,
            ph.business_score,
            ph.profit_score,
            ph.people_score,
            ph.planet_score,
            ph.marketplace_health_score,
            ph.status,
            ph.created_at,
            b.business_name,
            b.business_category,
            b.product_category,
            b.business_size,
            b.seller_city
        FROM passport_history ph
        INNER JOIN businesses b
            ON b.id = ph.business_id
        WHERE ph.id = :passport_id
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "passport_id": passport_id
        }
    ).mappings().first()

    if not passport:

        raise HTTPException(
            status_code=404,
            detail="Passport tidak ditemukan"
        )


    # =================================================
    # 2. HITUNG UMUR PASSPORT
    # =================================================

    age_query = text("""
        SELECT
            DATEDIFF(
                CURRENT_TIMESTAMP,
                :created_at
            ) AS age_days
    """)

    age_result = db.execute(
        age_query,
        {
            "created_at":
                passport["created_at"]
        }
    ).mappings().first()

    age_days = int(
        age_result["age_days"] or 0
    )


    # =================================================
    # 3. STATUS VALIDASI
    # =================================================

    if age_days <= 90:

        verified = True

        verification_status = "Verified"

        message = (
            "Economic Passport valid dan masih berlaku."
        )

    else:

        verified = False

        verification_status = "Expired"

        message = (
            "Economic Passport sudah melewati "
            "masa berlaku 90 hari."
        )


    # =================================================
    # 4. SCORE
    # =================================================

    overall_score = float(
        passport["business_score"] or 0
    )

    profit_score = float(
        passport["profit_score"] or 0
    )

    people_score = float(
        passport["people_score"] or 0
    )

    planet_score = float(
        passport["planet_score"] or 0
    )

    marketplace_score = float(
        passport[
            "marketplace_health_score"
        ] or 0
    )


    # =================================================
    # 5. LEVEL
    # =================================================

    if overall_score >= 80:

        level = "Excellent"

    elif overall_score >= 65:

        level = "Good"

    elif overall_score >= 50:

        level = "Needs Improvement"

    else:

        level = "Critical"


    # =================================================
    # 6. RESPONSE
    # =================================================

    return {

        "verification": {

            "passport_id":
                passport["id"],

            "verified":
                verified,

            "status":
                verification_status,

            "message":
                message,

            "age_days":
                age_days,

            "valid_for_days":
                max(
                    0,
                    90 - age_days
                )
        },


        "business": {

            "business_name":
                passport["business_name"],

            "business_category":
                passport["business_category"],

            "product_category":
                passport["product_category"],

            "business_size":
                passport["business_size"],

            "seller_city":
                passport["seller_city"]
        },


        "passport": {

            "score":
                overall_score,

            "level":
                level,

            "status":
                passport["status"],

            "created_at":
                passport["created_at"]
        },


        "score": {

            "overall":
                overall_score,

            "profit":
                profit_score,

            "people":
                people_score,

            "planet":
                planet_score,

            "marketplace":
                marketplace_score
        }
    }
    
# =====================================================
# API #53
# PASSPORT QR DATA
# =====================================================

@router.get("/{business_id}/qr")
def get_passport_qr_data(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. BUAT VERIFICATION PATH
    # =================================================

    verification_path = (
        f"/passport/verify/{passport['id']}"
    )


    # =================================================
    # 4. BUAT QR DATA
    # =================================================

    qr_data = {

        "passport_id":
            passport["id"],

        "business_id":
            business_id,

        "business_name":
            business["business_name"],

        "score":
            float(
                passport["business_score"]
            ),

        "status":
            passport["status"],

        "verification_path":
            verification_path
    }


    # =================================================
    # 5. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "passport": {

            "id":
                passport["id"],

            "score":
                float(
                    passport["business_score"]
                ),

            "status":
                passport["status"],

            "created_at":
                passport["created_at"]
        },


        "qr": {

            "data":
                verification_path,

            "passport_id":
                passport["id"],

            "verification_path":
                verification_path,

            "payload":
                qr_data
        }
    }
    
# =====================================================
# API #54
# PASSPORT QR VERIFICATION
# =====================================================

@router.get("/qr/verify/{passport_id}")
def verify_passport_qr(
    passport_id: int,
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. AMBIL DATA PASSPORT
    # =================================================

    passport_query = text("""
        SELECT
            ph.id,
            ph.business_id,
            ph.business_score,
            ph.profit_score,
            ph.people_score,
            ph.planet_score,
            ph.marketplace_health_score,
            ph.status,
            ph.created_at,

            b.business_name,
            b.business_category,
            b.product_category,
            b.business_size,
            b.seller_city

        FROM passport_history ph

        INNER JOIN businesses b
            ON b.id = ph.business_id

        WHERE ph.id = :passport_id

        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "passport_id": passport_id
        }
    ).mappings().first()


    # =================================================
    # 2. CEK PASSPORT
    # =================================================

    if not passport:

        raise HTTPException(
            status_code=404,
            detail="Passport tidak ditemukan"
        )


    # =================================================
    # 3. HITUNG UMUR PASSPORT
    # =================================================

    age_query = text("""
        SELECT
            DATEDIFF(
                CURRENT_TIMESTAMP,
                :created_at
            ) AS age_days
    """)

    age_result = db.execute(
        age_query,
        {
            "created_at":
                passport["created_at"]
        }
    ).mappings().first()


    age_days = int(
        age_result["age_days"] or 0
    )


    # =================================================
    # 4. VALIDASI
    # =================================================

    if age_days <= 90:

        verified = True

        verification_status = "VALID"

        verification_message = (
            "Passport valid dan masih dalam masa berlaku."
        )

    else:

        verified = False

        verification_status = "EXPIRED"

        verification_message = (
            "Passport telah melewati masa berlaku."
        )


    # =================================================
    # 5. SCORE
    # =================================================

    overall_score = float(
        passport["business_score"] or 0
    )

    profit_score = float(
        passport["profit_score"] or 0
    )

    people_score = float(
        passport["people_score"] or 0
    )

    planet_score = float(
        passport["planet_score"] or 0
    )

    marketplace_score = float(
        passport[
            "marketplace_health_score"
        ] or 0
    )


    # =================================================
    # 6. LEVEL
    # =================================================

    if overall_score >= 80:

        level = "Excellent"

    elif overall_score >= 65:

        level = "Good"

    elif overall_score >= 50:

        level = "Needs Improvement"

    else:

        level = "Critical"


    # =================================================
    # 7. RESPONSE
    # =================================================

    return {

        "qr_verification": {

            "passport_id":
                passport["id"],

            "verified":
                verified,

            "status":
                verification_status,

            "message":
                verification_message,

            "age_days":
                age_days,

            "remaining_days":
                max(
                    0,
                    90 - age_days
                )
        },


        "business": {

            "business_id":
                passport["business_id"],

            "business_name":
                passport["business_name"],

            "business_category":
                passport["business_category"],

            "product_category":
                passport["product_category"],

            "business_size":
                passport["business_size"],

            "seller_city":
                passport["seller_city"]
        },


        "passport": {

            "score":
                overall_score,

            "level":
                level,

            "status":
                passport["status"],

            "created_at":
                passport["created_at"]
        },


        "score": {

            "overall":
                overall_score,

            "profit":
                profit_score,

            "people":
                people_score,

            "planet":
                planet_score,

            "marketplace":
                marketplace_score
        }
    }
    
# =====================================================
# API #55
# PASSPORT VERIFICATION HISTORY
# =====================================================

@router.get("/{business_id}/verification-history")
def get_passport_verification_history(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL HISTORY PASSPORT
    # =================================================

    history_query = text("""
        SELECT
            id,
            business_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
    """)

    history = db.execute(
        history_query,
        {
            "business_id": business_id
        }
    ).mappings().all()


    # =================================================
    # 3. CEK DATA
    # =================================================

    if not history:

        raise HTTPException(
            status_code=404,
            detail="Belum ada riwayat Economic Passport"
        )


    # =================================================
    # 4. BENTUK VERIFICATION HISTORY
    # =================================================

    verification_history = []

    for item in history:

        # ---------------------------------------------
        # HITUNG UMUR PASSPORT
        # ---------------------------------------------

        age_query = text("""
            SELECT
                DATEDIFF(
                    CURRENT_TIMESTAMP,
                    :created_at
                ) AS age_days
        """)

        age_result = db.execute(
            age_query,
            {
                "created_at":
                    item["created_at"]
            }
        ).mappings().first()

        age_days = int(
            age_result["age_days"] or 0
        )


        # ---------------------------------------------
        # STATUS VALIDASI
        # ---------------------------------------------

        if age_days <= 90:

            verified = True
            verification_status = "VALID"

        else:

            verified = False
            verification_status = "EXPIRED"


        # ---------------------------------------------
        # SCORE
        # ---------------------------------------------

        score = float(
            item["business_score"] or 0
        )


        # ---------------------------------------------
        # LEVEL
        # ---------------------------------------------

        if score >= 80:

            level = "Excellent"

        elif score >= 65:

            level = "Good"

        elif score >= 50:

            level = "Needs Improvement"

        else:

            level = "Critical"


        verification_history.append({

            "passport_id":
                item["id"],

            "score":
                score,

            "level":
                level,

            "passport_status":
                item["status"],

            "verification_status":
                verification_status,

            "verified":
                verified,

            "age_days":
                age_days,

            "created_at":
                item["created_at"]
        })


    # =================================================
    # 5. HITUNG SUMMARY
    # =================================================

    valid_count = sum(
        1
        for item in verification_history
        if item["verified"]
    )

    expired_count = sum(
        1
        for item in verification_history
        if not item["verified"]
    )


    # =================================================
    # 6. PASSPORT TERBARU
    # =================================================

    latest = verification_history[0]


    # =================================================
    # 7. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "summary": {

            "total_passports":
                len(verification_history),

            "valid":
                valid_count,

            "expired":
                expired_count,

            "latest_passport_id":
                latest["passport_id"],

            "latest_status":
                latest["verification_status"]
        },


        "history":
            verification_history
    }
    
# =====================================================
# API #56
# PASSPORT RENEWAL STATUS
# =====================================================

@router.get("/{business_id}/renewal-status")
def get_passport_renewal_status(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. HITUNG UMUR
    # =================================================

    age_query = text("""
        SELECT
            DATEDIFF(
                CURRENT_TIMESTAMP,
                :created_at
            ) AS age_days
    """)

    age_result = db.execute(
        age_query,
        {
            "created_at":
                passport["created_at"]
        }
    ).mappings().first()

    age_days = int(
        age_result["age_days"] or 0
    )


    # =================================================
    # 4. MASA BERLAKU
    # =================================================

    validity_days = 90

    remaining_days = max(
        0,
        validity_days - age_days
    )


    # =================================================
    # 5. TENTUKAN STATUS
    # =================================================

    if age_days > validity_days:

        renewal_status = "Expired"

        renewal_required = True

        message = (
            "Passport telah kedaluwarsa "
            "dan perlu dilakukan assessment ulang."
        )


    elif remaining_days <= 14:

        renewal_status = "Expiring Soon"

        renewal_required = True

        message = (
            "Passport akan segera kedaluwarsa. "
            "Disarankan melakukan assessment ulang."
        )


    elif remaining_days <= 30:

        renewal_status = "Renewal Recommended"

        renewal_required = False

        message = (
            "Passport masih berlaku, tetapi "
            "sudah mendekati masa pembaruan."
        )


    else:

        renewal_status = "Active"

        renewal_required = False

        message = (
            "Passport masih aktif dan belum "
            "memerlukan pembaruan."
        )


    # =================================================
    # 6. SCORE
    # =================================================

    score = float(
        passport["business_score"] or 0
    )


    # =================================================
    # 7. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "passport": {

            "id":
                passport["id"],

            "score":
                score,

            "status":
                passport["status"],

            "created_at":
                passport["created_at"]
        },


        "renewal": {

            "status":
                renewal_status,

            "required":
                renewal_required,

            "validity_days":
                validity_days,

            "age_days":
                age_days,

            "remaining_days":
                remaining_days,

            "message":
                message
        }
    }
    
# =====================================================
# API #57
# PASSPORT RENEWAL PREVIEW
# =====================================================

@router.get("/{business_id}/renewal-preview")
def get_passport_renewal_preview(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. HITUNG UMUR PASSPORT
    # =================================================

    age_query = text("""
        SELECT
            DATEDIFF(
                CURRENT_TIMESTAMP,
                :created_at
            ) AS age_days
    """)

    age_result = db.execute(
        age_query,
        {
            "created_at":
                passport["created_at"]
        }
    ).mappings().first()

    age_days = int(
        age_result["age_days"] or 0
    )


    # =================================================
    # 4. MASA BERLAKU
    # =================================================

    validity_days = 90

    remaining_days = max(
        0,
        validity_days - age_days
    )


    # =================================================
    # 5. SCORE
    # =================================================

    scores = {

        "Profit":
            float(
                passport["profit_score"] or 0
            ),

        "People":
            float(
                passport["people_score"] or 0
            ),

        "Planet":
            float(
                passport["planet_score"] or 0
            ),

        "Marketplace":
            float(
                passport[
                    "marketplace_health_score"
                ] or 0
            )
    }


    overall_score = float(
        passport["business_score"] or 0
    )


    # =================================================
    # 6. AREA YANG PERLU DIPERHATIKAN
    # =================================================

    areas_need_attention = []

    for category, score in scores.items():

        if score < 80:

            if score < 50:

                severity = "Critical"

            elif score < 65:

                severity = "High"

            else:

                severity = "Medium"


            areas_need_attention.append({

                "category":
                    category,

                "current_score":
                    score,

                "target_score":
                    80,

                "gap":
                    round(
                        80 - score,
                        2
                    ),

                "severity":
                    severity
            })


    # =================================================
    # 7. URUTKAN AREA
    # =================================================

    areas_need_attention.sort(
        key=lambda item:
            item["current_score"]
    )


    # =================================================
    # 8. TENTUKAN RECOMMENDATION
    # =================================================

    if age_days > validity_days:

        renewal_action = "Renew Now"

        recommendation = (
            "Passport sudah kedaluwarsa. "
            "Lakukan assessment ulang untuk mendapatkan Passport terbaru."
        )

    elif remaining_days <= 14:

        renewal_action = "Renew Soon"

        recommendation = (
            "Passport akan segera kedaluwarsa. "
            "Disarankan menyiapkan assessment ulang."
        )

    elif remaining_days <= 30:

        renewal_action = "Prepare Renewal"

        recommendation = (
            "Passport masih aktif tetapi sudah mendekati "
            "masa pembaruan."
        )

    else:

        renewal_action = "No Renewal Needed"

        recommendation = (
            "Passport masih aktif dan belum membutuhkan pembaruan."
        )


    # =================================================
    # 9. PROJECTED IMPROVEMENT TARGET
    # =================================================

    target_score = 80

    score_gap = max(
        0,
        round(
            target_score - overall_score,
            2
        )
    )


    # =================================================
    # 10. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "current_passport": {

            "id":
                passport["id"],

            "score":
                overall_score,

            "status":
                passport["status"],

            "created_at":
                passport["created_at"]
        },


        "validity": {

            "validity_days":
                validity_days,

            "age_days":
                age_days,

            "remaining_days":
                remaining_days
        },


        "renewal": {

            "action":
                renewal_action,

            "recommendation":
                recommendation
        },


        "improvement": {

            "target_score":
                target_score,

            "current_score":
                overall_score,

            "gap":
                score_gap,

            "areas_need_attention":
                len(
                    areas_need_attention
                )
        },


        "areas":
            areas_need_attention
    }
    
# =====================================================
# API #58
# PASSPORT RENEWAL COMPARISON
# =====================================================

@router.get("/{business_id}/renewal-comparison")
def get_passport_renewal_comparison(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL DUA PASSPORT TERBARU
    # =================================================

    history_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 2
    """)

    history = db.execute(
        history_query,
        {
            "business_id": business_id
        }
    ).mappings().all()


    # =================================================
    # 3. CEK MINIMAL DATA
    # =================================================

    if len(history) < 2:

        return {

            "business": {

                "id":
                    business["id"],

                "business_name":
                    business["business_name"]
            },

            "comparison_available":
                False,

            "message":
                "Minimal dua Passport diperlukan untuk melakukan perbandingan renewal.",

            "total_passports":
                len(history)
        }


    # =================================================
    # 4. PASSPORT TERBARU DAN SEBELUMNYA
    # =================================================

    latest = history[0]

    previous = history[1]


    # =================================================
    # 5. SCORE OVERALL
    # =================================================

    previous_overall = float(
        previous["business_score"] or 0
    )

    latest_overall = float(
        latest["business_score"] or 0
    )

    overall_change = round(
        latest_overall
        - previous_overall,
        2
    )


    # =================================================
    # 6. TREND OVERALL
    # =================================================

    if overall_change > 0:

        overall_trend = "Improved"

    elif overall_change < 0:

        overall_trend = "Declined"

    else:

        overall_trend = "Stable"


    # =================================================
    # 7. AREA COMPARISON
    # =================================================

    area_mapping = {

        "Profit": (
            "profit_score"
        ),

        "People": (
            "people_score"
        ),

        "Planet": (
            "planet_score"
        ),

        "Marketplace": (
            "marketplace_health_score"
        )
    }


    areas = []

    improved_count = 0

    declined_count = 0

    stable_count = 0


    for category, column in area_mapping.items():

        previous_score = float(
            previous[column] or 0
        )

        latest_score = float(
            latest[column] or 0
        )

        change = round(
            latest_score
            - previous_score,
            2
        )


        if change > 0:

            trend = "Improved"

            improved_count += 1

        elif change < 0:

            trend = "Declined"

            declined_count += 1

        else:

            trend = "Stable"

            stable_count += 1


        areas.append({

            "category":
                category,

            "previous_score":
                previous_score,

            "latest_score":
                latest_score,

            "change":
                change,

            "trend":
                trend
        })


    # =================================================
    # 8. AREA TERBESAR PENINGKATANNYA
    # =================================================

    strongest_improvement = max(
        areas,
        key=lambda item:
            item["change"]
    )


    # =================================================
    # 9. AREA TERBESAR PENURUNANNYA
    # =================================================

    largest_decline = min(
        areas,
        key=lambda item:
            item["change"]
    )


    # =================================================
    # 10. TARGET 80
    # =================================================

    target_score = 80

    previous_target_gap = max(
        0,
        round(
            target_score
            - previous_overall,
            2
        )
    )

    latest_target_gap = max(
        0,
        round(
            target_score
            - latest_overall,
            2
        )
    )


    # =================================================
    # 11. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "comparison_available":
            True,


        "previous_passport": {

            "id":
                previous["id"],

            "score":
                previous_overall,

            "status":
                previous["status"],

            "created_at":
                previous["created_at"]
        },


        "latest_passport": {

            "id":
                latest["id"],

            "score":
                latest_overall,

            "status":
                latest["status"],

            "created_at":
                latest["created_at"]
        },


        "overall": {

            "previous_score":
                previous_overall,

            "latest_score":
                latest_overall,

            "change":
                overall_change,

            "trend":
                overall_trend
        },


        "target": {

            "target_score":
                target_score,

            "previous_gap":
                previous_target_gap,

            "latest_gap":
                latest_target_gap
        },


        "area_summary": {

            "improved":
                improved_count,

            "declined":
                declined_count,

            "stable":
                stable_count
        },


        "strongest_improvement": {

            "category":
                strongest_improvement["category"],

            "change":
                strongest_improvement["change"]
        },


        "largest_decline": {

            "category":
                largest_decline["category"],

            "change":
                largest_decline["change"]
        },


        "areas":
            areas
    }
    
# =====================================================
# API #59
# PASSPORT IMPROVEMENT PRIORITIES
# =====================================================

@router.get("/{business_id}/improvement-priorities")
def get_passport_improvement_priorities(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. SCORE
    # =================================================

    scores = {

        "Profit":
            float(
                passport["profit_score"] or 0
            ),

        "People":
            float(
                passport["people_score"] or 0
            ),

        "Planet":
            float(
                passport["planet_score"] or 0
            ),

        "Marketplace":
            float(
                passport[
                    "marketplace_health_score"
                ] or 0
            )
    }


    # =================================================
    # 4. TARGET
    # =================================================

    target_score = 80


    # =================================================
    # 5. BUAT PRIORITAS
    # =================================================

    priorities = []

    for category, score in scores.items():

        gap = round(
            max(
                0,
                target_score - score
            ),
            2
        )


        if score < 50:

            severity = "Critical"

        elif score < 65:

            severity = "High"

        elif score < 80:

            severity = "Medium"

        else:

            severity = "Low"


        if score < target_score:

            action_required = True

        else:

            action_required = False


        priorities.append({

            "category":
                category,

            "current_score":
                score,

            "target_score":
                target_score,

            "gap":
                gap,

            "severity":
                severity,

            "action_required":
                action_required
        })


    # =================================================
    # 6. URUTKAN
    # =================================================

    priorities.sort(
        key=lambda item: (
            item["current_score"],
            -item["gap"]
        )
    )


    # =================================================
    # 7. TAMBAHKAN NOMOR PRIORITAS
    # =================================================

    for index, item in enumerate(
        priorities,
        start=1
    ):

        item["priority"] = index


    # =================================================
    # 8. AREA YANG SUDAH MENCAPAI TARGET
    # =================================================

    achieved = [

        item["category"]

        for item in priorities

        if not item["action_required"]
    ]


    # =================================================
    # 9. AREA YANG PERLU TINDAKAN
    # =================================================

    action_required = [

        item

        for item in priorities

        if item["action_required"]
    ]


    # =================================================
    # 10. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "passport": {

            "id":
                passport["id"],

            "overall_score":
                float(
                    passport["business_score"]
                    or 0
                ),

            "status":
                passport["status"],

            "created_at":
                passport["created_at"]
        },


        "target": {

            "target_score":
                target_score,

            "total_areas":
                len(scores),

            "areas_requiring_action":
                len(action_required),

            "areas_achieved":
                len(achieved)
        },


        "top_priority":

            action_required[0]
            if action_required
            else None,


        "achieved_areas":
            achieved,


        "priorities":
            priorities
    }
    
# =====================================================
# API #60
# PASSPORT DASHBOARD SUMMARY
# =====================================================

@router.get("/{business_id}/dashboard")
def get_passport_dashboard(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. SCORE
    # =================================================

    overall_score = float(
        passport["business_score"] or 0
    )

    profit_score = float(
        passport["profit_score"] or 0
    )

    people_score = float(
        passport["people_score"] or 0
    )

    planet_score = float(
        passport["planet_score"] or 0
    )

    marketplace_score = float(
        passport[
            "marketplace_health_score"
        ] or 0
    )


    scores = {

        "Profit":
            profit_score,

        "People":
            people_score,

        "Planet":
            planet_score,

        "Marketplace":
            marketplace_score
    }


    # =================================================
    # 4. LEVEL
    # =================================================

    if overall_score >= 80:

        level = "Excellent"

    elif overall_score >= 65:

        level = "Good"

    elif overall_score >= 50:

        level = "Needs Improvement"

    else:

        level = "Critical"


    # =================================================
    # 5. AREA TERBAIK DAN TERLEMAH
    # =================================================

    strongest_category = max(
        scores,
        key=scores.get
    )

    weakest_category = min(
        scores,
        key=scores.get
    )


    # =================================================
    # 6. HITUNG ACTION REQUIRED
    # =================================================

    action_required = sum(
        1
        for score in scores.values()
        if score < 80
    )


    # =================================================
    # 7. HITUNG UMUR PASSPORT
    # =================================================

    age_query = text("""
        SELECT
            DATEDIFF(
                CURRENT_TIMESTAMP,
                :created_at
            ) AS age_days
    """)

    age_result = db.execute(
        age_query,
        {
            "created_at":
                passport["created_at"]
        }
    ).mappings().first()

    age_days = int(
        age_result["age_days"] or 0
    )


    validity_days = 90

    remaining_days = max(
        0,
        validity_days - age_days
    )


    # =================================================
    # 8. STATUS PASSPORT
    # =================================================

    if age_days > validity_days:

        passport_status = "Expired"

    elif remaining_days <= 14:

        passport_status = "Expiring Soon"

    else:

        passport_status = "Active"


    # =================================================
    # 9. AMBIL HISTORY
    # =================================================

    history_query = text("""
        SELECT
            id,
            business_score,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at ASC, id ASC
    """)

    history = db.execute(
        history_query,
        {
            "business_id": business_id
        }
    ).mappings().all()


    # =================================================
    # 10. TREND
    # =================================================

    if len(history) >= 2:

        previous_score = float(
            history[-2]["business_score"] or 0
        )

        score_change = round(
            overall_score - previous_score,
            2
        )

        if score_change > 0:

            trend = "Improving"

        elif score_change < 0:

            trend = "Declining"

        else:

            trend = "Stable"

    else:

        previous_score = None

        score_change = None

        trend = "First Assessment"


    # =================================================
    # 11. TARGET
    # =================================================

    target_score = 80

    target_gap = max(
        0,
        round(
            target_score - overall_score,
            2
        )
    )


    if overall_score >= target_score:

        target_status = "Achieved"

    else:

        target_status = "In Progress"


    # =================================================
    # 12. CATEGORY DATA
    # =================================================

    categories = []

    for category, score in scores.items():

        gap = max(
            0,
            round(
                target_score - score,
                2
            )
        )

        if score >= 80:

            status = "Excellent"

        elif score >= 65:

            status = "Good"

        elif score >= 50:

            status = "Needs Improvement"

        else:

            status = "Critical"


        categories.append({

            "category":
                category,

            "score":
                score,

            "target":
                target_score,

            "gap":
                gap,

            "status":
                status
        })


    # =================================================
    # 13. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "passport": {

            "id":
                passport["id"],

            "score":
                overall_score,

            "level":
                level,

            "status":
                passport["status"],

            "created_at":
                passport["created_at"],

            "passport_status":
                passport_status
        },


        "trend": {

            "current_score":
                overall_score,

            "previous_score":
                previous_score,

            "change":
                score_change,

            "direction":
                trend
        },


        "target": {

            "target_score":
                target_score,

            "status":
                target_status,

            "gap":
                target_gap
        },


        "categories":
            categories,


        "highlights": {

            "strongest_category":
                strongest_category,

            "strongest_score":
                scores[
                    strongest_category
                ],

            "weakest_category":
                weakest_category,

            "weakest_score":
                scores[
                    weakest_category
                ],

            "action_required":
                action_required
        },


        "history": {

            "total_assessments":
                len(history),

            "first_assessment":
                history[0]["created_at"],

            "latest_assessment":
                history[-1]["created_at"]
        }
    }
    
# =====================================================
# API #61
# PASSPORT SCORE BREAKDOWN
# =====================================================

@router.get("/{business_id}/score-breakdown")
def get_passport_score_breakdown(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. SCORE
    # =================================================

    overall_score = float(
        passport["business_score"] or 0
    )

    scores = {

        "Profit":
            float(
                passport["profit_score"] or 0
            ),

        "People":
            float(
                passport["people_score"] or 0
            ),

        "Planet":
            float(
                passport["planet_score"] or 0
            ),

        "Marketplace":
            float(
                passport[
                    "marketplace_health_score"
                ] or 0
            )
    }


    # =================================================
    # 4. HITUNG RATA-RATA AREA
    # =================================================

    category_average = round(
        sum(scores.values())
        / len(scores),
        2
    )


    # =================================================
    # 5. BUAT BREAKDOWN
    # =================================================

    breakdown = []

    for category, score in scores.items():

        # ---------------------------------------------
        # Selisih dengan overall
        # ---------------------------------------------

        difference = round(
            score - overall_score,
            2
        )


        # ---------------------------------------------
        # Persentase terhadap score maksimum
        # ---------------------------------------------

        percentage = round(
            score,
            2
        )


        # ---------------------------------------------
        # Progress menuju target 80
        # ---------------------------------------------

        target_score = 80

        if score >= target_score:

            target_progress = 100

        else:

            target_progress = round(
                (
                    score
                    / target_score
                ) * 100,
                2
            )


        # ---------------------------------------------
        # Status
        # ---------------------------------------------

        if score >= 80:

            status = "Excellent"

        elif score >= 65:

            status = "Good"

        elif score >= 50:

            status = "Needs Improvement"

        else:

            status = "Critical"


        breakdown.append({

            "category":
                category,

            "score":
                score,

            "percentage":
                percentage,

            "difference_from_overall":
                difference,

            "target_score":
                target_score,

            "target_progress":
                target_progress,

            "status":
                status
        })


    # =================================================
    # 6. RANKING
    # =================================================

    breakdown.sort(
        key=lambda item:
            item["score"],
        reverse=True
    )


    for index, item in enumerate(
        breakdown,
        start=1
    ):

        item["rank"] = index


    # =================================================
    # 7. HIGHEST DAN LOWEST
    # =================================================

    highest = breakdown[0]

    lowest = breakdown[-1]


    # =================================================
    # 8. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "passport": {

            "id":
                passport["id"],

            "overall_score":
                overall_score,

            "category_average":
                category_average,

            "status":
                passport["status"],

            "created_at":
                passport["created_at"]
        },


        "highest_category": {

            "category":
                highest["category"],

            "score":
                highest["score"],

            "rank":
                highest["rank"]
        },


        "lowest_category": {

            "category":
                lowest["category"],

            "score":
                lowest["score"],

            "rank":
                lowest["rank"]
        },


        "breakdown":
            breakdown
    }
    
# =====================================================
# API #62
# PASSPORT SCORE TIMELINE
# =====================================================

@router.get("/{business_id}/score-timeline")
def get_passport_score_timeline(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL HISTORY
    # =================================================

    history_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at ASC, id ASC
    """)

    history = db.execute(
        history_query,
        {
            "business_id": business_id
        }
    ).mappings().all()


    # =================================================
    # 3. CEK HISTORY
    # =================================================

    if not history:
        raise HTTPException(
            status_code=404,
            detail="Belum ada riwayat Economic Passport"
        )


    # =================================================
    # 4. BUAT TIMELINE
    # =================================================

    timeline = []

    for index, item in enumerate(
        history,
        start=1
    ):

        timeline.append({

            "assessment_number":
                index,

            "passport_id":
                item["id"],

            "date":
                item["created_at"],

            "overall_score":
                float(
                    item["business_score"] or 0
                ),

            "profit":
                float(
                    item["profit_score"] or 0
                ),

            "people":
                float(
                    item["people_score"] or 0
                ),

            "planet":
                float(
                    item["planet_score"] or 0
                ),

            "marketplace":
                float(
                    item[
                        "marketplace_health_score"
                    ] or 0
                ),

            "status":
                item["status"]
        })


    # =================================================
    # 5. HITUNG SCORE RANGE
    # =================================================

    overall_scores = [

        item["overall_score"]

        for item in timeline
    ]

    highest_score = max(
        overall_scores
    )

    lowest_score = min(
        overall_scores
    )


    # =================================================
    # 6. HITUNG TOTAL CHANGE
    # =================================================

    first_score = timeline[0][
        "overall_score"
    ]

    latest_score = timeline[-1][
        "overall_score"
    ]

    total_change = round(
        latest_score - first_score,
        2
    )


    # =================================================
    # 7. TREND
    # =================================================

    if total_change > 0:

        trend = "Improving"

    elif total_change < 0:

        trend = "Declining"

    else:

        trend = "Stable"


    # =================================================
    # 8. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "summary": {

            "total_assessments":
                len(timeline),

            "first_score":
                first_score,

            "latest_score":
                latest_score,

            "highest_score":
                highest_score,

            "lowest_score":
                lowest_score,

            "total_change":
                total_change,

            "trend":
                trend
        },


        "timeline":
            timeline
    }
    
# =====================================================
# API #63
# PASSPORT CATEGORY TIMELINE
# =====================================================

@router.get("/{business_id}/category-timeline")
def get_passport_category_timeline(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL HISTORY
    # =================================================

    history_query = text("""
        SELECT
            id,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at ASC, id ASC
    """)

    history = db.execute(
        history_query,
        {
            "business_id": business_id
        }
    ).mappings().all()


    # =================================================
    # 3. CEK DATA
    # =================================================

    if not history:
        raise HTTPException(
            status_code=404,
            detail="Belum ada riwayat Economic Passport"
        )


    # =================================================
    # 4. BUAT TIMELINE PER CATEGORY
    # =================================================

    profit_timeline = []
    people_timeline = []
    planet_timeline = []
    marketplace_timeline = []


    for index, item in enumerate(
        history,
        start=1
    ):

        profit_timeline.append({

            "assessment_number":
                index,

            "passport_id":
                item["id"],

            "date":
                item["created_at"],

            "score":
                float(
                    item["profit_score"] or 0
                )
        })


        people_timeline.append({

            "assessment_number":
                index,

            "passport_id":
                item["id"],

            "date":
                item["created_at"],

            "score":
                float(
                    item["people_score"] or 0
                )
        })


        planet_timeline.append({

            "assessment_number":
                index,

            "passport_id":
                item["id"],

            "date":
                item["created_at"],

            "score":
                float(
                    item["planet_score"] or 0
                )
        })


        marketplace_timeline.append({

            "assessment_number":
                index,

            "passport_id":
                item["id"],

            "date":
                item["created_at"],

            "score":
                float(
                    item[
                        "marketplace_health_score"
                    ] or 0
                )
        })


    # =================================================
    # 5. GABUNGKAN TIMELINE
    # =================================================

    timeline = []

    for index, item in enumerate(
        history,
        start=1
    ):

        timeline.append({

            "assessment_number":
                index,

            "passport_id":
                item["id"],

            "date":
                item["created_at"],

            "profit":
                float(
                    item["profit_score"] or 0
                ),

            "people":
                float(
                    item["people_score"] or 0
                ),

            "planet":
                float(
                    item["planet_score"] or 0
                ),

            "marketplace":
                float(
                    item[
                        "marketplace_health_score"
                    ] or 0
                )
        })


    # =================================================
    # 6. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "summary": {

            "total_assessments":
                len(history),

            "categories":
                4
        },


        "categories": {

            "profit":
                profit_timeline,

            "people":
                people_timeline,

            "planet":
                planet_timeline,

            "marketplace":
                marketplace_timeline
        },


        "timeline":
            timeline
    }
    
# =====================================================
# API #64
# PASSPORT CATEGORY TREND
# =====================================================

@router.get("/{business_id}/category-trend")
def get_passport_category_trend(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL HISTORY
    # =================================================

    history_query = text("""
        SELECT
            id,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at ASC, id ASC
    """)

    history = db.execute(
        history_query,
        {
            "business_id": business_id
        }
    ).mappings().all()


    # =================================================
    # 3. CEK DATA
    # =================================================

    if not history:
        raise HTTPException(
            status_code=404,
            detail="Belum ada riwayat Economic Passport"
        )


    # =================================================
    # 4. JIKA BARU SATU ASSESSMENT
    # =================================================

    if len(history) == 1:

        item = history[0]

        return {

            "business": {

                "id":
                    business["id"],

                "business_name":
                    business["business_name"]
            },

            "trend_available":
                False,

            "message":
                "Minimal dua assessment diperlukan untuk menentukan tren kategori.",

            "categories": {

                "Profit": {

                    "current_score":
                        float(
                            item["profit_score"] or 0
                        ),

                    "trend":
                        "No Previous Data"
                },

                "People": {

                    "current_score":
                        float(
                            item["people_score"] or 0
                        ),

                    "trend":
                        "No Previous Data"
                },

                "Planet": {

                    "current_score":
                        float(
                            item["planet_score"] or 0
                        ),

                    "trend":
                        "No Previous Data"
                },

                "Marketplace": {

                    "current_score":
                        float(
                            item[
                                "marketplace_health_score"
                            ] or 0
                        ),

                    "trend":
                        "No Previous Data"
                }
            }
        }


    # =================================================
    # 5. DATA PERTAMA DAN TERBARU
    # =================================================

    first = history[0]

    latest = history[-1]


    # =================================================
    # 6. DEFINISI CATEGORY
    # =================================================

    category_mapping = {

        "Profit":
            "profit_score",

        "People":
            "people_score",

        "Planet":
            "planet_score",

        "Marketplace":
            "marketplace_health_score"
    }


    category_trends = []


    # =================================================
    # 7. HITUNG TREND
    # =================================================

    for category, column in category_mapping.items():

        first_score = float(
            first[column] or 0
        )

        latest_score = float(
            latest[column] or 0
        )

        change = round(
            latest_score - first_score,
            2
        )


        # ---------------------------------------------
        # Trend
        # ---------------------------------------------

        if change > 0:

            trend = "Improving"

        elif change < 0:

            trend = "Declining"

        else:

            trend = "Stable"


        # ---------------------------------------------
        # Persentase perubahan
        # ---------------------------------------------

        if first_score != 0:

            percentage_change = round(
                (
                    change
                    / first_score
                ) * 100,
                2
            )

        else:

            percentage_change = 0


        # ---------------------------------------------
        # Status
        # ---------------------------------------------

        if latest_score >= 80:

            status = "Excellent"

        elif latest_score >= 65:

            status = "Good"

        elif latest_score >= 50:

            status = "Needs Improvement"

        else:

            status = "Critical"


        category_trends.append({

            "category":
                category,

            "first_score":
                first_score,

            "latest_score":
                latest_score,

            "change":
                change,

            "percentage_change":
                percentage_change,

            "trend":
                trend,

            "status":
                status
        })


    # =================================================
    # 8. HITUNG SUMMARY
    # =================================================

    improving = sum(
        1
        for item in category_trends
        if item["trend"] == "Improving"
    )

    declining = sum(
        1
        for item in category_trends
        if item["trend"] == "Declining"
    )

    stable = sum(
        1
        for item in category_trends
        if item["trend"] == "Stable"
    )


    # =================================================
    # 9. TERBAIK DAN TERBURUK
    # =================================================

    strongest_growth = max(
        category_trends,
        key=lambda item:
            item["change"]
    )

    largest_decline = min(
        category_trends,
        key=lambda item:
            item["change"]
    )


    # =================================================
    # 10. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "trend_available":
            True,


        "assessment": {

            "total":
                len(history),

            "first_date":
                first["created_at"],

            "latest_date":
                latest["created_at"]
        },


        "summary": {

            "improving":
                improving,

            "declining":
                declining,

            "stable":
                stable
        },


        "strongest_growth": {

            "category":
                strongest_growth["category"],

            "change":
                strongest_growth["change"],

            "trend":
                strongest_growth["trend"]
        },


        "largest_decline": {

            "category":
                largest_decline["category"],

            "change":
                largest_decline["change"],

            "trend":
                largest_decline["trend"]
        },


        "categories":
            category_trends
    }
    
# =====================================================
# API #65
# PASSPORT RECOMMENDATIONS
# =====================================================

@router.get("/{business_id}/recommendations")
def get_passport_recommendations(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. SCORE
    # =================================================

    overall_score = float(
        passport["business_score"] or 0
    )

    scores = {

        "Profit":
            float(
                passport["profit_score"] or 0
            ),

        "People":
            float(
                passport["people_score"] or 0
            ),

        "Planet":
            float(
                passport["planet_score"] or 0
            ),

        "Marketplace":
            float(
                passport[
                    "marketplace_health_score"
                ] or 0
            )
    }


    # =================================================
    # 4. FUNGSI REKOMENDASI
    # =================================================

    def generate_recommendation(
        category,
        score
    ):

        if category == "Profit":

            if score < 50:

                return {
                    "priority": "Critical",
                    "title": "Perbaiki kesehatan keuangan",
                    "recommendation":
                        "Evaluasi biaya operasional, margin keuntungan, "
                        "harga jual, dan arus kas bisnis."
                }

            elif score < 65:

                return {
                    "priority": "High",
                    "title": "Tingkatkan profitabilitas",
                    "recommendation":
                        "Kurangi biaya yang tidak produktif dan "
                        "tingkatkan margin keuntungan."
                }

            elif score < 80:

                return {
                    "priority": "Medium",
                    "title": "Optimalkan keuntungan",
                    "recommendation":
                        "Evaluasi produk dengan margin terbaik dan "
                        "optimalkan strategi harga."
                }

            else:

                return {
                    "priority": "Low",
                    "title": "Pertahankan profitabilitas",
                    "recommendation":
                        "Pertahankan margin yang sehat dan terus "
                        "pantau pertumbuhan keuntungan."
                }


        elif category == "People":

            if score < 50:

                return {
                    "priority": "Critical",
                    "title": "Perkuat aspek sosial bisnis",
                    "recommendation":
                        "Perbaiki kesejahteraan pekerja, kondisi kerja, "
                        "dan hubungan dengan pelanggan maupun komunitas."
                }

            elif score < 65:

                return {
                    "priority": "High",
                    "title": "Tingkatkan kesejahteraan",
                    "recommendation":
                        "Perhatikan kondisi kerja, pengembangan SDM, "
                        "dan kepuasan pelanggan."
                }

            elif score < 80:

                return {
                    "priority": "Medium",
                    "title": "Perkuat dampak sosial",
                    "recommendation":
                        "Tingkatkan pelatihan, keterlibatan komunitas, "
                        "dan kualitas pelayanan."
                }

            else:

                return {
                    "priority": "Low",
                    "title": "Pertahankan dampak sosial",
                    "recommendation":
                        "Pertahankan praktik bisnis yang memberikan "
                        "dampak positif bagi pekerja dan komunitas."
                }


        elif category == "Planet":

            if score < 50:

                return {
                    "priority": "Critical",
                    "title": "Kurangi dampak lingkungan",
                    "recommendation":
                        "Kurangi limbah, penggunaan energi berlebih, "
                        "dan penggunaan material yang tidak ramah lingkungan."
                }

            elif score < 65:

                return {
                    "priority": "High",
                    "title": "Tingkatkan praktik ramah lingkungan",
                    "recommendation":
                        "Mulai menerapkan pengelolaan limbah, "
                        "efisiensi energi, dan penggunaan material berkelanjutan."
                }

            elif score < 80:

                return {
                    "priority": "Medium",
                    "title": "Optimalkan keberlanjutan",
                    "recommendation":
                        "Tingkatkan efisiensi penggunaan bahan, energi, "
                        "dan pengelolaan limbah."
                }

            else:

                return {
                    "priority": "Low",
                    "title": "Pertahankan praktik berkelanjutan",
                    "recommendation":
                        "Pertahankan praktik ramah lingkungan dan "
                        "tingkatkan inovasi berkelanjutan."
                }


        else:

            if score < 50:

                return {
                    "priority": "Critical",
                    "title": "Evaluasi marketplace",
                    "recommendation":
                        "Evaluasi biaya marketplace, ketergantungan "
                        "platform, promosi, dan profitabilitas setiap kanal."
                }

            elif score < 65:

                return {
                    "priority": "High",
                    "title": "Perbaiki strategi marketplace",
                    "recommendation":
                        "Bandingkan biaya, komisi, promosi, dan keuntungan "
                        "dari setiap marketplace."
                }

            elif score < 80:

                return {
                    "priority": "Medium",
                    "title": "Optimalkan pilihan marketplace",
                    "recommendation":
                        "Fokus pada marketplace yang memberikan "
                        "keseimbangan terbaik antara biaya dan keuntungan."
                }

            else:

                return {
                    "priority": "Low",
                    "title": "Pertahankan performa marketplace",
                    "recommendation":
                        "Pertahankan marketplace yang sehat dan "
                        "evaluasi performanya secara berkala."
                }


    # =================================================
    # 5. BUAT REKOMENDASI
    # =================================================

    recommendations = []

    for category, score in scores.items():

        recommendation = generate_recommendation(
            category,
            score
        )

        gap = max(
            0,
            round(
                80 - score,
                2
            )
        )

        recommendations.append({

            "category":
                category,

            "score":
                score,

            "target":
                80,

            "gap":
                gap,

            "priority":
                recommendation["priority"],

            "title":
                recommendation["title"],

            "recommendation":
                recommendation["recommendation"]
        })


    # =================================================
    # 6. URUTKAN PRIORITAS
    # =================================================

    priority_order = {

        "Critical": 1,

        "High": 2,

        "Medium": 3,

        "Low": 4
    }

    recommendations.sort(
        key=lambda item: (
            priority_order[
                item["priority"]
            ],
            item["score"]
        )
    )


    # =================================================
    # 7. NOMOR PRIORITAS
    # =================================================

    for index, item in enumerate(
        recommendations,
        start=1
    ):

        item["priority_rank"] = index


    # =================================================
    # 8. HITUNG SUMMARY
    # =================================================

    critical_count = sum(
        1
        for item in recommendations
        if item["priority"] == "Critical"
    )

    high_count = sum(
        1
        for item in recommendations
        if item["priority"] == "High"
    )

    medium_count = sum(
        1
        for item in recommendations
        if item["priority"] == "Medium"
    )

    low_count = sum(
        1
        for item in recommendations
        if item["priority"] == "Low"
    )


    # =================================================
    # 9. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "passport": {

            "id":
                passport["id"],

            "overall_score":
                overall_score,

            "status":
                passport["status"],

            "created_at":
                passport["created_at"]
        },


        "summary": {

            "total_recommendations":
                len(recommendations),

            "critical":
                critical_count,

            "high":
                high_count,

            "medium":
                medium_count,

            "low":
                low_count
        },


        "top_recommendation":
            recommendations[0],


        "recommendations":
            recommendations
    }
    
# =====================================================
# API #66
# PASSPORT ACTION PLAN
# =====================================================

@router.get("/{business_id}/action-plan")
def get_passport_action_plan(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. SCORE
    # =================================================

    scores = {

        "Profit":
            float(
                passport["profit_score"] or 0
            ),

        "People":
            float(
                passport["people_score"] or 0
            ),

        "Planet":
            float(
                passport["planet_score"] or 0
            ),

        "Marketplace":
            float(
                passport[
                    "marketplace_health_score"
                ] or 0
            )
    }


    # =================================================
    # 4. ACTION PLAN TEMPLATE
    # =================================================

    action_templates = {

        "Profit": {

            "critical":
                "Lakukan evaluasi menyeluruh terhadap biaya operasional, "
                "harga jual, margin keuntungan, dan arus kas.",

            "high":
                "Kurangi biaya yang tidak produktif dan evaluasi "
                "produk dengan margin keuntungan rendah.",

            "medium":
                "Optimalkan strategi harga dan prioritaskan produk "
                "dengan margin keuntungan terbaik.",

            "low":
                "Pertahankan margin keuntungan dan lakukan evaluasi "
                "profitabilitas secara berkala."
        },


        "People": {

            "critical":
                "Perbaiki kondisi kerja, kesejahteraan pekerja, "
                "kepuasan pelanggan, dan hubungan dengan komunitas.",

            "high":
                "Tingkatkan kesejahteraan pekerja, kualitas pelayanan, "
                "dan pengembangan sumber daya manusia.",

            "medium":
                "Tambahkan pelatihan dan tingkatkan keterlibatan "
                "pekerja maupun komunitas.",

            "low":
                "Pertahankan praktik sosial yang baik dan terus "
                "tingkatkan kualitas hubungan dengan stakeholder."
        },


        "Planet": {

            "critical":
                "Kurangi limbah dan penggunaan energi serta evaluasi "
                "material yang memiliki dampak lingkungan tinggi.",

            "high":
                "Terapkan pengelolaan limbah dan efisiensi penggunaan "
                "energi serta bahan baku.",

            "medium":
                "Tingkatkan efisiensi bahan, energi, dan pengelolaan "
                "limbah secara bertahap.",

            "low":
                "Pertahankan praktik ramah lingkungan dan kembangkan "
                "inovasi berkelanjutan."
        },


        "Marketplace": {

            "critical":
                "Evaluasi seluruh marketplace yang digunakan, termasuk "
                "komisi, biaya layanan, promosi, dan profitabilitas.",

            "high":
                "Bandingkan biaya dan keuntungan setiap marketplace "
                "serta kurangi ketergantungan pada kanal yang tidak sehat.",

            "medium":
                "Fokuskan penjualan pada marketplace dengan "
                "keseimbangan biaya dan keuntungan terbaik.",

            "low":
                "Pertahankan marketplace yang sehat dan lakukan "
                "evaluasi performa secara berkala."
        }
    }


    # =================================================
    # 5. BUAT ACTION PLAN
    # =================================================

    action_plan = []

    for category, score in scores.items():

        # ---------------------------------------------
        # TENTUKAN PRIORITAS
        # ---------------------------------------------

        if score < 50:

            priority = "Critical"

            priority_key = "critical"

        elif score < 65:

            priority = "High"

            priority_key = "high"

        elif score < 80:

            priority = "Medium"

            priority_key = "medium"

        else:

            priority = "Low"

            priority_key = "low"


        # ---------------------------------------------
        # GAP
        # ---------------------------------------------

        gap = round(
            max(
                0,
                80 - score
            ),
            2
        )


        # ---------------------------------------------
        # TARGET
        # ---------------------------------------------

        target = 80


        # ---------------------------------------------
        # ACTION
        # ---------------------------------------------

        action = action_templates[
            category
        ][
            priority_key
        ]


        # ---------------------------------------------
        # STATUS
        # ---------------------------------------------

        if score >= target:

            status = "On Track"

        else:

            status = "Needs Action"


        action_plan.append({

            "category":
                category,

            "current_score":
                score,

            "target_score":
                target,

            "gap":
                gap,

            "priority":
                priority,

            "status":
                status,

            "action":
                action
        })


    # =================================================
    # 6. URUTKAN
    # =================================================

    priority_order = {

        "Critical": 1,

        "High": 2,

        "Medium": 3,

        "Low": 4
    }

    action_plan.sort(
        key=lambda item: (
            priority_order[
                item["priority"]
            ],
            item["current_score"]
        )
    )


    # =================================================
    # 7. NOMOR URUT
    # =================================================

    for index, item in enumerate(
        action_plan,
        start=1
    ):

        item["step"] = index


    # =================================================
    # 8. SUMMARY
    # =================================================

    needs_action = sum(
        1
        for item in action_plan
        if item["status"] == "Needs Action"
    )

    on_track = sum(
        1
        for item in action_plan
        if item["status"] == "On Track"
    )


    # =================================================
    # 9. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "passport": {

            "id":
                passport["id"],

            "overall_score":
                float(
                    passport["business_score"]
                    or 0
                ),

            "status":
                passport["status"],

            "created_at":
                passport["created_at"]
        },


        "summary": {

            "total_actions":
                len(action_plan),

            "needs_action":
                needs_action,

            "on_track":
                on_track
        },


        "top_action":
            action_plan[0]
            if action_plan
            else None,


        "action_plan":
            action_plan
    }
    
# =====================================================
# API #67
# PASSPORT ACTION PLAN PROGRESS
# =====================================================

@router.get("/{business_id}/action-plan-progress")
def get_passport_action_plan_progress(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL DUA PASSPORT TERBARU
    # =================================================

    history_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 2
    """)

    history = db.execute(
        history_query,
        {
            "business_id": business_id
        }
    ).mappings().all()


    # =================================================
    # 3. CEK JUMLAH ASSESSMENT
    # =================================================

    if len(history) == 0:

        raise HTTPException(
            status_code=404,
            detail="Belum ada Economic Passport"
        )


    # =================================================
    # 4. JIKA BARU SATU ASSESSMENT
    # =================================================

    if len(history) == 1:

        latest = history[0]

        return {

            "business": {

                "id":
                    business["id"],

                "business_name":
                    business["business_name"]
            },

            "progress_available":
                False,

            "message":
                "Minimal dua assessment diperlukan untuk mengukur progress action plan.",

            "current_passport": {

                "id":
                    latest["id"],

                "score":
                    float(
                        latest["business_score"]
                        or 0
                    ),

                "created_at":
                    latest["created_at"]
            },

            "areas": []
        }


    # =================================================
    # 5. PASSPORT TERBARU DAN SEBELUMNYA
    # =================================================

    latest = history[0]

    previous = history[1]


    # =================================================
    # 6. MAPPING CATEGORY
    # =================================================

    category_mapping = {

        "Profit":
            "profit_score",

        "People":
            "people_score",

        "Planet":
            "planet_score",

        "Marketplace":
            "marketplace_health_score"
    }


    # =================================================
    # 7. HITUNG PROGRESS
    # =================================================

    areas = []

    improved = 0

    declined = 0

    stable = 0


    for category, column in category_mapping.items():

        previous_score = float(
            previous[column] or 0
        )

        current_score = float(
            latest[column] or 0
        )

        change = round(
            current_score
            - previous_score,
            2
        )


        # ---------------------------------------------
        # STATUS PROGRESS
        # ---------------------------------------------

        if change > 0:

            progress_status = "Improved"

            improved += 1

        elif change < 0:

            progress_status = "Declined"

            declined += 1

        else:

            progress_status = "No Change"

            stable += 1


        # ---------------------------------------------
        # TARGET
        # ---------------------------------------------

        target_score = 80

        remaining_gap = round(
            max(
                0,
                target_score
                - current_score
            ),
            2
        )


        # ---------------------------------------------
        # TARGET STATUS
        # ---------------------------------------------

        if current_score >= target_score:

            target_status = "Achieved"

        else:

            target_status = "In Progress"


        # ---------------------------------------------
        # PROGRESS PERCENTAGE
        # ---------------------------------------------

        if previous_score < target_score:

            denominator = (
                target_score
                - previous_score
            )

            if denominator > 0:

                progress_percentage = round(
                    (
                        change
                        / denominator
                    ) * 100,
                    2
                )

            else:

                progress_percentage = 100

        else:

            progress_percentage = 100


        # Batasi antara 0 dan 100

        progress_percentage = max(
            0,
            min(
                100,
                progress_percentage
            )
        )


        areas.append({

            "category":
                category,

            "previous_score":
                previous_score,

            "current_score":
                current_score,

            "change":
                change,

            "progress_percentage":
                progress_percentage,

            "target_score":
                target_score,

            "remaining_gap":
                remaining_gap,

            "target_status":
                target_status,

            "progress_status":
                progress_status
        })


    # =================================================
    # 8. OVERALL PROGRESS
    # =================================================

    previous_overall = float(
        previous["business_score"] or 0
    )

    current_overall = float(
        latest["business_score"] or 0
    )

    overall_change = round(
        current_overall
        - previous_overall,
        2
    )


    # =================================================
    # 9. OVERALL STATUS
    # =================================================

    if overall_change > 0:

        overall_status = "Improved"

    elif overall_change < 0:

        overall_status = "Declined"

    else:

        overall_status = "No Change"


    # =================================================
    # 10. AREA TERBAIK
    # =================================================

    strongest_progress = max(
        areas,
        key=lambda item:
            item["change"]
    )


    # =================================================
    # 11. AREA TERBURUK
    # =================================================

    weakest_progress = min(
        areas,
        key=lambda item:
            item["change"]
    )


    # =================================================
    # 12. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "progress_available":
            True,


        "previous_passport": {

            "id":
                previous["id"],

            "score":
                previous_overall,

            "created_at":
                previous["created_at"]
        },


        "current_passport": {

            "id":
                latest["id"],

            "score":
                current_overall,

            "created_at":
                latest["created_at"]
        },


        "overall_progress": {

            "previous_score":
                previous_overall,

            "current_score":
                current_overall,

            "change":
                overall_change,

            "status":
                overall_status
        },


        "summary": {

            "improved":
                improved,

            "declined":
                declined,

            "no_change":
                stable
        },


        "strongest_progress": {

            "category":
                strongest_progress["category"],

            "change":
                strongest_progress["change"],

            "status":
                strongest_progress["progress_status"]
        },


        "weakest_progress": {

            "category":
                weakest_progress["category"],

            "change":
                weakest_progress["change"],

            "status":
                weakest_progress["progress_status"]
        },


        "areas":
            areas
    }
    
# =====================================================
# API #68
# PASSPORT IMPROVEMENT GOALS
# =====================================================

@router.get("/{business_id}/improvement-goals")
def get_passport_improvement_goals(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. SCORE
    # =================================================

    scores = {

        "Profit":
            float(
                passport["profit_score"] or 0
            ),

        "People":
            float(
                passport["people_score"] or 0
            ),

        "Planet":
            float(
                passport["planet_score"] or 0
            ),

        "Marketplace":
            float(
                passport[
                    "marketplace_health_score"
                ] or 0
            )
    }


    # =================================================
    # 4. TARGET
    # =================================================

    target_score = 80


    # =================================================
    # 5. BUAT GOALS
    # =================================================

    goals = []

    achieved = 0

    in_progress = 0


    for category, current_score in scores.items():

        # ---------------------------------------------
        # GAP
        # ---------------------------------------------

        gap = round(
            max(
                0,
                target_score - current_score
            ),
            2
        )


        # ---------------------------------------------
        # PROGRESS
        # ---------------------------------------------

        progress = round(
            min(
                100,
                (
                    current_score
                    / target_score
                ) * 100
            ),
            2
        )


        # ---------------------------------------------
        # STATUS
        # ---------------------------------------------

        if current_score >= target_score:

            goal_status = "Achieved"

            achieved += 1

        else:

            goal_status = "In Progress"

            in_progress += 1


        # ---------------------------------------------
        # NEXT SCORE
        # ---------------------------------------------

        if current_score < 50:

            next_milestone = 50

        elif current_score < 65:

            next_milestone = 65

        elif current_score < 80:

            next_milestone = 80

        else:

            next_milestone = 100


        next_gap = round(
            max(
                0,
                next_milestone - current_score
            ),
            2
        )


        goals.append({

            "category":
                category,

            "current_score":
                current_score,

            "target_score":
                target_score,

            "gap":
                gap,

            "progress_percentage":
                progress,

            "goal_status":
                goal_status,

            "next_milestone":
                next_milestone,

            "next_milestone_gap":
                next_gap
        })


    # =================================================
    # 6. URUTKAN DARI PROGRESS TERENDAH
    # =================================================

    goals.sort(
        key=lambda item:
            item["progress_percentage"]
    )


    # =================================================
    # 7. TAMBAHKAN RANK
    # =================================================

    for index, item in enumerate(
        goals,
        start=1
    ):

        item["priority"] = index


    # =================================================
    # 8. OVERALL GOAL
    # =================================================

    overall_score = float(
        passport["business_score"] or 0
    )

    overall_gap = round(
        max(
            0,
            target_score - overall_score
        ),
        2
    )

    overall_progress = round(
        min(
            100,
            (
                overall_score
                / target_score
            ) * 100
        ),
        2
    )


    if overall_score >= target_score:

        overall_status = "Achieved"

    else:

        overall_status = "In Progress"


    # =================================================
    # 9. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "passport": {

            "id":
                passport["id"],

            "overall_score":
                overall_score,

            "status":
                passport["status"],

            "created_at":
                passport["created_at"]
        },


        "overall_goal": {

            "target_score":
                target_score,

            "current_score":
                overall_score,

            "gap":
                overall_gap,

            "progress_percentage":
                overall_progress,

            "status":
                overall_status
        },


        "summary": {

            "total_goals":
                len(goals),

            "achieved":
                achieved,

            "in_progress":
                in_progress
        },


        "top_priority":
            goals[0]
            if goals
            else None,


        "goals":
            goals
    }
    
# =====================================================
# API #69
# PASSPORT GOAL PROGRESS HISTORY
# =====================================================

@router.get("/{business_id}/goal-progress-history")
def get_passport_goal_progress_history(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL HISTORY
    # =================================================

    history_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at ASC, id ASC
    """)

    history = db.execute(
        history_query,
        {
            "business_id": business_id
        }
    ).mappings().all()


    # =================================================
    # 3. CEK DATA
    # =================================================

    if not history:
        raise HTTPException(
            status_code=404,
            detail="Belum ada riwayat Economic Passport"
        )


    # =================================================
    # 4. TARGET
    # =================================================

    target_score = 80


    # =================================================
    # 5. BUAT HISTORY PROGRESS
    # =================================================

    progress_history = []


    for index, item in enumerate(
        history,
        start=1
    ):

        overall_score = float(
            item["business_score"] or 0
        )


        # ---------------------------------------------
        # Progress overall menuju target
        # ---------------------------------------------

        overall_progress = round(
            min(
                100,
                (
                    overall_score
                    / target_score
                ) * 100
            ),
            2
        )


        # ---------------------------------------------
        # Status target
        # ---------------------------------------------

        if overall_score >= target_score:

            overall_status = "Achieved"

        else:

            overall_status = "In Progress"


        # ---------------------------------------------
        # Category scores
        # ---------------------------------------------

        categories = {

            "Profit":
                float(
                    item["profit_score"] or 0
                ),

            "People":
                float(
                    item["people_score"] or 0
                ),

            "Planet":
                float(
                    item["planet_score"] or 0
                ),

            "Marketplace":
                float(
                    item[
                        "marketplace_health_score"
                    ] or 0
                )
        }


        category_progress = {}


        for category, score in categories.items():

            progress = round(
                min(
                    100,
                    (
                        score
                        / target_score
                    ) * 100
                ),
                2
            )


            gap = round(
                max(
                    0,
                    target_score - score
                ),
                2
            )


            category_progress[category] = {

                "score":
                    score,

                "progress_percentage":
                    progress,

                "gap":
                    gap,

                "status":
                    "Achieved"
                    if score >= target_score
                    else "In Progress"
            }


        # ---------------------------------------------
        # Simpan assessment
        # ---------------------------------------------

        progress_history.append({

            "assessment_number":
                index,

            "passport_id":
                item["id"],

            "date":
                item["created_at"],

            "overall": {

                "score":
                    overall_score,

                "progress_percentage":
                    overall_progress,

                "status":
                    overall_status
            },

            "categories":
                category_progress,

            "passport_status":
                item["status"]
        })


    # =================================================
    # 6. CURRENT PROGRESS
    # =================================================

    latest = progress_history[-1]


    # =================================================
    # 7. FIRST PROGRESS
    # =================================================

    first = progress_history[0]


    # =================================================
    # 8. TOTAL IMPROVEMENT
    # =================================================

    total_score_change = round(
        latest["overall"]["score"]
        - first["overall"]["score"],
        2
    )


    total_progress_change = round(
        latest["overall"]["progress_percentage"]
        - first["overall"]["progress_percentage"],
        2
    )


    # =================================================
    # 9. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "target": {

            "target_score":
                target_score,

            "first_score":
                first["overall"]["score"],

            "latest_score":
                latest["overall"]["score"],

            "first_progress":
                first["overall"]["progress_percentage"],

            "latest_progress":
                latest["overall"]["progress_percentage"],

            "score_change":
                total_score_change,

            "progress_change":
                total_progress_change
        },


        "summary": {

            "total_assessments":
                len(progress_history),

            "current_status":
                latest["overall"]["status"],

            "current_progress":
                latest["overall"]["progress_percentage"]
        },


        "history":
            progress_history
    }
    
# =====================================================
# API #70
# PASSPORT OVERALL STATISTICS
# =====================================================

@router.get("/{business_id}/statistics")
def get_passport_statistics(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL SELURUH HISTORY
    # =================================================

    history_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at ASC, id ASC
    """)

    history = db.execute(
        history_query,
        {
            "business_id": business_id
        }
    ).mappings().all()


    # =================================================
    # 3. CEK DATA
    # =================================================

    if not history:
        raise HTTPException(
            status_code=404,
            detail="Belum ada riwayat Economic Passport"
        )


    # =================================================
    # 4. TARGET
    # =================================================

    target_score = 80


    # =================================================
    # 5. AMBIL OVERALL SCORE
    # =================================================

    overall_scores = [

        float(
            item["business_score"] or 0
        )

        for item in history
    ]


    # =================================================
    # 6. STATISTIK OVERALL
    # =================================================

    average_score = round(
        sum(overall_scores)
        / len(overall_scores),
        2
    )

    highest_score = max(
        overall_scores
    )

    lowest_score = min(
        overall_scores
    )

    latest_score = overall_scores[-1]

    first_score = overall_scores[0]


    # =================================================
    # 7. TOTAL PERUBAHAN
    # =================================================

    total_change = round(
        latest_score
        - first_score,
        2
    )


    # =================================================
    # 8. TREND
    # =================================================

    if total_change > 0:

        trend = "Improving"

    elif total_change < 0:

        trend = "Declining"

    else:

        trend = "Stable"


    # =================================================
    # 9. CATEGORY TERBARU
    # =================================================

    latest = history[-1]

    categories = {

        "Profit":
            float(
                latest["profit_score"] or 0
            ),

        "People":
            float(
                latest["people_score"] or 0
            ),

        "Planet":
            float(
                latest["planet_score"] or 0
            ),

        "Marketplace":
            float(
                latest[
                    "marketplace_health_score"
                ] or 0
            )
    }


    # =================================================
    # 10. CATEGORY YANG MENCAPAI TARGET
    # =================================================

    achieved_categories = [

        category

        for category, score
        in categories.items()

        if score >= target_score
    ]


    categories_below_target = [

        category

        for category, score
        in categories.items()

        if score < target_score
    ]


    # =================================================
    # 11. SCORE TERBAIK DAN TERENDAH
    # =================================================

    strongest_category = max(
        categories,
        key=categories.get
    )

    weakest_category = min(
        categories,
        key=categories.get
    )


    # =================================================
    # 12. JUMLAH ASSESSMENT MENCAPAI TARGET
    # =================================================

    assessments_reaching_target = sum(

        1

        for score in overall_scores

        if score >= target_score
    )


    # =================================================
    # 13. PERSENTASE ASSESSMENT MENCAPAI TARGET
    # =================================================

    target_percentage = round(
        (
            assessments_reaching_target
            / len(history)
        ) * 100,
        2
    )


    # =================================================
    # 14. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "statistics": {

            "total_assessments":
                len(history),

            "average_score":
                average_score,

            "highest_score":
                highest_score,

            "lowest_score":
                lowest_score,

            "first_score":
                first_score,

            "latest_score":
                latest_score,

            "total_change":
                total_change,

            "trend":
                trend
        },


        "target": {

            "target_score":
                target_score,

            "latest_score":
                latest_score,

            "achieved":
                latest_score >= target_score,

            "gap":
                round(
                    max(
                        0,
                        target_score
                        - latest_score
                    ),
                    2
                ),

            "assessments_reaching_target":
                assessments_reaching_target,

            "target_percentage":
                target_percentage
        },


        "categories": {

            "achieved":
                achieved_categories,

            "below_target":
                categories_below_target,

            "achieved_count":
                len(achieved_categories),

            "below_target_count":
                len(categories_below_target),

            "strongest":
                {
                    "category":
                        strongest_category,

                    "score":
                        categories[
                            strongest_category
                        ]
                },

            "weakest":
                {
                    "category":
                        weakest_category,

                    "score":
                        categories[
                            weakest_category
                        ]
                }
        },


        "latest_passport": {

            "id":
                latest["id"],

            "status":
                latest["status"],

            "created_at":
                latest["created_at"]
        }
    }
    
# =====================================================
# API #71
# PASSPORT CATEGORY STATISTICS
# =====================================================

@router.get("/{business_id}/category-statistics")
def get_passport_category_statistics(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL HISTORY
    # =================================================

    history_query = text("""
        SELECT
            id,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at ASC, id ASC
    """)

    history = db.execute(
        history_query,
        {
            "business_id": business_id
        }
    ).mappings().all()


    # =================================================
    # 3. CEK DATA
    # =================================================

    if not history:
        raise HTTPException(
            status_code=404,
            detail="Belum ada riwayat Economic Passport"
        )


    # =================================================
    # 4. MAPPING CATEGORY
    # =================================================

    category_mapping = {

        "Profit":
            "profit_score",

        "People":
            "people_score",

        "Planet":
            "planet_score",

        "Marketplace":
            "marketplace_health_score"
    }


    statistics = []


    # =================================================
    # 5. HITUNG STATISTIK SETIAP CATEGORY
    # =================================================

    for category, column in category_mapping.items():

        scores = [

            float(
                item[column] or 0
            )

            for item in history
        ]


        # ---------------------------------------------
        # BASIC STATISTICS
        # ---------------------------------------------

        average_score = round(
            sum(scores)
            / len(scores),
            2
        )

        highest_score = max(scores)

        lowest_score = min(scores)

        first_score = scores[0]

        latest_score = scores[-1]


        # ---------------------------------------------
        # CHANGE
        # ---------------------------------------------

        total_change = round(
            latest_score
            - first_score,
            2
        )


        # ---------------------------------------------
        # TREND
        # ---------------------------------------------

        if total_change > 0:

            trend = "Improving"

        elif total_change < 0:

            trend = "Declining"

        else:

            trend = "Stable"


        # ---------------------------------------------
        # TARGET
        # ---------------------------------------------

        target_score = 80

        target_gap = round(
            max(
                0,
                target_score
                - latest_score
            ),
            2
        )

        target_achieved = (
            latest_score >= target_score
        )


        # ---------------------------------------------
        # JUMLAH ASSESSMENT MENCAPAI TARGET
        # ---------------------------------------------

        assessments_reaching_target = sum(

            1

            for score in scores

            if score >= target_score
        )


        # ---------------------------------------------
        # PERSENTASE PENCAPAIAN TARGET
        # ---------------------------------------------

        target_percentage = round(
            (
                assessments_reaching_target
                / len(scores)
            ) * 100,
            2
        )


        statistics.append({

            "category":
                category,

            "average_score":
                average_score,

            "highest_score":
                highest_score,

            "lowest_score":
                lowest_score,

            "first_score":
                first_score,

            "latest_score":
                latest_score,

            "total_change":
                total_change,

            "trend":
                trend,

            "target_score":
                target_score,

            "target_gap":
                target_gap,

            "target_achieved":
                target_achieved,

            "assessments_reaching_target":
                assessments_reaching_target,

            "target_percentage":
                target_percentage
        })


    # =================================================
    # 6. RANKING
    # =================================================

    statistics.sort(
        key=lambda item:
            item["latest_score"],
        reverse=True
    )


    for index, item in enumerate(
        statistics,
        start=1
    ):

        item["rank"] = index


    # =================================================
    # 7. CATEGORY TERBAIK
    # =================================================

    strongest = statistics[0]


    # =================================================
    # 8. CATEGORY TERENDAH
    # =================================================

    weakest = statistics[-1]


    # =================================================
    # 9. SUMMARY TREND
    # =================================================

    improving = sum(

        1

        for item in statistics

        if item["trend"] == "Improving"
    )

    declining = sum(

        1

        for item in statistics

        if item["trend"] == "Declining"
    )

    stable = sum(

        1

        for item in statistics

        if item["trend"] == "Stable"
    )


    # =================================================
    # 10. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "summary": {

            "total_assessments":
                len(history),

            "total_categories":
                len(statistics),

            "improving":
                improving,

            "declining":
                declining,

            "stable":
                stable
        },


        "strongest_category": {

            "category":
                strongest["category"],

            "latest_score":
                strongest["latest_score"],

            "average_score":
                strongest["average_score"],

            "trend":
                strongest["trend"]
        },


        "weakest_category": {

            "category":
                weakest["category"],

            "latest_score":
                weakest["latest_score"],

            "average_score":
                weakest["average_score"],

            "trend":
                weakest["trend"]
        },


        "categories":
            statistics
    }
    
# =====================================================
# API #72
# PASSPORT SCORE COMPARISON
# =====================================================

@router.get("/{business_id}/score-comparison")
def get_passport_score_comparison(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL DUA PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 2
    """)

    passports = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().all()


    # =================================================
    # 3. CEK DATA
    # =================================================

    if not passports:

        raise HTTPException(
            status_code=404,
            detail="Belum ada Economic Passport"
        )


    # =================================================
    # 4. JIKA BARU SATU PASSPORT
    # =================================================

    if len(passports) == 1:

        latest = passports[0]

        return {

            "business": {

                "id":
                    business["id"],

                "business_name":
                    business["business_name"]
            },

            "comparison_available":
                False,

            "message":
                "Belum ada assessment sebelumnya untuk dibandingkan.",

            "latest": {

                "passport_id":
                    latest["id"],

                "score":
                    float(
                        latest["business_score"] or 0
                    ),

                "status":
                    latest["status"],

                "created_at":
                    latest["created_at"]
            }
        }


    # =================================================
    # 5. PASSPORT TERBARU
    # =================================================

    latest = passports[0]

    previous = passports[1]


    # =================================================
    # 6. OVERALL SCORE
    # =================================================

    latest_overall = float(
        latest["business_score"] or 0
    )

    previous_overall = float(
        previous["business_score"] or 0
    )

    overall_change = round(
        latest_overall
        - previous_overall,
        2
    )


    # =================================================
    # 7. OVERALL TREND
    # =================================================

    if overall_change > 0:

        overall_trend = "Improved"

    elif overall_change < 0:

        overall_trend = "Declined"

    else:

        overall_trend = "Stable"


    # =================================================
    # 8. CATEGORY COMPARISON
    # =================================================

    category_mapping = {

        "Profit":
            "profit_score",

        "People":
            "people_score",

        "Planet":
            "planet_score",

        "Marketplace":
            "marketplace_health_score"
    }


    categories = []


    for category, column in category_mapping.items():

        previous_score = float(
            previous[column] or 0
        )

        latest_score = float(
            latest[column] or 0
        )

        change = round(
            latest_score
            - previous_score,
            2
        )


        if change > 0:

            trend = "Improved"

        elif change < 0:

            trend = "Declined"

        else:

            trend = "Stable"


        categories.append({

            "category":
                category,

            "previous_score":
                previous_score,

            "latest_score":
                latest_score,

            "change":
                change,

            "trend":
                trend
        })


    # =================================================
    # 9. HITUNG SUMMARY
    # =================================================

    improved = sum(

        1

        for item in categories

        if item["trend"] == "Improved"
    )

    declined = sum(

        1

        for item in categories

        if item["trend"] == "Declined"
    )

    stable = sum(

        1

        for item in categories

        if item["trend"] == "Stable"
    )


    # =================================================
    # 10. SCORE TERBESAR MENINGKAT
    # =================================================

    strongest_improvement = max(
        categories,
        key=lambda item:
            item["change"]
    )


    # =================================================
    # 11. PENURUNAN TERBESAR
    # =================================================

    largest_decline = min(
        categories,
        key=lambda item:
            item["change"]
    )


    # =================================================
    # 12. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "comparison_available":
            True,


        "latest": {

            "passport_id":
                latest["id"],

            "score":
                latest_overall,

            "status":
                latest["status"],

            "created_at":
                latest["created_at"]
        },


        "previous": {

            "passport_id":
                previous["id"],

            "score":
                previous_overall,

            "status":
                previous["status"],

            "created_at":
                previous["created_at"]
        },


        "overall": {

            "previous_score":
                previous_overall,

            "latest_score":
                latest_overall,

            "change":
                overall_change,

            "trend":
                overall_trend
        },


        "summary": {

            "improved":
                improved,

            "declined":
                declined,

            "stable":
                stable
        },


        "strongest_improvement":
            strongest_improvement,


        "largest_decline":
            largest_decline,


        "categories":
            categories
    }
    
# =====================================================
# API #73
# PASSPORT PERFORMANCE RATING
# =====================================================

@router.get("/{business_id}/performance-rating")
def get_passport_performance_rating(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. OVERALL SCORE
    # =================================================

    overall_score = float(
        passport["business_score"] or 0
    )


    # =================================================
    # 4. TENTUKAN RATING
    # =================================================

    if overall_score >= 90:

        rating = "A+"

        level = "Outstanding"

        description = (
            "Bisnis menunjukkan performa yang sangat baik "
            "dan memiliki tingkat keberlanjutan yang tinggi."
        )

    elif overall_score >= 80:

        rating = "A"

        level = "Excellent"

        description = (
            "Bisnis memiliki performa yang sangat baik "
            "dan telah mencapai target utama Economic Passport."
        )

    elif overall_score >= 70:

        rating = "B+"

        level = "Good"

        description = (
            "Bisnis memiliki performa yang baik, "
            "namun masih terdapat beberapa area yang dapat dioptimalkan."
        )

    elif overall_score >= 65:

        rating = "B"

        level = "Moderate"

        description = (
            "Bisnis memiliki performa cukup baik, "
            "tetapi membutuhkan peningkatan pada beberapa aspek."
        )

    elif overall_score >= 50:

        rating = "C"

        level = "Needs Improvement"

        description = (
            "Bisnis membutuhkan perbaikan pada beberapa "
            "aspek utama agar performanya meningkat."
        )

    else:

        rating = "D"

        level = "Critical"

        description = (
            "Bisnis membutuhkan evaluasi dan perbaikan "
            "secara menyeluruh."
        )


    # =================================================
    # 5. TARGET
    # =================================================

    target_score = 80

    target_achieved = (
        overall_score >= target_score
    )

    target_gap = round(
        max(
            0,
            target_score - overall_score
        ),
        2
    )


    # =================================================
    # 6. CATEGORY SCORE
    # =================================================

    categories = {

        "Profit":
            float(
                passport["profit_score"] or 0
            ),

        "People":
            float(
                passport["people_score"] or 0
            ),

        "Planet":
            float(
                passport["planet_score"] or 0
            ),

        "Marketplace":
            float(
                passport[
                    "marketplace_health_score"
                ] or 0
            )
    }


    # =================================================
    # 7. CATEGORY RATING
    # =================================================

    category_ratings = []

    for category, score in categories.items():

        if score >= 90:

            category_rating = "A+"

        elif score >= 80:

            category_rating = "A"

        elif score >= 70:

            category_rating = "B+"

        elif score >= 65:

            category_rating = "B"

        elif score >= 50:

            category_rating = "C"

        else:

            category_rating = "D"


        category_ratings.append({

            "category":
                category,

            "score":
                score,

            "rating":
                category_rating,

            "target_achieved":
                score >= target_score,

            "gap":
                round(
                    max(
                        0,
                        target_score - score
                    ),
                    2
                )
        })


    # =================================================
    # 8. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "passport": {

            "id":
                passport["id"],

            "score":
                overall_score,

            "status":
                passport["status"],

            "created_at":
                passport["created_at"]
        },


        "rating": {

            "rating":
                rating,

            "level":
                level,

            "description":
                description
        },


        "target": {

            "target_score":
                target_score,

            "achieved":
                target_achieved,

            "gap":
                target_gap
        },


        "categories":
            category_ratings
    }
    
# =====================================================
# API #74
# PASSPORT CATEGORY RATING SUMMARY
# =====================================================

@router.get("/{business_id}/category-rating")
def get_passport_category_rating(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. SCORE CATEGORY
    # =================================================

    scores = {

        "Profit":
            float(
                passport["profit_score"] or 0
            ),

        "People":
            float(
                passport["people_score"] or 0
            ),

        "Planet":
            float(
                passport["planet_score"] or 0
            ),

        "Marketplace":
            float(
                passport[
                    "marketplace_health_score"
                ] or 0
            )
    }


    # =================================================
    # 4. FUNGSI RATING
    # =================================================

    def get_rating(score):

        if score >= 90:
            return "A+"

        elif score >= 80:
            return "A"

        elif score >= 70:
            return "B+"

        elif score >= 65:
            return "B"

        elif score >= 50:
            return "C"

        else:
            return "D"


    # =================================================
    # 5. BUAT CATEGORY SUMMARY
    # =================================================

    categories = []

    for category, score in scores.items():

        rating = get_rating(score)

        gap = round(
            max(
                0,
                80 - score
            ),
            2
        )

        target_achieved = (
            score >= 80
        )

        categories.append({

            "category":
                category,

            "score":
                score,

            "rating":
                rating,

            "target":
                80,

            "gap":
                gap,

            "target_achieved":
                target_achieved
        })


    # =================================================
    # 6. RANKING
    # =================================================

    categories.sort(
        key=lambda item:
            item["score"],
        reverse=True
    )


    for index, item in enumerate(
        categories,
        start=1
    ):

        item["rank"] = index


    # =================================================
    # 7. SUMMARY
    # =================================================

    achieved_count = sum(

        1

        for item in categories

        if item["target_achieved"]
    )

    below_target_count = (
        len(categories)
        - achieved_count
    )


    # =================================================
    # 8. STRONGEST CATEGORY
    # =================================================

    strongest = categories[0]


    # =================================================
    # 9. WEAKEST CATEGORY
    # =================================================

    weakest = categories[-1]


    # =================================================
    # 10. AVERAGE
    # =================================================

    average_score = round(
        sum(
            item["score"]
            for item in categories
        )
        / len(categories),
        2
    )


    # =================================================
    # 11. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "passport": {

            "id":
                passport["id"],

            "overall_score":
                float(
                    passport["business_score"]
                    or 0
                ),

            "status":
                passport["status"],

            "created_at":
                passport["created_at"]
        },


        "summary": {

            "average_category_score":
                average_score,

            "total_categories":
                len(categories),

            "target_achieved":
                achieved_count,

            "below_target":
                below_target_count
        },


        "strongest": {

            "category":
                strongest["category"],

            "score":
                strongest["score"],

            "rating":
                strongest["rating"]
        },


        "weakest": {

            "category":
                weakest["category"],

            "score":
                weakest["score"],

            "rating":
                weakest["rating"],

            "gap":
                weakest["gap"]
        },


        "categories":
            categories
    }
    
# =====================================================
# API #75
# PASSPORT ELIGIBILITY CHECK
# =====================================================

@router.get("/{business_id}/eligibility")
def get_passport_eligibility(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()


    # =================================================
    # 3. BELUM ADA PASSPORT
    # =================================================

    if not passport:

        return {

            "business": {

                "id":
                    business["id"],

                "business_name":
                    business["business_name"]
            },

            "eligible":
                False,

            "status":
                "Not Assessed",

            "message":
                "Bisnis belum memiliki Economic Passport. "
                "Assessment diperlukan terlebih dahulu.",

            "requirements": {

                "passport_exists":
                    False,

                "minimum_score":
                    50,

                "score_requirement_met":
                    False
            }
        }


    # =================================================
    # 4. SCORE
    # =================================================

    overall_score = float(
        passport["business_score"] or 0
    )

    profit_score = float(
        passport["profit_score"] or 0
    )

    people_score = float(
        passport["people_score"] or 0
    )

    planet_score = float(
        passport["planet_score"] or 0
    )

    marketplace_score = float(
        passport[
            "marketplace_health_score"
        ] or 0
    )


    # =================================================
    # 5. MINIMUM SCORE
    # =================================================

    minimum_score = 50

    score_requirement_met = (
        overall_score >= minimum_score
    )


    # =================================================
    # 6. CATEGORY CHECK
    # =================================================

    categories = {

        "Profit":
            profit_score,

        "People":
            people_score,

        "Planet":
            planet_score,

        "Marketplace":
            marketplace_score
    }


    categories_below_minimum = [

        category

        for category, score
        in categories.items()

        if score < minimum_score
    ]


    all_categories_met = (
        len(categories_below_minimum) == 0
    )


    # =================================================
    # 7. ELIGIBILITY
    # =================================================

    eligible = (
        score_requirement_met
        and all_categories_met
    )


    # =================================================
    # 8. STATUS
    # =================================================

    if eligible:

        eligibility_status = "Eligible"

        message = (
            "Bisnis memenuhi persyaratan minimum "
            "untuk Economic Passport."
        )

    else:

        eligibility_status = "Not Eligible"

        message = (
            "Bisnis belum memenuhi seluruh persyaratan "
            "minimum Economic Passport."
        )


    # =================================================
    # 9. CATEGORY DETAIL
    # =================================================

    category_details = []

    for category, score in categories.items():

        category_details.append({

            "category":
                category,

            "score":
                score,

            "minimum_score":
                minimum_score,

            "requirement_met":
                score >= minimum_score
        })


    # =================================================
    # 10. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "eligible":
            eligible,


        "status":
            eligibility_status,


        "message":
            message,


        "passport": {

            "id":
                passport["id"],

            "overall_score":
                overall_score,

            "status":
                passport["status"],

            "created_at":
                passport["created_at"]
        },


        "requirements": {

            "minimum_score":
                minimum_score,

            "score_requirement_met":
                score_requirement_met,

            "all_categories_met":
                all_categories_met,

            "categories_below_minimum":
                len(
                    categories_below_minimum
                )
        },


        "categories":
            category_details
    }
    
# =====================================================
# API #76
# PASSPORT STATUS SUMMARY
# =====================================================

@router.get("/{business_id}/status-summary")
def get_passport_status_summary(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()


    # =================================================
    # 3. JIKA BELUM ADA
    # =================================================

    if not passport:

        return {

            "business": {
                "id":
                    business["id"],

                "business_name":
                    business["business_name"]
            },

            "has_passport":
                False,

            "status":
                "Not Assessed",

            "message":
                "Bisnis belum memiliki Economic Passport."
        }


    # =================================================
    # 4. SCORE
    # =================================================

    score = float(
        passport["business_score"] or 0
    )


    # =================================================
    # 5. LEVEL
    # =================================================

    if score >= 90:

        level = "Outstanding"

    elif score >= 80:

        level = "Excellent"

    elif score >= 70:

        level = "Good"

    elif score >= 65:

        level = "Moderate"

    elif score >= 50:

        level = "Needs Improvement"

    else:

        level = "Critical"


    # =================================================
    # 6. HITUNG UMUR PASSPORT
    # =================================================

    age_query = text("""
        SELECT
            DATEDIFF(
                CURRENT_TIMESTAMP,
                :created_at
            ) AS age_days
    """)

    age_result = db.execute(
        age_query,
        {
            "created_at":
                passport["created_at"]
        }
    ).mappings().first()

    age_days = int(
        age_result["age_days"] or 0
    )


    # =================================================
    # 7. MASA BERLAKU
    # =================================================

    validity_days = 90

    remaining_days = max(
        0,
        validity_days - age_days
    )


    # =================================================
    # 8. STATUS AKTIVITAS
    # =================================================

    if age_days > validity_days:

        status = "Expired"

        status_message = (
            "Passport sudah kedaluwarsa."
        )

    elif remaining_days <= 14:

        status = "Expiring Soon"

        status_message = (
            "Passport akan segera kedaluwarsa."
        )

    elif score < 50:

        status = "Needs Attention"

        status_message = (
            "Score Passport masih berada "
            "di bawah batas minimum."
        )

    else:

        status = "Active"

        status_message = (
            "Passport masih aktif."
        )


    # =================================================
    # 9. TARGET
    # =================================================

    target_score = 80

    target_achieved = (
        score >= target_score
    )

    target_gap = round(
        max(
            0,
            target_score - score
        ),
        2
    )


    # =================================================
    # 10. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "has_passport":
            True,


        "passport": {

            "id":
                passport["id"],

            "score":
                score,

            "level":
                level,

            "database_status":
                passport["status"],

            "created_at":
                passport["created_at"]
        },


        "status": {

            "current":
                status,

            "message":
                status_message,

            "age_days":
                age_days,

            "validity_days":
                validity_days,

            "remaining_days":
                remaining_days
        },


        "target": {

            "target_score":
                target_score,

            "achieved":
                target_achieved,

            "gap":
                target_gap
        }
    }
    
# =====================================================
# API #77
# PASSPORT VERIFICATION SUMMARY
# =====================================================

@router.get("/{business_id}/verification-summary")
def get_passport_verification_summary(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()


    # =================================================
    # 3. BELUM ADA PASSPORT
    # =================================================

    if not passport:

        return {

            "business": {

                "id":
                    business["id"],

                "business_name":
                    business["business_name"]
            },

            "verified":
                False,

            "verification_status":
                "Not Assessed",

            "message":
                "Bisnis belum memiliki Economic Passport."
        }


    # =================================================
    # 4. HITUNG UMUR PASSPORT
    # =================================================

    age_query = text("""
        SELECT
            DATEDIFF(
                CURRENT_TIMESTAMP,
                :created_at
            ) AS age_days
    """)

    age_result = db.execute(
        age_query,
        {
            "created_at":
                passport["created_at"]
        }
    ).mappings().first()

    age_days = int(
        age_result["age_days"] or 0
    )


    # =================================================
    # 5. MASA BERLAKU
    # =================================================

    validity_days = 90

    remaining_days = max(
        0,
        validity_days - age_days
    )


    # =================================================
    # 6. STATUS VERIFIKASI
    # =================================================

    if age_days > validity_days:

        verified = False

        verification_status = "Expired"

        verification_message = (
            "Passport sudah melewati masa berlaku."
        )

    elif remaining_days <= 14:

        verified = True

        verification_status = "Expiring Soon"

        verification_message = (
            "Passport masih valid tetapi "
            "segera memasuki masa pembaruan."
        )

    else:

        verified = True

        verification_status = "Verified"

        verification_message = (
            "Passport masih valid dan dapat digunakan."
        )


    # =================================================
    # 7. TANGGAL PERKIRAAN EXPIRED
    # =================================================

    expiry_query = text("""
        SELECT
            DATE_ADD(
                :created_at,
                INTERVAL :validity_days DAY
            ) AS expiry_date
    """)

    expiry_result = db.execute(
        expiry_query,
        {
            "created_at":
                passport["created_at"],

            "validity_days":
                validity_days
        }
    ).mappings().first()

    expiry_date = expiry_result["expiry_date"]


    # =================================================
    # 8. SCORE
    # =================================================

    score = float(
        passport["business_score"] or 0
    )


    # =================================================
    # 9. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "verification": {

            "verified":
                verified,

            "status":
                verification_status,

            "message":
                verification_message
        },


        "passport": {

            "id":
                passport["id"],

            "score":
                score,

            "database_status":
                passport["status"],

            "created_at":
                passport["created_at"],

            "expiry_date":
                expiry_date
        },


        "validity": {

            "validity_days":
                validity_days,

            "age_days":
                age_days,

            "remaining_days":
                remaining_days
        }
    }
    
# =====================================================
# API #78
# PASSPORT DETAIL
# =====================================================

@router.get("/{business_id}/detail")
def get_passport_detail(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. SCORE
    # =================================================

    overall_score = float(
        passport["business_score"] or 0
    )

    profit_score = float(
        passport["profit_score"] or 0
    )

    people_score = float(
        passport["people_score"] or 0
    )

    planet_score = float(
        passport["planet_score"] or 0
    )

    marketplace_score = float(
        passport["marketplace_health_score"] or 0
    )


    # =================================================
    # 4. LEVEL
    # =================================================

    if overall_score >= 90:

        level = "Outstanding"

    elif overall_score >= 80:

        level = "Excellent"

    elif overall_score >= 70:

        level = "Good"

    elif overall_score >= 65:

        level = "Moderate"

    elif overall_score >= 50:

        level = "Needs Improvement"

    else:

        level = "Critical"


    # =================================================
    # 5. CATEGORY
    # =================================================

    categories = [

        {
            "name": "Profit",
            "score": profit_score,
            "target": 80,
            "achieved": profit_score >= 80
        },

        {
            "name": "People",
            "score": people_score,
            "target": 80,
            "achieved": people_score >= 80
        },

        {
            "name": "Planet",
            "score": planet_score,
            "target": 80,
            "achieved": planet_score >= 80
        },

        {
            "name": "Marketplace",
            "score": marketplace_score,
            "target": 80,
            "achieved": marketplace_score >= 80
        }
    ]


    # =================================================
    # 6. CATEGORY TERBAIK
    # =================================================

    strongest = max(
        categories,
        key=lambda item: item["score"]
    )


    # =================================================
    # 7. CATEGORY TERLEMAH
    # =================================================

    weakest = min(
        categories,
        key=lambda item: item["score"]
    )


    # =================================================
    # 8. TARGET
    # =================================================

    target_score = 80

    target_gap = round(
        max(
            0,
            target_score - overall_score
        ),
        2
    )


    # =================================================
    # 9. STATUS TARGET
    # =================================================

    if overall_score >= target_score:

        target_status = "Achieved"

    else:

        target_status = "In Progress"


    # =================================================
    # 10. RESPONSE
    # =================================================

    return {

        "business": {

            "id": business["id"],

            "business_name":
                business["business_name"]
        },

        "passport": {

            "id":
                passport["id"],

            "overall_score":
                overall_score,

            "level":
                level,

            "status":
                passport["status"],

            "created_at":
                passport["created_at"]
        },

        "target": {

            "target_score":
                target_score,

            "status":
                target_status,

            "gap":
                target_gap
        },

        "categories":
            categories,

        "highlights": {

            "strongest":
                strongest,

            "weakest":
                weakest
        }
    }
    
# =====================================================
# API #79
# PASSPORT SHARE DATA
# =====================================================

@router.get("/{business_id}/share")
def get_passport_share_data(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()


    # =================================================
    # 3. CEK PASSPORT
    # =================================================

    if not passport:

        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 4. SCORE
    # =================================================

    overall_score = float(
        passport["business_score"] or 0
    )

    profit_score = float(
        passport["profit_score"] or 0
    )

    people_score = float(
        passport["people_score"] or 0
    )

    planet_score = float(
        passport["planet_score"] or 0
    )

    marketplace_score = float(
        passport["marketplace_health_score"] or 0
    )


    # =================================================
    # 5. LEVEL
    # =================================================

    if overall_score >= 90:

        level = "Outstanding"

    elif overall_score >= 80:

        level = "Excellent"

    elif overall_score >= 70:

        level = "Good"

    elif overall_score >= 65:

        level = "Moderate"

    elif overall_score >= 50:

        level = "Needs Improvement"

    else:

        level = "Critical"


    # =================================================
    # 6. STATUS SHARE
    # =================================================

    if overall_score >= 80:

        share_status = "Verified"

    elif overall_score >= 50:

        share_status = "Needs Improvement"

    else:

        share_status = "Critical"


    # =================================================
    # 7. CATEGORY
    # =================================================

    categories = [

        {
            "category": "Profit",
            "score": profit_score
        },

        {
            "category": "People",
            "score": people_score
        },

        {
            "category": "Planet",
            "score": planet_score
        },

        {
            "category": "Marketplace",
            "score": marketplace_score
        }
    ]


    # =================================================
    # 8. TARGET
    # =================================================

    target_score = 80

    target_achieved = (
        overall_score >= target_score
    )


    # =================================================
    # 9. HITUNG UMUR PASSPORT
    # =================================================

    age_query = text("""
        SELECT
            DATEDIFF(
                CURRENT_TIMESTAMP,
                :created_at
            ) AS age_days
    """)

    age_result = db.execute(
        age_query,
        {
            "created_at":
                passport["created_at"]
        }
    ).mappings().first()

    age_days = int(
        age_result["age_days"] or 0
    )


    validity_days = 90

    remaining_days = max(
        0,
        validity_days - age_days
    )


    # =================================================
    # 10. STATUS VALIDITAS
    # =================================================

    if age_days > validity_days:

        validity_status = "Expired"

    elif remaining_days <= 14:

        validity_status = "Expiring Soon"

    else:

        validity_status = "Valid"


    # =================================================
    # 11. RESPONSE SHARE
    # =================================================

    return {

        "shareable": True,

        "passport": {

            "passport_id":
                passport["id"],

            "business_name":
                business["business_name"],

            "score":
                overall_score,

            "level":
                level,

            "status":
                share_status,

            "issued_at":
                passport["created_at"],

            "validity_status":
                validity_status
        },

        "categories":
            categories,

        "target": {

            "target_score":
                target_score,

            "achieved":
                target_achieved
        },

        "validity": {

            "validity_days":
                validity_days,

            "age_days":
                age_days,

            "remaining_days":
                remaining_days
        },

        "verification": {

            "verified":
                validity_status != "Expired",

            "verification_status":
                validity_status
        }
    }
    
# =====================================================
# API #80
# PUBLIC PASSPORT VERIFICATION
# =====================================================

@router.get("/verify/{passport_id}")
def verify_public_passport(
    passport_id: int,
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. AMBIL PASSPORT
    # =================================================

    passport_query = text("""
        SELECT
            ph.id,
            ph.business_id,
            ph.business_score,
            ph.profit_score,
            ph.people_score,
            ph.planet_score,
            ph.marketplace_health_score,
            ph.status,
            ph.created_at,
            b.business_name
        FROM passport_history ph
        INNER JOIN businesses b
            ON ph.business_id = b.id
        WHERE ph.id = :passport_id
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "passport_id": passport_id
        }
    ).mappings().first()


    # =================================================
    # 2. PASSPORT TIDAK DITEMUKAN
    # =================================================

    if not passport:

        return {

            "verified":
                False,

            "status":
                "Not Found",

            "message":
                "Passport tidak ditemukan."
        }


    # =================================================
    # 3. SCORE
    # =================================================

    overall_score = float(
        passport["business_score"] or 0
    )

    profit_score = float(
        passport["profit_score"] or 0
    )

    people_score = float(
        passport["people_score"] or 0
    )

    planet_score = float(
        passport["planet_score"] or 0
    )

    marketplace_score = float(
        passport[
            "marketplace_health_score"
        ] or 0
    )


    # =================================================
    # 4. MASA BERLAKU
    # =================================================

    validity_days = 90

    age_query = text("""
        SELECT
            DATEDIFF(
                CURRENT_TIMESTAMP,
                :created_at
            ) AS age_days
    """)

    age_result = db.execute(
        age_query,
        {
            "created_at":
                passport["created_at"]
        }
    ).mappings().first()

    age_days = int(
        age_result["age_days"] or 0
    )

    remaining_days = max(
        0,
        validity_days - age_days
    )


    # =================================================
    # 5. STATUS VALIDITAS
    # =================================================

    if age_days > validity_days:

        verified = False

        verification_status = "Expired"

        message = (
            "Passport ditemukan tetapi "
            "sudah melewati masa berlaku."
        )

    else:

        verified = True

        verification_status = "Verified"

        message = (
            "Passport valid dan berhasil diverifikasi."
        )


    # =================================================
    # 6. LEVEL
    # =================================================

    if overall_score >= 90:

        level = "Outstanding"

    elif overall_score >= 80:

        level = "Excellent"

    elif overall_score >= 70:

        level = "Good"

    elif overall_score >= 65:

        level = "Moderate"

    elif overall_score >= 50:

        level = "Needs Improvement"

    else:

        level = "Critical"


    # =================================================
    # 7. CATEGORY
    # =================================================

    categories = [

        {
            "category":
                "Profit",

            "score":
                profit_score
        },

        {
            "category":
                "People",

            "score":
                people_score
        },

        {
            "category":
                "Planet",

            "score":
                planet_score
        },

        {
            "category":
                "Marketplace",

            "score":
                marketplace_score
        }
    ]


    # =================================================
    # 8. TARGET
    # =================================================

    target_score = 80

    target_achieved = (
        overall_score >= target_score
    )


    # =================================================
    # 9. RESPONSE PUBLIK
    # =================================================

    return {

        "verified":
            verified,

        "verification": {

            "status":
                verification_status,

            "message":
                message
        },


        "passport": {

            "id":
                passport["id"],

            "business_name":
                passport["business_name"],

            "score":
                overall_score,

            "level":
                level,

            "status":
                passport["status"],

            "issued_at":
                passport["created_at"],

            "validity": {

                "validity_days":
                    validity_days,

                "age_days":
                    age_days,

                "remaining_days":
                    remaining_days
            }
        },


        "categories":
            categories,


        "target": {

            "target_score":
                target_score,

            "achieved":
                target_achieved
        }
    }
    
# =====================================================
# API #81
# PASSPORT MARKETPLACE COMPATIBILITY
# =====================================================

@router.get("/{business_id}/marketplace-compatibility")
def get_marketplace_compatibility(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. SCORE
    # =================================================

    profit_score = float(
        passport["profit_score"] or 0
    )

    people_score = float(
        passport["people_score"] or 0
    )

    planet_score = float(
        passport["planet_score"] or 0
    )

    marketplace_score = float(
        passport["marketplace_health_score"] or 0
    )


    # =================================================
    # 4. MARKETPLACE PROFILE
    # =================================================
    #
    # Bobot dibuat sebagai model awal.
    # Nanti bisa disesuaikan dengan data marketplace
    # yang sebenarnya.
    # =================================================

    marketplace_profiles = {

        "Marketplace A": {

            "profit_weight": 0.40,
            "people_weight": 0.15,
            "planet_weight": 0.10,
            "marketplace_weight": 0.35
        },

        "Marketplace B": {

            "profit_weight": 0.30,
            "people_weight": 0.20,
            "planet_weight": 0.20,
            "marketplace_weight": 0.30
        },

        "Marketplace C": {

            "profit_weight": 0.25,
            "people_weight": 0.15,
            "planet_weight": 0.30,
            "marketplace_weight": 0.30
        }
    }


    # =================================================
    # 5. HITUNG COMPATIBILITY
    # =================================================

    results = []

    for marketplace, profile in marketplace_profiles.items():

        compatibility_score = round(

            (
                profit_score
                * profile["profit_weight"]
            )

            +

            (
                people_score
                * profile["people_weight"]
            )

            +

            (
                planet_score
                * profile["planet_weight"]
            )

            +

            (
                marketplace_score
                * profile["marketplace_weight"]
            ),

            2
        )


        # ---------------------------------------------
        # LEVEL
        # ---------------------------------------------

        if compatibility_score >= 85:

            level = "Very Compatible"

        elif compatibility_score >= 75:

            level = "Compatible"

        elif compatibility_score >= 60:

            level = "Moderately Compatible"

        elif compatibility_score >= 50:

            level = "Low Compatibility"

        else:

            level = "Not Recommended"


        # ---------------------------------------------
        # RECOMMENDATION
        # ---------------------------------------------

        if compatibility_score >= 75:

            recommendation = (
                "Marketplace cukup sesuai dengan "
                "kondisi bisnis saat ini."
            )

        elif compatibility_score >= 60:

            recommendation = (
                "Marketplace masih dapat digunakan, "
                "tetapi beberapa aspek bisnis perlu diperbaiki."
            )

        else:

            recommendation = (
                "Marketplace kurang sesuai dengan "
                "kondisi bisnis saat ini."
            )


        results.append({

            "marketplace":
                marketplace,

            "compatibility_score":
                compatibility_score,

            "level":
                level,

            "recommendation":
                recommendation
        })


    # =================================================
    # 6. RANKING
    # =================================================

    results.sort(
        key=lambda item:
            item["compatibility_score"],
        reverse=True
    )


    for index, item in enumerate(
        results,
        start=1
    ):

        item["rank"] = index


    # =================================================
    # 7. BEST MARKETPLACE
    # =================================================

    best_marketplace = results[0]


    # =================================================
    # 8. WORST MARKETPLACE
    # =================================================

    worst_marketplace = results[-1]


    # =================================================
    # 9. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },

        "passport": {

            "id":
                passport["id"],

            "marketplace_health_score":
                marketplace_score
        },

        "input_scores": {

            "profit":
                profit_score,

            "people":
                people_score,

            "planet":
                planet_score,

            "marketplace":
                marketplace_score
        },

        "best_match": {

            "marketplace":
                best_marketplace["marketplace"],

            "score":
                best_marketplace[
                    "compatibility_score"
                ],

            "level":
                best_marketplace["level"]
        },

        "lowest_match": {

            "marketplace":
                worst_marketplace["marketplace"],

            "score":
                worst_marketplace[
                    "compatibility_score"
                ],

            "level":
                worst_marketplace["level"]
        },

        "marketplaces":
            results
    }
    
# =====================================================
# API #82
# PASSPORT MARKETPLACE RECOMMENDATION
# =====================================================

@router.get("/{business_id}/marketplace-recommendation")
def get_marketplace_recommendation(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. SCORE
    # =================================================

    scores = {

        "Profit":
            float(
                passport["profit_score"] or 0
            ),

        "People":
            float(
                passport["people_score"] or 0
            ),

        "Planet":
            float(
                passport["planet_score"] or 0
            ),

        "Marketplace":
            float(
                passport[
                    "marketplace_health_score"
                ] or 0
            )
    }


    # =================================================
    # 4. MARKETPLACE PROFILE
    # =================================================

    marketplace_profiles = {

        "Marketplace A": {

            "weights": {

                "Profit": 0.40,

                "People": 0.15,

                "Planet": 0.10,

                "Marketplace": 0.35
            }
        },

        "Marketplace B": {

            "weights": {

                "Profit": 0.30,

                "People": 0.20,

                "Planet": 0.20,

                "Marketplace": 0.30
            }
        },

        "Marketplace C": {

            "weights": {

                "Profit": 0.25,

                "People": 0.15,

                "Planet": 0.30,

                "Marketplace": 0.30
            }
        }
    }


    # =================================================
    # 5. HITUNG REKOMENDASI
    # =================================================

    recommendations = []


    for marketplace, profile in marketplace_profiles.items():

        weights = profile["weights"]


        compatibility_score = round(

            (
                scores["Profit"]
                * weights["Profit"]
            )

            +

            (
                scores["People"]
                * weights["People"]
            )

            +

            (
                scores["Planet"]
                * weights["Planet"]
            )

            +

            (
                scores["Marketplace"]
                * weights["Marketplace"]
            ),

            2
        )


        # ---------------------------------------------
        # LEVEL
        # ---------------------------------------------

        if compatibility_score >= 85:

            level = "Highly Recommended"

        elif compatibility_score >= 75:

            level = "Recommended"

        elif compatibility_score >= 60:

            level = "Consider"

        elif compatibility_score >= 50:

            level = "Low Priority"

        else:

            level = "Not Recommended"


        # ---------------------------------------------
        # CARI FAKTOR TERLEMAH
        # ---------------------------------------------

        weighted_scores = {

            "Profit":
                scores["Profit"]
                * weights["Profit"],

            "People":
                scores["People"]
                * weights["People"],

            "Planet":
                scores["Planet"]
                * weights["Planet"],

            "Marketplace":
                scores["Marketplace"]
                * weights["Marketplace"]
        }


        weakest_factor = min(
            weighted_scores,
            key=weighted_scores.get
        )


        # ---------------------------------------------
        # REASON
        # ---------------------------------------------

        if compatibility_score >= 75:

            reason = (
                f"{marketplace} memiliki tingkat kecocokan "
                f"yang baik dengan kondisi bisnis saat ini."
            )

        elif compatibility_score >= 60:

            reason = (
                f"{marketplace} masih dapat dipertimbangkan, "
                f"tetapi aspek {weakest_factor} perlu diperbaiki."
            )

        else:

            reason = (
                f"{marketplace} belum terlalu sesuai. "
                f"Aspek {weakest_factor} menjadi faktor yang perlu "
                f"mendapat perhatian."
            )


        recommendations.append({

            "marketplace":
                marketplace,

            "compatibility_score":
                compatibility_score,

            "level":
                level,

            "weakest_factor":
                weakest_factor,

            "reason":
                reason
        })


    # =================================================
    # 6. SORTING
    # =================================================

    recommendations.sort(
        key=lambda item:
            item["compatibility_score"],
        reverse=True
    )


    # =================================================
    # 7. RANK
    # =================================================

    for index, item in enumerate(
        recommendations,
        start=1
    ):

        item["rank"] = index


    # =================================================
    # 8. BEST RECOMMENDATION
    # =================================================

    best = recommendations[0]


    # =================================================
    # 9. ALTERNATIVE
    # =================================================

    alternatives = recommendations[1:]


    # =================================================
    # 10. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "passport": {

            "id":
                passport["id"]
        },


        "recommendation": {

            "marketplace":
                best["marketplace"],

            "score":
                best["compatibility_score"],

            "level":
                best["level"],

            "reason":
                best["reason"],

            "weakest_factor":
                best["weakest_factor"]
        },


        "alternatives":
            alternatives,


        "all_marketplaces":
            recommendations
    }
    
# =====================================================
# API #83
# PASSPORT EXPORT DATA
# =====================================================

@router.get("/{business_id}/export")
def export_passport_data(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. AMBIL PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. SCORE
    # =================================================

    overall_score = float(
        passport["business_score"] or 0
    )

    profit_score = float(
        passport["profit_score"] or 0
    )

    people_score = float(
        passport["people_score"] or 0
    )

    planet_score = float(
        passport["planet_score"] or 0
    )

    marketplace_score = float(
        passport["marketplace_health_score"] or 0
    )


    # =================================================
    # 4. LEVEL
    # =================================================

    if overall_score >= 90:

        level = "Outstanding"

    elif overall_score >= 80:

        level = "Excellent"

    elif overall_score >= 70:

        level = "Good"

    elif overall_score >= 65:

        level = "Moderate"

    elif overall_score >= 50:

        level = "Needs Improvement"

    else:

        level = "Critical"


    # =================================================
    # 5. CATEGORY
    # =================================================

    categories = {

        "Profit":
            profit_score,

        "People":
            people_score,

        "Planet":
            planet_score,

        "Marketplace":
            marketplace_score
    }


    category_data = []

    for category, score in categories.items():

        if score >= 90:

            rating = "A+"

        elif score >= 80:

            rating = "A"

        elif score >= 70:

            rating = "B+"

        elif score >= 65:

            rating = "B"

        elif score >= 50:

            rating = "C"

        else:

            rating = "D"


        category_data.append({

            "category":
                category,

            "score":
                score,

            "rating":
                rating,

            "target":
                80,

            "target_achieved":
                score >= 80,

            "gap":
                round(
                    max(
                        0,
                        80 - score
                    ),
                    2
                )
        })


    # =================================================
    # 6. TARGET
    # =================================================

    target_score = 80

    target_achieved = (
        overall_score >= target_score
    )

    target_gap = round(
        max(
            0,
            target_score - overall_score
        ),
        2
    )


    # =================================================
    # 7. PASSPORT VALIDITY
    # =================================================

    validity_days = 90

    age_query = text("""
        SELECT
            DATEDIFF(
                CURRENT_TIMESTAMP,
                :created_at
            ) AS age_days
    """)

    age_result = db.execute(
        age_query,
        {
            "created_at":
                passport["created_at"]
        }
    ).mappings().first()

    age_days = int(
        age_result["age_days"] or 0
    )

    remaining_days = max(
        0,
        validity_days - age_days
    )


    if age_days > validity_days:

        validity_status = "Expired"

    elif remaining_days <= 14:

        validity_status = "Expiring Soon"

    else:

        validity_status = "Valid"


    # =================================================
    # 8. RESPONSE EXPORT
    # =================================================

    return {

        "export_type":
            "Economic Passport",

        "generated_at":
            datetime.now(),


        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "passport": {

            "id":
                passport["id"],

            "overall_score":
                overall_score,

            "level":
                level,

            "status":
                passport["status"],

            "created_at":
                passport["created_at"]
        },


        "categories":
            category_data,


        "target": {

            "target_score":
                target_score,

            "achieved":
                target_achieved,

            "gap":
                target_gap
        },


        "validity": {

            "validity_days":
                validity_days,

            "age_days":
                age_days,

            "remaining_days":
                remaining_days,

            "status":
                validity_status
        }
    }
    
# =====================================================
# API #84
# PASSPORT FINAL SUMMARY
# =====================================================

@router.get("/{business_id}/final-summary")
def get_passport_final_summary(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BUSINESS
    # =================================================

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


    # =================================================
    # 2. PASSPORT TERBARU
    # =================================================

    passport_query = text("""
        SELECT
            id,
            business_score,
            profit_score,
            people_score,
            planet_score,
            marketplace_health_score,
            status,
            created_at
        FROM passport_history
        WHERE business_id = :business_id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    """)

    passport = db.execute(
        passport_query,
        {
            "business_id": business_id
        }
    ).mappings().first()

    if not passport:
        raise HTTPException(
            status_code=404,
            detail="Economic Passport belum dibuat"
        )


    # =================================================
    # 3. SCORE
    # =================================================

    overall_score = float(
        passport["business_score"] or 0
    )

    profit_score = float(
        passport["profit_score"] or 0
    )

    people_score = float(
        passport["people_score"] or 0
    )

    planet_score = float(
        passport["planet_score"] or 0
    )

    marketplace_score = float(
        passport["marketplace_health_score"] or 0
    )


    # =================================================
    # 4. RATING
    # =================================================

    if overall_score >= 90:

        rating = "A+"
        level = "Outstanding"

    elif overall_score >= 80:

        rating = "A"
        level = "Excellent"

    elif overall_score >= 70:

        rating = "B+"
        level = "Good"

    elif overall_score >= 65:

        rating = "B"
        level = "Moderate"

    elif overall_score >= 50:

        rating = "C"
        level = "Needs Improvement"

    else:

        rating = "D"
        level = "Critical"


    # =================================================
    # 5. CATEGORY
    # =================================================

    categories = {

        "Profit":
            profit_score,

        "People":
            people_score,

        "Planet":
            planet_score,

        "Marketplace":
            marketplace_score
    }


    category_data = []

    for category, score in categories.items():

        if score >= 90:

            category_rating = "A+"

        elif score >= 80:

            category_rating = "A"

        elif score >= 70:

            category_rating = "B+"

        elif score >= 65:

            category_rating = "B"

        elif score >= 50:

            category_rating = "C"

        else:

            category_rating = "D"


        category_data.append({

            "category":
                category,

            "score":
                score,

            "rating":
                category_rating,

            "target":
                80,

            "target_achieved":
                score >= 80,

            "gap":
                round(
                    max(
                        0,
                        80 - score
                    ),
                    2
                )
        })


    # =================================================
    # 6. STRONGEST & WEAKEST
    # =================================================

    strongest = max(
        category_data,
        key=lambda item: item["score"]
    )

    weakest = min(
        category_data,
        key=lambda item: item["score"]
    )


    # =================================================
    # 7. TARGET
    # =================================================

    target_score = 80

    target_achieved = (
        overall_score >= target_score
    )

    target_gap = round(
        max(
            0,
            target_score - overall_score
        ),
        2
    )


    # =================================================
    # 8. VALIDITY
    # =================================================

    validity_days = 90

    age_query = text("""
        SELECT
            DATEDIFF(
                CURRENT_TIMESTAMP,
                :created_at
            ) AS age_days
    """)

    age_result = db.execute(
        age_query,
        {
            "created_at":
                passport["created_at"]
        }
    ).mappings().first()

    age_days = int(
        age_result["age_days"] or 0
    )

    remaining_days = max(
        0,
        validity_days - age_days
    )


    if age_days > validity_days:

        validity_status = "Expired"

    elif remaining_days <= 14:

        validity_status = "Expiring Soon"

    else:

        validity_status = "Valid"


    # =================================================
    # 9. RECOMMENDATION
    # =================================================

    if weakest["score"] < 50:

        recommendation = (
            f"Prioritaskan perbaikan pada aspek "
            f"{weakest['category']} karena score masih berada "
            f"di bawah batas minimum."
        )

    elif weakest["score"] < 65:

        recommendation = (
            f"Fokuskan peningkatan pada aspek "
            f"{weakest['category']} untuk memperkuat "
            f"performa bisnis."
        )

    elif weakest["score"] < 80:

        recommendation = (
            f"Optimalkan aspek {weakest['category']} "
            f"agar mencapai target score 80."
        )

    else:

        recommendation = (
            "Seluruh kategori telah mencapai target minimum. "
            "Pertahankan performa dan lakukan evaluasi berkala."
        )


    # =================================================
    # 10. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },


        "passport": {

            "id":
                passport["id"],

            "score":
                overall_score,

            "rating":
                rating,

            "level":
                level,

            "status":
                passport["status"],

            "created_at":
                passport["created_at"]
        },


        "target": {

            "target_score":
                target_score,

            "achieved":
                target_achieved,

            "gap":
                target_gap
        },


        "validity": {

            "validity_days":
                validity_days,

            "age_days":
                age_days,

            "remaining_days":
                remaining_days,

            "status":
                validity_status
        },


        "categories":
            category_data,


        "highlights": {

            "strongest":
                strongest,

            "weakest":
                weakest
        },


        "recommendation":
            recommendation
    }
