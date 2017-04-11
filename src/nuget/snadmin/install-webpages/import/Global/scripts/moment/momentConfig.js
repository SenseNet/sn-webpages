$(function () {
    moment.locale('en', {
        calendar: {
            lastDay: '[Yesterday at] LT',
            nextDay: '[Tomorrow at] LT',
            lastWeek: 'dddd, MMMM DD, YYYY [at] H:mm A',
            nextWeek: 'dddd [at] LT',
            sameElse: 'dddd, DD MMMM, YYYY [at] H:mm A'
        }
    });

    moment.locale('hu', {
        calendar: {
            lastDay: '[Tegnap] LT',
            nextDay: '[Holnap] LT',
            lastWeek: 'YYYY. MMMM DD., HH:mm',
            nextWeek: 'dddd [at] LT',
            sameElse: 'YYYY. MMMM DD., HH:mm',
        }
    });
});