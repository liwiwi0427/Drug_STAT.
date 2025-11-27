document.addEventListener('DOMContentLoaded', () => {
    let allDrugs = [];
    let favorites = JSON.parse(localStorage.getItem('favDrugs')) || []; // 讀取收藏
    let currentMode = 'all'; // 'all' or 'fav'
    let currentCategory = 'all';

    const grid = document.getElementById('grid');
    const searchInput = document.getElementById('searchInput');
    const modal = document.getElementById('modal');
    const emptyMsg = document.getElementById('emptyMsg');

    // 1. 初始化
    fetch('drugs.json')
        .then(r => r.json())
        .then(data => {
            allDrugs = data;
            renderGrid();
        });

    // 檢查夜間模式設定
    if (localStorage.getItem('theme') === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('themeBtn').textContent = '☀️';
    }

    // 2. 核心渲染函式
    function renderGrid() {
        grid.innerHTML = '';
        const keyword = searchInput.value.toLowerCase();
        
        // 篩選邏輯：搜尋 + 分類 + 是否收藏
        let filtered = allDrugs.filter(d => {
            const matchSearch = (
                d.generic_name.toLowerCase().includes(keyword) ||
                d.brand_name_zh.includes(keyword) ||
                (d.nhi_code && d.nhi_code.toLowerCase().includes(keyword)) ||
                d.indication.includes(keyword)
            );
            const matchCat = currentCategory === 'all' || d.category.includes(currentCategory);
            const matchFav = currentMode === 'all' || favorites.includes(d.id);

            return matchSearch && matchCat && matchFav;
        });

        // 空白狀態處理
        if (filtered.length === 0) {
            emptyMsg.style.display = 'block';
            emptyMsg.querySelector('p').textContent = currentMode === 'fav' 
                ? "你還沒有收藏任何藥物喔！" 
                : "找不到相關藥物。";
        } else {
            emptyMsg.style.display = 'none';
        }

        // 產生卡片
        filtered.forEach((d, index) => {
            const isFav = favorites.includes(d.id);
            const card = document.createElement('div');
            card.className = 'card';
            // 加上動畫延遲，讓卡片一張張出現
            card.style.animationDelay = `${index * 0.05}s`;
            
            card.innerHTML = `
                <div class="card-header">
                    <h3>${d.generic_name}</h3>
                    <button class="card-fav ${isFav ? 'active' : ''}" onclick="toggleFav(event, ${d.id})">
                        ${isFav ? '❤️' : '🤍'}
                    </button>
                </div>
                <div class="sub">${d.brand_name_en}</div>
                <div class="zh">${d.brand_name_zh}</div>
                <div class="card-atc">${d.atc_code || ''}</div>
            `;
            // 點擊卡片本體打開詳情 (排除愛心按鈕)
            card.addEventListener('click', (e) => {
                if(!e.target.classList.contains('card-fav')) openModal(d);
            });
            grid.appendChild(card);
        });
    }

    // 3. 收藏功能 (Toggle)
    window.toggleFav = function(e, id) {
        e.stopPropagation(); // 阻止冒泡開啟 Modal
        if (favorites.includes(id)) {
            favorites = favorites.filter(fid => fid !== id);
        } else {
            favorites.push(id);
        }
        localStorage.setItem('favDrugs', JSON.stringify(favorites));
        renderGrid(); // 重新渲染愛心狀態
    };

    // 4. Modal 詳情
    function openModal(d) {
        const isFav = favorites.includes(d.id);
        
        document.getElementById('m-name').textContent = d.generic_name;
        document.getElementById('m-en').textContent = d.brand_name_en;
        document.getElementById('m-zh').textContent = d.brand_name_zh;
        document.getElementById('m-atc').textContent = d.atc_code;
        document.getElementById('m-nhi').textContent = d.nhi_code || 'N/A';
        document.getElementById('m-mech').textContent = d.mechanism;
        document.getElementById('m-ind').textContent = d.indication;
        document.getElementById('m-side').textContent = d.side_effect;
        document.getElementById('m-warn').textContent = d.precautions;

        // Modal 裡的愛心按鈕
        const favBtn = document.getElementById('modalFavBtn');
        favBtn.textContent = isFav ? '❤️' : '🤍';
        favBtn.className = isFav ? 'fav-icon active' : 'fav-icon';
        favBtn.onclick = (e) => {
            toggleFav(e, d.id);
            openModal(d); // 刷新按鈕狀態
        };

        // 孕婦分級 Badge 顏色
        const pBadge = document.getElementById('m-preg');
        const cat = (d.pregnancy_category || '?').toUpperCase();
        pBadge.textContent = `Cat. ${cat}`;
        pBadge.className = 'badge'; // reset
        if(['A','B'].includes(cat)) pBadge.classList.add('cat-A');
        else if(cat === 'C') pBadge.classList.add('cat-C');
        else if(['D','X'].includes(cat)) pBadge.classList.add('cat-D');

        modal.style.display = 'block';
    }

    // 5. 事件監聽
    searchInput.addEventListener('input', renderGrid);

    // 分類按鈕
    document.querySelectorAll('#catGroup button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('#catGroup .active').classList.remove('active');
            btn.classList.add('active');
            currentCategory = btn.dataset.cat;
            renderGrid();
        });
    });

    // 頁籤切換 (全部 vs 收藏)
    document.getElementById('tabAll').addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('tabFav').classList.remove('active');
        currentMode = 'all';
        renderGrid();
    });
    document.getElementById('tabFav').addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('tabAll').classList.remove('active');
        currentMode = 'fav';
        renderGrid();
    });

    // 夜間模式
    document.getElementById('themeBtn').addEventListener('click', () => {
        const body = document.body;
        if (body.hasAttribute('data-theme')) {
            body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            document.getElementById('themeBtn').textContent = '🌙';
        } else {
            body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            document.getElementById('themeBtn').textContent = '☀️';
        }
    });

    // 隨機抽卡
    document.getElementById('randomBtn').addEventListener('click', () => {
        if(allDrugs.length > 0) {
            const randomDrug = allDrugs[Math.floor(Math.random() * allDrugs.length)];
            openModal(randomDrug);
        }
    });

    // 關閉 Modal
    document.getElementById('closeBtn').addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => { if(e.target == modal) modal.style.display = 'none'; });
});
