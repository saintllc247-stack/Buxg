from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Category
from app.schemas import UserRegister, UserLogin, Token, UserOut, UserSettings
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

DEFAULT_CATEGORIES = {
    "income": ["Продажи", "Услуги", "Консультации", "Аренда", "Прочие доходы"],
    "expense": ["Аренда", "Зарплата", "Налоги", "Реклама", "Интернет/Связь", "Офис", "Транспорт", "Прочие расходы"],
}


@router.post("/register", response_model=Token)
def register(data: UserRegister, db: Session = Depends(get_db)):
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Пароль должен быть не менее 6 символов")
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    user = User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
        company_name=data.company_name,
    )
    db.add(user)
    db.flush()
    for typ, names in DEFAULT_CATEGORIES.items():
        for name in names:
            db.add(Category(user_id=user.id, name=name, type=typ))
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)


@router.put("/settings")
def update_settings(data: UserSettings, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    for k, v in data.model_dump().items():
        setattr(user, k, v)
    db.commit()
    return {"ok": True}


@router.get("/settings", response_model=UserSettings)
def get_settings(user: User = Depends(get_current_user)):
    return UserSettings(
        company_name=user.company_name,
        smtp_host=user.smtp_host,
        smtp_port=user.smtp_port,
        smtp_user=user.smtp_user,
        smtp_password=user.smtp_password,
    )


@router.post("/change-password")
def change_password(data: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    old = data.get("old_password", "").strip()
    new = data.get("new_password", "").strip()
    if not old or not new:
        raise HTTPException(400, "old_password and new_password required")
    if len(new) < 6:
        raise HTTPException(400, "New password must be at least 6 characters")
    if not verify_password(old, user.password_hash):
        raise HTTPException(400, "Current password is incorrect")
    user.password_hash = hash_password(new)
    db.commit()
    return {"ok": True}


@router.post("/send-invoice/{inv_id}")
def send_invoice(inv_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    import smtplib
    from email.message import EmailMessage
    from app.models import Invoice, Client

    inv = db.query(Invoice).filter(Invoice.id == inv_id, Invoice.user_id == user.id).first()
    if not inv:
        raise HTTPException(404, "Invoice not found")
    if not user.smtp_host:
        raise HTTPException(400, "SMTP not configured")

    client = db.query(Client).filter(Client.id == inv.client_id).first()
    if not client or not client.email:
        raise HTTPException(400, "Client has no email")

    msg = EmailMessage()
    msg.set_content(f"Здравствуйте!\n\nСчёт №{inv.invoice_number} на сумму {inv.total_amount} сум.\nСтатус: {'Оплачен' if inv.status == 'paid' else 'Отправлен' if inv.status == 'sent' else 'Черновик'}\n\nС уважением, {user.company_name or user.username}")
    msg["Subject"] = f"Счёт №{inv.invoice_number} от {user.company_name or user.username}"
    msg["From"] = user.smtp_user
    msg["To"] = client.email

    try:
        with smtplib.SMTP(user.smtp_host, user.smtp_port, timeout=10) as server:
            server.starttls()
            server.login(user.smtp_user, user.smtp_password)
            server.send_message(msg)
    except Exception as e:
        raise HTTPException(500, f"Email error: {e}")

    inv.status = "sent"
    db.commit()
    return {"ok": True, "message": f"Invoice sent to {client.email}"}
