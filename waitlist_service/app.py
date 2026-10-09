"""FastAPI service for trained waitlist probability inference."""

from __future__ import annotations

import logging
import os
from datetime import date, datetime
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from zoneinfo import ZoneInfo

import psycopg
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from ml.waitlist.predictor import InvalidFeatures, predict_confirmation


logger = logging.getLogger(__name__)
app = FastAPI(title="RailConnect Waitlist Predictor")


class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    train_id: int | None = Field(default=None, gt=0)
    journey_date: date | None = None
    travel_class: str | None = Field(default=None, min_length=1, max_length=10)
    current_waitlist: int | None = Field(default=None, ge=1)
    features: dict[str, Any] | None = None


class PredictionResponse(BaseModel):
    confirmation_probability: float
    prediction: str


class HistoricalFeaturesUnavailable(Exception):
    """Raised when database history cannot provide real model inputs."""


def prepare_features_from_database(
    train_id: int,
    journey_date: date,
    travel_class: str,
    current_waitlist: int | None = None,
) -> dict[str, Any]:
    """Prepare model inputs from the selected train and recorded bookings."""
    database_url = os.environ.get("DATABASE_URL", "").strip()
    if not database_url:
        raise HistoricalFeaturesUnavailable("Database connection is not configured")

    selected_class = travel_class.strip().upper()
    parsed_url = urlsplit(database_url)
    if parsed_url.scheme in {"postgres", "postgresql"}:
        query = [
            (key, value)
            for key, value in parse_qsl(parsed_url.query, keep_blank_values=True)
            if key.lower() != "pgbouncer"
        ]
        database_url = urlunsplit(parsed_url._replace(query=urlencode(query)))

    with psycopg.connect(database_url, connect_timeout=5) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT total_seats FROM trains WHERE id = %s",
                (train_id,),
            )
            train = cursor.fetchone()
            if train is None:
                raise HistoricalFeaturesUnavailable("Selected train was not found")
            total_seats = int(train[0])
            if total_seats <= 0:
                raise HistoricalFeaturesUnavailable("Selected train has no valid seat capacity")

            cursor.execute(
                """
                SELECT
                    COUNT(*)::int,
                    COALESCE(MAX(waitlist_position), 0)::int
                FROM bookings
                WHERE train_id = %s
                  AND journey_date = %s
                  AND UPPER(travel_class) = %s
                  AND booking_status = 'WAITLISTED'
                """,
                (train_id, journey_date.isoformat(), selected_class),
            )
            waitlist_count, max_waitlist_position = cursor.fetchone()
            waitlist_position = (
                current_waitlist
                if current_waitlist is not None
                else max(int(waitlist_count), int(max_waitlist_position)) + 1
            )

            cursor.execute(
                """
                SELECT
                    journey_date,
                    COUNT(*) FILTER (WHERE booking_status = 'CONFIRMED')::int,
                    COUNT(*) FILTER (WHERE booking_status = 'CANCELLED')::int
                FROM bookings
                WHERE train_id = %s
                  AND UPPER(travel_class) = %s
                  AND journey_date < %s
                  AND booking_status IN ('CONFIRMED', 'CANCELLED')
                GROUP BY journey_date
                ORDER BY journey_date
                """,
                (train_id, selected_class, journey_date.isoformat()),
            )
            train_history = cursor.fetchall()

            if train_history:
                history = [
                    (history_date, confirmed, cancelled, total_seats)
                    for history_date, confirmed, cancelled in train_history
                ]
            else:
                cursor.execute(
                    """
                    SELECT
                        booking.journey_date,
                        train.total_seats,
                        COUNT(*) FILTER (WHERE booking.booking_status = 'CONFIRMED')::int,
                        COUNT(*) FILTER (WHERE booking.booking_status = 'CANCELLED')::int
                    FROM bookings AS booking
                    JOIN trains AS train ON train.id = booking.train_id
                    WHERE UPPER(booking.travel_class) = %s
                      AND booking.journey_date < %s
                      AND booking.booking_status IN ('CONFIRMED', 'CANCELLED')
                    GROUP BY booking.train_id, booking.journey_date, train.total_seats
                    ORDER BY booking.journey_date
                    """,
                    (selected_class, journey_date.isoformat()),
                )
                history = [
                    (history_date, confirmed, cancelled, int(historical_total_seats))
                    for history_date, historical_total_seats, confirmed, cancelled in cursor.fetchall()
                ]

    if not history:
        raise HistoricalFeaturesUnavailable("No historical bookings are available for this travel class")

    total_historical_bookings = sum(confirmed + cancelled for _, confirmed, cancelled, _ in history)
    if total_historical_bookings <= 0:
        raise HistoricalFeaturesUnavailable("Historical booking totals are unavailable")

    historical_occupancy_rate = sum(
        min(confirmed / historical_total_seats, 1.0)
        for _, confirmed, _, historical_total_seats in history
    ) / len(history)
    cancelled_bookings = sum(cancelled for _, _, cancelled, _ in history)
    historical_cancellation_rate = cancelled_bookings / total_historical_bookings
    seats_released = sum(cancelled for _, _, cancelled, _ in history) / len(history)

    if historical_occupancy_rate >= 0.8:
        demand_level = "HIGH"
    elif historical_occupancy_rate >= 0.5:
        demand_level = "MEDIUM"
    else:
        demand_level = "LOW"

    today = datetime.now(ZoneInfo("Asia/Kolkata")).date()
    days_to_departure = (journey_date - today).days
    weekday = journey_date.strftime("%A")

    return {
        "days_to_departure": days_to_departure,
        "waitlist_position": waitlist_position,
        "total_seats": total_seats,
        "historical_occupancy_rate": historical_occupancy_rate,
        "historical_cancellation_rate": historical_cancellation_rate,
        "seats_released": seats_released,
        "travel_class": selected_class,
        "day_of_week": weekday,
        "is_weekend": weekday in {"Friday", "Saturday", "Sunday"},
        "demand_level": demand_level,
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "waitlist-predictor"}


@app.post("/", response_model=PredictionResponse)
def predict_waitlist(request: PredictionRequest) -> dict[str, Any]:
    try:
        if request.features is not None:
            features = request.features
        else:
            if request.train_id is None or request.journey_date is None or request.travel_class is None:
                raise HTTPException(
                    status_code=422,
                    detail="Provide either model features or train_id, journey_date, and travel_class",
                )
            features = prepare_features_from_database(
                request.train_id,
                request.journey_date,
                request.travel_class,
                request.current_waitlist,
            )
        return predict_confirmation(features)
    except InvalidFeatures as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except HistoricalFeaturesUnavailable as error:
        logger.info("Waitlist prediction unavailable: %s", error)
        raise HTTPException(
            status_code=503,
            detail=str(error),
        ) from error
    except FileNotFoundError as error:
        logger.error("Waitlist prediction model is unavailable")
        raise HTTPException(
            status_code=503,
            detail="Trained waitlist model is unavailable",
        ) from error
    except HTTPException:
        raise
    except psycopg.Error as error:
        logger.exception("Waitlist prediction database query failed")
        raise HTTPException(
            status_code=503,
            detail="Unable to read booking history from the database; check waitlist service logs",
        ) from error
    except (RuntimeError, ValueError) as error:
        logger.exception("Waitlist prediction failed")
        raise HTTPException(
            status_code=503,
            detail="Waitlist prediction failed; check waitlist service logs",
        ) from error
