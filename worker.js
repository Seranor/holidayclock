import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import axios from 'axios'
import moment from 'moment-timezone'

const app = new Hono()

// US state timezone mapping
const US_STATE_TIMEZONES = {
  'AL': 'America/Chicago', // Alabama
  'AK': 'America/Anchorage', // Alaska
  'AZ': 'America/Phoenix', // Arizona
  'AR': 'America/Chicago', // Arkansas
  'CA': 'America/Los_Angeles', // California
  'CO': 'America/Denver', // Colorado
  'CT': 'America/New_York', // Connecticut
  'DE': 'America/New_York', // Delaware
  'FL': 'America/New_York', // Florida (Eastern)
  'GA': 'America/New_York', // Georgia
  'HI': 'Pacific/Honolulu', // Hawaii
  'ID': 'America/Boise', // Idaho
  'IL': 'America/Chicago', // Illinois
  'IN': 'America/Indiana/Indianapolis', // Indiana
  'IA': 'America/Chicago', // Iowa
  'KS': 'America/Chicago', // Kansas
  'KY': 'America/New_York', // Kentucky
  'LA': 'America/Chicago', // Louisiana
  'ME': 'America/New_York', // Maine
  'MD': 'America/New_York', // Maryland
  'MA': 'America/New_York', // Massachusetts
  'MI': 'America/Detroit', // Michigan
  'MN': 'America/Chicago', // Minnesota
  'MS': 'America/Chicago', // Mississippi
  'MO': 'America/Chicago', // Missouri
  'MT': 'America/Denver', // Montana
  'NE': 'America/Chicago', // Nebraska
  'NV': 'America/Los_Angeles', // Nevada
  'NH': 'America/New_York', // New Hampshire
  'NJ': 'America/New_York', // New Jersey
  'NM': 'America/Denver', // New Mexico
  'NY': 'America/New_York', // New York
  'NC': 'America/New_York', // North Carolina
  'ND': 'America/Chicago', // North Dakota
  'OH': 'America/New_York', // Ohio
  'OK': 'America/Chicago', // Oklahoma
  'OR': 'America/Los_Angeles', // Oregon
  'PA': 'America/New_York', // Pennsylvania
  'RI': 'America/New_York', // Rhode Island
  'SC': 'America/New_York', // South Carolina
  'SD': 'America/Chicago', // South Dakota
  'TN': 'America/Chicago', // Tennessee
  'TX': 'America/Chicago', // Texas
  'UT': 'America/Denver', // Utah
  'VT': 'America/New_York', // Vermont
  'VA': 'America/New_York', // Virginia
  'WA': 'America/Los_Angeles', // Washington
  'WV': 'America/New_York', // West Virginia
  'WI': 'America/Chicago', // Wisconsin
  'WY': 'America/Denver', // Wyoming
  'DC': 'America/New_York', // District of Columbia
}

// Get location info from IP
async function getLocationFromIP(ip) {
  try {
    console.log('Detecting location for IP:', ip)
    
    // Try ipapi.co first
    const response = await axios.get(`https://ipapi.co/${ip}/json/`, {
      timeout: 5000,
      headers: {
        'User-Agent': 'HolidayClock/1.0'
      }
    })
    
    console.log('Location data from ipapi.co:', response.data)
    return response.data
  } catch (error) {
    console.error('ipapi.co failed:', error.message)
    
    try {
      // Fallback to ip-api.com
      const fallbackResponse = await axios.get(`http://ip-api.com/json/${ip}`, {
        timeout: 5000
      })
      
      console.log('Location data from ip-api.com:', fallbackResponse.data)
      
      // Convert ip-api.com format to match ipapi.co format
      const data = fallbackResponse.data
      return {
        country_code: data.countryCode,
        country_name: data.country,
        region_code: data.region,
        city: data.city,
        timezone: data.timezone
      }
    } catch (fallbackError) {
      console.error('ip-api.com also failed:', fallbackError.message)
      return null
    }
  }
}

// Get timezone based on location
function getTimezoneFromLocation(locationData) {
  if (!locationData) return 'America/New_York'
  
  // For US users, use state-specific timezone
  if (locationData.country_code === 'US' && locationData.region_code) {
    return getStateTimezone(locationData.region_code)
  }
  
  // For other countries, use the timezone from the API
  if (locationData.timezone) {
    return locationData.timezone
  }
  
  // Fallback based on country code
  const countryTimezones = {
    'CN': 'Asia/Shanghai', // China
    'KR': 'Asia/Seoul', // South Korea
    'JP': 'Asia/Tokyo', // Japan
    'GB': 'Europe/London', // United Kingdom
    'DE': 'Europe/Berlin', // Germany
    'FR': 'Europe/Paris', // France
    'CA': 'America/Toronto', // Canada
    'AU': 'Australia/Sydney', // Australia
    'IN': 'Asia/Kolkata', // India
    'BR': 'America/Sao_Paulo', // Brazil
    'MX': 'America/Mexico_City', // Mexico
    'RU': 'Europe/Moscow', // Russia
    'IT': 'Europe/Rome', // Italy
    'ES': 'Europe/Madrid', // Spain
    'NL': 'Europe/Amsterdam', // Netherlands
    'SE': 'Europe/Stockholm', // Sweden
    'NO': 'Europe/Oslo', // Norway
    'DK': 'Europe/Copenhagen', // Denmark
    'FI': 'Europe/Helsinki', // Finland
    'PL': 'Europe/Warsaw', // Poland
    'CZ': 'Europe/Prague', // Czech Republic
    'AT': 'Europe/Vienna', // Austria
    'CH': 'Europe/Zurich', // Switzerland
    'BE': 'Europe/Brussels', // Belgium
    'IE': 'Europe/Dublin', // Ireland
    'PT': 'Europe/Lisbon', // Portugal
    'GR': 'Europe/Athens', // Greece
    'HU': 'Europe/Budapest', // Hungary
    'RO': 'Europe/Bucharest', // Romania
    'BG': 'Europe/Sofia', // Bulgaria
    'HR': 'Europe/Zagreb', // Croatia
    'SI': 'Europe/Ljubljana', // Slovenia
    'SK': 'Europe/Bratislava', // Slovakia
    'LT': 'Europe/Vilnius', // Lithuania
    'LV': 'Europe/Riga', // Latvia
    'EE': 'Europe/Tallinn', // Estonia
    'SG': 'Asia/Singapore', // Singapore
    'MY': 'Asia/Kuala_Lumpur', // Malaysia
    'TH': 'Asia/Bangkok', // Thailand
    'VN': 'Asia/Ho_Chi_Minh', // Vietnam
    'PH': 'Asia/Manila', // Philippines
    'ID': 'Asia/Jakarta', // Indonesia
    'NZ': 'Pacific/Auckland', // New Zealand
    'ZA': 'Africa/Johannesburg', // South Africa
    'EG': 'Africa/Cairo', // Egypt
    'NG': 'Africa/Lagos', // Nigeria
    'KE': 'Africa/Nairobi', // Kenya
    'MA': 'Africa/Casablanca', // Morocco
    'IL': 'Asia/Jerusalem', // Israel
    'TR': 'Europe/Istanbul', // Turkey
    'AE': 'Asia/Dubai', // United Arab Emirates
    'SA': 'Asia/Riyadh', // Saudi Arabia
    'QA': 'Asia/Qatar', // Qatar
    'KW': 'Asia/Kuwait', // Kuwait
    'BH': 'Asia/Bahrain', // Bahrain
    'OM': 'Asia/Muscat', // Oman
    'JO': 'Asia/Amman', // Jordan
    'LB': 'Asia/Beirut', // Lebanon
    'SY': 'Asia/Damascus', // Syria
    'IQ': 'Asia/Baghdad', // Iraq
    'IR': 'Asia/Tehran', // Iran
    'PK': 'Asia/Karachi', // Pakistan
    'BD': 'Asia/Dhaka', // Bangladesh
    'LK': 'Asia/Colombo', // Sri Lanka
    'NP': 'Asia/Kathmandu', // Nepal
    'MM': 'Asia/Yangon', // Myanmar
    'KH': 'Asia/Phnom_Penh', // Cambodia
    'LA': 'Asia/Vientiane', // Laos
    'MN': 'Asia/Ulaanbaatar', // Mongolia
    'KZ': 'Asia/Almaty', // Kazakhstan
    'UZ': 'Asia/Tashkent', // Uzbekistan
    'KG': 'Asia/Bishkek', // Kyrgyzstan
    'TJ': 'Asia/Dushanbe', // Tajikistan
    'TM': 'Asia/Ashgabat', // Turkmenistan
    'AF': 'Asia/Kabul', // Afghanistan
    'GE': 'Asia/Tbilisi', // Georgia
    'AM': 'Asia/Yerevan', // Armenia
    'AZ': 'Asia/Baku', // Azerbaijan
    'UA': 'Europe/Kiev', // Ukraine
    'BY': 'Europe/Minsk', // Belarus
    'MD': 'Europe/Chisinau', // Moldova
    'RS': 'Europe/Belgrade', // Serbia
    'ME': 'Europe/Podgorica', // Montenegro
    'BA': 'Europe/Sarajevo', // Bosnia and Herzegovina
    'MK': 'Europe/Skopje', // North Macedonia
    'AL': 'Europe/Tirane', // Albania
    'XK': 'Europe/Belgrade', // Kosovo
    'IS': 'Atlantic/Reykjavik', // Iceland
    'MT': 'Europe/Malta', // Malta
    'CY': 'Asia/Nicosia', // Cyprus
    'LU': 'Europe/Luxembourg', // Luxembourg
    'MC': 'Europe/Monaco', // Monaco
    'LI': 'Europe/Vaduz', // Liechtenstein
    'SM': 'Europe/San_Marino', // San Marino
    'VA': 'Europe/Vatican', // Vatican City
    'AD': 'Europe/Andorra', // Andorra
    'FO': 'Atlantic/Faroe', // Faroe Islands
    'GL': 'America/Godthab', // Greenland
    'GI': 'Europe/Gibraltar', // Gibraltar
    'AX': 'Europe/Mariehamn', // Åland Islands
    'SJ': 'Arctic/Longyearbyen', // Svalbard and Jan Mayen
    'BV': 'Antarctica/Bouvet', // Bouvet Island
    'TF': 'Indian/Kerguelen', // French Southern Territories
    'HM': 'Antarctica/Mawson', // Heard Island and McDonald Islands
    'AQ': 'Antarctica/McMurdo', // Antarctica
    'IO': 'Indian/Chagos', // British Indian Ocean Territory
    'CX': 'Indian/Christmas', // Christmas Island
    'CC': 'Indian/Cocos', // Cocos (Keeling) Islands
    'NF': 'Pacific/Norfolk', // Norfolk Island
    'PN': 'Pacific/Pitcairn', // Pitcairn
    'TK': 'Pacific/Fakaofo', // Tokelau
    'WF': 'Pacific/Wallis', // Wallis and Futuna
    'NC': 'Pacific/Noumea', // New Caledonia
    'PF': 'Pacific/Tahiti', // French Polynesia
    'VU': 'Pacific/Efate', // Vanuatu
    'FJ': 'Pacific/Fiji', // Fiji
    'TO': 'Pacific/Tongatapu', // Tonga
    'WS': 'Pacific/Apia', // Samoa
    'KI': 'Pacific/Tarawa', // Kiribati
    'TV': 'Pacific/Funafuti', // Tuvalu
    'NR': 'Pacific/Nauru', // Nauru
    'PW': 'Pacific/Palau', // Palau
    'FM': 'Pacific/Pohnpei', // Micronesia
    'GU': 'Pacific/Guam', // Guam
    'MP': 'Pacific/Saipan', // Northern Mariana Islands
    'AS': 'Pacific/Pago_Pago', // American Samoa
    'CK': 'Pacific/Rarotonga', // Cook Islands
    'NU': 'Pacific/Niue', // Niue
    'PW': 'Pacific/Palau', // Palau
    'MH': 'Pacific/Majuro', // Marshall Islands
    'FM': 'Pacific/Pohnpei', // Micronesia
    'KI': 'Pacific/Tarawa', // Kiribati
    'TV': 'Pacific/Funafuti', // Tuvalu
    'NR': 'Pacific/Nauru', // Nauru
    'TO': 'Pacific/Tongatapu', // Tonga
    'WS': 'Pacific/Apia', // Samoa
    'FJ': 'Pacific/Fiji', // Fiji
    'VU': 'Pacific/Efate', // Vanuatu
    'NC': 'Pacific/Noumea', // New Caledonia
    'PF': 'Pacific/Tahiti', // French Polynesia
    'WF': 'Pacific/Wallis', // Wallis and Futuna
    'TK': 'Pacific/Fakaofo', // Tokelau
    'PN': 'Pacific/Pitcairn', // Pitcairn
    'NF': 'Pacific/Norfolk', // Norfolk Island
    'CX': 'Indian/Christmas', // Christmas Island
    'CC': 'Indian/Cocos', // Cocos (Keeling) Islands
    'IO': 'Indian/Chagos', // British Indian Ocean Territory
    'AQ': 'Antarctica/McMurdo', // Antarctica
    'HM': 'Antarctica/Mawson', // Heard Island and McDonald Islands
    'TF': 'Indian/Kerguelen', // French Southern Territories
    'BV': 'Antarctica/Bouvet', // Bouvet Island
    'SJ': 'Arctic/Longyearbyen', // Svalbard and Jan Mayen
    'AX': 'Europe/Mariehamn', // Åland Islands
    'GI': 'Europe/Gibraltar', // Gibraltar
    'GL': 'America/Godthab', // Greenland
    'FO': 'Atlantic/Faroe', // Faroe Islands
    'AD': 'Europe/Andorra', // Andorra
    'VA': 'Europe/Vatican', // Vatican City
    'SM': 'Europe/San_Marino', // San Marino
    'LI': 'Europe/Vaduz', // Liechtenstein
    'MC': 'Europe/Monaco', // Monaco
    'LU': 'Europe/Luxembourg', // Luxembourg
    'CY': 'Asia/Nicosia', // Cyprus
    'MT': 'Europe/Malta', // Malta
    'IS': 'Atlantic/Reykjavik', // Iceland
    'XK': 'Europe/Belgrade', // Kosovo
    'AL': 'Europe/Tirane', // Albania
    'MK': 'Europe/Skopje', // North Macedonia
    'BA': 'Europe/Sarajevo', // Bosnia and Herzegovina
    'ME': 'Europe/Podgorica', // Montenegro
    'RS': 'Europe/Belgrade', // Serbia
    'MD': 'Europe/Chisinau', // Moldova
    'BY': 'Europe/Minsk', // Belarus
    'UA': 'Europe/Kiev', // Ukraine
    'AZ': 'Asia/Baku', // Azerbaijan
    'AM': 'Asia/Yerevan', // Armenia
    'GE': 'Asia/Tbilisi', // Georgia
    'AF': 'Asia/Kabul', // Afghanistan
    'TM': 'Asia/Ashgabat', // Turkmenistan
    'TJ': 'Asia/Dushanbe', // Tajikistan
    'KG': 'Asia/Bishkek', // Kyrgyzstan
    'UZ': 'Asia/Tashkent', // Uzbekistan
    'KZ': 'Asia/Almaty', // Kazakhstan
    'MN': 'Asia/Ulaanbaatar', // Mongolia
    'LA': 'Asia/Vientiane', // Laos
    'KH': 'Asia/Phnom_Penh', // Cambodia
    'MM': 'Asia/Yangon', // Myanmar
    'NP': 'Asia/Kathmandu', // Nepal
    'LK': 'Asia/Colombo', // Sri Lanka
    'BD': 'Asia/Dhaka', // Bangladesh
    'PK': 'Asia/Karachi', // Pakistan
    'IR': 'Asia/Tehran', // Iran
    'IQ': 'Asia/Baghdad', // Iraq
    'SY': 'Asia/Damascus', // Syria
    'LB': 'Asia/Beirut', // Lebanon
    'JO': 'Asia/Amman', // Jordan
    'OM': 'Asia/Muscat', // Oman
    'BH': 'Asia/Bahrain', // Bahrain
    'KW': 'Asia/Kuwait', // Kuwait
    'QA': 'Asia/Qatar', // Qatar
    'SA': 'Asia/Riyadh', // Saudi Arabia
    'AE': 'Asia/Dubai', // United Arab Emirates
    'TR': 'Europe/Istanbul', // Turkey
    'IL': 'Asia/Jerusalem', // Israel
    'MA': 'Africa/Casablanca', // Morocco
    'KE': 'Africa/Nairobi', // Kenya
    'NG': 'Africa/Lagos', // Nigeria
    'EG': 'Africa/Cairo', // Egypt
    'ZA': 'Africa/Johannesburg', // South Africa
    'NZ': 'Pacific/Auckland', // New Zealand
    'ID': 'Asia/Jakarta', // Indonesia
    'PH': 'Asia/Manila', // Philippines
    'VN': 'Asia/Ho_Chi_Minh', // Vietnam
    'TH': 'Asia/Bangkok', // Thailand
    'MY': 'Asia/Kuala_Lumpur', // Malaysia
    'SG': 'Asia/Singapore', // Singapore
    'EE': 'Europe/Tallinn', // Estonia
    'LV': 'Europe/Riga', // Latvia
    'LT': 'Europe/Vilnius', // Lithuania
    'SK': 'Europe/Bratislava', // Slovakia
    'SI': 'Europe/Ljubljana', // Slovenia
    'HR': 'Europe/Zagreb', // Croatia
    'BG': 'Europe/Sofia', // Bulgaria
    'RO': 'Europe/Bucharest', // Romania
    'HU': 'Europe/Budapest', // Hungary
    'GR': 'Europe/Athens', // Greece
    'PT': 'Europe/Lisbon', // Portugal
    'IE': 'Europe/Dublin', // Ireland
    'BE': 'Europe/Brussels', // Belgium
    'CH': 'Europe/Zurich', // Switzerland
    'AT': 'Europe/Vienna', // Austria
    'CZ': 'Europe/Prague', // Czech Republic
    'PL': 'Europe/Warsaw', // Poland
    'FI': 'Europe/Helsinki', // Finland
    'DK': 'Europe/Copenhagen', // Denmark
    'NO': 'Europe/Oslo', // Norway
    'SE': 'Europe/Stockholm', // Sweden
    'NL': 'Europe/Amsterdam', // Netherlands
    'ES': 'Europe/Madrid', // Spain
    'IT': 'Europe/Rome', // Italy
    'RU': 'Europe/Moscow', // Russia
    'MX': 'America/Mexico_City', // Mexico
    'BR': 'America/Sao_Paulo', // Brazil
    'IN': 'Asia/Kolkata', // India
    'AU': 'Australia/Sydney', // Australia
    'CA': 'America/Toronto', // Canada
    'FR': 'Europe/Paris', // France
    'DE': 'Europe/Berlin', // Germany
    'GB': 'Europe/London', // United Kingdom
    'JP': 'Asia/Tokyo', // Japan
    'KR': 'Asia/Seoul', // South Korea
    'CN': 'Asia/Shanghai', // China
  }
  
  return countryTimezones[locationData.country_code] || 'UTC'
}

// Get US state timezone
function getStateTimezone(stateCode) {
  return US_STATE_TIMEZONES[stateCode] || 'America/New_York'
}

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
        .location-info {
            font-size: 1rem;
            color: #95a5a6;
            margin-top: 5px;
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
                <div class="timezone-info" id="timezoneInfo">Loading timezone...</div>
                <div class="location-info" id="locationInfo">Detecting your location...</div>
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

        function updateTimezoneInfo(timezone, location) {
            const timezoneInfo = timezone || 'Unknown timezone';
            const locationInfo = location || 'Location not detected';
            
            document.getElementById('timezoneInfo').textContent = timezoneInfo;
            document.getElementById('locationInfo').textContent = locationInfo;
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
                const response = await fetch('/api/time');
                if (!response.ok) {
                    throw new Error('Network request failed');
                }
                const data = await response.json();
                
                // Update timezone and location info
                updateTimezoneInfo(data.timezone, data.location);
                
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

// Test endpoint for debugging IP detection
app.get('/test-ip', async (c) => {
  try {
    const userIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || '8.8.8.8'
    const locationData = await getLocationFromIP(userIP)
    const userTimezone = getTimezoneFromLocation(locationData)
    
    return c.json({
      ip: userIP,
      location: locationData,
      timezone: userTimezone,
      headers: {
        'CF-Connecting-IP': c.req.header('CF-Connecting-IP'),
        'X-Forwarded-For': c.req.header('X-Forwarded-For'),
        'CF-IPCountry': c.req.header('CF-IPCountry')
      }
    })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

// API route
app.get('/api/time', async (c) => {
  try {
    const now = moment()
    const userIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || '8.8.8.8'
    
    // Get location from IP
    const locationData = await getLocationFromIP(userIP)
    const userTimezone = getTimezoneFromLocation(locationData)
    let locationInfo = 'Location not detected'
    
    if (locationData && locationData.country_code === 'US' && locationData.region_code) {
      locationInfo = `${locationData.city}, ${locationData.region_code}`
    } else if (locationData && locationData.country_code === 'US') {
      locationInfo = 'United States'
    } else if (locationData) {
      locationInfo = `${locationData.city || ''}, ${locationData.country_name || ''}`.trim()
    }
    
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
      location: locationInfo,
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