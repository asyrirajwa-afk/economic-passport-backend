from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db


router = APIRouter(
    prefix="/marketplaces",
    tags=["Marketplaces"]
)


@router.get("")
def get_marketplaces(db: Session = Depends(get_db)):

    query = text("""
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
            partner_status,
            is_active
        FROM marketplaces
        WHERE is_active = 1
        ORDER BY id ASC
    """)

    result = db.execute(query)

    marketplaces = []

    for row in result.mappings():
        marketplaces.append({
            "id": row["id"],
            "name": row["name"],
            "alias": row["alias"],
            "logo_tag": row["logo_tag"],
            "platform_cost_percent": float(row["platform_cost_percent"]),
            "commission_fee_percent": float(row["commission_fee_percent"]),
            "service_fee_percent": float(row["service_fee_percent"]),
            "payment_fee_percent": float(row["payment_fee_percent"]),
            "recommended_promo_percent": float(row["recommended_promo_percent"]),
            "average_traffic_index": row["average_traffic_index"],
            "target_audience": row["target_audience"],
            "partner_status": row["partner_status"],
            "is_active": bool(row["is_active"])
        })

    return marketplaces