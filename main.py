
from datetime import date
from decimal import Decimal

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Column, Integer, String, Date, Numeric, UniqueConstraint,select, update
from sqlalchemy.orm import Session
from database import Base, engine, SessionLocal


# Database table
class Medicine(Base):
    __tablename__ = "medicines"

    __table_args__ = (
        UniqueConstraint("name", "batch_no", name="unique_medicine_batch"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    batch_no = Column(String(100), nullable=False)
    tablets_per_strip = Column(Integer, nullable=False)
    strips_in_stock = Column(Integer, nullable=False, default=0)
    loose_tablets = Column(Integer, nullable=False, default=0)
    strip_price = Column(Numeric(10, 2), nullable=False)
    strip_discount = Column(Numeric(5, 2), nullable=False, default=0)
    tablet_discount = Column(Numeric(5, 2), nullable=False, default=0)
    expiry = Column(Date, nullable=False)


# Create the table if missing
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Medicine Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Request and response format
class MedicineInput(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    batch_no: str = Field(min_length=1, max_length=100)
    tablets_per_strip: int = Field(ge=1)
    strips_in_stock: int = Field(ge=0)
    loose_tablets: int = Field(ge=0)
    strip_price: Decimal = Field(gt=0)
    strip_discount: Decimal = Field(ge=0, le=100)
    tablet_discount: Decimal = Field(ge=0, le=100)
    expiry: date


class MedicineOutput(MedicineInput):
    id: int
    model_config = ConfigDict(from_attributes=True)


@app.get("/")
def home():
    return {"message": "Medicine Management API is running"}


@app.get("/api/medicines", response_model=list[MedicineOutput])
def get_medicines(db: Session = Depends(get_db)):
    return db.query(Medicine).order_by(Medicine.id).all()


@app.post("/api/medicines", response_model=MedicineOutput, status_code=201)
def add_medicine(data: MedicineInput, db: Session = Depends(get_db)):
    if data.loose_tablets >= data.tablets_per_strip:
        raise HTTPException(
            status_code=400,
            detail="Loose tablets must be fewer than tablets per strip."
        )

    existing = db.query(Medicine).filter(
        Medicine.name == data.name.strip(),
        Medicine.batch_no == data.batch_no.strip()
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="This medicine name and batch number already exist."
        )

    medicine = Medicine(
        **data.model_dump(exclude={"name", "batch_no"}),
        name=data.name.strip(),
        batch_no=data.batch_no.strip()
    )
    db.add(medicine)

    try:
        db.commit()
        db.refresh(medicine)
        return medicine
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not save medicine.")


@app.put("/api/medicines/{medicine_id}", response_model=MedicineOutput)
def update_medicine(
    medicine_id: int,
    data: MedicineInput,
    db: Session = Depends(get_db)
):
    medicine = db.query(Medicine).filter(
        Medicine.id == medicine_id
    ).first()

    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found.")

    if data.loose_tablets >= data.tablets_per_strip:
        raise HTTPException(
            status_code=400,
            detail="Loose tablets must be fewer than tablets per strip."
        )

    duplicate = db.query(Medicine).filter(
        Medicine.name == data.name.strip(),
        Medicine.batch_no == data.batch_no.strip(),
        Medicine.id != medicine_id
    ).first()

    if duplicate:
        raise HTTPException(
            status_code=409,
            detail="Another batch already uses this name and batch number."
        )

    for key, value in data.model_dump().items():
        setattr(medicine, key, value)

    medicine.name = data.name.strip()
    medicine.batch_no = data.batch_no.strip()

    try:
        db.commit()
        db.refresh(medicine)
        return medicine
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not update medicine.")


@app.delete("/api/medicines/{medicine_id}")
def delete_medicine(medicine_id: int, db: Session = Depends(get_db)):
    medicine = db.query(Medicine).filter(
        Medicine.id == medicine_id
    ).first()

    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found.")

    db.delete(medicine)
    db.commit()
    return {"message": "Medicine deleted successfully"}



class SaleItem(BaseModel):
    medicine_id: int
    tablets_sold: int = Field(gt=0)


class SaleRequest(BaseModel):
    items: list[SaleItem] = Field(min_length=1)


@app.post("/api/sales")
def complete_sale(
    sale: SaleRequest,
    db: Session = Depends(get_db)
):
    today = date.today()

    # Combine duplicate entries for the same medicine.
    quantities = {}
    for item in sale.items:
        quantities[item.medicine_id] = (
            quantities.get(item.medicine_id, 0) + item.tablets_sold
        )

    try:
        # Lock records while checking and deducting stock.
        for medicine_id in sorted(quantities):
            medicine = db.execute(
                select(Medicine)
                .where(Medicine.id == medicine_id)
                .with_for_update()
            ).scalar_one_or_none()

            if medicine is None:
                raise HTTPException(
                    status_code=404,
                    detail="Medicine not found."
                )

            if medicine.expiry < today:
                raise HTTPException(
                    status_code=400,
                    detail=f"{medicine.name} is expired."
                )

            available = (
                medicine.strips_in_stock * medicine.tablets_per_strip
                + medicine.loose_tablets
            )
            sold = quantities[medicine_id]

            if sold > available:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for {medicine.name}."
                )

            remaining = available - sold
            medicine.strips_in_stock = (
                remaining // medicine.tablets_per_strip
            )
            medicine.loose_tablets = (
                remaining % medicine.tablets_per_strip
            )

        db.commit()
        return {"message": "Sale completed and stock saved successfully."}

    except Exception:
        db.rollback()
        raise
