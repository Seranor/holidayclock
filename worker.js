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