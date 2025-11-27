// 全域變數
let drugs = [];
// 定義表單欄位對應的 JSON key
const fields = [
    'generic_name', 'brand_name_en', 'brand_name_zh', 
    'atc_code', 'nhi_code', 'category', 'pregnancy_category', 
    'mechanism', 'indication', 'side_effect', 'precautions'
];

// 頁面載入後執行
document.addEventListener('DOMContentLoaded', () => {
    // 初始化：讀取目前的 JSON 檔案
    fetch('drugs.json')
        .then(response => {
            if (!response.ok) throw new Error("HTTP error " + response.status);
            return response.json();
        })
        .then(data => {
            drugs = data;
            renderList();
        })
        .catch(err => {
            console.error(err);
            alert('讀取失敗：找不到 drugs.json。\n請確保檔案在同一個資料夾中，並使用 Server 模式開啟 (如 Live Server)。');
        });
});

// 1. 渲染左側列表
function renderList(filterText = '') {
    const listEl = document.getElementById('drugList');
    listEl.innerHTML = '';
    
    // 依搜尋條件過濾
    const filtered = drugs.filter(d => 
        (d.generic_name && d.generic_name.toLowerCase().includes(filterText.toLowerCase())) || 
        (d.brand_name_zh && d.brand_name_zh.includes(filterText))
    );

    filtered.forEach(d => {
        const li = document.createElement('li');
        li.className = 'list-item';
        // 如果這個項目是目前編輯的，加上 active
        const currentId = document.getElementById('id').value;
        if(d.id == currentId) li.classList.add('active');

        li.innerHTML = `<b>${d.generic_name}</b><small>${d.brand_name_zh || ''}</small>`;
        li.onclick = () => loadForm(d.id);
        listEl.appendChild(li);
    });
}

// 2. 載入表單資料
function loadForm(id) {
    // 切換 UI 顯示
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('editorArea').classList.add('show');
    
    // 處理列表 Active 狀態
    document.querySelectorAll('.list-item').forEach(el => el.classList.remove('active'));
    renderList(document.getElementById('searchBox').value); // 重繪以更新 active 樣式 (稍微沒效率但簡單)

    const drug = drugs.find(d => d.id === id);
    if(!drug) return;

    // 填入資料
    document.getElementById('editTitle').textContent = "編輯藥物";
    document.getElementById('displayId').textContent = drug.id;
    document.getElementById('id').value = drug.id;

    fields.forEach(f => {
        document.getElementById(f).value = drug[f] || '';
    });
}

// 3. 新增模式
function addNew() {
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('editorArea').classList.add('show');
    document.querySelectorAll('.list-item').forEach(el => el.classList.remove('active'));

    document.getElementById('editTitle').textContent = "新增藥物";
    document.getElementById('displayId').textContent = "New";
    document.getElementById('drugForm').reset();
    document.getElementById('id').value = 'new';
    
    // 游標自動聚焦在第一個欄位
    document.getElementById('generic_name').focus();
}

// 4. 儲存功能 (更新陣列)
function saveDrug(e) {
    e.preventDefault(); // 防止表單送出刷新頁面
    
    const idVal = document.getElementById('id').value;
    const newObj = {};
    
    // 從表單收集資料
    fields.forEach(f => newObj[f] = document.getElementById(f).value);

    if (idVal === 'new') {
        // 新增：自動產生 ID (找目前最大 ID + 1)
        const maxId = drugs.length > 0 ? Math.max(...drugs.map(d => d.id)) : 0;
        newObj.id = maxId + 1;
        drugs.push(newObj);
        
        // 更新當前表單的 ID，變成編輯模式
        document.getElementById('id').value = newObj.id;
        document.getElementById('displayId').textContent = newObj.id;
    } else {
        // 修改：找到原本的索引位置並覆蓋
        const idx = drugs.findIndex(d => d.id == idVal);
        if (idx > -1) {
            newObj.id = parseInt(idVal);
            drugs[idx] = newObj;
        }
    }
    
    // 重新整理列表並保持搜尋狀態
    renderList(document.getElementById('searchBox').value);
    showToast('修改已暫存！記得下載檔案。');
}

// 5. 刪除功能
function deleteDrug() {
    const id = document.getElementById('id').value;
    if (id === 'new') {
        // 如果是正在新增還沒存，直接清空就好
        document.getElementById('drugForm').reset();
        return;
    }

    if(!confirm('確定要刪除這筆資料嗎？此動作無法復原。')) return;
    
    const parsedId = parseInt(id);
    drugs = drugs.filter(d => d.id !== parsedId);
    
    // 刪除後回到空白狀態
    renderList(document.getElementById('searchBox').value);
    document.getElementById('editorArea').classList.remove('show');
    document.getElementById('emptyState').style.display = 'flex';
    showToast('資料已刪除');
}

// 6. 列表搜尋過濾
function filterList() {
    renderList(document.getElementById('searchBox').value);
}

// 7. 核心功能：下載 JSON
function downloadJSON() {
    // 將物件轉為漂亮的 JSON 字串
    const dataStr = JSON.stringify(drugs, null, 4);
    
    // 建立 Blob 物件
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // 建立暫時的下載連結並點擊
    const a = document.createElement('a');
    a.href = url;
    a.download = 'drugs.json';
    document.body.appendChild(a);
    a.click();
    
    // 清理資源
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('檔案已下載！\n請將下載的 drugs.json 覆蓋掉原本資料夾中的檔案即可完成更新。');
}

// 顯示提示訊息 (Toast)
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.style.display = 'block';
    
    // 3秒後消失
    setTimeout(() => {
        t.style.display = 'none';
    }, 3000);
}
