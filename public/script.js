// 语言配置
const languages = {
    'zh-CN': {
        weekend: '距离周末',
        nearestHoliday: '下一个假期',
        thanksgiving: '感恩节',
        christmas: '圣诞节',
        newYear: '新年',
        timezone: '时区信息',
        days: '天',
        hours: '小时',
        minutes: '分钟',
        seconds: '秒',
        vacationDays: '天假期',
        loadingFailed: '加载失败'
    },
    'en-US': {
        weekend: 'Time until weekend',
        nearestHoliday: 'Time until next holiday',
        thanksgiving: 'Thanksgiving',
        christmas: 'Christmas',
        newYear: 'New Year',
        timezone: 'Timezone info',
        days: 'days',
        hours: 'hours',
        minutes: 'minutes',
        seconds: 'seconds',
        vacationDays: 'days vacation',
        loadingFailed: 'Load failed'
    },
    'ja-JP': {
        weekend: '週末まで',
        nearestHoliday: '次の休日まで',
        thanksgiving: '感謝祭',
        christmas: 'クリスマス',
        newYear: '新年',
        timezone: 'タイムゾーン情報',
        days: '日',
        hours: '時間',
        minutes: '分',
        seconds: '秒',
        vacationDays: '日間の休暇',
        loadingFailed: '読み込みに失敗しました'
    },
    'ko-KR': {
        weekend: '주말까지',
        nearestHoliday: '다음 휴일까지',
        thanksgiving: '추수감사절',
        christmas: '크리스마스',
        newYear: '신년',
        timezone: '시간대 정보',
        days: '일',
        hours: '시간',
        minutes: '분',
        seconds: '초',
        vacationDays: '일 휴가',
        loadingFailed: '로드 실패'
    },
    'fr-FR': {
        weekend: 'Temps jusqu\'au week-end',
        nearestHoliday: 'Temps jusqu\'à la prochaine fête',
        thanksgiving: 'Action de grâce',
        christmas: 'Noël',
        newYear: 'Nouvel an',
        timezone: 'Informations sur le fuseau horaire',
        days: 'jours',
        hours: 'heures',
        minutes: 'minutes',
        seconds: 'secondes',
        vacationDays: 'jours de vacances',
        loadingFailed: 'Échec du chargement'
    },
    'de-DE': {
        weekend: 'Zeit bis zum Wochenende',
        nearestHoliday: 'Zeit bis zum nächsten Feiertag',
        thanksgiving: 'Erntedankfest',
        christmas: 'Weihnachten',
        newYear: 'Neujahr',
        timezone: 'Zeitzoneninformation',
        days: 'Tage',
        hours: 'Stunden',
        minutes: 'Minuten',
        seconds: 'Sekunden',
        vacationDays: 'Urlaubstage',
        loadingFailed: 'Laden fehlgeschlagen'
    },
    'es-ES': {
        weekend: 'Tiempo hasta el fin de semana',
        nearestHoliday: 'Tiempo hasta la próxima fiesta',
        thanksgiving: 'Día de Acción de Gracias',
        christmas: 'Navidad',
        newYear: 'Año Nuevo',
        timezone: 'Información de zona horaria',
        days: 'días',
        hours: 'horas',
        minutes: 'minutos',
        seconds: 'segundos',
        vacationDays: 'días de vacaciones',
        loadingFailed: 'Carga fallida'
    }
};

// 检测用户语言
function detectUserLanguage() {
    const userLang = navigator.language || 'en-US';
    const supportedLangs = Object.keys(languages);
    
    // 查找匹配的语言或返回默认语言
    for (let lang of supportedLangs) {
        if (userLang.startsWith(lang.split('-')[0])) {
            return lang;
        }
    }
    
    return 'en-US'; // 默认英语
}

// 获取当前语言
let currentLang = detectUserLanguage();

// 格式化倒计时显示
function formatCountdown(countdown) {
    const lang = languages[currentLang];
    if (!countdown) return `-- ${lang.days} -- ${lang.hours} -- ${lang.minutes} -- ${lang.seconds}`;
    
    const { days, hours, minutes, seconds } = countdown;
    return `${days} ${lang.days} ${hours} ${lang.hours} ${minutes} ${lang.minutes} ${seconds} ${lang.seconds}`;
}

// 更新当前时间显示
function updateCurrentTime() {
    const now = new Date();
    const dateString = now.toLocaleDateString(currentLang);
    const timeString = now.toLocaleTimeString(currentLang, {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    document.getElementById('currentTime').textContent = timeString;
    document.getElementById('currentDate').textContent = dateString;
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
    const lang = languages[currentLang];
    const timezoneInfo = getUserTimezone();
    document.getElementById('timezoneInfo').textContent = timezoneInfo;
}

// 更新页面文字
function updatePageText() {
    const lang = languages[currentLang];
    
    // 更新标签文字
    document.querySelectorAll('.countdown-label')[0].textContent = lang.weekend;
    document.querySelectorAll('.countdown-label')[1].textContent = `${lang.nearestHoliday} `;
    document.querySelectorAll('.countdown-label')[2].textContent = lang.thanksgiving;
    document.querySelectorAll('.countdown-label')[3].textContent = lang.christmas;
    document.querySelectorAll('.countdown-label')[4].textContent = lang.newYear;
    
    // 更新假期天数文字
    const vacationElements = document.querySelectorAll('.vacation-days');
    if (vacationElements.length >= 3) {
        vacationElements[0].textContent = `4${lang.vacationDays}`;
        vacationElements[1].textContent = `2${lang.vacationDays}`;
        vacationElements[2].textContent = `1${lang.vacationDays}`;
    }
    
    // 更新页面标题
    document.title = 'Holiday Clock - ' + (currentLang === 'zh-CN' ? '实时倒计时' : 'Real-time Countdown');
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
    const lang = languages[currentLang];
    
    document.getElementById('weekendCountdown').textContent = formatCountdown(countdownState.weekend);
    document.getElementById('nearestHoliday').textContent = formatCountdown(countdownState.nearestHoliday);
    document.getElementById('thanksgivingCountdown').textContent = formatCountdown(countdownState.thanksgiving);
    document.getElementById('christmasCountdown').textContent = formatCountdown(countdownState.christmas);
    document.getElementById('newYearCountdown').textContent = formatCountdown(countdownState.newYear);
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
        const lang = languages[currentLang];
        document.getElementById('weekendCountdown').textContent = lang.loadingFailed;
        document.getElementById('nearestHoliday').textContent = lang.loadingFailed;
        document.getElementById('thanksgivingCountdown').textContent = lang.loadingFailed;
        document.getElementById('christmasCountdown').textContent = lang.loadingFailed;
        document.getElementById('newYearCountdown').textContent = lang.loadingFailed;
    }
}

function initApp() {
    updatePageText();
    updateTimezoneInfo();
    updateCurrentTime();
    fetchTimeData();
    setInterval(updateCurrentTime, 1000);
    setInterval(fetchTimeData, 60000); // 每分钟拉取一次
    startCountdownTick(); // 本地每秒递减
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initApp);
