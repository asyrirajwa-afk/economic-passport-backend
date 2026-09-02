from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from pwdlib import PasswordHash
from jose import jwt

from app.database import get_db
from app.schemas.user import UserRegister


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

password_hash = PasswordHash.recommended()

SECRET_KEY = "economic-passport-development-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


@router.post("/register")
def register_user(
    user: UserRegister,
    db: Session = Depends(get_db)
):

    check_query = text("""
        SELECT id
        FROM users
        WHERE email = :email
        LIMIT 1
    """)

    existing_user = db.execute(
        check_query,
        {"email": user.email}
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email sudah terdaftar"
        )

    hashed_password = password_hash.hash(user.password)

    insert_query = text("""
        INSERT INTO users
        (
            email,
            password_hash,
            full_name,
            phone
        )
        VALUES
        (
            :email,
            :password_hash,
            :full_name,
            :phone
        )
    """)

    result = db.execute(
        insert_query,
        {
            "email": user.email,
            "password_hash": hashed_password,
            "full_name": user.full_name,
            "phone": user.phone
        }
    )

    db.commit()

    user_id = result.lastrowid

    return {
        "message": "Registrasi berhasil",
        "user": {
            "id": user_id,
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone
        }
    }


@router.post("/login")
def login_user(
    email: str,
    password: str,
    db: Session = Depends(get_db)
):

    query = text("""
        SELECT
            id,
            email,
            password_hash,
            full_name,
            phone
        FROM users
        WHERE email = :email
        LIMIT 1
    """)

    user = db.execute(
        query,
        {"email": email}
    ).mappings().first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Email atau password salah"
        )

    password_valid = password_hash.verify(
        password,
        user["password_hash"]
    )

    if not password_valid:
        raise HTTPException(
            status_code=401,
            detail="Email atau password salah"
        )

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    token_data = {
        "sub": str(user["id"]),
        "email": user["email"],
        "exp": expire
    }

    access_token = jwt.encode(
        token_data,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return {
        "message": "Login berhasil",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "phone": user["phone"]
        }
    }