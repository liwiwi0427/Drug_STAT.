document.addEventListener('DOMContentLoaded', () => {
    let drugsData = [];
    const grid = document.getElementById('grid');
    const searchInput = document.getElementById('searchInput');
    const modal = document.getElementById('modal');
    
    // 1. 讀取資料
    fetch('drugs.json')
        .then(res => res.json())
        .then(data => {
            drugsData = data;
            renderDrugs(drugsData);
        })
        .catch(err => {
            console.error(err);
            grid.innerHTML = '<p style="text-align:center;width:100%;">讀取資料失敗，請確認 drugs.json 存在。</p>';
        });

    // 2. 渲染卡片
    function renderDrugs(list) {
        grid.innerHTML = '';
        if(list.length === 0) {
            grid.innerHTML = '<p style="color:#888; text-align:center;">找不到相關藥物</p>';
            return;
        }

        list.forEach(drug => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.innerHTML = `
                <span class="atc-small">${drug.atc_code || ''}</span>
                <h3>${drug.generic_name}</h3>
                <div class="sub">${drug.brand_name_en}</div>
                <div class="zh">${drug.brand_name_zh}</div>
            `;
            card.onclick = () => showDetail(drug);
            grid.appendChild(card);
        });
    }

    // 3. 搜尋功能
    searchInput.addEventListener('input', (e) => {
        const k = e.target.value.toLowerCase();
        const filtered = drugsData.filter(d => 
            d.generic_name.toLowerCase().includes(k) ||
            d.brand_name_en.toLowerCase().includes(k) ||
            d.brand_name_zh.includes(k) ||
            (d.nhi_code && d.nhi_code.toLowerCase().includes(k)) ||
            (d.indication && d.indication.includes(k))
        );
        renderDrugs(filtered);
    });

    // 4. 分類按鈕
    document.querySelectorAll('#catGroup button').forEach(btn => {
        btn.onclick = () => {
            document.querySelector('#catGroup .active').classList.remove('active');
            btn.classList.add('active');
            const cat = btn.dataset.cat;
            if(cat === 'all') renderDrugs(drugsData);
            else renderDrugs(drugsData.filter(d => d.category.includes(cat)));
        };
    });

    // 5. 顯示詳情 (Modal)
    function showDetail(d) {
        document.getElementById('m-name').textContent = d.generic_name;
        document.getElementById('m-en').textContent = d.brand_name_en;
        document.getElementById('m-zh').textContent = d.brand_name_zh;
        document.getElementById('m-atc').textContent = d.atc_code;
        document.getElementById('m-nhi').textContent = d.nhi_code || '無資料';
        document.getElementById('m-mech').textContent = d.mechanism;
        document.getElementById('m-ind').textContent = d.indication;
        document.getElementById('m-side').textContent = d.side_effect;
        document.getElementById('m-warn').textContent = d.precautions;

        // 孕婦分級上色
        const pBadge = document.getElementById('m-preg');
        const cat = d.pregnancy_category || '?';
        pBadge.textContent = `Cat. ${cat}`;
        pBadge.className = 'badge-preg'; // 重置 class
        
        if(['A','B'].includes(cat)) pBadge.classList.add('preg-A');
        else if(cat === 'C') pBadge.classList.add('preg-C');
        else if(['D','X'].includes(cat)) pBadge.classList.add('preg-D');

        modal.style.display = 'block';
    }

    // 關閉 Modal
    document.getElementById('closeBtn').onclick = () => modal.style.display = 'none';
    window.onclick = (e) => { if(e.target == modal) modal.style.display = 'none'; };
});
