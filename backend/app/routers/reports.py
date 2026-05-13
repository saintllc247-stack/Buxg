from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Transaction, Category
from app.auth import get_current_user
from app.schemas import DashboardData

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/dashboard", response_model=DashboardData)
def dashboard(
    from_date: date = Query(None, alias="from"),
    to_date: date = Query(None, alias="to"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Базовый фильтр для всех запросов
    def base_q():
        q = db.query(Transaction).filter(Transaction.user_id == user.id)
        if from_date:
            q = q.filter(Transaction.date >= from_date)
        if to_date:
            q = q.filter(Transaction.date <= to_date)
        return q

    # БАГ-ФИКС: раньше q фильтровался дважды (и по датам, и по типу на уже отфильтрованном запросе)
    # Теперь каждый подзапрос строится заново от base_q()
    total_income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user.id,
        Transaction.type == "income",
        *(([Transaction.date >= from_date]) if from_date else []),
        *(([Transaction.date <= to_date]) if to_date else []),
    ).scalar() or 0.0

    total_expense = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user.id,
        Transaction.type == "expense",
        *(([Transaction.date >= from_date]) if from_date else []),
        *(([Transaction.date <= to_date]) if to_date else []),
    ).scalar() or 0.0

    categories = db.query(Category).filter(Category.user_id == user.id).all()
    cat_map = {c.id: c.name for c in categories}

    income_by_cat = base_q().filter(Transaction.type == "income").with_entities(
        Transaction.category_id, func.sum(Transaction.amount)
    ).group_by(Transaction.category_id).all()

    expense_by_cat = base_q().filter(Transaction.type == "expense").with_entities(
        Transaction.category_id, func.sum(Transaction.amount)
    ).group_by(Transaction.category_id).all()

    recent = base_q().order_by(Transaction.date.desc()).limit(10).all()

    return DashboardData(
        total_income=float(total_income),
        total_expense=float(total_expense),
        balance=float(total_income) - float(total_expense),
        income_by_category=[{"name": cat_map.get(cid, "Без категории"), "amount": float(amt)} for cid, amt in income_by_cat],
        expense_by_category=[{"name": cat_map.get(cid, "Без категории"), "amount": float(amt)} for cid, amt in expense_by_cat],
        recent_transactions=recent,
    )
