# Holiday Clock App

A beautiful Node.js holiday clock app that shows the current time and countdowns to various US public holidays.

## Features

- 🕐 **Real-time Clock** - Large font display of the current time
- 🌍 **Timezone Info** - Shows the user's timezone
- 📅 **Weekend Countdown** - Time left until the weekend
- 🎉 **Holiday Countdown** - Time left until major US holidays
- 🏖️ **Vacation Days** - Shows vacation days for each holiday
- 📱 **Responsive Design** - Works on desktop and mobile
- 🎨 **Modern UI** - Gradient background and animation effects

## Supported Holidays

- Thanksgiving (4 days vacation)
- Christmas (2 days vacation)
- New Year (1 day vacation)
- Next public holiday (1 day vacation)

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: HTML5 + CSS3 + JavaScript
- **Time Handling**: Moment.js + Moment Timezone
- **Holiday Data**: [Nager.Date API](https://date.nager.at/)

## Installation & Run

### 1. Install dependencies

```bash
npm install
```

### 2. Start the app

```bash
# Development mode (auto-restart)
npm run dev

# Production mode
npm start
```

### 3. Open in browser

Visit: http://localhost:3000

## Project Structure

```
holidayclock/
├── server.js          # Express server
├── package.json       # Project config
├── README.md          # Project docs
└── public/            # Static files
    ├── index.html     # Main page
    ├── styles.css     # Styles
    └── script.js      # Frontend logic
```

## API

### GET /api/time

Get time and countdown data

**Query params:**
- `timezone` (optional): User timezone, default 'America/New_York'

**Response example:**
```json
{
  "currentTime": "2024-01-15 14:30:25",
  "timezone": "America/New_York",
  "weekendCountdown": {
    "days": 2,
    "hours": 9,
    "minutes": 29,
    "seconds": 35
  },
  "nearestHoliday": {
    "name": "Martin Luther King, Jr. Day",
    "days": 5,
    "hours": 9,
    "minutes": 29,
    "seconds": 35,
    "vacationDays": 1
  },
  "holidayCountdowns": [
    {
      "name": "Thanksgiving",
      "days": 315,
      "hours": 9,
      "minutes": 29,
      "seconds": 35,
      "vacationDays": 4
    }
  ]
}
```

## Customization

### Change port

Edit the `PORT` variable in `server.js`:

```javascript
const PORT = process.env.PORT || 3000;
```

### Add new holiday

Add to the `majorHolidays` array in `server.js`:

```javascript
const majorHolidays = [
    { name: 'Thanksgiving', date: null, vacationDays: 4 },
    { name: 'Christmas', date: null, vacationDays: 2 },
    { name: 'New Year', date: null, vacationDays: 1 },
    { name: 'Independence Day', date: null, vacationDays: 1 }  // new
];
```

## License

MIT License

## Contributing

Feel free to submit Issues and Pull Requests! 