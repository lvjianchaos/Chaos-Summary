// options.js

document.addEventListener('DOMContentLoaded', () => {
    const detailLevel = document.getElementById('detail-level');
    const themeColor = document.getElementById('theme-color');
    const saveBtn = document.getElementById('save-btn');
    const status = document.getElementById('status');

    // 加载保存的设置
    chrome.storage.sync.get(['detailLevel', 'themeColor'], (data) => {
        if (data.detailLevel) detailLevel.value = data.detailLevel;
        if (data.themeColor) themeColor.value = data.themeColor;
    });

    // 保存设置
    saveBtn.addEventListener('click', () => {
        chrome.storage.sync.set({
            detailLevel: detailLevel.value,
            themeColor: themeColor.value
        }, () => {
            status.textContent = '设置已保存。';
            setTimeout(() => { status.textContent = ''; }, 2000);
        });
    });
});
