(function(root) {
  const key = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const shift = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate()+days, 12);
  function summarize(dates, today = new Date()) {
    const days = new Set(dates.filter(value => value <= key(today)));
    let currentStreak = 0;
    let cursor = days.has(key(today)) ? today : shift(today,-1);
    while (days.has(key(cursor))) { currentStreak++; cursor = shift(cursor,-1); }
    let longestStreak = 0, run = 0, previous = null;
    for (const day of [...days].sort()) {
      const [year,month,date] = day.split('-').map(Number);
      const value = new Date(year,month-1,date,12);
      run = previous && key(shift(previous,1)) === day ? run+1 : 1;
      longestStreak = Math.max(longestStreak,run); previous = value;
    }
    return {currentStreak,longestStreak,recentDays:Array.from({length:14},(_,i)=>{const date=key(shift(today,i-13));return {date,completed:days.has(date)};})};
  }
  const api={key,shift,summarize};
  if(typeof module!=='undefined')module.exports=api;else root.StreakDates=api;
})(typeof window!=='undefined'?window:globalThis);
