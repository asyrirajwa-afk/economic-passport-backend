from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user


router = APIRouter(
    prefix="/recommendations",
    tags=["Marketplace Recommendations"]
)


# =====================================================
# REQUEST SCHEMA
# =====================================================

class MarketplaceSimulationRequest(BaseModel):
    marketplace_id: int


# =====================================================
# HELPER
# =====================================================

def clamp_score(value):
    """
    Memastikan score berada di antara 0 dan 100.
    """
    return round(max(0, min(100, value)), 2)


# =====================================================
# API #10
# MARKETPLACE RECOMMENDATIONS
# =====================================================

@router.get("/{business_id}")
def get_marketplace_recommendations(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BISNIS
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
    # 2. AMBIL FINANCIAL PROFILE
    # =================================================

    financial_query = text("""
        SELECT
            monthly_revenue,
            cogs_hpp,
            operating_expenses,
            avg_marketplace_fee_percent,
            avg_promotional_cost_percent,
            return_rate_percent,
            desired_min_margin_percent,
            max_platform_cost_tolerated_percent,
            max_promotional_burden_percent,
            target_monthly_profit
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


    # =================================================
    # 3. AMBIL MARKETPLACE AKTIF
    # =================================================

    marketplace_query = text("""
        SELECT
            id,
            name,
            alias,
            logo_tag,
            platform_cost_percent,
            commission_fee_percent,
            service_fee_percent,
            payment_fee_percent,
            recommended_promo_percent,
            average_traffic_index,
            target_audience,
            partner_status
        FROM marketplaces
        WHERE is_active = 1
        ORDER BY average_traffic_index DESC
    """)

    marketplaces = db.execute(
        marketplace_query
    ).mappings().all()

    if not marketplaces:
        raise HTTPException(
            status_code=404,
            detail="Belum ada marketplace aktif"
        )


    # =================================================
    # 4. BATAS BISNIS
    # =================================================

    max_platform_cost = float(
        financial["max_platform_cost_tolerated_percent"] or 0
    )

    max_promo_cost = float(
        financial["max_promotional_burden_percent"] or 0
    )

    current_platform_cost = float(
        financial["avg_marketplace_fee_percent"] or 0
    )

    current_promo_cost = float(
        financial["avg_promotional_cost_percent"] or 0
    )


    # =================================================
    # 5. TRAFFIC MAKSIMUM
    # =================================================

    max_traffic = max(
        float(marketplace["average_traffic_index"] or 0)
        for marketplace in marketplaces
    )


    recommendations = []


    # =================================================
    # 6. HITUNG MARKETPLACE SCORE
    # =================================================

    for marketplace in marketplaces:

        platform_cost = float(
            marketplace["platform_cost_percent"] or 0
        )

        commission_fee = float(
            marketplace["commission_fee_percent"] or 0
        )

        service_fee = float(
            marketplace["service_fee_percent"] or 0
        )

        payment_fee = float(
            marketplace["payment_fee_percent"] or 0
        )

        recommended_promo = float(
            marketplace["recommended_promo_percent"] or 0
        )

        traffic_index = float(
            marketplace["average_traffic_index"] or 0
        )


        # =============================================
        # TOTAL BIAYA MARKETPLACE
        # =============================================

        total_cost = (
            platform_cost
            + commission_fee
            + service_fee
            + payment_fee
        )


        # =============================================
        # COST SCORE
        # =============================================

        if max_platform_cost > 0:

            if total_cost <= max_platform_cost:

                cost_score = 100

            else:

                excess = (
                    total_cost
                    - max_platform_cost
                )

                cost_score = (
                    100
                    - (
                        excess
                        / max_platform_cost
                        * 100
                    )
                )

        else:

            cost_score = 0


        cost_score = clamp_score(cost_score)


        # =============================================
        # PROMOTION SCORE
        # =============================================

        if max_promo_cost > 0:

            if recommended_promo <= max_promo_cost:

                promotion_score = 100

            else:

                excess = (
                    recommended_promo
                    - max_promo_cost
                )

                promotion_score = (
                    100
                    - (
                        excess
                        / max_promo_cost
                        * 100
                    )
                )

        else:

            promotion_score = 0


        promotion_score = clamp_score(
            promotion_score
        )


        # =============================================
        # TRAFFIC SCORE
        # =============================================

        if max_traffic > 0:

            traffic_score = (
                traffic_index
                / max_traffic
            ) * 100

        else:

            traffic_score = 0


        traffic_score = clamp_score(
            traffic_score
        )


        # =============================================
        # FINAL SCORE
        # =============================================

        marketplace_score = (
            cost_score * 0.50
            + promotion_score * 0.25
            + traffic_score * 0.25
        )

        marketplace_score = clamp_score(
            marketplace_score
        )


        # =============================================
        # STATUS
        # =============================================

        if marketplace_score >= 80:

            status = "Recommended"

        elif marketplace_score >= 65:

            status = "Consider"

        else:

            status = "Not Recommended"


        # =============================================
        # REASONS
        # =============================================

        reasons = []
        warnings = []


        if total_cost <= max_platform_cost:

            reasons.append(
                "Total biaya marketplace masih dalam batas toleransi bisnis"
            )

        else:

            warnings.append(
                "Total biaya marketplace melebihi batas toleransi bisnis"
            )


        if recommended_promo <= max_promo_cost:

            reasons.append(
                "Beban promosi yang direkomendasikan masih dalam batas"
            )

        else:

            warnings.append(
                "Beban promosi yang direkomendasikan cukup tinggi"
            )


        if traffic_score >= 70:

            reasons.append(
                "Indeks traffic marketplace relatif tinggi"
            )

        elif traffic_score < 40:

            warnings.append(
                "Indeks traffic marketplace relatif rendah"
            )


        if not reasons:

            reasons.append(
                "Marketplace memiliki beberapa faktor yang perlu dipertimbangkan"
            )


        if not warnings:

            warnings.append(
                "Tidak ditemukan risiko utama berdasarkan data yang tersedia"
            )


        # =============================================
        # SIMPAN HASIL
        # =============================================

        recommendations.append({

            "marketplace": {

                "id": marketplace["id"],

                "name": marketplace["name"],

                "alias": marketplace["alias"],

                "logo_tag": marketplace["logo_tag"],

                "target_audience":
                    marketplace["target_audience"],

                "partner_status":
                    marketplace["partner_status"]
            },

            "score":
                marketplace_score,

            "status":
                status,

            "cost_analysis": {

                "platform_cost_percent":
                    platform_cost,

                "commission_fee_percent":
                    commission_fee,

                "service_fee_percent":
                    service_fee,

                "payment_fee_percent":
                    payment_fee,

                "total_cost_percent":
                    round(total_cost, 2),

                "business_tolerance_percent":
                    max_platform_cost
            },

            "promotion_analysis": {

                "recommended_promo_percent":
                    recommended_promo,

                "business_max_promo_percent":
                    max_promo_cost
            },

            "traffic_analysis": {

                "average_traffic_index":
                    traffic_index,

                "traffic_score":
                    traffic_score
            },

            "reasons":
                reasons,

            "warnings":
                warnings
        })


    # =================================================
    # 7. URUTKAN SCORE
    # =================================================

    recommendations.sort(
        key=lambda x: x["score"],
        reverse=True
    )


    # =================================================
    # 8. MARKETPLACE TERBAIK
    # =================================================

    best_marketplace = recommendations[0]


    # =================================================
    # 9. RESPONSE
    # =================================================

    return {

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

            "current_marketplace":
                business["primary_marketplace"],

            "seller_city":
                business["seller_city"]
        },


        "business_constraints": {

            "max_marketplace_cost_percent":
                max_platform_cost,

            "max_promotional_burden_percent":
                max_promo_cost,

            "current_marketplace_cost_percent":
                current_platform_cost,

            "current_promotional_cost_percent":
                current_promo_cost
        },


        "best_recommendation": {

            "marketplace":
                best_marketplace["marketplace"],

            "score":
                best_marketplace["score"],

            "status":
                best_marketplace["status"]
        },


        "recommendations":
            recommendations
    }


# =====================================================
# API #11
# MARKETPLACE SIMULATION
# =====================================================

@router.post("/{business_id}/simulate")
def simulate_marketplace(
    business_id: int,
    simulation: MarketplaceSimulationRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BISNIS
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
    # 2. FINANCIAL PROFILE
    # =================================================

    financial_query = text("""
        SELECT
            monthly_revenue,
            cogs_hpp,
            operating_expenses,
            desired_min_margin_percent,
            max_platform_cost_tolerated_percent,
            max_promotional_burden_percent,
            target_monthly_profit
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


    # =================================================
    # 3. MARKETPLACE YANG DIPILIH
    # =================================================

    marketplace_query = text("""
        SELECT
            id,
            name,
            alias,
            logo_tag,
            platform_cost_percent,
            commission_fee_percent,
            service_fee_percent,
            payment_fee_percent,
            recommended_promo_percent,
            average_traffic_index,
            target_audience,
            partner_status
        FROM marketplaces
        WHERE id = :marketplace_id
          AND is_active = 1
        LIMIT 1
    """)

    marketplace = db.execute(
        marketplace_query,
        {
            "marketplace_id":
                simulation.marketplace_id
        }
    ).mappings().first()

    if not marketplace:
        raise HTTPException(
            status_code=404,
            detail="Marketplace tidak ditemukan atau tidak aktif"
        )


    # =================================================
    # 4. DATA FINANSIAL
    # =================================================

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

    max_platform_cost = float(
        financial["max_platform_cost_tolerated_percent"] or 0
    )

    max_promo_cost = float(
        financial["max_promotional_burden_percent"] or 0
    )

    target_profit = float(
        financial["target_monthly_profit"] or 0
    )


    # =================================================
    # 5. DATA MARKETPLACE
    # =================================================

    platform_cost = float(
        marketplace["platform_cost_percent"] or 0
    )

    commission_fee = float(
        marketplace["commission_fee_percent"] or 0
    )

    service_fee = float(
        marketplace["service_fee_percent"] or 0
    )

    payment_fee = float(
        marketplace["payment_fee_percent"] or 0
    )

    recommended_promo = float(
        marketplace["recommended_promo_percent"] or 0
    )

    traffic_index = float(
        marketplace["average_traffic_index"] or 0
    )


    # =================================================
    # 6. TOTAL MARKETPLACE COST
    # =================================================

    marketplace_fee_percent = (
        platform_cost
        + commission_fee
        + service_fee
        + payment_fee
    )


    total_marketplace_burden_percent = (
        marketplace_fee_percent
        + recommended_promo
    )


    # =================================================
    # 7. BIAYA DALAM RUPIAH
    # =================================================

    marketplace_fee_amount = (
        revenue
        * marketplace_fee_percent
        / 100
    )

    promotional_cost_amount = (
        revenue
        * recommended_promo
        / 100
    )

    total_marketplace_cost = (
        marketplace_fee_amount
        + promotional_cost_amount
    )


    # =================================================
    # 8. PROFIT SEBELUM MARKETPLACE
    # =================================================

    profit_before_marketplace = (
        revenue
        - cogs
        - operating_expenses
    )


    # =================================================
    # 9. PROFIT SETELAH MARKETPLACE
    # =================================================

    estimated_net_profit = (
        profit_before_marketplace
        - total_marketplace_cost
    )


    # =================================================
    # 10. NET MARGIN
    # =================================================

    if revenue > 0:

        estimated_net_margin = (
            estimated_net_profit
            / revenue
        ) * 100

    else:

        estimated_net_margin = 0


    # =================================================
    # 11. PROFIT SCORE
    # =================================================

    if desired_margin > 0:

        margin_score = (
            estimated_net_margin
            / desired_margin
        ) * 100

    else:

        margin_score = 0


    if target_profit > 0:

        profit_target_score = (
            estimated_net_profit
            / target_profit
        ) * 100

    else:

        profit_target_score = 100


    profit_score = (
        margin_score * 0.6
        + profit_target_score * 0.4
    )


    profit_score = max(
        0,
        min(100, profit_score)
    )


    # =================================================
    # 12. COST SCORE
    # =================================================

    if max_platform_cost > 0:

        if marketplace_fee_percent <= max_platform_cost:

            cost_score = 100

        else:

            cost_score = (
                100
                - (
                    (
                        marketplace_fee_percent
                        - max_platform_cost
                    )
                    / max_platform_cost
                    * 100
                )
            )

    else:

        cost_score = 0


    cost_score = max(
        0,
        min(100, cost_score)
    )


    # =================================================
    # 13. PROMOTION SCORE
    # =================================================

    if max_promo_cost > 0:

        if recommended_promo <= max_promo_cost:

            promotion_score = 100

        else:

            promotion_score = (
                100
                - (
                    (
                        recommended_promo
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


    # =================================================
    # 14. STATUS
    # =================================================

    if (
        estimated_net_margin >= desired_margin
        and marketplace_fee_percent <= max_platform_cost
        and recommended_promo <= max_promo_cost
    ):

        status = "Recommended"

    elif estimated_net_margin >= 0:

        status = "Consider"

    else:

        status = "Not Recommended"


    # =================================================
    # 15. ADVANTAGES & WARNINGS
    # =================================================

    advantages = []
    warnings = []


    if marketplace_fee_percent <= max_platform_cost:

        advantages.append(
            "Biaya marketplace masih berada dalam batas toleransi bisnis"
        )

    else:

        warnings.append(
            "Biaya marketplace melebihi batas toleransi bisnis"
        )


    if recommended_promo <= max_promo_cost:

        advantages.append(
            "Rekomendasi promosi masih berada dalam batas yang dapat diterima"
        )

    else:

        warnings.append(
            "Beban promosi melebihi batas yang ditetapkan bisnis"
        )


    if estimated_net_margin >= desired_margin:

        advantages.append(
            "Estimasi margin memenuhi target minimum bisnis"
        )

    else:

        warnings.append(
            "Estimasi margin belum memenuhi target minimum bisnis"
        )


    if estimated_net_profit >= target_profit:

        advantages.append(
            "Estimasi profit memenuhi target profit bulanan"
        )

    else:

        warnings.append(
            "Estimasi profit belum mencapai target profit bulanan"
        )


    # =================================================
    # 16. RESPONSE
    # =================================================

    return {

        "simulation": {

            "business": {

                "id":
                    business["id"],

                "business_name":
                    business["business_name"]
            },


            "marketplace": {

                "id":
                    marketplace["id"],

                "name":
                    marketplace["name"],

                "alias":
                    marketplace["alias"],

                "logo_tag":
                    marketplace["logo_tag"],

                "target_audience":
                    marketplace["target_audience"]
            },


            "marketplace_cost": {

                "platform_cost_percent":
                    platform_cost,

                "commission_fee_percent":
                    commission_fee,

                "service_fee_percent":
                    service_fee,

                "payment_fee_percent":
                    payment_fee,

                "marketplace_fee_percent":
                    round(
                        marketplace_fee_percent,
                        2
                    ),

                "recommended_promo_percent":
                    recommended_promo,

                "total_burden_percent":
                    round(
                        total_marketplace_burden_percent,
                        2
                    )
            },


            "estimated_cost": {

                "marketplace_fee_amount":
                    round(
                        marketplace_fee_amount,
                        2
                    ),

                "promotional_cost_amount":
                    round(
                        promotional_cost_amount,
                        2
                    ),

                "total_marketplace_cost":
                    round(
                        total_marketplace_cost,
                        2
                    )
            },


            "profit_simulation": {

                "monthly_revenue":
                    round(
                        revenue,
                        2
                    ),

                "profit_before_marketplace":
                    round(
                        profit_before_marketplace,
                        2
                    ),

                "estimated_net_profit":
                    round(
                        estimated_net_profit,
                        2
                    ),

                "estimated_net_margin_percent":
                    round(
                        estimated_net_margin,
                        2
                    ),

                "target_monthly_profit":
                    round(
                        target_profit,
                        2
                    ),

                "desired_min_margin_percent":
                    round(
                        desired_margin,
                        2
                    )
            },


            "scores": {

                "profit_score":
                    round(
                        profit_score,
                        2
                    ),

                "cost_score":
                    round(
                        cost_score,
                        2
                    ),

                "promotion_score":
                    round(
                        promotion_score,
                        2
                    )
            },


            "traffic": {

                "average_traffic_index":
                    traffic_index
            },


            "status":
                status,

            "advantages":
                advantages,

            "warnings":
                warnings
        }
    }
    
# =====================================================
# API #12 - COMPARE MARKETPLACES
# =====================================================

@router.get("/{business_id}/compare")
def compare_marketplaces(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =================================================
    # 1. CEK BISNIS
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
    # 2. AMBIL FINANCIAL PROFILE
    # =================================================

    financial_query = text("""
        SELECT
            monthly_revenue,
            cogs_hpp,
            operating_expenses,
            desired_min_margin_percent,
            max_platform_cost_tolerated_percent,
            max_promotional_burden_percent,
            target_monthly_profit
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


    # =================================================
    # 3. AMBIL MARKETPLACE AKTIF
    # =================================================

    marketplace_query = text("""
        SELECT
            id,
            name,
            alias,
            logo_tag,
            platform_cost_percent,
            commission_fee_percent,
            service_fee_percent,
            payment_fee_percent,
            recommended_promo_percent,
            average_traffic_index,
            target_audience,
            partner_status
        FROM marketplaces
        WHERE is_active = 1
        ORDER BY average_traffic_index DESC
    """)

    marketplaces = db.execute(
        marketplace_query
    ).mappings().all()

    if not marketplaces:
        raise HTTPException(
            status_code=404,
            detail="Belum ada marketplace aktif"
        )


    # =================================================
    # 4. DATA FINANCIAL
    # =================================================

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

    max_platform_cost = float(
        financial["max_platform_cost_tolerated_percent"] or 0
    )

    max_promo_cost = float(
        financial["max_promotional_burden_percent"] or 0
    )

    target_profit = float(
        financial["target_monthly_profit"] or 0
    )


    # =================================================
    # 5. TRAFFIC MAKSIMUM
    # =================================================

    max_traffic = max(
        float(m["average_traffic_index"] or 0)
        for m in marketplaces
    )


    comparison = []


    # =================================================
    # 6. HITUNG SETIAP MARKETPLACE
    # =================================================

    for marketplace in marketplaces:

        platform_cost = float(
            marketplace["platform_cost_percent"] or 0
        )

        commission_fee = float(
            marketplace["commission_fee_percent"] or 0
        )

        service_fee = float(
            marketplace["service_fee_percent"] or 0
        )

        payment_fee = float(
            marketplace["payment_fee_percent"] or 0
        )

        recommended_promo = float(
            marketplace["recommended_promo_percent"] or 0
        )

        traffic_index = float(
            marketplace["average_traffic_index"] or 0
        )


        # =============================================
        # TOTAL MARKETPLACE FEE
        # =============================================

        marketplace_fee_percent = (
            platform_cost
            + commission_fee
            + service_fee
            + payment_fee
        )


        total_burden_percent = (
            marketplace_fee_percent
            + recommended_promo
        )


        # =============================================
        # COST SCORE
        # =============================================

        if max_platform_cost > 0:

            if marketplace_fee_percent <= max_platform_cost:

                cost_score = 100

            else:

                cost_score = (
                    100
                    - (
                        (
                            marketplace_fee_percent
                            - max_platform_cost
                        )
                        / max_platform_cost
                        * 100
                    )
                )

        else:

            cost_score = 0


        cost_score = clamp_score(
            cost_score
        )


        # =============================================
        # PROMOTION SCORE
        # =============================================

        if max_promo_cost > 0:

            if recommended_promo <= max_promo_cost:

                promotion_score = 100

            else:

                promotion_score = (
                    100
                    - (
                        (
                            recommended_promo
                            - max_promo_cost
                        )
                        / max_promo_cost
                        * 100
                    )
                )

        else:

            promotion_score = 0


        promotion_score = clamp_score(
            promotion_score
        )


        # =============================================
        # TRAFFIC SCORE
        # =============================================

        if max_traffic > 0:

            traffic_score = (
                traffic_index
                / max_traffic
            ) * 100

        else:

            traffic_score = 0


        traffic_score = clamp_score(
            traffic_score
        )


        # =============================================
        # MARKETPLACE SCORE
        # =============================================

        marketplace_score = (
            cost_score * 0.50
            + promotion_score * 0.25
            + traffic_score * 0.25
        )

        marketplace_score = clamp_score(
            marketplace_score
        )


        # =============================================
        # ESTIMASI BIAYA
        # =============================================

        marketplace_fee_amount = (
            revenue
            * marketplace_fee_percent
            / 100
        )

        promotional_cost_amount = (
            revenue
            * recommended_promo
            / 100
        )

        total_marketplace_cost = (
            marketplace_fee_amount
            + promotional_cost_amount
        )


        # =============================================
        # ESTIMASI PROFIT
        # =============================================

        profit_before_marketplace = (
            revenue
            - cogs
            - operating_expenses
        )

        estimated_net_profit = (
            profit_before_marketplace
            - total_marketplace_cost
        )


        # =============================================
        # ESTIMASI MARGIN
        # =============================================

        if revenue > 0:

            estimated_net_margin = (
                estimated_net_profit
                / revenue
            ) * 100

        else:

            estimated_net_margin = 0


        # =============================================
        # PROFIT SCORE
        # =============================================

        if desired_margin > 0:

            margin_score = (
                estimated_net_margin
                / desired_margin
            ) * 100

        else:

            margin_score = 0


        if target_profit > 0:

            target_profit_score = (
                estimated_net_profit
                / target_profit
            ) * 100

        else:

            target_profit_score = 100


        profit_score = (
            margin_score * 0.6
            + target_profit_score * 0.4
        )

        profit_score = clamp_score(
            profit_score
        )


        # =============================================
        # FINAL STATUS
        # =============================================

        if (
            marketplace_score >= 80
            and estimated_net_margin >= desired_margin
        ):

            status = "Recommended"

        elif (
            marketplace_score >= 65
            and estimated_net_profit >= 0
        ):

            status = "Consider"

        else:

            status = "Not Recommended"


        # =============================================
        # PROFIT TARGET
        # =============================================

        profit_target_status = (
            "Achieved"
            if estimated_net_profit >= target_profit
            else "Not Achieved"
        )


        # =============================================
        # MARGIN STATUS
        # =============================================

        margin_status = (
            "Achieved"
            if estimated_net_margin >= desired_margin
            else "Below Target"
        )


        # =============================================
        # TAMBAHKAN HASIL
        # =============================================

        comparison.append({

            "marketplace": {

                "id":
                    marketplace["id"],

                "name":
                    marketplace["name"],

                "alias":
                    marketplace["alias"],

                "logo_tag":
                    marketplace["logo_tag"],

                "target_audience":
                    marketplace["target_audience"]
            },


            "score":
                marketplace_score,


            "status":
                status,


            "cost": {

                "marketplace_fee_percent":
                    round(
                        marketplace_fee_percent,
                        2
                    ),

                "recommended_promo_percent":
                    round(
                        recommended_promo,
                        2
                    ),

                "total_burden_percent":
                    round(
                        total_burden_percent,
                        2
                    ),

                "total_cost_amount":
                    round(
                        total_marketplace_cost,
                        2
                    )
            },


            "profit": {

                "estimated_net_profit":
                    round(
                        estimated_net_profit,
                        2
                    ),

                "estimated_net_margin_percent":
                    round(
                        estimated_net_margin,
                        2
                    ),

                "profit_score":
                    profit_score,

                "target_profit":
                    round(
                        target_profit,
                        2
                    ),

                "profit_target_status":
                    profit_target_status,

                "margin_status":
                    margin_status
            },


            "traffic": {

                "average_traffic_index":
                    traffic_index,

                "traffic_score":
                    traffic_score
            }
        })


    # =================================================
    # 7. URUTKAN SCORE TERTINGGI
    # =================================================

    comparison.sort(
        key=lambda x: x["score"],
        reverse=True
    )


    # =================================================
    # 8. BEST MARKETPLACE
    # =================================================

    best = comparison[0]


    # =================================================
    # 9. RETURN
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"],

            "product_category":
                business["product_category"],

            "current_marketplace":
                business["primary_marketplace"]
        },


        "comparison_summary": {

            "total_marketplaces":
                len(comparison),

            "best_marketplace":
                best["marketplace"],

            "best_score":
                best["score"],

            "best_status":
                best["status"]
        },


        "marketplaces":
            comparison
    }
    
# =====================================================
# API #22
# MARKETPLACE RECOMMENDATION DETAIL
# =====================================================

@router.get("/{business_id}/marketplace/{marketplace_id}")
def get_marketplace_detail(
    business_id: int,
    marketplace_id: int,
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
    # 2. AMBIL FINANCIAL PROFILE
    # =================================================

    financial_query = text("""
        SELECT
            monthly_revenue,
            cogs_hpp,
            operating_expenses,
            desired_min_margin_percent,
            max_platform_cost_tolerated_percent,
            max_promotional_burden_percent,
            target_monthly_profit
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


    # =================================================
    # 3. AMBIL MARKETPLACE
    # =================================================

    marketplace_query = text("""
        SELECT
            id,
            name,
            alias,
            logo_tag,
            platform_cost_percent,
            commission_fee_percent,
            service_fee_percent,
            payment_fee_percent,
            recommended_promo_percent,
            average_traffic_index,
            target_audience,
            partner_status
        FROM marketplaces
        WHERE id = :marketplace_id
          AND is_active = 1
        LIMIT 1
    """)

    marketplace = db.execute(
        marketplace_query,
        {
            "marketplace_id":
                marketplace_id
        }
    ).mappings().first()

    if not marketplace:
        raise HTTPException(
            status_code=404,
            detail="Marketplace tidak ditemukan atau tidak aktif"
        )


    # =================================================
    # 4. DATA FINANCIAL
    # =================================================

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

    max_platform_cost = float(
        financial["max_platform_cost_tolerated_percent"] or 0
    )

    max_promo_cost = float(
        financial["max_promotional_burden_percent"] or 0
    )

    target_profit = float(
        financial["target_monthly_profit"] or 0
    )


    # =================================================
    # 5. DATA MARKETPLACE
    # =================================================

    platform_cost = float(
        marketplace["platform_cost_percent"] or 0
    )

    commission_fee = float(
        marketplace["commission_fee_percent"] or 0
    )

    service_fee = float(
        marketplace["service_fee_percent"] or 0
    )

    payment_fee = float(
        marketplace["payment_fee_percent"] or 0
    )

    recommended_promo = float(
        marketplace["recommended_promo_percent"] or 0
    )

    traffic_index = float(
        marketplace["average_traffic_index"] or 0
    )


    # =================================================
    # 6. TOTAL FEE
    # =================================================

    marketplace_fee_percent = (
        platform_cost
        + commission_fee
        + service_fee
        + payment_fee
    )

    total_burden_percent = (
        marketplace_fee_percent
        + recommended_promo
    )


    # =================================================
    # 7. ESTIMASI BIAYA
    # =================================================

    marketplace_fee_amount = (
        revenue
        * marketplace_fee_percent
        / 100
    )

    promotional_cost_amount = (
        revenue
        * recommended_promo
        / 100
    )

    total_marketplace_cost = (
        marketplace_fee_amount
        + promotional_cost_amount
    )


    # =================================================
    # 8. ESTIMASI PROFIT
    # =================================================

    profit_before_marketplace = (
        revenue
        - cogs
        - operating_expenses
    )

    estimated_net_profit = (
        profit_before_marketplace
        - total_marketplace_cost
    )

    if revenue > 0:

        estimated_net_margin = (
            estimated_net_profit
            / revenue
        ) * 100

    else:

        estimated_net_margin = 0


    # =================================================
    # 9. COST SCORE
    # =================================================

    if max_platform_cost > 0:

        if marketplace_fee_percent <= max_platform_cost:

            cost_score = 100

        else:

            cost_score = (
                100
                - (
                    (
                        marketplace_fee_percent
                        - max_platform_cost
                    )
                    / max_platform_cost
                    * 100
                )
            )

    else:

        cost_score = 0

    cost_score = max(
        0,
        min(100, cost_score)
    )


    # =================================================
    # 10. PROMOTION SCORE
    # =================================================

    if max_promo_cost > 0:

        if recommended_promo <= max_promo_cost:

            promotion_score = 100

        else:

            promotion_score = (
                100
                - (
                    (
                        recommended_promo
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


    # =================================================
    # 11. TRAFFIC SCORE
    # =================================================

    traffic_score = min(
        100,
        max(
            0,
            traffic_index
        )
    )


    # =================================================
    # 12. FINAL SCORE
    # =================================================

    marketplace_score = (
        cost_score * 0.50
        + promotion_score * 0.25
        + traffic_score * 0.25
    )

    marketplace_score = round(
        max(0, min(100, marketplace_score)),
        2
    )


    # =================================================
    # 13. STATUS
    # =================================================

    if (
        marketplace_score >= 80
        and estimated_net_margin >= desired_margin
    ):

        status = "Recommended"

    elif (
        marketplace_score >= 65
        and estimated_net_profit >= 0
    ):

        status = "Consider"

    else:

        status = "Not Recommended"


    # =================================================
    # 14. ADVANTAGES
    # =================================================

    advantages = []

    if marketplace_fee_percent <= max_platform_cost:

        advantages.append(
            "Biaya marketplace masih berada dalam batas toleransi"
        )

    if recommended_promo <= max_promo_cost:

        advantages.append(
            "Beban promosi masih berada dalam batas toleransi"
        )

    if estimated_net_margin >= desired_margin:

        advantages.append(
            "Estimasi margin memenuhi target minimum"
        )

    if traffic_score >= 70:

        advantages.append(
            "Indeks traffic marketplace relatif tinggi"
        )


    # =================================================
    # 15. WARNINGS
    # =================================================

    warnings = []

    if marketplace_fee_percent > max_platform_cost:

        warnings.append(
            "Biaya marketplace melebihi batas toleransi"
        )

    if recommended_promo > max_promo_cost:

        warnings.append(
            "Beban promosi melebihi batas toleransi"
        )

    if estimated_net_margin < desired_margin:

        warnings.append(
            "Estimasi margin belum mencapai target minimum"
        )

    if estimated_net_profit < target_profit:

        warnings.append(
            "Estimasi profit belum mencapai target profit bulanan"
        )

    if traffic_score < 40:

        warnings.append(
            "Indeks traffic marketplace relatif rendah"
        )


    # =================================================
    # 16. RETURN
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"],

            "product_category":
                business["product_category"]
        },


        "marketplace": {

            "id":
                marketplace["id"],

            "name":
                marketplace["name"],

            "alias":
                marketplace["alias"],

            "logo_tag":
                marketplace["logo_tag"],

            "target_audience":
                marketplace["target_audience"],

            "partner_status":
                marketplace["partner_status"]
        },


        "score": {

            "marketplace_score":
                marketplace_score,

            "cost_score":
                round(cost_score, 2),

            "promotion_score":
                round(promotion_score, 2),

            "traffic_score":
                round(traffic_score, 2)
        },


        "cost_analysis": {

            "platform_cost_percent":
                platform_cost,

            "commission_fee_percent":
                commission_fee,

            "service_fee_percent":
                service_fee,

            "payment_fee_percent":
                payment_fee,

            "total_marketplace_fee_percent":
                round(
                    marketplace_fee_percent,
                    2
                ),

            "recommended_promo_percent":
                recommended_promo,

            "total_burden_percent":
                round(
                    total_burden_percent,
                    2
                )
        },


        "financial_impact": {

            "monthly_revenue":
                revenue,

            "marketplace_fee_amount":
                round(
                    marketplace_fee_amount,
                    2
                ),

            "promotional_cost_amount":
                round(
                    promotional_cost_amount,
                    2
                ),

            "total_marketplace_cost":
                round(
                    total_marketplace_cost,
                    2
                ),

            "estimated_net_profit":
                round(
                    estimated_net_profit,
                    2
                ),

            "estimated_net_margin_percent":
                round(
                    estimated_net_margin,
                    2
                )
        },


        "business_constraints": {

            "max_platform_cost_percent":
                max_platform_cost,

            "max_promotional_burden_percent":
                max_promo_cost,

            "desired_min_margin_percent":
                desired_margin,

            "target_monthly_profit":
                target_profit
        },


        "status":
            status,

        "advantages":
            advantages,

        "warnings":
            warnings
    }
    
# =====================================================
# API #26
# MARKETPLACE RANKING
# =====================================================

@router.get("/{business_id}/ranking")
def get_marketplace_ranking(
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
    # 2. AMBIL FINANCIAL PROFILE
    # =================================================

    financial_query = text("""
        SELECT
            monthly_revenue,
            cogs_hpp,
            operating_expenses,
            desired_min_margin_percent,
            max_platform_cost_tolerated_percent,
            max_promotional_burden_percent,
            target_monthly_profit
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


    # =================================================
    # 3. AMBIL MARKETPLACE
    # =================================================

    marketplace_query = text("""
        SELECT
            id,
            name,
            alias,
            logo_tag,
            platform_cost_percent,
            commission_fee_percent,
            service_fee_percent,
            payment_fee_percent,
            recommended_promo_percent,
            average_traffic_index,
            target_audience,
            partner_status
        FROM marketplaces
        WHERE is_active = 1
    """)

    marketplaces = db.execute(
        marketplace_query
    ).mappings().all()

    if not marketplaces:
        raise HTTPException(
            status_code=404,
            detail="Belum ada marketplace aktif"
        )


    # =================================================
    # 4. DATA FINANCIAL
    # =================================================

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

    max_platform_cost = float(
        financial["max_platform_cost_tolerated_percent"] or 0
    )

    max_promo_cost = float(
        financial["max_promotional_burden_percent"] or 0
    )

    target_profit = float(
        financial["target_monthly_profit"] or 0
    )


    rankings = []


    # =================================================
    # 5. HITUNG SETIAP MARKETPLACE
    # =================================================

    for marketplace in marketplaces:

        platform_cost = float(
            marketplace[
                "platform_cost_percent"
            ] or 0
        )

        commission_fee = float(
            marketplace[
                "commission_fee_percent"
            ] or 0
        )

        service_fee = float(
            marketplace[
                "service_fee_percent"
            ] or 0
        )

        payment_fee = float(
            marketplace[
                "payment_fee_percent"
            ] or 0
        )

        promo = float(
            marketplace[
                "recommended_promo_percent"
            ] or 0
        )

        traffic = float(
            marketplace[
                "average_traffic_index"
            ] or 0
        )


        # =============================================
        # TOTAL MARKETPLACE FEE
        # =============================================

        total_fee = (
            platform_cost
            + commission_fee
            + service_fee
            + payment_fee
        )


        # =============================================
        # COST SCORE
        # =============================================

        if max_platform_cost > 0:

            if total_fee <= max_platform_cost:

                cost_score = 100

            else:

                cost_score = (
                    100
                    - (
                        (
                            total_fee
                            - max_platform_cost
                        )
                        / max_platform_cost
                        * 100
                    )
                )

        else:

            cost_score = 0


        cost_score = max(
            0,
            min(100, cost_score)
        )


        # =============================================
        # PROMOTION SCORE
        # =============================================

        if max_promo_cost > 0:

            if promo <= max_promo_cost:

                promotion_score = 100

            else:

                promotion_score = (
                    100
                    - (
                        (
                            promo
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


        # =============================================
        # TRAFFIC SCORE
        # =============================================

        traffic_score = max(
            0,
            min(100, traffic)
        )


        # =============================================
        # ESTIMATED COST
        # =============================================

        fee_amount = (
            revenue
            * total_fee
            / 100
        )

        promo_amount = (
            revenue
            * promo
            / 100
        )

        total_marketplace_cost = (
            fee_amount
            + promo_amount
        )


        # =============================================
        # ESTIMATED PROFIT
        # =============================================

        estimated_profit = (
            revenue
            - cogs
            - operating_expenses
            - total_marketplace_cost
        )


        if revenue > 0:

            estimated_margin = (
                estimated_profit
                / revenue
            ) * 100

        else:

            estimated_margin = 0


        # =============================================
        # MARGIN SCORE
        # =============================================

        if desired_margin > 0:

            margin_score = (
                estimated_margin
                / desired_margin
            ) * 100

        else:

            margin_score = 100


        margin_score = max(
            0,
            min(100, margin_score)
        )


        # =============================================
        # FINAL SCORE
        # =============================================

        final_score = (
            cost_score * 0.35
            + promotion_score * 0.20
            + traffic_score * 0.20
            + margin_score * 0.25
        )

        final_score = round(
            max(0, min(100, final_score)),
            2
        )


        # =============================================
        # STATUS
        # =============================================

        if (
            final_score >= 80
            and estimated_margin >= desired_margin
            and estimated_profit >= target_profit
        ):

            status = "Recommended"

        elif final_score >= 65:

            status = "Consider"

        else:

            status = "Not Recommended"


        rankings.append({

            "marketplace_id":
                marketplace["id"],

            "name":
                marketplace["name"],

            "alias":
                marketplace["alias"],

            "logo_tag":
                marketplace["logo_tag"],

            "score":
                final_score,

            "status":
                status,

            "cost_score":
                round(
                    cost_score,
                    2
                ),

            "promotion_score":
                round(
                    promotion_score,
                    2
                ),

            "traffic_score":
                round(
                    traffic_score,
                    2
                ),

            "margin_score":
                round(
                    margin_score,
                    2
                ),

            "total_fee_percent":
                round(
                    total_fee,
                    2
                ),

            "promotion_percent":
                promo,

            "estimated_profit":
                round(
                    estimated_profit,
                    2
                ),

            "estimated_margin_percent":
                round(
                    estimated_margin,
                    2
                )
        })


    # =================================================
    # 6. URUTKAN
    # =================================================

    rankings.sort(
        key=lambda x: x["score"],
        reverse=True
    )


    # =================================================
    # 7. TAMBAHKAN RANK
    # =================================================

    for index, item in enumerate(
        rankings,
        start=1
    ):

        item["rank"] = index


    # =================================================
    # 8. MARKETPLACE TERBAIK
    # =================================================

    best_marketplace = (
        rankings[0]
        if rankings
        else None
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

        "best_marketplace":
            best_marketplace,

        "total_marketplaces":
            len(rankings),

        "ranking":
            rankings
    }
    
# =====================================================
# API #27
# MARKETPLACE RECOMMENDATION EXPLANATION
# =====================================================

@router.get("/{business_id}/marketplace/{marketplace_id}/explanation")
def get_marketplace_explanation(
    business_id: int,
    marketplace_id: int,
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
    # 2. FINANCIAL PROFILE
    # =================================================

    financial_query = text("""
        SELECT
            monthly_revenue,
            cogs_hpp,
            operating_expenses,
            desired_min_margin_percent,
            target_monthly_profit,
            max_platform_cost_tolerated_percent,
            max_promotional_burden_percent
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


    # =================================================
    # 3. MARKETPLACE
    # =================================================

    marketplace_query = text("""
        SELECT
            id,
            name,
            alias,
            platform_cost_percent,
            commission_fee_percent,
            service_fee_percent,
            payment_fee_percent,
            recommended_promo_percent,
            average_traffic_index,
            target_audience,
            partner_status
        FROM marketplaces
        WHERE id = :marketplace_id
          AND is_active = 1
        LIMIT 1
    """)

    marketplace = db.execute(
        marketplace_query,
        {
            "marketplace_id":
                marketplace_id
        }
    ).mappings().first()

    if not marketplace:
        raise HTTPException(
            status_code=404,
            detail="Marketplace tidak ditemukan atau tidak aktif"
        )


    # =================================================
    # 4. DATA KEUANGAN
    # =================================================

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

    max_platform_cost = float(
        financial[
            "max_platform_cost_tolerated_percent"
        ] or 0
    )

    max_promo_cost = float(
        financial[
            "max_promotional_burden_percent"
        ] or 0
    )


    # =================================================
    # 5. DATA MARKETPLACE
    # =================================================

    platform_cost = float(
        marketplace[
            "platform_cost_percent"
        ] or 0
    )

    commission = float(
        marketplace[
            "commission_fee_percent"
        ] or 0
    )

    service_fee = float(
        marketplace[
            "service_fee_percent"
        ] or 0
    )

    payment_fee = float(
        marketplace[
            "payment_fee_percent"
        ] or 0
    )

    promo = float(
        marketplace[
            "recommended_promo_percent"
        ] or 0
    )

    traffic = float(
        marketplace[
            "average_traffic_index"
        ] or 0
    )


    # =================================================
    # 6. TOTAL FEE
    # =================================================

    total_fee = (
        platform_cost
        + commission
        + service_fee
        + payment_fee
    )


    total_burden = (
        total_fee
        + promo
    )


    # =================================================
    # 7. ESTIMATED PROFIT
    # =================================================

    marketplace_cost = (
        revenue
        * total_burden
        / 100
    )

    estimated_profit = (
        revenue
        - cogs
        - operating_expenses
        - marketplace_cost
    )


    if revenue > 0:

        estimated_margin = (
            estimated_profit
            / revenue
        ) * 100

    else:

        estimated_margin = 0


    # =================================================
    # 8. REASONS
    # =================================================

    positive_reasons = []

    warnings = []


    # ---------------------------------------------
    # PLATFORM COST
    # ---------------------------------------------

    if (
        max_platform_cost > 0
        and total_fee <= max_platform_cost
    ):

        positive_reasons.append({
            "factor": "Platform Cost",
            "result": "Good",
            "message":
                "Total biaya marketplace masih berada dalam batas toleransi bisnis."
        })

    else:

        warnings.append({
            "factor": "Platform Cost",
            "result": "Warning",
            "message":
                "Total biaya marketplace melebihi batas toleransi bisnis."
        })


    # ---------------------------------------------
    # PROMOTION
    # ---------------------------------------------

    if (
        max_promo_cost > 0
        and promo <= max_promo_cost
    ):

        positive_reasons.append({
            "factor": "Promotion",
            "result": "Good",
            "message":
                "Beban promosi masih sesuai dengan batas yang ditentukan."
        })

    else:

        warnings.append({
            "factor": "Promotion",
            "result": "Warning",
            "message":
                "Beban promosi melebihi batas yang ditentukan."
        })


    # ---------------------------------------------
    # MARGIN
    # ---------------------------------------------

    if estimated_margin >= desired_margin:

        positive_reasons.append({
            "factor": "Profit Margin",
            "result": "Good",
            "message":
                "Estimasi margin memenuhi target minimum bisnis."
        })

    else:

        warnings.append({
            "factor": "Profit Margin",
            "result": "Warning",
            "message":
                "Estimasi margin belum mencapai target minimum."
        })


    # ---------------------------------------------
    # TARGET PROFIT
    # ---------------------------------------------

    if estimated_profit >= target_profit:

        positive_reasons.append({
            "factor": "Target Profit",
            "result": "Good",
            "message":
                "Estimasi profit mampu mencapai target profit bulanan."
        })

    else:

        warnings.append({
            "factor": "Target Profit",
            "result": "Warning",
            "message":
                "Estimasi profit masih berada di bawah target bulanan."
        })


    # ---------------------------------------------
    # TRAFFIC
    # ---------------------------------------------

    if traffic >= 80:

        positive_reasons.append({
            "factor": "Traffic",
            "result": "Excellent",
            "message":
                "Indeks traffic marketplace tergolong tinggi."
        })

    elif traffic >= 60:

        positive_reasons.append({
            "factor": "Traffic",
            "result": "Good",
            "message":
                "Indeks traffic marketplace tergolong cukup baik."
        })

    else:

        warnings.append({
            "factor": "Traffic",
            "result": "Low",
            "message":
                "Indeks traffic marketplace relatif rendah."
        })


    # =================================================
    # 9. RECOMMENDATION STATUS
    # =================================================

    good_factors = len(
        positive_reasons
    )

    warning_factors = len(
        warnings
    )


    if (
        good_factors >= 4
        and warning_factors == 0
    ):

        status = "Highly Recommended"

    elif (
        good_factors >= 3
        and warning_factors <= 1
    ):

        status = "Recommended"

    elif good_factors >= 2:

        status = "Consider"

    else:

        status = "Not Recommended"


    # =================================================
    # 10. MAIN EXPLANATION
    # =================================================

    if status == "Highly Recommended":

        explanation = (
            "Marketplace sangat sesuai dengan kondisi bisnis "
            "karena biaya, promosi, margin, profit, dan traffic "
            "berada pada kondisi yang mendukung."
        )

    elif status == "Recommended":

        explanation = (
            "Marketplace direkomendasikan karena sebagian besar "
            "faktor utama sesuai dengan kondisi dan target bisnis."
        )

    elif status == "Consider":

        explanation = (
            "Marketplace masih dapat dipertimbangkan, tetapi "
            "terdapat beberapa faktor yang perlu diperhatikan."
        )

    else:

        explanation = (
            "Marketplace kurang sesuai dengan kondisi bisnis "
            "saat ini dan membutuhkan evaluasi lebih lanjut."
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


        "marketplace": {
            "id":
                marketplace["id"],

            "name":
                marketplace["name"],

            "alias":
                marketplace["alias"],

            "target_audience":
                marketplace["target_audience"],

            "partner_status":
                marketplace["partner_status"]
        },


        "recommendation": {

            "status":
                status,

            "explanation":
                explanation
        },


        "financial_impact": {

            "monthly_revenue":
                revenue,

            "total_marketplace_fee_percent":
                round(
                    total_fee,
                    2
                ),

            "promotion_percent":
                promo,

            "total_burden_percent":
                round(
                    total_burden,
                    2
                ),

            "estimated_profit":
                round(
                    estimated_profit,
                    2
                ),

            "estimated_margin_percent":
                round(
                    estimated_margin,
                    2
                )
        },


        "positive_reasons":
            positive_reasons,


        "warnings":
            warnings,


        "summary": {

            "positive_factors":
                good_factors,

            "warning_factors":
                warning_factors
        }
    }
    
# =====================================================
# API #28
# MARKETPLACE SWITCH ANALYSIS
# =====================================================

@router.get("/{business_id}/switch-analysis/{marketplace_id}")
def marketplace_switch_analysis(
    business_id: int,
    marketplace_id: int,
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
            primary_marketplace
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
    # 2. FINANCIAL PROFILE
    # =================================================

    financial_query = text("""
        SELECT
            monthly_revenue,
            cogs_hpp,
            operating_expenses,
            desired_min_margin_percent,
            target_monthly_profit
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


    # =================================================
    # 3. AMBIL MARKETPLACE TARGET
    # =================================================

    marketplace_query = text("""
        SELECT
            id,
            name,
            alias,
            platform_cost_percent,
            commission_fee_percent,
            service_fee_percent,
            payment_fee_percent,
            recommended_promo_percent,
            average_traffic_index,
            target_audience,
            partner_status
        FROM marketplaces
        WHERE id = :marketplace_id
          AND is_active = 1
        LIMIT 1
    """)

    target = db.execute(
        marketplace_query,
        {
            "marketplace_id":
                marketplace_id
        }
    ).mappings().first()

    if not target:
        raise HTTPException(
            status_code=404,
            detail="Marketplace tujuan tidak ditemukan"
        )


    # =================================================
    # 4. CARI MARKETPLACE SAAT INI
    # =================================================

    current_marketplace = None

    if business["primary_marketplace"]:

        current_query = text("""
            SELECT
                id,
                name,
                alias,
                platform_cost_percent,
                commission_fee_percent,
                service_fee_percent,
                payment_fee_percent,
                recommended_promo_percent,
                average_traffic_index
            FROM marketplaces
            WHERE (
                name = :marketplace_name
                OR alias = :marketplace_name
            )
            AND is_active = 1
            LIMIT 1
        """)

        current_marketplace = db.execute(
            current_query,
            {
                "marketplace_name":
                    business["primary_marketplace"]
            }
        ).mappings().first()


    # =================================================
    # 5. FUNGSI HITUNG MARKETPLACE
    # =================================================

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


    def calculate_marketplace(marketplace):

        platform_cost = float(
            marketplace["platform_cost_percent"] or 0
        )

        commission = float(
            marketplace["commission_fee_percent"] or 0
        )

        service_fee = float(
            marketplace["service_fee_percent"] or 0
        )

        payment_fee = float(
            marketplace["payment_fee_percent"] or 0
        )

        promo = float(
            marketplace["recommended_promo_percent"] or 0
        )

        traffic = float(
            marketplace["average_traffic_index"] or 0
        )


        total_fee = (
            platform_cost
            + commission
            + service_fee
            + payment_fee
        )

        total_burden = (
            total_fee
            + promo
        )


        marketplace_cost = (
            revenue
            * total_burden
            / 100
        )


        estimated_profit = (
            revenue
            - cogs
            - operating_expenses
            - marketplace_cost
        )


        if revenue > 0:

            margin = (
                estimated_profit
                / revenue
            ) * 100

        else:

            margin = 0


        return {
            "total_fee_percent":
                round(total_fee, 2),

            "promotion_percent":
                round(promo, 2),

            "total_burden_percent":
                round(total_burden, 2),

            "marketplace_cost":
                round(
                    marketplace_cost,
                    2
                ),

            "estimated_profit":
                round(
                    estimated_profit,
                    2
                ),

            "estimated_margin_percent":
                round(
                    margin,
                    2
                ),

            "traffic_index":
                round(
                    traffic,
                    2
                )
        }


    # =================================================
    # 6. HITUNG TARGET MARKETPLACE
    # =================================================

    target_result = calculate_marketplace(
        target
    )


    # =================================================
    # 7. JIKA MARKETPLACE SEKARANG ADA
    # =================================================

    current_result = None

    profit_change = None
    margin_change = None
    cost_change = None


    if current_marketplace:

        current_result = calculate_marketplace(
            current_marketplace
        )

        profit_change = round(
            target_result["estimated_profit"]
            - current_result["estimated_profit"],
            2
        )

        margin_change = round(
            target_result["estimated_margin_percent"]
            - current_result["estimated_margin_percent"],
            2
        )

        cost_change = round(
            target_result["marketplace_cost"]
            - current_result["marketplace_cost"],
            2
        )


    # =================================================
    # 8. REKOMENDASI
    # =================================================

    if not current_marketplace:

        recommendation = "No Current Marketplace"

        explanation = (
            "Marketplace saat ini tidak dapat "
            "diidentifikasi sehingga perbandingan "
            "langsung tidak dapat dilakukan."
        )

    elif profit_change > 0 and margin_change >= 0:

        recommendation = "Switch Recommended"

        explanation = (
            "Marketplace tujuan memberikan estimasi "
            "profit yang lebih tinggi dan margin yang "
            "tidak lebih rendah dibanding marketplace saat ini."
        )

    elif profit_change > 0:

        recommendation = "Consider Switching"

        explanation = (
            "Marketplace tujuan meningkatkan estimasi "
            "profit, tetapi margin perlu diperhatikan."
        )

    elif profit_change < 0:

        recommendation = "Stay"

        explanation = (
            "Marketplace saat ini memberikan estimasi "
            "profit yang lebih baik dibanding marketplace tujuan."
        )

    else:

        recommendation = "Neutral"

        explanation = (
            "Perbedaan estimasi profit relatif kecil "
            "sehingga keputusan pindah perlu mempertimbangkan "
            "faktor lain."
        )


    # =================================================
    # 9. CEK TARGET BISNIS
    # =================================================

    target_status = "Below Target"

    if (
        target_result["estimated_profit"]
        >= target_profit
        and target_result["estimated_margin_percent"]
        >= desired_margin
    ):

        target_status = "Meets Target"


    # =================================================
    # 10. ADVANTAGES
    # =================================================

    advantages = []

    if current_result:

        if profit_change > 0:

            advantages.append(
                "Estimasi profit lebih tinggi"
            )

        if margin_change > 0:

            advantages.append(
                "Estimasi margin lebih tinggi"
            )

        if cost_change < 0:

            advantages.append(
                "Biaya marketplace lebih rendah"
            )


    if target_result["estimated_profit"] >= target_profit:

        advantages.append(
            "Estimasi profit memenuhi target bulanan"
        )


    if target_result["estimated_margin_percent"] >= desired_margin:

        advantages.append(
            "Estimasi margin memenuhi target minimum"
        )


    # =================================================
    # 11. WARNINGS
    # =================================================

    warnings = []

    if current_result:

        if profit_change < 0:

            warnings.append(
                "Estimasi profit lebih rendah dibanding marketplace saat ini"
            )

        if margin_change < 0:

            warnings.append(
                "Estimasi margin lebih rendah dibanding marketplace saat ini"
            )

        if cost_change > 0:

            warnings.append(
                "Biaya marketplace lebih tinggi"
            )


    if target_status == "Below Target":

        warnings.append(
            "Marketplace tujuan belum memenuhi target profit atau margin"
        )


    # =================================================
    # 12. RESPONSE
    # =================================================

    return {

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"],

            "current_marketplace":
                business["primary_marketplace"]
        },


        "target_marketplace": {

            "id":
                target["id"],

            "name":
                target["name"],

            "alias":
                target["alias"],

            "target_audience":
                target["target_audience"],

            "partner_status":
                target["partner_status"]
        },


        "current_marketplace_analysis":
            current_result,


        "target_marketplace_analysis":
            target_result,


        "comparison": {

            "profit_change":
                profit_change,

            "margin_change":
                margin_change,

            "marketplace_cost_change":
                cost_change
        },


        "recommendation": {

            "status":
                recommendation,

            "explanation":
                explanation,

            "target_status":
                target_status
        },


        "advantages":
            advantages,

        "warnings":
            warnings
    }