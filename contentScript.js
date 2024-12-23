// contentScript.js

function displayPopup(summary) {
    let popup = document.getElementById('ai-response');

    if (!popup) {
        // 创建弹窗容器
        popup = document.createElement('div');
        popup.id = 'ai-response';
        popup.setAttribute('role', 'dialog');
        popup.setAttribute('aria-modal', 'true');
        popup.setAttribute('aria-labelledby', 'ai-response-title');
        popup.style.cssText = `
            position: fixed;
            top: 10px;
            right: 20px;
            z-index: 10000;
            padding: 20px;
            max-width: 400px;
            max-height: 600px;
            background-color: #AFD;
            border-radius: 8px;
            overflow-y: auto;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            color: black;
            font-size: 14px;
            font-family: Arial, sans-serif;
        `;
        document.body.appendChild(popup);
    }

    // 获取或创建弹窗内部的各个部分
    let title = popup.querySelector('#ai-response-title');
    let loadingDiv = popup.querySelector('#glm-loading');
    let summaryPre = popup.querySelector('#glm-summary');
    let copyBtn = popup.querySelector('#glm-copy-btn');
    let closeBtnTop = popup.querySelector('#glm-close-btn');
    let closeBtnBottom = popup.querySelector('#glm-close-btn-bottom');

    // 如果是第一次创建内容
    if (!title) {
        popup.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong id="ai-response-title">文本总结如下:</strong>
                <button id="glm-close-btn" style="
                    border: none; 
                    background: none;
                    font-size: 16px;
                    cursor: pointer;
                " aria-label="关闭">&times;</button>
            </div>
            <div id="glm-loading" style="margin: 10px 0;">
                <span>生成中...</span>
            </div>
            <pre id="glm-summary" style="margin: 10px 0; white-space: pre-wrap; display: none;">${summary}</pre>
            <div style="display: flex; justify-content: flex-end; gap: 10px; display: none;">
                <button id="glm-copy-btn" style="
                    border: none; 
                    padding: 8px 12px;
                    border-radius: 5px;
                    color: white;
                    background-color: #28a745;
                    cursor: pointer;
                ">复制</button>
                <button id="glm-close-btn-bottom" style="
                    border: none; 
                    padding: 8px 12px;
                    border-radius: 5px;
                    color: white;
                    background-color: #007bff;
                    cursor: pointer;
                ">关闭</button>
            </div>
        `;

        // 重新获取元素引用
        title = popup.querySelector('#ai-response-title');
        loadingDiv = popup.querySelector('#glm-loading');
        summaryPre = popup.querySelector('#glm-summary');
        copyBtn = popup.querySelector('#glm-copy-btn');
        closeBtnTop = popup.querySelector('#glm-close-btn');
        closeBtnBottom = popup.querySelector('#glm-close-btn-bottom');

        // 关闭按钮事件监听
        closeBtnTop.addEventListener('click', () => {
            popup.remove();
        });

        closeBtnBottom.addEventListener('click', () => {
            popup.remove();
        });

        // 复制按钮事件监听
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const summaryText = summaryPre.textContent;
                navigator.clipboard.writeText(summaryText).then(() => {
                    alert('摘要已复制到剪贴板。');
                }).catch(err => {
                    console.error('复制失败:', err);
                });
            });
        }
    }

    // 更新弹窗内容
    if (summary === '生成中...') {
        // 显示加载指示器，隐藏摘要和复制按钮
        loadingDiv.style.display = 'block';
        summaryPre.style.display = 'none';
        popup.querySelector('div[style*="flex-end"]').style.display = 'none';
    } else if (summary === '未检测到选中文本。' || summary.startsWith('抱歉')) {
        // 显示错误信息，隐藏加载指示器和复制按钮
        loadingDiv.style.display = 'none';
        summaryPre.style.display = 'block';
        summaryPre.textContent = summary;
        popup.querySelector('div[style*="flex-end"]').style.display = 'none';
    } else {
        // 显示摘要内容和复制按钮，隐藏加载指示器
        loadingDiv.style.display = 'none';
        summaryPre.style.display = 'block';
        summaryPre.textContent = summary;
        popup.querySelector('div[style*="flex-end"]').style.display = 'flex';
    }
}

// 监听来自后台的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'displayPopup') {
        console.log('收到消息:', request.summary); // 添加日志
        displayPopup(request.summary);
    }
});
