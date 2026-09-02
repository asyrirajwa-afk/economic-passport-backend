from pydantic import BaseModel, Field


class BusinessCreate(BaseModel):
    business_name: str = Field(min_length=2, max_length=200)
    business_category: str = Field(min_length=2, max_length=150)
    business_size: str = "MICRO"
    product_category: str | None = None
    primary_marketplace: str | None = None
    seller_city: str | None = None