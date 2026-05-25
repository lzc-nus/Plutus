from fastapi import APIRouter, Depends
from sqlmodel import Session, select
import datetime
from ..core.database import get_db, FinancialEvent

router = APIRouter(prefix="/api/calendar", tags=['Calendar Engine'])

@router.get('/')
def get_calendar_events(start_view: datetime.date, end_view: datetime.date, db: Session = Depends(get_db)):
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
                    "title": item.description,
                    'amount': item.amount,
                    'category': item.category,
                    'date': current_check.isoformat()
                })

            elif item.frequency == 'WEEKLY' and current_check.weekday() == item.day_of_week:
                calendar_feed.append({
                    "title": item.description,
                    'amount': item.amount,
                    'category': item.category,
                    'date': current_check.isoformat()
                })

            current_check += datetime.timedelta(days=1)

    return calendar_feed