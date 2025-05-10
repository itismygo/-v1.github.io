document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const darkModeToggle = document.querySelector('.dark-mode-toggle');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchResultsDiv = document.getElementById('searchResults');
    const promptFileInput = document.getElementById('promptFileInput'); // 用于选择 prompt 文件的 input
    let fixedPrompt = localStorage.getItem('fixedPrompt') || ''; // 尝试从 localStorage 加载 prompt
    let isSearching = false; // 标记是否正在搜索

    // 如果 localStorage 中有 prompt，则更新提示信息
    if (fixedPrompt) {
        searchResultsDiv.innerHTML = '<p>Prompt 文件已加载，请输入您想知道的内容并搜索。</p>';
    }

    // 检查本地存储中是否有深色模式的偏好
    const isDarkModePreferred = localStorage.getItem('darkMode') === 'enabled';

    // 根据偏好设置初始化深色模式
    if (isDarkModePreferred) {
        body.classList.add('dark-mode');
        darkModeToggle.textContent = '☀️';
        darkModeToggle.setAttribute('aria-label', '切换浅色模式');
    }

    
    // 切换深色/浅色模式
    darkModeToggle.addEventListener('click', () => {
        console.log('深浅色切换按钮被点击了！');
        body.classList.toggle('dark-mode');
        const isDarkModeActive = body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkModeActive ? 'enabled' : 'disabled');
        darkModeToggle.textContent = isDarkModeActive ? '☀️' : '🌙';
        darkModeToggle.setAttribute('aria-label', isDarkModeActive ? '切换浅色模式' : '切换深色模式');
    });

    // 从用户选择的文件中读取 prompt
    promptFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (e) => {
                fixedPrompt = e.target.result;
                localStorage.setItem('fixedPrompt', fixedPrompt); // 将 prompt 存储到 localStorage
                searchResultsDiv.innerHTML = '<p>Prompt 文件已加载，请输入您想知道的内容并搜索。</p>';
                isSearching = false; // 重置搜索状态
                searchButton.textContent = '开始搜索'; // 更新按钮文本
            };
            reader.onerror = (error) => {
                console.error('读取 Prompt 文件失败:', error);
                searchResultsDiv.innerHTML = '<p class="error">读取 Prompt 文件失败。</p>';
                isSearching = false; // 重置搜索状态
                searchButton.textContent = '开始搜索'; // 更新按钮文本
            };
            reader.readAsText(file);
        } else if (file) {
            searchResultsDiv.innerHTML = '<p class="error">请选择一个 .txt 格式的 Prompt 文件。</p>';
            localStorage.removeItem('fixedPrompt'); // 移除 localStorage 中的 prompt
            fixedPrompt = '';
            isSearching = false; // 重置搜索状态
            searchButton.textContent = '开始搜索'; // 更新按钮文本
        } else {
            searchResultsDiv.innerHTML = '<p>请选择一个 .txt 格式的 Prompt 文件。</p>';
            localStorage.removeItem('fixedPrompt'); // 移除 localStorage 中的 prompt
            fixedPrompt = ''; // 清空 prompt
            isSearching = false; // 重置搜索状态
            searchButton.textContent = '开始搜索'; // 更新按钮文本
        }
    });

    // 执行搜索功能
    function performSearch() {
        const query = searchInput.value.trim();
        if (query && fixedPrompt && !isSearching) {
            searchResultsDiv.innerHTML = '<p>正在思考...</p>';
            isSearching = true; // 设置为正在搜索状态
            searchButton.textContent = '正在搜索...'; // 更新按钮文本

            const fullQuery = fixedPrompt + query; // 将读取的 prompt 和用户输入拼接

            const apiKey = 'AIzaSyA3yGB86eRGgEcWTXXm3mahjyD4DrQeid4'; // 替换为你的 API 密钥
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: fullQuery}]
                    }]
                })
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        console.error('API Error:', errorData);
                        throw new Error(`API request failed with status ${response.status}: ${errorData?.error?.message || 'Unknown error'}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('API Response:', data);
                isSearching = false; // 搜索完成，重置状态
                searchButton.textContent = '开始搜索'; // 更新按钮文本
                if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                    localStorage.setItem('geminiResponse', JSON.stringify(data));
                    window.location.href = '卡片输出.html';
                } else {
                    searchResultsDiv.innerHTML = '<p>未找到合适的回复，无法在新页面显示。</p>';
                }
            })
            .catch(error => {
                console.error('Fetch Error:', error);
                searchResultsDiv.innerHTML = `<p class="error">思考失败：${error.message}</p>`;
                isSearching = false; // 搜索失败，重置状态
                searchButton.textContent = '开始搜索'; // 更新按钮文本
            });
        } else if (isSearching) {
            searchResultsDiv.innerHTML = '<p>正在搜索中，请稍候...</p>';
        } else if (!fixedPrompt) {
            searchResultsDiv.innerHTML = '<p>请先选择一个包含 Prompt 的 .txt 文件。</p>';
        } else {
            searchResultsDiv.innerHTML = '<p>请输入您想知道的内容。</p>';
        }
    }

    // 监听搜索按钮点击
    searchButton.addEventListener('click', performSearch);

    // 监听输入框键盘事件，处理 Enter 键搜索
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            performSearch();
            event.preventDefault();
        }
    });

    // 关闭顶部提示栏
    const topBar = document.querySelector('.top-bar');
    const closeButton = document.querySelector('.close-button');
    if (closeButton && topBar) {
        closeButton.addEventListener('click', () => {
            topBar.style.display = 'none';
        });
    }
});