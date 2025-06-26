// 格式化倒计时显示
function formatCountdown(countdown) {
    if (!countdown) return '-- days -- hours -- minutes -- seconds';
    
    const { days, hours, minutes, seconds } = countdown;
    return `${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`;
}

// 格式化假日倒计时显示（包含假期天数）
function formatHolidayCountdown(countdown) {
    if (!countdown) return '-- days -- hours -- minutes -- seconds (-- days vacation)';
    
    const { days, hours, minutes, seconds, vacationDays } = countdown;
    return `${days} days ${hours} hours ${minutes} minutes ${seconds} seconds (${vacationDays} days vacation)`;
}

// 更新当前时间显示
function updateCurrentTime() {
    const now = new Date();
    const dateString = now.toLocaleDateString('en-US');
    const timeString = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    document.getElementById('currentTime').textContent = `${dateString} ${timeString}`;
}

// 获取用户时区信息
function getUserTimezone() {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = new Date().getTimezoneOffset();
    const offsetHours = Math.abs(Math.floor(offset / 60));
    const offsetMinutes = Math.abs(offset % 60);
    const sign = offset <= 0 ? '+' : '-';
    
    return `${timezone} (UTC${sign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')})`;
}

// 更新时区信息
function updateTimezoneInfo() {
    const timezoneInfo = getUserTimezone();
    document.getElementById('timezoneInfo').textContent = timezoneInfo;
}

let countdownState = {
    weekend: null,
    nearestHoliday: null,
    thanksgiving: null,
    christmas: null,
    newYear: null
};

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

// 修改fetchTimeData，拉取后赋值countdownState
async function fetchTimeData() {
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const response = await fetch(`/api/time?timezone=${encodeURIComponent(timezone)}`);
        if (!response.ok) {
            throw new Error('Network request failed');
        }
        const data = await response.json();
        // 保存初始倒计时数据
        countdownState.weekend = { ...data.weekendCountdown };
        countdownState.nearestHoliday = data.nearestHoliday ? { ...data.nearestHoliday } : null;
        // 主假日
        countdownState.thanksgiving = data.holidayCountdowns.find(h => h.name === 'Thanksgiving' || h.name === 'Thanksgiving Day') || null;
        countdownState.christmas = data.holidayCountdowns.find(h => h.name === 'Christmas' || h.name === 'Christmas Day') || null;
        countdownState.newYear = data.holidayCountdowns.find(h => h.name === 'New Year' || h.name === "New Year's Day") || null;
        // 最近假日名称
        if (data.nearestHoliday) {
            document.getElementById('nearestHolidayName').textContent = `(${data.nearestHoliday.name})`;
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
    setInterval(fetchTimeData, 60000); // 每分钟拉取一次
    startCountdownTick(); // 本地每秒递减
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initApp); 