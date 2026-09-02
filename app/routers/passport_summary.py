from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user


router = APIRouter(
    prefix="/passport",
    tags=["Economic Passport"]
)


# =====================================================
# API #14
# GET PASSPORT SUMMARY
# =====================================================

@router.get("/{business_id}/summary")
def get_passport_summary(
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
    # 2. AMBIL PASSPORT TERBARU
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
        LIMIT 1
    """)

    latest = db.execute(
        history_query,
        {
            "business_id": business_id
        }
    ).mappings().first()


    # =================================================
    # 3. CEK APAKAH SUDAH ADA PASSPORT
    # =================================================

    if not latest:
        raise HTTPException(
            status_code=404,
            detail="Passport belum pernah dibuat. Silakan lakukan analisis terlebih dahulu."
        )


    # =================================================
    # 4. AMBIL HISTORY SEBELUMNYA
    # =================================================

    previous_query = text("""
        SELECT
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
            "business_id": business_id,
            "latest_id": latest["id"]
        }
    ).mappings().first()


    # =================================================
    # 5. HITUNG PERUBAHAN SCORE
    # =================================================

    current_score = float(
        latest["business_score"]
    )

    if previous:

        previous_score = float(
            previous["business_score"]
        )

        score_change = round(
            current_score - previous_score,
            2
        )

    else:

        previous_score = None
        score_change = None


    # =================================================
    # 6. TENTUKAN TREND
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
    # 7. RESPONSE
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


        "passport": {

            "id":
                latest["id"],

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
                )
        },


        "comparison": {

            "previous_score":
                previous_score,

            "score_change":
                score_change,

            "trend":
                trend
        },


        "latest_update":
            latest["created_at"]
    }