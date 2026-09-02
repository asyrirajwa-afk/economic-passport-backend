from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import text


SECRET_KEY = "economic-passport-development-secret-key"
ALGORITHM = "HS256"

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Token tidak valid"
            )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Token tidak valid atau sudah kedaluwarsa"
        )

    query = text("""
        SELECT
            id,
            email,
            full_name,
            phone
        FROM users
        WHERE id = :user_id
        LIMIT 1
    """)

    user = db.execute(
        query,
        {"user_id": int(user_id)}
    ).mappings().first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User tidak ditemukan"
        )

    return user