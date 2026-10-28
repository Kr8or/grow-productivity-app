// Preserve the original design's task labels and fill widths.
const tasks = [
  { title: 'Deep Work Sprint', period: '1 Week', description: 'Spend 20hrs working across the week', completed: 18, total: 20, label: '18hrs/20hrs', fillWidth: 224.42 },
  { title: 'Writing Session', period: '1 Week', description: 'Spend 8hrs working across the week', completed: 3.5, total: 8, label: '3.5hrs/8hrs', fillWidth: 122 },
  { title: 'Fishing Trip', period: '1 Day', description: 'Spend 2hrs Fishing', completed: 0, total: 8, label: '0hrs/8hrs', fillWidth: 0 },
];

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function ProgressBar(task) {
  const row = element('div', 'progress');
  const track = element('div', 'progress-track');
  track.setAttribute('role', 'progressbar');
  track.setAttribute('aria-label', task.title);
  track.setAttribute('aria-valuemin', '0');
  track.setAttribute('aria-valuemax', task.total);
  track.setAttribute('aria-valuenow', task.completed);
  track.setAttribute('aria-valuetext', task.label);
  if (task.fillWidth) {
    const fill = element('span', 'progress-fill');
    fill.style.setProperty('--fill-width', `${task.fillWidth}px`);
    track.append(fill);
  }
  row.append(track, element('span', 'progress-label', task.label));
  return row;
}

function TaskCard(task) {
  const card = element('article', 'task-card');
  const select = element('button', 'task-select');
  select.type = 'button';
  select.setAttribute('aria-label', `Select ${task.title}`);
  select.setAttribute('aria-pressed', 'false');
  if (selectedTask === task) { select.setAttribute('aria-pressed', 'true'); card.classList.add('is-selected'); }
  select.addEventListener('click', () => {
    selectedTask = task;
    document.querySelectorAll('.task-select').forEach(button => {
      const selected = button === select;
      button.setAttribute('aria-pressed', String(selected));
      button.closest('.task-card').classList.toggle('is-selected', selected);
    });
    continueButton.disabled = false;
  });
  const copy = element('div', 'task-copy');
  copy.append(element('h2', 'task-title', task.title), element('p', 'task-description', task.description));
  card.append(element('span', 'badge', task.period), copy, ProgressBar(task), select, DeleteTaskButton(task));
  return card;
}

function AddTaskButton(atLimit) {
  const button = element('button', 'button add-task');
  button.disabled = atLimit;
  button.setAttribute('aria-label', atLimit ? 'Add task — maximum of 3 active tasks reached' : 'Add task');
  const icon = document.createElement('img');
  icon.src = 'assets/add.svg';
  icon.alt = '';
  button.append(icon);
  button.id = 'add-task';
  button.addEventListener('click', openCreateTask);
  return button;
}

let selectedTask = null;
const continueButton = document.querySelector('#continue');
function renderTasks() {
  document.querySelector('#tasks').replaceChildren(...tasks.map(TaskCard), AddTaskButton(tasks.length >= 3));
  continueButton.disabled = !selectedTask;
}
renderTasks();
let timer = new FocusTimer();
const taskTimers = new WeakMap();
const selectionScreen = document.querySelector('#selection-screen');
const timerScreen = document.querySelector('#timer-screen');
const toggleButton = document.querySelector('#toggle-timer');
const announcement = document.querySelector('#announcement');
let tickHandle = null;
let sessionFinished = false;

function renderTimer() {
  const remaining = timer.read();
  document.querySelector('#countdown').textContent = timer.display;
  document.querySelector('#progress-circle').style.strokeDashoffset = 100 * (1 - timer.fraction);
  document.querySelector('#progress-circle').style.opacity = remaining ? '1' : '0';
  document.querySelector('#timer-progress').setAttribute('aria-valuenow', String(Math.round(timer.fraction * 100)));
  document.querySelector('#timer-progress').setAttribute('aria-valuetext', `${timer.display} remaining`);
  toggleButton.textContent = timer.running ? 'Pause' : 'Start';
  toggleButton.setAttribute('aria-label', timer.running ? 'Pause timer' : 'Start timer');
  toggleButton.disabled = remaining === 0;
  document.querySelector('#subtract').disabled = remaining === 0;
  document.querySelector('#focus-status').textContent = remaining === 0 ? 'Session complete • Your tree is ready!' : timer.running ? 'Focus mode active • Grow your forest' : 'Timer paused • Ready when you are';
  if (remaining === 0 && !sessionFinished) {
    sessionFinished = true;
    announcement.textContent = 'Focus session complete. Your tree is ready to water.';
    clearInterval(tickHandle); tickHandle = null;
  }
}
function startTicking() {
  clearInterval(tickHandle);
  tickHandle = setInterval(renderTimer, 100);
}
function openTimer() {
  if (!selectedTask) return;
  if (!taskTimers.has(selectedTask)) taskTimers.set(selectedTask,new FocusTimer());
  timer = taskTimers.get(selectedTask); sessionFinished = false;
  navigate('timer');
  document.querySelector('#activity-title').textContent = selectedTask.title;
  renderTimer();
  document.querySelector('#activity-title').focus({ preventScroll: true });
  window.scrollTo(0, 0);
}
function returnToActivities(completed = false) {
  timer.pause(); clearInterval(tickHandle); tickHandle = null;
  navigate('home');
  if (completed) {
    recordStreakDay();
    const title = selectedTask.title;
    completedTasks.push(selectedTask);
    tasks.splice(tasks.indexOf(selectedTask), 1);
    selectedTask = null;
    renderTasks();
    announcement.textContent = `${title} completed. You have room for a new task.`;
  }
  (completed ? document.querySelector('#add-task') : continueButton).focus({ preventScroll: true });
}
continueButton.addEventListener('click', openTimer);
toggleButton.addEventListener('click', () => {
  if (timer.running) { timer.pause(); clearInterval(tickHandle); tickHandle = null; }
  else { timer.start(); startTicking(); }
  renderTimer();
});

// Sample history maintains the original 14-day badge; daily completions are unique.
const streakState = {
  completedDays: new Set(Array.from({length:14},(_,i)=>StreakDates.key(StreakDates.shift(new Date(),-i-1)))),
  currentStreak: 0, longestStreak: 0, recentDays: []
};
const streakOverlay = document.querySelector('#streak-overlay');
const streakTrigger = document.querySelector('#streak-trigger');
function renderStreaks() {
  const today = new Date();
  Object.assign(streakState,StreakDates.summarize([...streakState.completedDays],today));
  document.querySelector('#streak-count').textContent = `${streakState.currentStreak}d`;
  streakTrigger.setAttribute('aria-label',`View streaks: ${streakState.currentStreak} days, longest ${streakState.longestStreak} days`);
  streakTrigger.title = `Current: ${streakState.currentStreak} days · Longest: ${streakState.longestStreak} days`;
  document.querySelector('.stake').lastChild.textContent = streakState.currentStreak ? `Day ${streakState.currentStreak} at stake!` : 'Start your streak!';
  document.querySelector('#streak-summary').textContent = `Current streak: ${streakState.currentStreak} days. Longest streak: ${streakState.longestStreak} days.`;
  document.querySelector('#calendar-month').textContent = today.toLocaleDateString('en-US',{month:'long',year:'numeric'});
  const first = new Date(today.getFullYear(),today.getMonth(),1,12);
  const start = StreakDates.shift(first,-first.getDay());
  const grid = document.querySelector('#calendar-days'); grid.replaceChildren();
  for(let i=0;i<42;i++) {
    const date = StreakDates.shift(start,i), dayKey = StreakDates.key(date);
    const active = streakState.completedDays.has(dayKey);
    const outside = date.getMonth() !== today.getMonth();
    const cell = element('div',`calendar-day${outside?' outside':''}`);
    cell.setAttribute('role','listitem');
    cell.setAttribute('aria-label',`${date.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}: ${active?'completed':dayKey>StreakDates.key(today)?'upcoming':'no activity'}`);
    if(dayKey === StreakDates.key(today))cell.setAttribute('aria-current','date');
    if(active) { const flame=document.createElement('img');flame.src='assets/calendar-flame.svg';flame.alt='';cell.append(flame); }
    else if(i>=first.getDay())cell.textContent=date.getDate();
    grid.append(cell);
  }
}
function recordStreakDay() { streakState.completedDays.add(StreakDates.key(new Date())); renderStreaks(); }
function openStreaks() {
  navigate('streaks');
  renderStreaks();
  document.querySelector('#streak-close').focus({preventScroll:true});window.scrollTo(0,0);
}
function closeStreaks() {
  navigate('home');streakTrigger.focus({preventScroll:true});
}
streakTrigger.addEventListener('click',openStreaks);
document.querySelector('#streak-back').addEventListener('click',closeStreaks);
document.querySelector('#streak-close').addEventListener('click',closeStreaks);
document.querySelector('.streak-backdrop').addEventListener('click',closeStreaks);
streakOverlay.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();closeStreaks();}
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)renderStreaks();});
renderStreaks();
function adjustTime(minutes) {
  timer.adjust(minutes); sessionFinished = false; renderTimer();
}
document.querySelector('#add').addEventListener('click', () => adjustTime(5));
document.querySelector('#subtract').addEventListener('click', () => adjustTime(-5));
document.querySelectorAll('[data-minutes]').forEach(button => button.addEventListener('click', () => adjustTime(Number(button.dataset.minutes))));
document.querySelector('#restart').addEventListener('click', () => {
  clearInterval(tickHandle); tickHandle = null; timer.reset(); sessionFinished = false; renderTimer();
  announcement.textContent = 'Timer reset to 30 minutes. Press Start when ready.';
});
document.querySelector('#cancel').addEventListener('click', () => returnToActivities());
document.querySelector('#complete').addEventListener('click', () => returnToActivities(true));
document.addEventListener('visibilitychange', () => { if (!timerScreen.hidden) renderTimer(); });

const completedTasks = [
  {title:'Coding Sprint',description:'Spend 20hrs coding across the week'},
  {title:'Deployment',description:'Successfully launched version 1.0 of the product'}
];
const createScreen = document.querySelector('#create-screen');
const createForm = document.querySelector('#create-form');
const nameInput = document.querySelector('#task-name');
const descriptionInput = document.querySelector('#task-description');
const hoursInput = document.querySelector('#task-hours');
const createSubmit = document.querySelector('#create-submit');
const createError = document.querySelector('#create-error');

function clearCreateForm() {
  createForm.reset();
  createError.hidden = true;
  createError.textContent = '';
  nameInput.removeAttribute('aria-invalid');
  createSubmit.disabled = true;
}
function openCreateTask() {
  if (tasks.length >= 3) {
    announcement.textContent = 'You already have 3 active tasks. Complete one to make room for a new task.';
    return;
  }
  clearCreateForm();
  navigate('create');
  document.querySelector('#create-heading').focus({ preventScroll: true });
  window.scrollTo(0, 0);
}
function closeCreateTask() {
  clearCreateForm();
  navigate('home');
  document.querySelector('#add-task').focus({ preventScroll: true });
}
document.querySelector('#cancel-create').addEventListener('click', closeCreateTask);
createScreen.addEventListener('keydown', event => {
  if (event.key === 'Escape') { event.preventDefault(); closeCreateTask(); }
});
nameInput.addEventListener('input', () => {
  createSubmit.disabled = !nameInput.value.trim();
  createError.hidden = true;
  nameInput.removeAttribute('aria-invalid');
});
createForm.addEventListener('submit', event => {
  event.preventDefault();
  if (createScreen.hidden) return;
  const title = nameInput.value.trim();
  const description = descriptionInput.value.trim();
  const hours = Number(hoursInput.value);
  if (![0.5, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24].includes(hours)) {
    createError.textContent = 'Choose a time target for your task.';
    createError.hidden = false;
    hoursInput.focus();
    return;
  }
  if (tasks.length >= 3 || !title || title.length > 80 || description.length > 500) {
    createError.textContent = tasks.length >= 3 ? 'You already have 3 active tasks. Complete one before adding another.' : !title ? 'Give your task a name to get started.' : 'Keep the name within 80 characters and the description within 500.';
    createError.hidden = false;
    if (!title || title.length > 80) { nameInput.setAttribute('aria-invalid', 'true'); nameInput.focus(); }
    return;
  }
  const task = { title, description, period: '1 Day', completed: 0, total: hours, label: `0hrs/${hours}hrs`, fillWidth: 0 };
  tasks.push(task);
  selectedTask = null;
  renderTasks();
  clearCreateForm();
  navigate('home');
  announcement.textContent = `${title} created. ${tasks.length} of 3 active tasks.`;
  document.querySelectorAll('.task-select')[tasks.length - 1].focus({ preventScroll: true });
});

let currentView = 'home';
const forestScreen = document.querySelector('#forest-screen');
function navigate(view) {
  if(currentView === 'timer' && view !== 'timer') {
    timer.pause();clearInterval(tickHandle);tickHandle=null;
  }
  if(currentView === 'create' && view !== 'create') clearCreateForm();
  currentView=view;
  selectionScreen.hidden = view !== 'home' && view !== 'streaks';
  timerScreen.hidden = view !== 'timer';
  createScreen.hidden = view !== 'create';
  forestScreen.hidden = view !== 'forest';
  streakOverlay.hidden = view !== 'streaks';
  selectionScreen.inert = view === 'streaks';
  document.querySelector('.header').inert=false;
  document.querySelector('.app').classList.toggle('timer-view',view==='timer');
  document.querySelector('#forest-back').hidden = view !== 'forest';
  streakTrigger.disabled = view === 'streaks';
  if(view==='home')renderTasks();
  window.scrollTo(0,0);
}
function ForestCard(task, completed) {
  const card=element('article','forest-card');
  const tree=document.createElement('img');tree.src='assets/tree.png';tree.alt='';tree.width=56;tree.height=56;
  const content=element('div','forest-card-content');
  const copy=element('div','task-copy');
  copy.append(element('h2','task-title',task.title),element('p','task-description',task.description));
  content.append(element('span','badge',completed?'Completed':'In progress'),copy);
  card.append(tree,content,DeleteTaskButton(task));
  if(!completed) {
    const action=element('button','forest-task-action');action.setAttribute('aria-label',`Continue ${task.title}`);
    action.addEventListener('click',()=>{selectedTask=task;openTimer();});card.append(action);
  }
  return card;
}
function renderForest() {
  document.querySelector('#forest-list').replaceChildren(...tasks.map(task=>ForestCard(task,false)),...completedTasks.map(task=>ForestCard(task,true)));
}
function openForest() {
  renderForest();
  navigate('forest');forestScreen.focus({preventScroll:true});
}
document.querySelector('#view-forest').addEventListener('click',openForest);
document.querySelector('#forest-back').addEventListener('click',openStreaks);
document.querySelector('#home-button').addEventListener('click',()=>{
  if(currentView==='home'){window.location.reload();return;}
  navigate('home');document.querySelector('#home-button').focus({preventScroll:true});
});

let pendingDeleteTask = null;
let deleteOpener = null;
const deleteModal = document.querySelector('#delete-modal');
function DeleteTaskButton(task) {
  const button = element('button','task-delete absolute top-2 right-2');
  button.type = 'button';
  button.setAttribute('aria-label',`Delete ${task.title}`);
  button.title = 'Delete task';
  button.textContent = '×';
  button.addEventListener('click',event=>{
    event.stopPropagation();
    pendingDeleteTask = task; deleteOpener = button;
    document.querySelector('#delete-task-name').textContent = task.title;
    deleteModal.hidden = false; deleteModal.classList.remove('hidden');
    setDeleteBackgroundInert(true);
    document.querySelector('#cancel-delete').focus({preventScroll:true});
  });
  return button;
}
function setDeleteBackgroundInert(value) {
  for(const child of document.querySelector('.app').children) {
    if(child !== deleteModal)child.inert = value;
  }
  if(!value)selectionScreen.inert = currentView === 'streaks';
}
function closeDeleteModal(restoreFocus=true) {
  deleteModal.hidden=true;deleteModal.classList.add('hidden');
  pendingDeleteTask=null;
  setDeleteBackgroundInert(false);
  if(restoreFocus && deleteOpener?.isConnected)deleteOpener.focus({preventScroll:true});
  deleteOpener=null;
}
document.querySelector('#cancel-delete').addEventListener('click',()=>closeDeleteModal());
document.querySelector('#delete-backdrop').addEventListener('click',()=>closeDeleteModal());
document.querySelector('#confirm-delete').addEventListener('click',()=>{
  const task=pendingDeleteTask;
  if(!task)return;
  const activeIndex=tasks.indexOf(task), completedIndex=completedTasks.indexOf(task);
  if(activeIndex!==-1)tasks.splice(activeIndex,1);
  if(completedIndex!==-1)completedTasks.splice(completedIndex,1);
  taskTimers.delete(task);
  if(selectedTask===task)selectedTask=null;
  closeDeleteModal(false);
  renderTasks();renderForest();
  announcement.textContent=`${task.title} deleted. ${tasks.length} of 3 active tasks.`;
  const next=currentView==='forest'?document.querySelector('#forest-list .task-delete')||document.querySelector('#home-button'):document.querySelector('#add-task');
  next.focus({preventScroll:true});
});
deleteModal.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();closeDeleteModal();}
  if(event.key==='Tab'){
    event.preventDefault();
    const cancel=document.querySelector('#cancel-delete'),confirm=document.querySelector('#confirm-delete');
    (document.activeElement===cancel?confirm:cancel).focus();
  }
});
