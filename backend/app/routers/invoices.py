from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Invoice, InvoiceItem
from app.schemas import InvoiceCreate, InvoiceOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/invoices", tags=["invoices"])


def generate_invoice_number(db: Session, user_id: int) -> str:
    # Используем MAX(id) вместо COUNT, чтобы избежать дублирования при удалении счетов
    max_id = db.query(func.max(Invoice.id)).scalar() or 0
    return f"INV-{user_id:04d}-{max_id + 1:05d}"


@router.get("", response_model=list[InvoiceOut])
def list_invoices(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return (
        db.query(Invoice)
        .filter(Invoice.user_id == user.id)
        .order_by(Invoice.created_at.desc())
        .all()
    )


@router.post("", response_model=InvoiceOut)
def create_invoice(data: InvoiceCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    total = sum(item.quantity * item.unit_price for item in data.items)
    invoice = Invoice(
        user_id=user.id,
        client_id=data.client_id,
        invoice_number=generate_invoice_number(db, user.id),
        issue_date=data.issue_date,
        due_date=data.due_date,
        notes=data.notes,
        total_amount=total,
    )
    db.add(invoice)
    db.flush()
    for item in data.items:
        amount = item.quantity * item.unit_price
        db.add(InvoiceItem(
            invoice_id=invoice.id,
            description=item.description,
            quantity=item.quantity,
            unit_price=item.unit_price,
            amount=amount,
        ))
    db.commit()
    db.refresh(invoice)
    return invoice


@router.patch("/{inv_id}/status")
def update_status(inv_id: int, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    valid_statuses = {"draft", "sent", "paid", "cancelled"}
    status = body.get("status", "")
    if status not in valid_statuses:
        raise HTTPException(status_code=422, detail=f"Status must be one of: {', '.join(valid_statuses)}")
    inv = db.query(Invoice).filter(Invoice.id == inv_id, Invoice.user_id == user.id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    inv.status = status
    db.commit()
    return {"ok": True}


@router.delete("/{inv_id}")
def delete_invoice(inv_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inv = db.query(Invoice).filter(Invoice.id == inv_id, Invoice.user_id == user.id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    db.delete(inv)
    db.commit()
    return {"ok": True}
