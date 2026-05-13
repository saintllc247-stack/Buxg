from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Client
from app.schemas import ClientCreate, ClientOut
from app.auth import get_current_user


class BulkDeleteRequest(BaseModel):
    ids: list[int]

router = APIRouter(prefix="/api/clients", tags=["clients"])


@router.get("", response_model=list[ClientOut])
def list_clients(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Client).filter(Client.user_id == user.id).all()


@router.post("", response_model=ClientOut)
def create_client(data: ClientCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    client = Client(user_id=user.id, **data.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


@router.put("/{client_id}", response_model=ClientOut)
def update_client(client_id: int, data: ClientCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == client_id, Client.user_id == user.id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    for k, v in data.model_dump().items():
        setattr(client, k, v)
    db.commit()
    db.refresh(client)
    return client


@router.delete("/{client_id}")
def delete_client(client_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == client_id, Client.user_id == user.id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    db.delete(client)
    db.commit()
    return {"ok": True}


@router.post("/bulk-delete")
def bulk_delete_clients(data: BulkDeleteRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    deleted = db.query(Client).filter(Client.id.in_(data.ids), Client.user_id == user.id).delete(synchronize_session=False)
    db.commit()
    return {"deleted": deleted}
