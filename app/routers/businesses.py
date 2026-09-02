from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.schemas.business import BusinessCreate


router = APIRouter(
    prefix="/businesses",
    tags=["Businesses"]
)


# =====================================================
# GET ALL BUSINESSES MILIK USER
# =====================================================

@router.get("")
def get_businesses(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    query = text("""
        SELECT
            b.id,
            b.user_id,
            b.business_name,
            b.business_category,
            b.business_size,
            b.product_category,
            b.primary_marketplace,
            b.seller_city,
            b.created_at,

            ph.business_score,
            ph.status,
            ph.created_at AS score_updated_at

        FROM businesses b

        LEFT JOIN passport_history ph
            ON ph.business_id = b.id

            AND ph.id = (
                SELECT MAX(ph2.id)
                FROM passport_history ph2
                WHERE ph2.business_id = b.id
            )

        WHERE b.user_id = :user_id

        ORDER BY b.id DESC
    """)


    result = db.execute(
        query,
        {
            "user_id": current_user["id"]
        }
    )


    businesses = []


    for row in result.mappings():

        businesses.append({

            "id":
                row["id"],

            "user_id":
                row["user_id"],

            "business_name":
                row["business_name"],

            "business_category":
                row["business_category"],

            "business_size":
                row["business_size"],

            "product_category":
                row["product_category"],

            "primary_marketplace":
                row["primary_marketplace"],

            "seller_city":
                row["seller_city"],

            "created_at":
                str(row["created_at"]),

            "passport": {

                "score":
                    float(
                        row["business_score"]
                    )
                    if row["business_score"] is not None
                    else None,

                "status":
                    row["status"]
                    if row["status"]
                    else "Belum Dinilai",

                "score_updated_at":
                    str(
                        row["score_updated_at"]
                    )
                    if row["score_updated_at"]
                    else None
            }

        })


    return {

        "total_businesses":
            len(businesses),

        "businesses":
            businesses

    }


# =====================================================
# CREATE BUSINESS
# =====================================================

@router.post("")
def create_business(

    business: BusinessCreate,

    current_user=Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )

):

    insert_query = text("""
        INSERT INTO businesses
        (
            user_id,
            business_name,
            business_category,
            business_size,
            product_category,
            primary_marketplace,
            seller_city
        )

        VALUES
        (
            :user_id,
            :business_name,
            :business_category,
            :business_size,
            :product_category,
            :primary_marketplace,
            :seller_city
        )
    """)


    result = db.execute(

        insert_query,

        {

            "user_id":
                current_user["id"],

            "business_name":
                business.business_name,

            "business_category":
                business.business_category,

            "business_size":
                business.business_size,

            "product_category":
                business.product_category,

            "primary_marketplace":
                business.primary_marketplace,

            "seller_city":
                business.seller_city

        }

    )


    db.commit()


    return {

        "message":
            "Profil bisnis berhasil dibuat",

        "business": {

            "id":
                result.lastrowid,

            "user_id":
                current_user["id"],

            "business_name":
                business.business_name,

            "business_category":
                business.business_category,

            "business_size":
                business.business_size,

            "product_category":
                business.product_category,

            "primary_marketplace":
                business.primary_marketplace,

            "seller_city":
                business.seller_city

        }

    }


# =====================================================
# DELETE BUSINESS
# =====================================================

@router.delete("/{business_id}")
def delete_business(

    business_id: int,

    current_user=Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )

):

    # -------------------------------------------------
    # CEK BUSINESS MILIK USER
    # -------------------------------------------------

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

            "business_id":
                business_id,

            "user_id":
                current_user["id"]

        }

    ).mappings().first()


    if not business:

        raise HTTPException(

            status_code=404,

            detail=
                "Bisnis tidak ditemukan atau bukan milik user"

        )


    # -------------------------------------------------
    # DELETE
    # -------------------------------------------------

    delete_query = text("""
        DELETE FROM businesses

        WHERE id = :business_id

        AND user_id = :user_id
    """)


    db.execute(

        delete_query,

        {

            "business_id":
                business_id,

            "user_id":
                current_user["id"]

        }

    )


    db.commit()


    return {

        "message":
            "Bisnis berhasil dihapus",

        "business": {

            "id":
                business["id"],

            "business_name":
                business["business_name"]

        }

    }