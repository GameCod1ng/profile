// ============================================================
// To-Do 앱 전체 흐름
//
//   사용자 입력 ──▶ todos(배열) 변경 ──▶ saveTodos() ──▶ render()
//
//  [1] 페이지 열림      → loadTodos(), applyTheme(), render()
//  [2] 추가/Enter       → addTodo()      새 할 일을 todos에 넣기
//  [3] 체크박스         → toggleTodo(id) 완료 ↔ 진행중
//  [4] 삭제 버튼        → deleteTodo(id) 그 할 일만 지우기
//  [5] 전체/진행중/완료  → setFilter()    보여줄 목록만 바꾸기
//  [6] 다크 모드 버튼    → toggleTheme()  <html data-theme> 바꾸기
//
//  지킬 규칙: ① 삭제·체크는 순서 번호(index)가 아니라 고유 id로 찾는다
//            ② 저장할 때 completed까지 함께 저장한다
//            ③ 남은 개수는 "완료 안 된 것"만 센다
// ============================================================

// ---------- 상태(앱이 기억하는 데이터) ----------
let todos = [];              // 할 일 목록 (유일한 진짜 데이터)
let currentFilter = 'all';   // 'all' | 'active' | 'completed'

const TODO_KEY = 'todo-app-items';     // 브라우저에 저장할 때 쓰는 이름표
const THEME_KEY = 'todo-app-theme';

// ---------- 화면 요소 ----------
const $ = (id) => document.getElementById(id);
const listEl = $('todo-list');
const inputEl = $('todo-input');

// ---------- 저장/불러오기 (브라우저 localStorage, 서버/DB 아님) ----------
function saveTodos() {
  try { localStorage.setItem(TODO_KEY, JSON.stringify(todos)); } catch (e) { /* 저장 불가 환경이면 무시 */ }
}

function loadTodos() {
  try {
    const data = JSON.parse(localStorage.getItem(TODO_KEY) || '[]');
    // 모양이 맞는 것만 복원 (저장 데이터가 깨져도 앱이 멈추지 않게)
    todos = Array.isArray(data)
      ? data
          .filter((t) => t && typeof t.id === 'string' && typeof t.text === 'string')
          .map((t) => ({ id: t.id, text: t.text, completed: t.completed === true }))
      : [];
  } catch (e) {
    todos = [];
  }
}

// ---------- [2] 추가 ----------
function addTodo(rawText) {
  const text = rawText.trim();
  if (text === '') return false;           // 빈 글자/공백만이면 추가 안 함

  todos.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),  // 겹치지 않는 고유 번호
    text: text,
    completed: false,
  });
  saveTodos();
  render();
  return true;
}

// ---------- [3] 완료 토글 ----------
function toggleTodo(id) {
  const t = todos.find((item) => item.id === id);
  if (!t) return;
  t.completed = !t.completed;
  saveTodos();
  render();
}

// ---------- [4] 삭제 (id로 찾아서 지우기) ----------
function deleteTodo(id) {
  todos = todos.filter((item) => item.id !== id);
  saveTodos();
  render();
}

function clearCompleted() {
  todos = todos.filter((item) => !item.completed);
  saveTodos();
  render();
}

// ---------- [5] 필터 ----------
function setFilter(type) {
  currentFilter = type;
  render();
}

// ---------- 화면 그리기: todos를 보고 화면을 처음부터 다시 그린다 ----------
function render() {
  const total = todos.length;
  const doneCount = todos.filter((t) => t.completed).length;
  const activeCount = total - doneCount;

  // 현재 필터에 맞는 목록만 고르기
  const shown = todos.filter((t) =>
    currentFilter === 'all' ? true : currentFilter === 'active' ? !t.completed : t.completed
  );

  // 목록 그리기
  listEl.innerHTML = '';
  if (shown.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = {
      all: '할 일이 없어요. 위에 하나 적어 볼까요? ✍️',
      active: '진행중인 할 일이 없어요 🎉',
      completed: '완료한 할 일이 아직 없어요',
    }[currentFilter];
    listEl.appendChild(empty);
  }
  shown.forEach((todo) => listEl.appendChild(createItem(todo)));

  // 숫자/게이지/탭 상태 갱신
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);
  $('remain-count').textContent = `남은 할 일: ${activeCount}개`;
  $('gauge-text').textContent = `오늘 달성률 ${percent}% (${doneCount}/${total})`;
  $('gauge-bar').style.width = percent + '%';
  $('stat-all').textContent = total;
  $('stat-active').textContent = activeCount;
  $('stat-done').textContent = doneCount;
  $('clear-done').disabled = doneCount === 0;
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.filter === currentFilter);
  });
}

// 할 일 한 줄(li) 만들기: 체크박스 + 글자 + 삭제 버튼
function createItem(todo) {
  const li = document.createElement('li');
  li.className = 'todo-item' + (todo.completed ? ' completed' : '');

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.checked = todo.completed;
  check.setAttribute('aria-label', '완료 표시');
  check.addEventListener('change', () => toggleTodo(todo.id));      // index가 아니라 id 전달

  const text = document.createElement('span');
  text.className = 'todo-text';
  text.textContent = todo.text;                                      // textContent: 입력한 글자가 코드로 실행되지 않음

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'del-btn';
  del.textContent = '삭제';
  del.addEventListener('click', () => deleteTodo(todo.id));          // index가 아니라 id 전달

  li.append(check, text, del);
  return li;
}

// ---------- [6] 다크 모드 ----------
function applyTheme(theme) {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
  $('theme-icon').textContent = theme === 'dark' ? '☀️' : '🌙';
  $('theme-text').textContent = theme === 'dark' ? '라이트 모드' : '다크 모드';
}

function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* 무시 */ }
}

function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) { /* 무시 */ }
  const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (systemDark ? 'dark' : 'light'));   // 저장된 값 → 없으면 시스템 설정
}

// ---------- 버튼 연결 (이벤트 리스너) ----------
$('add-form').addEventListener('submit', (e) => {
  e.preventDefault();                   // form 기본 동작(페이지 새로고침) 막기
  if (addTodo(inputEl.value)) inputEl.value = '';
  inputEl.focus();
});
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => setFilter(tab.dataset.filter));
});
$('clear-done').addEventListener('click', clearCompleted);
$('theme-btn').addEventListener('click', toggleTheme);

// ---------- 시작! ----------
$('today').textContent = new Date().toLocaleDateString('ko-KR', {
  year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
});
initTheme();
loadTodos();
render();
