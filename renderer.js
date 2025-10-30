// renderer.js
const listEl = document.getElementById('list');
const titleEl = document.getElementById('title');
const contentEl = document.getElementById('content');
const newBtn = document.getElementById('newBtn');
const delBtn = document.getElementById('delBtn');
const statusEl = document.getElementById('status');

let notes = [];
let activeId = null;
let saveTimer = null;

function loadNotes() {
  try {
    notes = JSON.parse(localStorage.getItem('desktop-memo-notes') || '[]');
  } catch (e) {
    notes = [];
  }
}

function saveNotes() {
  localStorage.setItem('desktop-memo-notes', JSON.stringify(notes));
  statusEl.textContent = '保存済み';
}

function renderList() {
  listEl.innerHTML = '';
  notes.forEach(n => {
    const el = document.createElement('div');
    el.className = 'note-item' + (n.id === activeId ? ' active' : '');
    el.textContent = (n.title && n.title.trim()) ? n.title : (n.content ? n.content.substring(0,30) : '（無題）');
    el.addEventListener('click', () => selectNote(n.id));
    listEl.appendChild(el);
  });
}

function selectNote(id) {
  activeId = id;
  const n = notes.find(x => x.id === id);
  titleEl.value = n.title || '';
  contentEl.value = n.content || '';
  renderList();
}

function newNote() {
  const n = { id: Date.now(), title: '', content: '' };
  notes.unshift(n);
  selectNote(n.id);
  saveNotes();
}

function deleteNote() {
  if (!activeId) return;
  notes = notes.filter(n => n.id !== activeId);
  activeId = notes.length ? notes[0].id : null;
  if (activeId) {
    selectNote(activeId);
  } else {
    titleEl.value = '';
    contentEl.value = '';
  }
  saveNotes();
  renderList();
}

function scheduleSave() {
  statusEl.textContent = '編集中...';
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const n = notes.find(x => x.id === activeId);
    if (n) {
      n.title = titleEl.value;
      n.content = contentEl.value;
      saveNotes();
      renderList();
    }
  }, 700);
}

newBtn.addEventListener('click', newNote);
delBtn.addEventListener('click', () => {
  if (confirm('選択中のメモを削除しますか？')) deleteNote();
});

titleEl.addEventListener('input', scheduleSave);
contentEl.addEventListener('input', scheduleSave);

// 初期化
loadNotes();
if (notes.length) {
  selectNote(notes[0].id);
}
renderList();
