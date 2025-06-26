const express = require('express');
const moment = require('moment-timezone');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Set static directory
app.use(express.static('public'));

// Get US holidays from Nager.Date API
async function getUSHolidays(year) {
    try {
        const response = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/US`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch holiday data:', error.message);
        return [];
    }
}

// Calculate countdown to weekend
function getWeekendCountdown() {
    const now = moment();
    const currentDay = now.day(); // 0 = Sunday, 6 = Saturday
    const daysToWeekend = currentDay === 0 || currentDay === 6 ? 0 : 6 - currentDay;
    if (daysToWeekend === 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    const weekendStart = moment().endOf('week').startOf('day');
    const diff = moment.duration(weekendStart.diff(now));
    return {
        days: Math.floor(diff.asDays()),
        hours: diff.hours(),
        minutes: diff.minutes(),
        seconds: diff.seconds()
    };
}

// Calculate countdown to a specific holiday
function getHolidayCountdown(holidayDate, holidayName, vacationDays = 0) {
    const now = moment();
    const holiday = moment(holidayDate);
    if (holiday.isBefore(now)) {
        holiday.add(1, 'year');
    }
    const diff = moment.duration(holiday.diff(now));
    return {
        name: holidayName,
        days: Math.floor(diff.asDays()),
        hours: diff.hours(),
        minutes: diff.minutes(),
        seconds: diff.seconds(),
        vacationDays: vacationDays
    };
}

// API route - get time data
app.get('/api/time', async (req, res) => {
    try {
        const now = moment();
        const userTimezone = req.query.timezone || 'America/New_York';
        const currentYear = now.year();
        const holidays = await getUSHolidays(currentYear);
        // Define major holidays (with vacation days)
        const majorHolidays = [
            { name: 'Thanksgiving', date: null, vacationDays: 4 },
            { name: 'Christmas', date: null, vacationDays: 2 },
            { name: 'New Year', date: null, vacationDays: 1 }
        ];
        // Find holiday dates from API data
        holidays.forEach(holiday => {
            if (holiday.name === 'Thanksgiving' || holiday.name === 'Thanksgiving Day') {
                majorHolidays[0].date = holiday.date;
            } else if (holiday.name === 'Christmas' || holiday.name === 'Christmas Day') {
                majorHolidays[1].date = holiday.date;
            } else if (holiday.name === 'New Year' || holiday.name === "New Year's Day") {
                majorHolidays[2].date = holiday.date;
            }
        });
        // Calculate countdowns
        const weekendCountdown = getWeekendCountdown();
        const holidayCountdowns = majorHolidays
            .filter(holiday => holiday.date)
            .map(holiday => getHolidayCountdown(holiday.date, holiday.name, holiday.vacationDays));
        // Find the nearest public holiday
        const upcomingHolidays = holidays.filter(holiday => 
            moment(holiday.date).isAfter(now)
        ).sort((a, b) => moment(a.date).diff(moment(b.date)));
        const nearestHoliday = upcomingHolidays[0];
        const nearestHolidayCountdown = nearestHoliday ? 
            getHolidayCountdown(nearestHoliday.date, nearestHoliday.name, 1) : null;
        res.json({
            currentTime: now.format('YYYY-MM-DD HH:mm:ss'),
            timezone: userTimezone,
            weekendCountdown,
            nearestHoliday: nearestHolidayCountdown,
            holidayCountdowns
        });
    } catch (error) {
        console.error('Failed to get time data:', error);
        res.status(500).json({ error: 'Failed to get time data' });
    }
});

// Home route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Holiday clock server running at http://localhost:${PORT}`);
}); 