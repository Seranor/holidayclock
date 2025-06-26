import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import axios from 'axios'
import moment from 'moment-timezone'

const app = new Hono()

// Get US holidays from Nager.Date API
async function getUSHolidays(year) {
  try {
    const response = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/US`)
    return response.data
  } catch (error) {
    console.error('Failed to fetch holiday data:', error.message)
    return []
  }
}

// Calculate countdown to weekend
function getWeekendCountdown() {
  const now = moment()
  const currentDay = now.day() // 0 = Sunday, 6 = Saturday
  const daysToWeekend = currentDay === 0 || currentDay === 6 ? 0 : 6 - currentDay
  if (daysToWeekend === 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }
  const weekendStart = moment().endOf('week').startOf('day')
  const diff = moment.duration(weekendStart.diff(now))
  return {
    days: Math.floor(diff.asDays()),
    hours: diff.hours(),
    minutes: diff.minutes(),
    seconds: diff.seconds()
  }
}

// Calculate countdown to a specific holiday
function getHolidayCountdown(holidayDate, holidayName, vacationDays = 0) {
  const now = moment()
  const holiday = moment(holidayDate)
  if (holiday.isBefore(now)) {
    holiday.add(1, 'year')
  }
  const diff = moment.duration(holiday.diff(now))
  return {
    name: holidayName,
    days: Math.floor(diff.asDays()),
    hours: diff.hours(),
    minutes: diff.minutes(),
    seconds: diff.seconds(),
    vacationDays: vacationDays
  }
}

// Root route - serve HTML
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Holiday Clock</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }
        .container {
            width: 100%;
            max-width: 800px;
            padding: 20px;
        }
        .clock-card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .current-time {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 2px solid #f0f0f0;
        }
        .time-display {
            font-size: 4rem;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
            font-family: 'Courier New', monospace;
        }
        .timezone-info {
            font-size: 1.2rem;
            color: #7f8c8d;
            font-weight: 500;
        }
        .countdown-section {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        .countdown-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 12px;
            border-left: 4px solid #667eea;
            transition: all 0.3s ease;
        }
        .countdown-label {
            font-size: 1.1rem;
            font-weight: 600;
            color: #495057;
            flex: 1;
        }
        .countdown-value {
            font-size: 1.2rem;
            font-weight: 700;
            color: #2c3e50;
            font-family: 'Courier New', monospace;
            text-align: right;
            flex: 1;
        }
        @media (max-width: 768px) {
            .container { padding: 4px; }
            .clock-card { padding: 8px; }
            .time-display { font-size: 2rem; }
            .countdown-item { flex-direction: column; align-items: flex-start; gap: 6px; }
            .countdown-value { text-align: left; font-size: 1rem; }
        }
    </style>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-6W5KJJKMLT"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-6W5KJJKMLT');
    </script>
</head>
<body>
    <div class="container">
        <div class="clock-card">
            <div class="current-time">
                <div class="time-display" id="currentTime">--:--:--</div>
                <div class="timezone-info" id="timezoneInfo">Timezone Info</div>
            </div>
            
            <div class="countdown-section">
                <div class="countdown-item">
                    <div class="countdown-label">Time until weekend:</div>
                    <div class="countdown-value" id="weekendCountdown">-- days -- hours -- minutes -- seconds</div>
                </div>
                
                <div class="countdown-item">
                    <div class="countdown-label">Time until next public holiday <span id="nearestHolidayName"></span></div>
                    <div class="countdown-value" id="nearestHoliday">-- days -- hours -- minutes -- seconds (-- days vacation)</div>
                </div>
                
                <div class="countdown-item">
                    <div class="countdown-label">Time until Thanksgiving:</div>
                    <div class="countdown-value" id="thanksgivingCountdown">-- days -- hours -- minutes -- seconds (-- days vacation)</div>
                </div>
                
                <div class="countdown-item">
                    <div class="countdown-label">Time until Christmas:</div>
                    <div class="countdown-value" id="christmasCountdown">-- days -- hours -- minutes -- seconds (-- days vacation)</div>
                </div>
                
                <div class="countdown-item">
                    <div class="countdown-label">Time until New Year:</div>
                    <div class="countdown-value" id="newYearCountdown">-- days -- hours -- minutes -- seconds (-- days vacation)</div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let countdownState = {
            weekend: null,
            nearestHoliday: null,
            thanksgiving: null,
            christmas: null,
            newYear: null
        };

        function formatCountdown(countdown) {
            if (!countdown) return '-- days -- hours -- minutes -- seconds';
            const { days, hours, minutes, seconds } = countdown;
            return \`\${days} days \${hours} hours \${minutes} minutes \${seconds} seconds\`;
        }

        function formatHolidayCountdown(countdown) {
            if (!countdown) return '-- days -- hours -- minutes -- seconds (-- days vacation)';
            const { days, hours, minutes, seconds, vacationDays } = countdown;
            return \`\${days} days \${hours} hours \${minutes} minutes \${seconds} seconds (\${vacationDays} days vacation)\`;
        }

        function updateCurrentTime() {
            const now = new Date();
            const dateString = now.toLocaleDateString('en-US');
            const timeString = now.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            document.getElementById('currentTime').textContent = \`\${dateString} \${timeString}\`;
        }

        function getUserTimezone() {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const offset = new Date().getTimezoneOffset();
            const offsetHours = Math.abs(Math.floor(offset / 60));
            const offsetMinutes = Math.abs(offset % 60);
            const sign = offset <= 0 ? '+' : '-';
            return \`\${timezone} (UTC\${sign}\${offsetHours.toString().padStart(2, '0')}:\${offsetMinutes.toString().padStart(2, '0')})\`;
        }

        function updateTimezoneInfo() {
            const timezoneInfo = getUserTimezone();
            document.getElementById('timezoneInfo').textContent = timezoneInfo;
        }

        function tickCountdown(obj) {
            if (!obj) return;
            if (obj.seconds > 0) {
                obj.seconds--;
            } else if (obj.minutes > 0) {
                obj.minutes--;
                obj.seconds = 59;
            } else if (obj.hours > 0) {
                obj.hours--;
                obj.minutes = 59;
                obj.seconds = 59;
            } else if (obj.days > 0) {
                obj.days--;
                obj.hours = 23;
                obj.minutes = 59;
                obj.seconds = 59;
            }
        }

        function updateCountdownDisplay() {
            document.getElementById('weekendCountdown').textContent = formatCountdown(countdownState.weekend);
            document.getElementById('nearestHoliday').textContent = formatHolidayCountdown(countdownState.nearestHoliday);
            document.getElementById('thanksgivingCountdown').textContent = formatHolidayCountdown(countdownState.thanksgiving);
            document.getElementById('christmasCountdown').textContent = formatHolidayCountdown(countdownState.christmas);
            document.getElementById('newYearCountdown').textContent = formatHolidayCountdown(countdownState.newYear);
        }

        function startCountdownTick() {
            setInterval(() => {
                tickCountdown(countdownState.weekend);
                tickCountdown(countdownState.nearestHoliday);
                tickCountdown(countdownState.thanksgiving);
                tickCountdown(countdownState.christmas);
                tickCountdown(countdownState.newYear);
                updateCountdownDisplay();
            }, 1000);
        }

        async function fetchTimeData() {
            try {
                const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const response = await fetch(\`/api/time?timezone=\${encodeURIComponent(timezone)}\`);
                if (!response.ok) {
                    throw new Error('Network request failed');
                }
                const data = await response.json();
                countdownState.weekend = { ...data.weekendCountdown };
                countdownState.nearestHoliday = data.nearestHoliday ? { ...data.nearestHoliday } : null;
                countdownState.thanksgiving = data.holidayCountdowns.find(h => h.name === 'Thanksgiving' || h.name === 'Thanksgiving Day') || null;
                countdownState.christmas = data.holidayCountdowns.find(h => h.name === 'Christmas' || h.name === 'Christmas Day') || null;
                countdownState.newYear = data.holidayCountdowns.find(h => h.name === 'New Year' || h.name === "New Year's Day") || null;
                if (data.nearestHoliday) {
                    document.getElementById('nearestHolidayName').textContent = \`(\${data.nearestHoliday.name})\`;
                } else {
                    document.getElementById('nearestHolidayName').textContent = '';
                }
                updateCountdownDisplay();
            } catch (error) {
                document.getElementById('weekendCountdown').textContent = 'Load failed';
                document.getElementById('nearestHoliday').textContent = 'Load failed';
                document.getElementById('thanksgivingCountdown').textContent = 'Load failed';
                document.getElementById('christmasCountdown').textContent = 'Load failed';
                document.getElementById('newYearCountdown').textContent = 'Load failed';
            }
        }

        function initApp() {
            updateTimezoneInfo();
            updateCurrentTime();
            fetchTimeData();
            setInterval(updateCurrentTime, 1000);
            setInterval(fetchTimeData, 60000);
            startCountdownTick();
        }

        document.addEventListener('DOMContentLoaded', initApp);
    </script>
</body>
</html>
  `)
})

// API route
app.get('/api/time', async (c) => {
  try {
    const now = moment()
    const userTimezone = c.req.query('timezone') || 'America/New_York'
    const currentYear = now.year()
    const holidays = await getUSHolidays(currentYear)
    // Define major holidays (with vacation days)
    const majorHolidays = [
      { name: 'Thanksgiving', date: null, vacationDays: 4 },
      { name: 'Christmas', date: null, vacationDays: 2 },
      { name: 'New Year', date: null, vacationDays: 1 }
    ]
    holidays.forEach(holiday => {
      if (holiday.name === 'Thanksgiving' || holiday.name === 'Thanksgiving Day') {
        majorHolidays[0].date = holiday.date
      } else if (holiday.name === 'Christmas' || holiday.name === 'Christmas Day') {
        majorHolidays[1].date = holiday.date
      } else if (holiday.name === 'New Year' || holiday.name === "New Year's Day") {
        majorHolidays[2].date = holiday.date
      }
    })
    const weekendCountdown = getWeekendCountdown()
    const holidayCountdowns = majorHolidays
      .filter(holiday => holiday.date)
      .map(holiday => getHolidayCountdown(holiday.date, holiday.name, holiday.vacationDays))
    // Find the nearest public holiday
    const upcomingHolidays = holidays.filter(holiday =>
      moment(holiday.date).isAfter(now)
    ).sort((a, b) => moment(a.date).diff(moment(b.date)))
    const nearestHoliday = upcomingHolidays[0]
    const nearestHolidayCountdown = nearestHoliday ?
      getHolidayCountdown(nearestHoliday.date, nearestHoliday.name, 1) : null
    return c.json({
      currentTime: now.format('YYYY-MM-DD HH:mm:ss'),
      timezone: userTimezone,
      weekendCountdown,
      nearestHoliday: nearestHolidayCountdown,
      holidayCountdowns
    })
  } catch (error) {
    return c.json({ error: 'Failed to get time data' }, 500)
  }
})

// Serve static files - this should be the last route
app.use('/*', serveStatic({ root: './public' }))

export default app 