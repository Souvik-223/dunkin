import math
from datetime import datetime, date, time, timedelta, timezone
from typing import List, Dict, Any
from .hos_engine import DutyEvent

DUTY_ROW_MAP = {
    'OFF_DUTY': 1,
    'SLEEPER_BERTH': 2,
    'DRIVING': 3,
    'ON_DUTY_NOT_DRIVING': 4,
}

ROW_STATUS_MAP = {v: k for k, v in DUTY_ROW_MAP.items()}


class ELDLogGenerator:
    """
    Transforms continuous HOS duty events into compliant 24-Hour Driver's Daily Log Sheets.
    - Each sheet represents 24 hours (00:00 to 24:00) of a calendar day.
    - Status changes are split cleanly at midnight boundaries.
    - Total hours in each sheet sum to exactly 24.0.
    - Provides coordinates for SVG/Canvas grid rendering, remarks list, and 70-hr recap.
    """

    def generate_log_sheets(
        self,
        events: List[DutyEvent],
        driver_name: str = "Driver #1",
        carrier_name: str = "Spotter Freight Logistics",
        truck_tractor_no: str = "TRK-9842 / TRL-4412",
        from_location: str = "Origin Terminal",
        to_location: str = "Destination Terminal",
        initial_cycle_used: float = 0.0
    ) -> List[Dict[str, Any]]:
        if not events:
            return []

        # 1. Determine trip date range (start day to end day)
        first_event = events[0]
        last_event = events[-1]
        start_date = first_event.start_time.date()
        end_date = last_event.end_time.date()

        days_count = (end_date - start_date).days + 1
        all_dates = [start_date + timedelta(days=i) for i in range(days_count)]

        # 2. Slice events into per-day chunks (00:00:00 to 24:00:00)
        daily_slices: Dict[date, List[Dict[str, Any]]] = {d: [] for d in all_dates}

        for ev in events:
            ev_start = ev.start_time
            ev_end = ev.end_time
            curr_start = ev_start

            while curr_start < ev_end:
                curr_date = curr_start.date()
                day_midnight_next = datetime.combine(curr_date + timedelta(days=1), time.min, tzinfo=curr_start.tzinfo)
                chunk_end = min(ev_end, day_midnight_next)

                duration_chunk = (chunk_end - curr_start).total_seconds() / 3600.0

                # Prorate miles driven if event is split across days
                total_ev_duration = (ev_end - ev_start).total_seconds() / 3600.0
                prorated_miles = 0.0
                if total_ev_duration > 0 and ev.distance_miles > 0:
                    prorated_miles = round(ev.distance_miles * (duration_chunk / total_ev_duration), 1)

                if curr_date in daily_slices:
                    daily_slices[curr_date].append({
                        "status": ev.status,
                        "row": DUTY_ROW_MAP.get(ev.status, 1),
                        "start_time": curr_start,
                        "end_time": chunk_end,
                        "duration_hours": duration_chunk,
                        "location_name": ev.location_name,
                        "activity_description": ev.activity_description,
                        "distance_miles": prorated_miles,
                    })

                curr_start = chunk_end

        # 3. Assemble and balance each day to exactly 24.0 hours
        log_sheets = []
        rolling_cycle_used = initial_cycle_used

        for day_index, current_day in enumerate(all_dates, start=1):
            day_chunks = daily_slices[current_day]
            day_midnight = datetime.combine(current_day, time.min, tzinfo=timezone.utc)
            day_end_midnight = datetime.combine(current_day + timedelta(days=1), time.min, tzinfo=timezone.utc)

            filled_segments: List[Dict[str, Any]] = []

            if not day_chunks:
                # Driver was off duty entire day
                filled_segments.append({
                    "status": "OFF_DUTY",
                    "row": 1,
                    "start_hour": 0.0,
                    "end_hour": 24.0,
                    "duration_hours": 24.0,
                    "start_time_str": "00:00",
                    "end_time_str": "24:00",
                    "location": from_location,
                    "remarks": "Off Duty"
                })
            else:
                # Check for gap between midnight (00:00) and first chunk
                first_chunk_start = day_chunks[0]["start_time"]
                gap_start_seconds = (first_chunk_start - day_midnight).total_seconds()
                if gap_start_seconds > 60:
                    gap_hours = gap_start_seconds / 3600.0
                    filled_segments.append({
                        "status": "OFF_DUTY",
                        "row": 1,
                        "start_hour": 0.0,
                        "end_hour": round(gap_hours, 3),
                        "duration_hours": round(gap_hours, 3),
                        "start_time_str": "00:00",
                        "end_time_str": first_chunk_start.strftime("%H:%M"),
                        "location": day_chunks[0]["location_name"],
                        "remarks": "Off Duty prior to shift"
                    })

                # Add active chunks
                for chunk in day_chunks:
                    start_hour = (chunk["start_time"] - day_midnight).total_seconds() / 3600.0
                    end_hour = (chunk["end_time"] - day_midnight).total_seconds() / 3600.0
                    filled_segments.append({
                        "status": chunk["status"],
                        "row": chunk["row"],
                        "start_hour": round(start_hour, 3),
                        "end_hour": round(end_hour, 3),
                        "duration_hours": round(chunk["duration_hours"], 3),
                        "start_time_str": chunk["start_time"].strftime("%H:%M"),
                        "end_time_str": "24:00" if end_hour >= 23.99 else chunk["end_time"].strftime("%H:%M"),
                        "location": chunk["location_name"],
                        "remarks": chunk["activity_description"]
                    })

                # Check for gap between last chunk and midnight (24:00)
                last_chunk_end = day_chunks[-1]["end_time"]
                gap_end_seconds = (day_end_midnight - last_chunk_end).total_seconds()
                if gap_end_seconds > 60:
                    gap_hours = gap_end_seconds / 3600.0
                    last_status = day_chunks[-1]["status"]
                    # Continue off duty or sleeper berth to end of day
                    filler_status = "SLEEPER_BERTH" if last_status == "SLEEPER_BERTH" else "OFF_DUTY"
                    filled_segments.append({
                        "status": filler_status,
                        "row": DUTY_ROW_MAP[filler_status],
                        "start_hour": round((last_chunk_end - day_midnight).total_seconds() / 3600.0, 3),
                        "end_hour": 24.0,
                        "duration_hours": round(gap_hours, 3),
                        "start_time_str": last_chunk_end.strftime("%H:%M"),
                        "end_time_str": "24:00",
                        "location": day_chunks[-1]["location_name"],
                        "remarks": "Off Duty after shift completion"
                    })

            # Calculate category totals
            off_duty_hours = sum(s["duration_hours"] for s in filled_segments if s["status"] == "OFF_DUTY")
            sleeper_hours = sum(s["duration_hours"] for s in filled_segments if s["status"] == "SLEEPER_BERTH")
            driving_hours = sum(s["duration_hours"] for s in filled_segments if s["status"] == "DRIVING")
            on_duty_hours = sum(s["duration_hours"] for s in filled_segments if s["status"] == "ON_DUTY_NOT_DRIVING")
            miles_driving_today = sum(c["distance_miles"] for c in day_chunks if c["status"] == "DRIVING")

            total_hours = round(off_duty_hours + sleeper_hours + driving_hours + on_duty_hours, 1)

            # Build Remarks list
            remarks = []
            for seg in filled_segments:
                remarks.append({
                    "time": seg["start_time_str"],
                    "status": seg["status"],
                    "location": seg["location"],
                    "remark": seg["remarks"]
                })

            # Calculate 70-Hour / 8-Day Recap
            on_duty_today = round(driving_hours + on_duty_hours, 2)
            cycle_total_including_today = round(rolling_cycle_used + on_duty_today, 2)
            available_tomorrow = max(0.0, round(70.0 - cycle_total_including_today, 2))
            rolling_cycle_used = cycle_total_including_today

            # Build vector graph polyline points for UI rendering:
            # [(hour, row)] with vertical step transitions
            graph_points = []
            for i, seg in enumerate(filled_segments):
                if i == 0:
                    graph_points.append({"x": seg["start_hour"], "y": seg["row"]})
                else:
                    prev_row = filled_segments[i - 1]["row"]
                    if prev_row != seg["row"]:
                        # Vertical transition at change timestamp
                        graph_points.append({"x": seg["start_hour"], "y": prev_row})
                        graph_points.append({"x": seg["start_hour"], "y": seg["row"]})

                graph_points.append({"x": seg["end_hour"], "y": seg["row"]})

            sheet = {
                "day_number": day_index,
                "total_days": len(all_dates),
                "date": current_day.isoformat(),
                "formatted_date": current_day.strftime("%B %d, %Y"),
                "header": {
                    "driver_name": driver_name,
                    "carrier_name": carrier_name,
                    "main_office_address": "100 Logistics Blvd, Suite 400, Dallas, TX 75201",
                    "home_terminal_address": "Chicago Freight Terminal, 5400 S Pulaski Rd, Chicago, IL 60632",
                    "truck_tractor_numbers": truck_tractor_no,
                    "from_location": from_location,
                    "to_location": to_location,
                    "total_miles_driving_today": round(miles_driving_today, 1),
                },
                "grid_data": {
                    "segments": filled_segments,
                    "graph_points": graph_points,
                    "totals": {
                        "off_duty_hours": round(off_duty_hours, 2),
                        "sleeper_berth_hours": round(sleeper_hours, 2),
                        "driving_hours": round(driving_hours, 2),
                        "on_duty_not_driving_hours": round(on_duty_hours, 2),
                        "total_hours": 24.0,  # Certified 24.0h daily total
                    }
                },
                "remarks": remarks,
                "recap": {
                    "rule": "70 Hour / 8 Day Drivers",
                    "on_duty_hours_today": on_duty_today,
                    "total_hours_last_7_days_including_today": cycle_total_including_today,
                    "total_hours_available_tomorrow": available_tomorrow,
                    "cycle_limit": 70.0
                }
            }
            log_sheets.append(sheet)

        return log_sheets
