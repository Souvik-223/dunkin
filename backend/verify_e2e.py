import urllib.request
import json

def test_fullstack():
    print("--- Testing Fullstack Application Endpoints ---")
    # 1. Healthcheck through frontend proxy
    with urllib.request.urlopen('http://localhost:5173/api/health/') as res:
        health = json.loads(res.read().decode())
        print("1. Proxy Healthcheck:", health)

    # 2. Presets
    with urllib.request.urlopen('http://localhost:5173/api/trips/presets/') as res:
        presets = json.loads(res.read().decode())
        print(f"2. Presets loaded: {len(presets['data'])} scenarios")

    # 3. Plan Trip: Chicago -> St. Louis -> Los Angeles (~2,000 miles)
    payload = json.dumps({
        'current_location': 'Chicago, IL',
        'pickup_location': 'St. Louis, MO',
        'dropoff_location': 'Los Angeles, CA',
        'current_cycle_used_hours': 15.0,
        'driver_name': 'Sarah Connor',
        'carrier_name': 'Spotter Enterprise Logistics',
        'truck_tractor_no': 'TRK-5050 / TRL-9090'
    }).encode('utf-8')

    req = urllib.request.Request(
        'http://localhost:5173/api/trips/plan/',
        data=payload,
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read().decode())
        result = data['data']
        summary = result['summary']
        print(f"3. Trip Planned Successfully!")
        print(f"   Total Miles: {summary['total_distance_miles']} mi")
        print(f"   Total Elapsed: {summary['total_duration_hours']} hrs ({summary['days_count']} days)")
        print(f"   Driving Time: {summary['total_driving_hours']} hrs")
        print(f"   Rest Time: {summary['total_rest_hours']} hrs")
        print(f"   Cycle Remaining: {summary['cycle_remaining_hours']} / 70.0 hrs")
        print(f"   Stops Scheduled: {len(result['stops'])}")
        for s in result['stops']:
            print(f"     - [{s['stop_type']}] at {s['location_name']} (Duration: {s['duration_hours']}h)")

        print(f"   ELD Log Sheets Generated: {len(result['log_sheets'])}")
        all_24_hours = True
        for sheet in result['log_sheets']:
            t = sheet['grid_data']['totals']
            sum_h = round(t['off_duty_hours'] + t['sleeper_berth_hours'] + t['driving_hours'] + t['on_duty_not_driving_hours'], 1)
            recap = sheet['recap']
            print(f"     * Day {sheet['day_number']} ({sheet['date']}): Off={t['off_duty_hours']}h, Sleep={t['sleeper_berth_hours']}h, Drive={t['driving_hours']}h, OnDuty={t['on_duty_not_driving_hours']}h => Total: {sum_h}h (Recap: OnDutyToday={recap['on_duty_hours_today']}h, AvailableTomorrow={recap['total_hours_available_tomorrow']}h)")
            if sum_h != 24.0:
                all_24_hours = False

        assert all_24_hours, "Every day must sum to exactly 24.0 hours"
        print("\nALL VERIFICATIONS PASSED PERFECTLY!")

if __name__ == '__main__':
    test_fullstack()
