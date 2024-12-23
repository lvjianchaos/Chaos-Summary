// background.js

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'Chaos-Summary',
        title: '总结选中的文本',
        contexts: ['selection']
    });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'Chaos-Summary') {
        const selectionText = info.selectionText;
        console.log('选中文本:', selectionText); // 添加日志
        if (!selectionText) {
            // 发送消息到内容脚本显示错误弹窗
            chrome.tabs.sendMessage(tab.id, { action: 'displayPopup', summary: '未检测到选中文本。' });
            return;
        }

        // 检查缓存
        const cachedSummary = await getCachedSummary(selectionText);
        if (cachedSummary) {
            console.log('从缓存获取摘要');
            chrome.tabs.sendMessage(tab.id, { action: 'displayPopup', summary: cachedSummary });
            return;
        }

        // 发送消息显示加载指示器
        console.log('发送生成中消息');
        chrome.tabs.sendMessage(tab.id, { action: 'displayPopup', summary: '生成中...' });

        // 调用 API 生成摘要
        const summary = await callGLMAPI(selectionText);
        console.log('API 返回摘要:', summary);

        // 缓存摘要
        if (!summary.startsWith('抱歉')) {
            cacheSummary(selectionText, summary);
        }

        // 发送消息显示摘要
        chrome.tabs.sendMessage(tab.id, { action: 'displayPopup', summary: summary });
    }
});

async function callGLMAPI(text) {
    try {
        // 获取用户设置
        const settings = await new Promise((resolve) => {
            chrome.storage.sync.get(['detailLevel'], resolve);
        });

        let prompt = `请提取以下文本中的中文大纲，使用清晰的分级标题和子标题 (如 I、II、III 或 1、1.1、1.2 等),标题间用换行符分隔。如果文本逻辑清晰，请保留文本的结构层级，内容要点保持完整。\n文本内容\n${text}`;

        if (settings.detailLevel === 'short') {
            prompt = `请为以下文本生成一个简短的中文大纲。\n文本内容\n${text}`;
        } else if (settings.detailLevel === 'detailed') {
            prompt = `请为以下文本生成一个详细的中文大纲，包含所有关键点和子标题。\n文本内容\n${text}`;
        }

        const res = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer dc808a0285fb6b67e015219b2b8f184d.Uqz1qjwXBin1KrlP' // 请确保 API 密钥正确
            },
            body: JSON.stringify({
                model: 'glm-4-flash', // 修正模型名称
                messages: [ // 修正字段名为 'messages'
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        const data = await res.json();

        if (!res.ok) {
            console.error('API 响应错误:', data);
            throw new Error(`API 错误: ${res.statusText}`);
        }

        // 确保返回的数据结构正确
        if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
            return data.choices[0].message.content;
        } else {
            console.error('API 返回的数据结构不正确:', data);
            throw new Error('API 返回的数据结构不正确');
        }

    } catch (error) {
        console.error('调用 API 失败:', error);
        return '抱歉，无法生成总结。请稍后再试。';
    }
}

// 缓存摘要到 chrome.storage.local
function cacheSummary(text, summary) {
    chrome.storage.local.get(['summaryCache'], (data) => {
        const summaryCache = data.summaryCache || {};
        summaryCache[text] = summary;
        chrome.storage.local.set({ summaryCache: summaryCache }, () => {
            console.log('摘要已缓存');
        });
    });
}

// 从缓存中获取摘要
function getCachedSummary(text) {
    return new Promise((resolve) => {
        chrome.storage.local.get(['summaryCache'], (data) => {
            const summaryCache = data.summaryCache || {};
            resolve(summaryCache[text] || null);
        });
    });
}
