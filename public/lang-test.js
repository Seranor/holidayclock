// 语言检测测试脚本
console.log('=== 语言检测功能测试 ===');

// 1. 检测浏览器语言
console.log('1. 浏览器语言检测:');
console.log('   navigator.language:', navigator.language);
console.log('   navigator.languages:', navigator.languages);

// 2. 语言代码解析
console.log('\n2. 语言代码解析:');
const testLanguages = [
    'zh-CN', 'zh-TW', 'zh-HK', 'en-US', 'en-GB', 
    'ja-JP', 'ko-KR', 'fr-FR', 'fr-CA', 'de-DE', 'es-ES'
];

testLanguages.forEach(lang => {
    const baseLang = lang.split('-')[0];
    console.log(`   ${lang} -> ${baseLang}`);
});

// 3. 语言检测算法测试
console.log('\n3. 语言检测算法测试:');
const languages = {
    'zh-CN': { name: '简体中文' },
    'en-US': { name: 'English' },
    'ja-JP': { name: '日本語' },
    'ko-KR': { name: '한국어' },
    'fr-FR': { name: 'Français' },
    'de-DE': { name: 'Deutsch' },
    'es-ES': { name: 'Español' }
};

function detectUserLanguage() {
    const userLang = navigator.language || 'en-US';
    const supportedLangs = Object.keys(languages);
    
    for (let lang of supportedLangs) {
        if (userLang.startsWith(lang.split('-')[0])) {
            return lang;
        }
    }
    
    return 'en-US';
}

console.log('   检测到的语言:', detectUserLanguage());
console.log('   对应语言配置:', languages[detectUserLanguage()]);

// 4. 日期格式化测试
console.log('\n4. 日期格式化测试:');
const now = new Date();
const testLocales = ['en-US', 'zh-CN', 'ja-JP', 'ko-KR', 'fr-FR', 'de-DE', 'es-ES'];

testLocales.forEach(locale => {
    const dateStr = now.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
    console.log(`   ${locale}: ${dateStr}`);
});

// 5. 时间格式化测试
console.log('\n5. 时间格式化测试:');
testLocales.forEach(locale => {
    const timeStr = now.toLocaleTimeString(locale, {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    console.log(`   ${locale}: ${timeStr}`);
});

// 6. 数字格式化测试
console.log('\n6. 数字格式化测试:');
const testNumber = 123456.78;
testLocales.forEach(locale => {
    const numStr = testNumber.toLocaleString(locale);
    console.log(`   ${locale}: ${numStr}`);
});

// 7. 货币格式化测试
console.log('\n7. 货币格式化测试:');
const testCurrency = 1234.56;
testLocales.forEach(locale => {
    const currencyStr = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'USD'
    }).format(testCurrency);
    console.log(`   ${locale}: ${currencyStr}`);
});

// 8. 时区检测
console.log('\n8. 时区检测:');
try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log('   时区:', timezone);
} catch (error) {
    console.log('   时区检测失败:', error.message);
}

console.log('\n=== 测试完成 ===');
