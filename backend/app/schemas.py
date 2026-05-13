from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    company_name: str = ""


class UserLogin(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    company_name: str
    role: str = "admin"

    class Config:
        from_attributes = True


class UserSettings(BaseModel):
    company_name: str = ""
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ClientCreate(BaseModel):
    name: str
    email: str = ""
    phone: str = ""
    address: str = ""
    tin: str = ""


class ClientOut(ClientCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CategoryCreate(BaseModel):
    name: str
    type: str


class CategoryOut(CategoryCreate):
    id: int

    class Config:
        from_attributes = True


class TransactionCreate(BaseModel):
    type: str
    amount: float
    category_id: Optional[int] = None
    description: str = ""
    date: date
    client_id: Optional[int] = None


class TransactionOut(TransactionCreate):
    id: int
    is_imported: Optional[bool] = None
    created_at: datetime

    class Config:
        from_attributes = True


class InvoiceItemCreate(BaseModel):
    description: str
    quantity: float = 1
    unit_price: float = 0


class InvoiceCreate(BaseModel):
    client_id: int
    issue_date: date
    due_date: date
    notes: str = ""
    items: list[InvoiceItemCreate]


class InvoiceOut(BaseModel):
    id: int
    client_id: int
    invoice_number: str
    status: str
    total_amount: float
    issue_date: date
    due_date: date
    notes: str
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentOut(BaseModel):
    id: int
    original_name: str
    file_size: int
    mime_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardData(BaseModel):
    total_income: float
    total_expense: float
    balance: float
    income_by_category: list[dict]
    expense_by_category: list[dict]
    recent_transactions: list[TransactionOut]
