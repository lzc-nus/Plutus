import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..db.database import get_db, FinancialEvent
from ..schemas.calendar import FinancialEventCreate, FinancialEventResponse, FinancialEventUpdate

router = APIRouter(prefix="/api/calendar", tags=['Calendar Engine'])

@router.get('/')
def get_calendar_events(start_view: datetime.date, end_view: datetime.date, db: Session = Depends(get_db)):
    try:
        # Pull all recurring financial templates active during this window
        templates = db.exec(select(FinancialEvent)).all()
        calendar_feed = []

        for item in templates:
            current_check = max(item.start_date, start_view)
            limit = min(item.end_date if item.end_date else end_view, end_view)

            while current_check <= limit:
                # Match monthly schedules
                if item.frequency == 'MONTHLY' and current_check.day == item.day_of_month:
                    calendar_feed.append({
                        'id': str(item.id),
                        "title": item.description,
                        'amount': item.amount,
                        'category': item.category,
                        'date': current_check.isoformat()
                    })

                elif item.frequency == 'WEEKLY' and current_check.weekday() == item.day_of_week:
                    calendar_feed.append({
                        'id': str(item.id),
                        "title": item.description,
                        'amount': item.amount,
                        'category': item.category,
                        'date': current_check.isoformat()
                    })

                current_check += datetime.timedelta(days=1)

        return calendar_feed
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calendar projection failed: {str(e)}")
    
@router.post('/events', response_model=FinancialEventResponse, status_code=status.HTTP_201_CREATED)
def create_financial_event(event_in: FinancialEventCreate, db: Session = Depends(get_db)):
    # Convert Pydantic validated date into SQLModel entity instance
    db_event = FinancialEvent.model_validate(event_in)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_financial_event(event_id: uuid.UUID, db: Session = Depends(get_db)):
    db_event = db.get(FinancialEvent, event_id)
    if not db_event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Financial event template with ID {event_id} not found."
        )
    db.delete(db_event)
    db.commit()
    return None # Returns an empty body with a 204 status header

@router.patch('/events/{event_id}', response_model=FinancialEventResponse)
def update_financial_event(
    event_id: uuid.UUID,
    event_update: FinancialEventUpdate,
    db: Session = Depends(get_db)
):
    db_event = db.get(FinancialEvent, event_id)
    if not db_event:
        raise HTTPException(
            status_code=404,
            detail=f"Financial event template with ID {event_id} not found."
        )
    
    update_date = event_update.model_dump(exclude_unset=True)

    for key, value in update_date.items():
        setattr(db_event, key, value)

    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event