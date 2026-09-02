from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import test_database_connection
from app.routers.marketplaces import router as marketplace_router
from app.routers.businesses import router as business_router
from app.routers.auth import router as auth_router
from app.routers.financial import router as financial_router
from app.routers.scores import router as score_router
from app.routers.passport import router as passport_router
from app.routers.recommendations import router as recommendation_router
from app.routers.passport_history import router as passport_history_router
from app.routers.passport_summary import router as passport_summary_router
from app.routers.dashboard import router as dashboard_router



app = FastAPI(
    
    title="Economic Passport API",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "Economic Passport API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.get("/test-db")
def test_db():
    result = test_database_connection()

    return {
        "database": "connected",
        "test": result
    }


app.include_router(marketplace_router)
app.include_router(business_router)
app.include_router(auth_router)
app.include_router(financial_router)
app.include_router(score_router)
app.include_router(passport_router)
app.include_router(recommendation_router)
app.include_router(passport_history_router)
app.include_router(passport_summary_router)
app.include_router(dashboard_router)