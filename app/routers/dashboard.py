from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


# =====================================================
# API #19
# BUSINESS DASHBOARD SUMMARY
# =====================================================

@router.get("/{business_id}")
def get_dashboard(
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

    latest_query = text("""
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

    latest = db.execute(
        latest_query,
        {
            "business_id": business_id
        }
    ).mappings().first()


    # =================================================
    # 3. AMBIL PASSPORT SEBELUMNYA
    # =================================================

    previous = None

    if latest:

        previous_query = text("""
            SELECT
                id,
                business_score,
                created_at
            FROM passport_history
            WHERE business_id = :business_id
              AND id < :latest_id
            ORDER BY id DESC
            LIMIT 1
        """)

        previous = db.execute(
            previous_query,
            {
                "business_id":
                    business_id,

                "latest_id":
                    latest["id"]
            }
        ).mappings().first()


    # =================================================
    # 4. HITUNG SCORE CHANGE
    # =================================================

    if latest:

        current_score = float(
            latest["business_score"]
        )

    else:

        current_score = None


    if latest and previous:

        previous_score = float(
            previous["business_score"]
        )

        score_change = round(
            current_score
            - previous_score,
            2
        )

    else:

        previous_score = None
        score_change = None


    # =================================================
    # 5. TREND
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
    # 6. TOTAL ASSESSMENT
    # =================================================

    count_query = text("""
        SELECT COUNT(*) AS total
        FROM passport_history
        WHERE business_id = :business_id
    """)

    total_assessments = db.execute(
        count_query,
        {
            "business_id":
                business_id
        }
    ).scalar()


    # =================================================
    # 7. FINANCIAL SUMMARY
    # =================================================

    financial_query = text("""
        SELECT
            monthly_revenue,
            cogs_hpp,
            operating_expenses,
            target_monthly_profit
        FROM financial_profiles
        WHERE business_id = :business_id
        LIMIT 1
    """)

    financial = db.execute(
        financial_query,
        {
            "business_id":
                business_id
        }
    ).mappings().first()


    financial_summary = None

    if financial:

        revenue = float(
            financial["monthly_revenue"] or 0
        )

        cogs = float(
            financial["cogs_hpp"] or 0
        )

        operating_expenses = float(
            financial["operating_expenses"] or 0
        )

        target_profit = float(
            financial["target_monthly_profit"] or 0
        )

        estimated_profit = (
            revenue
            - cogs
            - operating_expenses
        )

        if revenue > 0:

            estimated_margin = (
                estimated_profit
                / revenue
            ) * 100

        else:

            estimated_margin = 0


        financial_summary = {

            "monthly_revenue":
                revenue,

            "cogs_hpp":
                cogs,

            "operating_expenses":
                operating_expenses,

            "estimated_profit":
                round(
                    estimated_profit,
                    2
                ),

            "estimated_margin_percent":
                round(
                    estimated_margin,
                    2
                ),

            "target_monthly_profit":
                target_profit
        }


    # =================================================
    # 8. PASSPORT RESPONSE
    # =================================================

    passport = None

    if latest:

        passport = {

            "score":
                current_score,

            "status":
                latest["status"],

            "profit_score":
                float(
                    latest["profit_score"]
                ),

            "people_score":
                float(
                    latest["people_score"]
                ),

            "planet_score":
                float(
                    latest["planet_score"]
                ),

            "marketplace_health_score":
                float(
                    latest[
                        "marketplace_health_score"
                    ]
                ),

            "last_updated":
                latest["created_at"]
        }


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

            "primary_marketplace":
                business["primary_marketplace"],

            "seller_city":
                business["seller_city"]
        },


        "passport":
            passport,


        "score_change": {

            "current_score":
                current_score,

            "previous_score":
                previous_score,

            "change":
                score_change,

            "trend":
                trend
        },


        "assessment": {

            "total_assessments":
                total_assessments
        },


        "financial":
            financial_summary
    }
    
# =====================================================
# API #20
# DASHBOARD SCORE HISTORY
# =====================================================

@router.get("/{business_id}/score-history")
def get_score_history(
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
    # 2. AMBIL SCORE HISTORY
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
    # 3. FORMAT DATA UNTUK GRAFIK
    # =================================================

    scores = []

    for item in history:

        scores.append({

            "id":
                item["id"],

            "date":
                item["created_at"],

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
                item["status"]
        })


    # =================================================
    # 4. HITUNG TREND
    # =================================================

    if len(scores) < 2:

        trend = "Insufficient Data"

        change = None

    else:

        first_score = scores[0]["business_score"]

        latest_score = scores[-1]["business_score"]

        change = round(
            latest_score - first_score,
            2
        )

        if change > 0:

            trend = "Improving"

        elif change < 0:

            trend = "Declining"

        else:

            trend = "Stable"


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

            "total_records":
                len(scores),

            "first_score":
                scores[0]["business_score"]
                if scores
                else None,

            "latest_score":
                scores[-1]["business_score"]
                if scores
                else None,

            "change":
                change,

            "trend":
                trend
        },


        "history":
            scores
    }
    
# =====================================================
# API #21
# PASSPORT RECOMMENDATIONS
# =====================================================

@router.get("/{business_id}/recommendations")
def get_dashboard_recommendations(
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
            detail="Passport belum dibuat"
        )


    # =================================================
    # 3. AMBIL SCORE
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


    recommendations = []


    # =================================================
    # 4. PROFIT RECOMMENDATION
    # =================================================

    if profit_score < 50:

        recommendations.append({
            "category": "Profit",
            "priority": "High",
            "score": profit_score,
            "title": "Perbaiki profitabilitas bisnis",
            "description":
                "Profit score masih rendah. Evaluasi harga jual, HPP, biaya operasional, dan target profit.",
            "action":
                "Kurangi biaya yang tidak produktif dan evaluasi kembali harga jual."
        })

    elif profit_score < 70:

        recommendations.append({
            "category": "Profit",
            "priority": "Medium",
            "score": profit_score,
            "title": "Optimalkan margin keuntungan",
            "description":
                "Profit bisnis cukup baik tetapi masih memiliki ruang untuk ditingkatkan.",
            "action":
                "Evaluasi HPP dan biaya operasional untuk meningkatkan margin."
        })

    else:

        recommendations.append({
            "category": "Profit",
            "priority": "Low",
            "score": profit_score,
            "title": "Pertahankan profitabilitas",
            "description":
                "Profit score sudah berada pada kondisi yang baik.",
            "action":
                "Pertahankan margin dan lakukan evaluasi biaya secara berkala."
        })


    # =================================================
    # 5. PEOPLE RECOMMENDATION
    # =================================================

    if people_score < 50:

        recommendations.append({
            "category": "People",
            "priority": "High",
            "score": people_score,
            "title": "Perkuat aspek kesejahteraan",
            "description":
                "People score masih rendah.",
            "action":
                "Evaluasi kesejahteraan pekerja dan keterjangkauan produk bagi konsumen."
        })

    elif people_score < 70:

        recommendations.append({
            "category": "People",
            "priority": "Medium",
            "score": people_score,
            "title": "Tingkatkan dampak sosial",
            "description":
                "Aspek sosial bisnis masih dapat ditingkatkan.",
            "action":
                "Perbaiki praktik upah dan pertimbangkan keterjangkauan produk."
        })

    else:

        recommendations.append({
            "category": "People",
            "priority": "Low",
            "score": people_score,
            "title": "Pertahankan dampak sosial",
            "description":
                "People score sudah baik.",
            "action":
                "Pertahankan praktik bisnis yang memberikan manfaat bagi pekerja dan konsumen."
        })


    # =================================================
    # 6. PLANET RECOMMENDATION
    # =================================================

    if planet_score < 50:

        recommendations.append({
            "category": "Planet",
            "priority": "High",
            "score": planet_score,
            "title": "Tingkatkan keberlanjutan",
            "description":
                "Planet score masih rendah.",
            "action":
                "Mulai menggunakan kemasan yang lebih ramah lingkungan."
        })

    elif planet_score < 70:

        recommendations.append({
            "category": "Planet",
            "priority": "Medium",
            "score": planet_score,
            "title": "Kurangi dampak lingkungan",
            "description":
                "Praktik ramah lingkungan sudah ada tetapi belum optimal.",
            "action":
                "Tingkatkan efisiensi kemasan dan proses pengiriman."
        })

    else:

        recommendations.append({
            "category": "Planet",
            "priority": "Low",
            "score": planet_score,
            "title": "Pertahankan praktik ramah lingkungan",
            "description":
                "Planet score sudah baik.",
            "action":
                "Pertahankan penggunaan praktik bisnis yang berkelanjutan."
        })


    # =================================================
    # 7. MARKETPLACE RECOMMENDATION
    # =================================================

    if marketplace_score < 50:

        recommendations.append({
            "category": "Marketplace",
            "priority": "High",
            "score": marketplace_score,
            "title": "Evaluasi marketplace",
            "description":
                "Marketplace health score masih rendah.",
            "action":
                "Evaluasi biaya platform, komisi, promosi, dan tingkat retur."
        })

    elif marketplace_score < 70:

        recommendations.append({
            "category": "Marketplace",
            "priority": "Medium",
            "score": marketplace_score,
            "title": "Optimalkan penggunaan marketplace",
            "description":
                "Marketplace masih dapat dioptimalkan.",
            "action":
                "Bandingkan biaya dan performa beberapa marketplace."
        })

    else:

        recommendations.append({
            "category": "Marketplace",
            "priority": "Low",
            "score": marketplace_score,
            "title": "Pertahankan performa marketplace",
            "description":
                "Marketplace health score sudah baik.",
            "action":
                "Pantau perubahan biaya dan performa marketplace secara berkala."
        })


    # =================================================
    # 8. OVERALL RECOMMENDATION
    # =================================================

    if business_score < 50:

        overall = {
            "priority": "High",
            "title": "Bisnis membutuhkan evaluasi menyeluruh",
            "description":
                "Business score berada pada tingkat risiko tinggi.",
            "action":
                "Prioritaskan perbaikan profitabilitas dan aspek dengan score terendah."
        }

    elif business_score < 65:

        overall = {
            "priority": "High",
            "title": "Fokus pada area yang masih lemah",
            "description":
                "Business score menunjukkan masih terdapat beberapa aspek yang perlu diperbaiki.",
            "action":
                "Gunakan score terendah sebagai prioritas perbaikan."
        }

    elif business_score < 80:

        overall = {
            "priority": "Medium",
            "title": "Tingkatkan performa bisnis",
            "description":
                "Bisnis berada pada kondisi cukup baik tetapi masih memiliki ruang untuk berkembang.",
            "action":
                "Optimalkan area dengan score terendah secara bertahap."
        }

    else:

        overall = {
            "priority": "Low",
            "title": "Pertahankan performa bisnis",
            "description":
                "Business score menunjukkan kondisi bisnis yang baik.",
            "action":
                "Pertahankan performa dan lakukan evaluasi berkala."
        }


    # =================================================
    # 9. CARI PRIORITAS TERENDAH
    # =================================================

    score_categories = [
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

    weakest_area = min(
        score_categories,
        key=lambda x: x["score"]
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
            "score":
                business_score,

            "status":
                passport["status"],

            "last_updated":
                passport["created_at"]
        },

        "overall_recommendation":
            overall,

        "weakest_area":
            weakest_area,

        "recommendations":
            recommendations,

        "total_recommendations":
            len(recommendations)
    }
    
# =====================================================
# API #23
# BUSINESS ACTION PLAN
# =====================================================

@router.get("/{business_id}/action-plan")
def get_action_plan(
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
            detail="Passport belum dibuat"
        )


    # =================================================
    # 3. AMBIL FINANCIAL PROFILE
    # =================================================

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
    # 5. ACTION PLAN
    # =================================================

    actions = []


    # =================================================
    # PROFIT
    # =================================================

    if profit_score < 50:

        actions.append({
            "priority": 1,
            "category": "Profit",
            "severity": "High",
            "title": "Perbaiki profitabilitas",
            "problem":
                "Profit score berada pada tingkat rendah.",
            "action":
                "Evaluasi HPP, biaya operasional, harga jual, dan target profit.",
            "expected_impact":
                "Meningkatkan margin dan profit bersih."
        })

    elif profit_score < 70:

        actions.append({
            "priority": 2,
            "category": "Profit",
            "severity": "Medium",
            "title": "Optimalkan margin",
            "problem":
                "Profit score masih memiliki ruang untuk ditingkatkan.",
            "action":
                "Cari komponen biaya yang dapat dikurangi tanpa menurunkan kualitas produk.",
            "expected_impact":
                "Meningkatkan profitabilitas bisnis."
        })


    # =================================================
    # PEOPLE
    # =================================================

    if people_score < 50:

        actions.append({
            "priority": 1,
            "category": "People",
            "severity": "High",
            "title": "Perbaiki aspek sosial",
            "problem":
                "People score masih rendah.",
            "action":
                "Evaluasi kesejahteraan pekerja dan keterjangkauan produk.",
            "expected_impact":
                "Meningkatkan keberlanjutan sosial bisnis."
        })

    elif people_score < 70:

        actions.append({
            "priority": 3,
            "category": "People",
            "severity": "Medium",
            "title": "Tingkatkan dampak sosial",
            "problem":
                "People score belum optimal.",
            "action":
                "Tingkatkan praktik kesejahteraan pekerja dan evaluasi harga produk.",
            "expected_impact":
                "Meningkatkan nilai sosial bisnis."
        })


    # =================================================
    # PLANET
    # =================================================

    if planet_score < 50:

        actions.append({
            "priority": 1,
            "category": "Planet",
            "severity": "High",
            "title": "Mulai praktik ramah lingkungan",
            "problem":
                "Planet score berada pada tingkat rendah.",
            "action":
                "Gunakan kemasan ramah lingkungan dan kurangi pemborosan material.",
            "expected_impact":
                "Mengurangi dampak lingkungan bisnis."
        })

    elif planet_score < 70:

        actions.append({
            "priority": 3,
            "category": "Planet",
            "severity": "Medium",
            "title": "Tingkatkan efisiensi lingkungan",
            "problem":
                "Praktik lingkungan belum optimal.",
            "action":
                "Tingkatkan efisiensi kemasan dan proses pengiriman.",
            "expected_impact":
                "Mengurangi penggunaan material dan biaya operasional."
        })


    # =================================================
    # MARKETPLACE
    # =================================================

    if marketplace_score < 50:

        actions.append({
            "priority": 1,
            "category": "Marketplace",
            "severity": "High",
            "title": "Evaluasi marketplace",
            "problem":
                "Marketplace health score rendah.",
            "action":
                "Bandingkan biaya platform, komisi, promosi, dan tingkat retur.",
            "expected_impact":
                "Mengurangi beban marketplace terhadap profit."
        })

    elif marketplace_score < 70:

        actions.append({
            "priority": 2,
            "category": "Marketplace",
            "severity": "Medium",
            "title": "Optimalkan marketplace",
            "problem":
                "Marketplace health score belum optimal.",
            "action":
                "Bandingkan marketplace dan kurangi biaya promosi yang kurang efektif.",
            "expected_impact":
                "Meningkatkan efisiensi penjualan online."
        })


    # =================================================
    # 6. FINANCIAL ACTION
    # =================================================

    if financial:

        revenue = float(
            financial["monthly_revenue"] or 0
        )

        cogs = float(
            financial["cogs_hpp"] or 0
        )

        operating_expenses = float(
            financial["operating_expenses"] or 0
        )

        target_profit = float(
            financial["target_monthly_profit"] or 0
        )

        estimated_profit = (
            revenue
            - cogs
            - operating_expenses
        )

        if estimated_profit < target_profit:

            actions.append({
                "priority": 2,
                "category": "Financial",
                "severity": "Medium",
                "title": "Kejar target profit",
                "problem":
                    "Estimasi profit masih di bawah target bulanan.",
                "action":
                    "Naikkan pendapatan atau kurangi biaya yang tidak memberikan kontribusi langsung.",
                "expected_impact":
                    "Mendekatkan profit aktual ke target bisnis."
            })


    # =================================================
    # 7. URUTKAN PRIORITAS
    # =================================================

    actions.sort(
        key=lambda x: (
            x["priority"],
            x["category"]
        )
    )


    # =================================================
    # 8. JIKA TIDAK ADA MASALAH BESAR
    # =================================================

    if not actions:

        actions.append({
            "priority": 4,
            "category": "General",
            "severity": "Low",
            "title": "Pertahankan performa bisnis",
            "problem":
                "Tidak ditemukan area dengan score rendah.",
            "action":
                "Lakukan monitoring dan evaluasi bisnis secara berkala.",
            "expected_impact":
                "Menjaga stabilitas performa bisnis."
        })


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

            "product_category":
                business["product_category"],

            "primary_marketplace":
                business["primary_marketplace"]
        },


        "passport": {

            "score":
                business_score,

            "status":
                passport["status"],

            "profit_score":
                profit_score,

            "people_score":
                people_score,

            "planet_score":
                planet_score,

            "marketplace_health_score":
                marketplace_score
        },


        "action_plan": actions,


        "total_actions":
            len(actions)
    }
    
# =====================================================
# API #24
# BUSINESS HEALTH CHECK
# =====================================================

@router.get("/{business_id}/health-check")
def get_business_health_check(
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
            product_category
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
            detail="Passport belum dibuat"
        )


    # =================================================
    # 3. FUNGSI STATUS SCORE
    # =================================================

    def get_health_status(score):

        if score >= 80:
            return "Healthy"

        elif score >= 65:
            return "Moderate"

        elif score >= 50:
            return "Needs Improvement"

        else:
            return "Critical"


    # =================================================
    # 4. AMBIL SCORE
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
    # 5. HEALTH CHECK
    # =================================================

    areas = {

        "profit": {
            "score": profit_score,
            "status": get_health_status(
                profit_score
            )
        },

        "people": {
            "score": people_score,
            "status": get_health_status(
                people_score
            )
        },

        "planet": {
            "score": planet_score,
            "status": get_health_status(
                planet_score
            )
        },

        "marketplace": {
            "score": marketplace_score,
            "status": get_health_status(
                marketplace_score
            )
        }
    }


    # =================================================
    # 6. HITUNG AREA SEHAT
    # =================================================

    healthy_count = 0
    moderate_count = 0
    improvement_count = 0
    critical_count = 0

    for area in areas.values():

        status = area["status"]

        if status == "Healthy":

            healthy_count += 1

        elif status == "Moderate":

            moderate_count += 1

        elif status == "Needs Improvement":

            improvement_count += 1

        elif status == "Critical":

            critical_count += 1


    # =================================================
    # 7. TENTUKAN KONDISI KESELURUHAN
    # =================================================

    if critical_count >= 2:

        overall_health = "Critical"

        message = (
            "Bisnis memiliki beberapa area kritis "
            "yang membutuhkan perhatian segera."
        )

    elif critical_count == 1:

        overall_health = "At Risk"

        message = (
            "Bisnis masih memiliki satu area kritis "
            "yang perlu segera diperbaiki."
        )

    elif improvement_count >= 2:

        overall_health = "Needs Improvement"

        message = (
            "Bisnis cukup stabil tetapi beberapa "
            "area masih perlu ditingkatkan."
        )

    elif healthy_count >= 3:

        overall_health = "Healthy"

        message = (
            "Sebagian besar aspek bisnis berada "
            "dalam kondisi sehat."
        )

    else:

        overall_health = "Moderate"

        message = (
            "Bisnis berada dalam kondisi cukup baik "
            "namun masih memiliki ruang untuk berkembang."
        )


    # =================================================
    # 8. CARI AREA TERKUAT DAN TERLEMAH
    # =================================================

    strongest_area = max(
        areas.items(),
        key=lambda item: item[1]["score"]
    )

    weakest_area = min(
        areas.items(),
        key=lambda item: item[1]["score"]
    )


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
                business["product_category"]
        },


        "overall": {

            "score":
                business_score,

            "passport_status":
                passport["status"],

            "health_status":
                overall_health,

            "message":
                message
        },


        "areas":
            areas,


        "strongest_area": {

            "category":
                strongest_area[0],

            "score":
                strongest_area[1]["score"],

            "status":
                strongest_area[1]["status"]
        },


        "weakest_area": {

            "category":
                weakest_area[0],

            "score":
                weakest_area[1]["score"],

            "status":
                weakest_area[1]["status"]
        },


        "summary": {

            "healthy":
                healthy_count,

            "moderate":
                moderate_count,

            "needs_improvement":
                improvement_count,

            "critical":
                critical_count
        },


        "last_updated":
            passport["created_at"]
    }
    
# =====================================================
# API #25
# BUSINESS ALERTS
# =====================================================

@router.get("/{business_id}/alerts")
def get_business_alerts(
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
            detail="Passport belum dibuat"
        )


    # =================================================
    # 3. FINANCIAL PROFILE
    # =================================================

    financial_query = text("""
        SELECT
            monthly_revenue,
            cogs_hpp,
            operating_expenses,
            desired_min_margin_percent,
            target_monthly_profit,
            avg_marketplace_fee_percent,
            avg_promotional_cost_percent,
            max_platform_cost_tolerated_percent,
            max_promotional_burden_percent,
            return_rate_percent
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


    alerts = []


    # =================================================
    # 4. SCORE ALERTS
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


    if business_score < 50:

        alerts.append({
            "type": "BUSINESS_RISK",
            "severity": "Critical",
            "category": "Overall",
            "title": "Business score sangat rendah",
            "message":
                "Bisnis membutuhkan evaluasi menyeluruh.",
            "score": business_score
        })

    elif business_score < 65:

        alerts.append({
            "type": "BUSINESS_WARNING",
            "severity": "High",
            "category": "Overall",
            "title": "Business score perlu diperbaiki",
            "message":
                "Beberapa aspek bisnis masih membutuhkan perhatian.",
            "score": business_score
        })


    if profit_score < 50:

        alerts.append({
            "type": "LOW_PROFIT_SCORE",
            "severity": "Critical",
            "category": "Profit",
            "title": "Profit score kritis",
            "message":
                "Profitabilitas bisnis berada pada tingkat yang berisiko.",
            "score": profit_score
        })

    elif profit_score < 65:

        alerts.append({
            "type": "LOW_PROFIT_SCORE",
            "severity": "High",
            "category": "Profit",
            "title": "Profit score rendah",
            "message":
                "Margin dan profit bisnis perlu dioptimalkan.",
            "score": profit_score
        })


    if people_score < 50:

        alerts.append({
            "type": "PEOPLE_RISK",
            "severity": "High",
            "category": "People",
            "title": "People score rendah",
            "message":
                "Aspek kesejahteraan pekerja atau keterjangkauan produk perlu diperhatikan.",
            "score": people_score
        })


    if planet_score < 50:

        alerts.append({
            "type": "PLANET_RISK",
            "severity": "High",
            "category": "Planet",
            "title": "Planet score rendah",
            "message":
                "Praktik bisnis perlu lebih memperhatikan dampak lingkungan.",
            "score": planet_score
        })


    if marketplace_score < 50:

        alerts.append({
            "type": "MARKETPLACE_RISK",
            "severity": "High",
            "category": "Marketplace",
            "title": "Marketplace health rendah",
            "message":
                "Biaya dan performa marketplace perlu dievaluasi.",
            "score": marketplace_score
        })


    # =================================================
    # 5. FINANCIAL ALERTS
    # =================================================

    if financial:

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

        marketplace_fee = float(
            financial["avg_marketplace_fee_percent"] or 0
        )

        promotion_cost = float(
            financial["avg_promotional_cost_percent"] or 0
        )

        max_platform_cost = float(
            financial["max_platform_cost_tolerated_percent"] or 0
        )

        max_promotion_cost = float(
            financial["max_promotional_burden_percent"] or 0
        )

        return_rate = float(
            financial["return_rate_percent"] or 0
        )


        # ---------------------------------------------
        # ESTIMATED PROFIT
        # ---------------------------------------------

        estimated_profit = (
            revenue
            - cogs
            - operating_expenses
        )

        if revenue > 0:

            estimated_margin = (
                estimated_profit
                / revenue
            ) * 100

        else:

            estimated_margin = 0


        # ---------------------------------------------
        # MARGIN ALERT
        # ---------------------------------------------

        if estimated_margin < desired_margin:

            alerts.append({
                "type": "LOW_MARGIN",
                "severity": "High",
                "category": "Financial",
                "title": "Margin di bawah target",
                "message":
                    "Estimasi margin belum mencapai margin minimum yang ditargetkan.",
                "current_margin":
                    round(estimated_margin, 2),
                "target_margin":
                    desired_margin
            })


        # ---------------------------------------------
        # TARGET PROFIT
        # ---------------------------------------------

        if estimated_profit < target_profit:

            alerts.append({
                "type": "TARGET_PROFIT_NOT_REACHED",
                "severity": "Medium",
                "category": "Financial",
                "title": "Target profit belum tercapai",
                "message":
                    "Estimasi profit bulanan masih berada di bawah target.",
                "estimated_profit":
                    round(estimated_profit, 2),
                "target_profit":
                    target_profit
            })


        # ---------------------------------------------
        # MARKETPLACE COST
        # ---------------------------------------------

        if (
            max_platform_cost > 0
            and marketplace_fee > max_platform_cost
        ):

            alerts.append({
                "type": "HIGH_PLATFORM_COST",
                "severity": "High",
                "category": "Marketplace",
                "title": "Biaya platform terlalu tinggi",
                "message":
                    "Biaya marketplace melebihi batas toleransi bisnis.",
                "current_cost":
                    marketplace_fee,
                "maximum_cost":
                    max_platform_cost
            })


        # ---------------------------------------------
        # PROMOTION COST
        # ---------------------------------------------

        if (
            max_promotion_cost > 0
            and promotion_cost > max_promotion_cost
        ):

            alerts.append({
                "type": "HIGH_PROMOTION_COST",
                "severity": "Medium",
                "category": "Marketplace",
                "title": "Beban promosi terlalu tinggi",
                "message":
                    "Biaya promosi melebihi batas yang ditentukan.",
                "current_cost":
                    promotion_cost,
                "maximum_cost":
                    max_promotion_cost
            })


        # ---------------------------------------------
        # RETURN RATE
        # ---------------------------------------------

        if return_rate >= 10:

            alerts.append({
                "type": "HIGH_RETURN_RATE",
                "severity": "High",
                "category": "Marketplace",
                "title": "Return rate tinggi",
                "message":
                    "Tingkat retur produk cukup tinggi dan perlu dievaluasi.",
                "return_rate":
                    return_rate
            })

        elif return_rate >= 5:

            alerts.append({
                "type": "RETURN_RATE_WARNING",
                "severity": "Medium",
                "category": "Marketplace",
                "title": "Return rate perlu diperhatikan",
                "message":
                    "Tingkat retur mulai memberikan risiko terhadap performa bisnis.",
                "return_rate":
                    return_rate
            })


    # =================================================
    # 6. SCORE HISTORY ALERT
    # =================================================

    previous_query = text("""
        SELECT
            business_score
        FROM passport_history
        WHERE business_id = :business_id
          AND id < :latest_id
        ORDER BY id DESC
        LIMIT 1
    """)

    previous = db.execute(
        previous_query,
        {
            "business_id": business_id,
            "latest_id": passport["id"]
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

        if score_change <= -5:

            alerts.append({
                "type": "SCORE_DECLINE",
                "severity": "High",
                "category": "Overall",
                "title": "Business score menurun",
                "message":
                    "Business score mengalami penurunan signifikan dibanding assessment sebelumnya.",
                "current_score":
                    business_score,
                "previous_score":
                    previous_score,
                "change":
                    score_change
            })


    # =================================================
    # 7. SORT ALERT
    # =================================================

    severity_order = {
        "Critical": 1,
        "High": 2,
        "Medium": 3,
        "Low": 4
    }

    alerts.sort(
        key=lambda x:
            severity_order.get(
                x["severity"],
                5
            )
    )


    # =================================================
    # 8. STATUS
    # =================================================

    critical_count = sum(
        1
        for alert in alerts
        if alert["severity"] == "Critical"
    )

    high_count = sum(
        1
        for alert in alerts
        if alert["severity"] == "High"
    )

    medium_count = sum(
        1
        for alert in alerts
        if alert["severity"] == "Medium"
    )


    if critical_count > 0:

        overall_alert_status = "Critical"

    elif high_count > 0:

        overall_alert_status = "Warning"

    elif medium_count > 0:

        overall_alert_status = "Notice"

    else:

        overall_alert_status = "Healthy"


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

        "overall_status":
            overall_alert_status,

        "alert_summary": {

            "total":
                len(alerts),

            "critical":
                critical_count,

            "high":
                high_count,

            "medium":
                medium_count
        },

        "alerts":
            alerts,

        "last_checked":
            passport["created_at"]
    }