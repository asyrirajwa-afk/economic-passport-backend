from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.schemas.financial import FinancialProfileCreate


# =========================================================
# FINANCIAL PROFILE UPDATE SCHEMA
# =========================================================

class FinancialProfileUpdate(BaseModel):

    monthly_revenue: float = Field(ge=0)
    cogs_hpp: float = Field(ge=0)
    operating_expenses: float = Field(ge=0)
    average_selling_price: float = Field(ge=0)

    employee_fair_wage_compliant: bool = False

    employee_count: int = Field(
        default=0,
        ge=0
    )

    fair_wage_basis: str | None = None


    # MATERIAL

    main_materials: str | None = None

    material_origin: str | None = None

    recycled_material_percent: float = Field(
        default=0,
        ge=0,
        le=100
    )


    # PACKAGING

    eco_packaging_adopted: bool = False

    packaging_material: str | None = None

    packaging_reusable: bool = False


    # WASTE

    waste_management: str | None = None

    waste_description: str | None = None


    # ENERGY

    energy_source: str | None = None


    # EXISTING EFFICIENCY

    packaging_efficiency_score: float = Field(
        default=0,
        ge=0,
        le=100
    )

    shipment_efficiency_score: float = Field(
        default=0,
        ge=0,
        le=100
    )

    return_efficiency_score: float = Field(
        default=0,
        ge=0,
        le=100
    )


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/financial-profiles",
    tags=["Financial Profiles"]
)


# =========================================================
# HELPER
# =========================================================

def check_business_ownership(
    business_id: int,
    current_user,
    db: Session
):

    query = text("""
        SELECT
            id,
            business_name
        FROM businesses
        WHERE id = :business_id
          AND user_id = :user_id
        LIMIT 1
    """)

    business = db.execute(
        query,
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

    return business


# =========================================================
# API #6
# CREATE FINANCIAL PROFILE
# =========================================================

@router.post("")
def create_financial_profile(
    financial: FinancialProfileCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =====================================================
    # 1. CEK KEPEMILIKAN BISNIS
    # =====================================================

    business = check_business_ownership(
        financial.business_id,
        current_user,
        db
    )


    # =====================================================
    # 2. CEK APAKAH PROFILE SUDAH ADA
    # =====================================================

    existing_query = text("""
        SELECT id
        FROM financial_profiles
        WHERE business_id = :business_id
        LIMIT 1
    """)

    existing_profile = db.execute(
        existing_query,
        {
            "business_id": financial.business_id
        }
    ).mappings().first()


    if existing_profile:

        raise HTTPException(
            status_code=409,
            detail="Financial profile untuk bisnis ini sudah ada"
        )


    # =====================================================
    # 3. INSERT
    # =====================================================

    insert_query = text("""
        INSERT INTO financial_profiles
        (
            business_id,

            monthly_revenue,
            cogs_hpp,
            operating_expenses,
            average_selling_price,

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
            
            employee_count,
            fair_wage_basis,

            main_materials,
            material_origin,
            recycled_material_percent,

            packaging_material,
            packaging_reusable,

            waste_management,
            waste_description,

            energy_source,

            packaging_efficiency_score,
            shipment_efficiency_score,
            return_efficiency_score,

            period_start,
            period_end
        )

        VALUES
        (
            :business_id,

            :monthly_revenue,
            :cogs_hpp,
            :operating_expenses,
            :average_selling_price,

            :avg_marketplace_fee_percent,
            :avg_promotional_cost_percent,
            :avg_packaging_cost_percent,
            :return_rate_percent,

            :desired_min_margin_percent,
            :max_platform_cost_tolerated_percent,
            :max_promotional_burden_percent,

            :target_monthly_profit,
            :min_sustainable_living_income,

            :consumer_affordability_index,

            :employee_fair_wage_compliant,
            :employee_count,
            :fair_wage_basis,

            :main_materials,
            :material_origin,
            :recycled_material_percent,

            :eco_packaging_adopted,
            :packaging_material,
            :packaging_reusable,

            :waste_management,
            :waste_description,

            :energy_source,

            :packaging_efficiency_score,
            :shipment_efficiency_score,
            :return_efficiency_score,

            :period_start,
            :period_end
            :shipment_efficiency_score,
            :return_efficiency_score,

            :period_start,
            :period_end
        )
    """)


    try:

        result = db.execute(
            insert_query,
            {
                "business_id":
                    financial.business_id,

                "monthly_revenue":
                    financial.monthly_revenue,

                "cogs_hpp":
                    financial.cogs_hpp,

                "operating_expenses":
                    financial.operating_expenses,

                "average_selling_price":
                    financial.average_selling_price,

                "avg_marketplace_fee_percent":
                    financial.avg_marketplace_fee_percent,

                "avg_promotional_cost_percent":
                    financial.avg_promotional_cost_percent,

                "avg_packaging_cost_percent":
                    financial.avg_packaging_cost_percent,

                "return_rate_percent":
                    financial.return_rate_percent,

                "desired_min_margin_percent":
                    financial.desired_min_margin_percent,

                "max_platform_cost_tolerated_percent":
                    financial.max_platform_cost_tolerated_percent,

                "max_promotional_burden_percent":
                    financial.max_promotional_burden_percent,

                "target_monthly_profit":
                    financial.target_monthly_profit,

                "min_sustainable_living_income":
                    financial.min_sustainable_living_income,

                "consumer_affordability_index":
                    financial.consumer_affordability_index,

                "employee_fair_wage_compliant":
                    financial.employee_fair_wage_compliant,

                "employee_count":
                    financial.employee_count,

                "fair_wage_basis":
                    financial.fair_wage_basis,

                "main_materials":
                    financial.main_materials,

                "material_origin":
                    financial.material_origin,

                "recycled_material_percent":
                    financial.recycled_material_percent,

                "eco_packaging_adopted":
                    financial.eco_packaging_adopted,

                "packaging_material":
                    financial.packaging_material,

                "packaging_reusable":
                    financial.packaging_reusable,

                "waste_management":
                    financial.waste_management,

                "waste_description":
                    financial.waste_description,

                "energy_source":
                    financial.energy_source,

                "packaging_efficiency_score":
                    getattr(
                        financial,
                        "packaging_efficiency_score",
                        0
                    ),

                "shipment_efficiency_score":
                    getattr(
                        financial,
                        "shipment_efficiency_score",
                        0
                    ),

                "return_efficiency_score":
                    getattr(
                        financial,
                        "return_efficiency_score",
                        0
                    ),

                "period_start":
                    financial.period_start,

                "period_end":
                    financial.period_end
            }
        )

        db.commit()


    except SQLAlchemyError as error:

        db.rollback()

        print(
            "ERROR CREATE FINANCIAL PROFILE:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Gagal menyimpan financial profile"
        )


    # =====================================================
    # 4. AMBIL DATA YANG BARU DISIMPAN
    # =====================================================

    profile_query = text("""
        SELECT
            id,
            business_id,

            monthly_revenue,
            cogs_hpp,
            operating_expenses,
            average_selling_price,

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
            return_efficiency_score,

            verification_level,
            verified_financial_consent,
            anonymous_data_contribution,

            period_start,
            period_end,

            created_at,
            updated_at

        FROM financial_profiles

        WHERE id = :profile_id

        LIMIT 1
    """)


    profile = db.execute(
        profile_query,
        {
            "profile_id": result.lastrowid
        }
    ).mappings().first()


    # =====================================================
    # 5. RESPONSE
    # =====================================================

    return {

        "message":
            "Financial profile berhasil dibuat",

        "business": {
            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },

        "financial_profile":
            dict(profile)
            if profile
            else None
    }
    
    


# =========================================================
# API #7
# GET FINANCIAL PROFILE
# =========================================================

@router.get("/{business_id}")
def get_financial_profile(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =====================================================
    # 1. CEK KEPEMILIKAN
    # =====================================================

    business = check_business_ownership(
        business_id,
        current_user,
        db
    )


    # =====================================================
    # 2. AMBIL PROFILE
    # =====================================================

    financial_query = text("""
        SELECT
            id,
            business_id,

            monthly_revenue,
            cogs_hpp,
            operating_expenses,
            average_selling_price,

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
            employee_count,
            fair_wage_basis,

            main_materials,
            material_origin,
            recycled_material_percent,

            eco_packaging_adopted,
            packaging_material,
            packaging_reusable,

            waste_management,
            waste_description,

            energy_source,

            packaging_efficiency_score,
            shipment_efficiency_score,
            return_efficiency_score,
            shipment_efficiency_score,
            return_efficiency_score,

            verification_level,
            verified_financial_consent,
            anonymous_data_contribution,

            period_start,
            period_end,

            created_at,
            updated_at

        FROM financial_profiles

        WHERE business_id = :business_id

        LIMIT 1
    """)


    profile = db.execute(
        financial_query,
        {
            "business_id": business_id
        }
    ).mappings().first()


    if not profile:

        raise HTTPException(
            status_code=404,
            detail="Financial profile belum dibuat"
        )


    return {

        "business": {
            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },

        "financial_profile":
            dict(profile)
    }


# =========================================================
# API #15
# UPDATE FINANCIAL PROFILE
# =========================================================

@router.put("/{business_id}")
def update_financial_profile(
    business_id: int,
    data: FinancialProfileUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =====================================================
    # 1. CEK KEPEMILIKAN
    # =====================================================

    business = check_business_ownership(
        business_id,
        current_user,
        db
    )


    # =====================================================
    # 2. CEK PROFILE
    # =====================================================

    check_query = text("""
        SELECT id
        FROM financial_profiles
        WHERE business_id = :business_id
        LIMIT 1
    """)


    existing = db.execute(
        check_query,
        {
            "business_id": business_id
        }
    ).mappings().first()


    if not existing:

        raise HTTPException(
            status_code=404,
            detail="Financial profile belum dibuat"
        )


    # =====================================================
    # 3. UPDATE
    # =====================================================

    update_query = text("""
        UPDATE financial_profiles

        SET

            monthly_revenue =
                :monthly_revenue,

            cogs_hpp =
                :cogs_hpp,

            operating_expenses =
                :operating_expenses,

            average_selling_price =
                :average_selling_price,

            avg_marketplace_fee_percent =
                :avg_marketplace_fee_percent,

            avg_promotional_cost_percent =
                :avg_promotional_cost_percent,

            avg_packaging_cost_percent =
                :avg_packaging_cost_percent,

            return_rate_percent =
                :return_rate_percent,

            desired_min_margin_percent =
                :desired_min_margin_percent,

            max_platform_cost_tolerated_percent =
                :max_platform_cost_tolerated_percent,

            max_promotional_burden_percent =
                :max_promotional_burden_percent,

            target_monthly_profit =
                :target_monthly_profit,

            min_sustainable_living_income =
                :min_sustainable_living_income,

            consumer_affordability_index =
                :consumer_affordability_index,

            employee_fair_wage_compliant =
                :employee_fair_wage_compliant,

            employee_count =
                :employee_count,

            fair_wage_basis =
                :fair_wage_basis,

            main_materials =
                :main_materials,

            material_origin =
                :material_origin,

            recycled_material_percent =
                :recycled_material_percent,

            eco_packaging_adopted =
                :eco_packaging_adopted,

            packaging_material =
                :packaging_material,

            packaging_reusable =
                :packaging_reusable,

            waste_management =
                :waste_management,

            waste_description =
                :waste_description,

            energy_source =
                :energy_source,

            packaging_efficiency_score =
                :packaging_efficiency_score,

            shipment_efficiency_score =
                :shipment_efficiency_score,

            return_efficiency_score =
                :return_efficiency_score

            shipment_efficiency_score =
                :shipment_efficiency_score,

            return_efficiency_score =
                :return_efficiency_score

        WHERE business_id =
            :business_id
    """)


    try:

        db.execute(
            update_query,
            {
                "business_id":
                    business_id,

                "monthly_revenue":
                    data.monthly_revenue,

                "cogs_hpp":
                    data.cogs_hpp,

                "operating_expenses":
                    data.operating_expenses,

                "average_selling_price":
                    data.average_selling_price,

                "avg_marketplace_fee_percent":
                    data.avg_marketplace_fee_percent,

                "avg_promotional_cost_percent":
                    data.avg_promotional_cost_percent,

                "avg_packaging_cost_percent":
                    data.avg_packaging_cost_percent,

                "return_rate_percent":
                    data.return_rate_percent,

                "desired_min_margin_percent":
                    data.desired_min_margin_percent,

                "max_platform_cost_tolerated_percent":
                    data.max_platform_cost_tolerated_percent,

                "max_promotional_burden_percent":
                    data.max_promotional_burden_percent,

                "target_monthly_profit":
                    data.target_monthly_profit,

                "min_sustainable_living_income":
                    data.min_sustainable_living_income,

                "consumer_affordability_index":
                    data.consumer_affordability_index,

                "employee_fair_wage_compliant":
                    data.employee_fair_wage_compliant,

                "employee_count":
                    data.employee_count,

                "fair_wage_basis":
                    data.fair_wage_basis,

                "main_materials":
                    data.main_materials,

                "material_origin":
                    data.material_origin,

                "recycled_material_percent":
                    data.recycled_material_percent,

                "eco_packaging_adopted":
                    data.eco_packaging_adopted,

                "packaging_material":
                    data.packaging_material,

                "packaging_reusable":
                    data.packaging_reusable,

                "waste_management":
                    data.waste_management,

                "waste_description":
                    data.waste_description,

                "energy_source":
                    data.energy_source,

                "packaging_efficiency_score":
                    data.packaging_efficiency_score,

                "shipment_efficiency_score":
                    data.shipment_efficiency_score,

                "return_efficiency_score":
                    data.return_efficiency_score,

                "shipment_efficiency_score":
                    data.shipment_efficiency_score,

                "return_efficiency_score":
                    data.return_efficiency_score
            }
        )

        db.commit()


    except SQLAlchemyError as error:

        db.rollback()

        print(
            "ERROR UPDATE FINANCIAL PROFILE:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Gagal memperbarui financial profile"
        )


    # =====================================================
    # 4. AMBIL DATA TERBARU
    # =====================================================

    result_query = text("""
        SELECT *
        FROM financial_profiles
        WHERE business_id = :business_id
        LIMIT 1
    """)


    result = db.execute(
        result_query,
        {
            "business_id": business_id
        }
    ).mappings().first()


    # =====================================================
    # 5. RESPONSE
    # =====================================================

    return {

        "message":
            "Financial profile berhasil diperbarui",

        "business": {
            "id":
                business["id"],

            "business_name":
                business["business_name"]
        },

        "financial_profile":
            dict(result)
            if result
            else None
    }


# =========================================================
# API #16
# DELETE FINANCIAL PROFILE
# =========================================================

@router.delete("/{business_id}")
def delete_financial_profile(
    business_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =====================================================
    # 1. CEK KEPEMILIKAN
    # =====================================================

    business = check_business_ownership(
        business_id,
        current_user,
        db
    )


    # =====================================================
    # 2. CEK PROFILE
    # =====================================================

    check_query = text("""
        SELECT id
        FROM financial_profiles
        WHERE business_id = :business_id
        LIMIT 1
    """)


    financial = db.execute(
        check_query,
        {
            "business_id": business_id
        }
    ).mappings().first()


    if not financial:

        raise HTTPException(
            status_code=404,
            detail="Financial profile tidak ditemukan"
        )


    # =====================================================
    # 3. CEK PASSPORT
    #
    # Passport memiliki foreign key ke financial profile.
    # Jadi jangan izinkan delete kalau sudah digunakan.
    # =====================================================

    passport_query = text("""
        SELECT id
        FROM passports
        WHERE financial_profile_id = :financial_profile_id
        LIMIT 1
    """)


    passport = db.execute(
        passport_query,
        {
            "financial_profile_id":
                financial["id"]
        }
    ).mappings().first()


    if passport:

        raise HTTPException(
            status_code=409,
            detail=(
                "Financial profile tidak dapat dihapus "
                "karena sudah digunakan oleh Economic Passport"
            )
        )


    # =====================================================
    # 4. DELETE
    # =====================================================

    delete_query = text("""
        DELETE FROM financial_profiles
        WHERE business_id = :business_id
    """)


    try:

        db.execute(
            delete_query,
            {
                "business_id": business_id
            }
        )

        db.commit()


    except SQLAlchemyError as error:

        db.rollback()

        print(
            "ERROR DELETE FINANCIAL PROFILE:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Gagal menghapus financial profile"
        )


    # =====================================================
    # 5. RESPONSE
    # =====================================================

    return {

        "message":
            "Financial profile berhasil dihapus",

        "business": {
            "id":
                business["id"],

            "business_name":
                business["business_name"]
        }

    }