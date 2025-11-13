// --- 配置 ---
// 🚨 必须在这里列出你的所有 Markdown 笔记文件路径
const NOTE_FILES = [
    'MARK/1.md',
    'MARK/2.md',
    'MARK/3.md',
    'MARK/4.md',
    'MARK/5.md',
    // 假设你有更多笔记，请继续添加...
];

const NOTES_PER_PAGE = 5; // 5. 一页最多有五个矩形块

// 全局变量
let allNotesData = []; // 存放所有已加载和解析的笔记数据
let currentPage = 1;

/**
 * 格式化 Markdown 文本，提取标题、时间，并渲染内容
 * @param {string} markdownText - 原始 Markdown 文本
 * @returns {object} 包含 title, time, contentHTML 的对象
 */
function parseMarkdown(markdownText) {
    const lines = markdownText.trim().split('\n').filter(line => line.trim() !== '');

    // 5. 标题为笔记第一行，时间为笔记第二行
    const title = lines.length > 0 ? lines[0].replace(/^[#\s]+/, '').trim() : '无标题笔记';
    const time = lines.length > 1 ? lines[1].replace(/^[#\s]+/, '').trim() : '未知时间';
    
    // 笔记剩下的内容
    const remainingContent = lines.slice(2).join('\n');
    
    // 渲染剩下的 Markdown 内容
    // 启用 Markd.js 的 GFM 模式 (GitHub Flavored Markdown)
    marked.setOptions({
        gfm: true,
        breaks: true, // 启用换行符
    });
    const contentHTML = marked.parse(remainingContent);

    return { title, time, contentHTML };
}

/**
 * 渲染指定页码的笔记到页面上
 * @param {number} page - 要渲染的页码
 */
function renderNotes(page) {
    const container = document.getElementById('notes-container');
    container.innerHTML = ''; // 清空现有内容

    const startIndex = (page - 1) * NOTES_PER_PAGE;
    const endIndex = startIndex + NOTES_PER_PAGE;
    const notesToShow = allNotesData.slice(startIndex, endIndex);

    if (notesToShow.length === 0 && page === 1) {
        container.innerHTML = '<p style="text-align: center; color:#666;">MARK 文件夹中还没有笔记哦！</p>';
        return;
    }

    notesToShow.forEach(note => {
        // 5. 根据内容长短划出一个白色圆角矩形块
        const noteBlock = document.createElement('div');
        noteBlock.classList.add('note-block');

        noteBlock.innerHTML = `
            <div class="note-title">${note.title}</div>
            <span class="note-time">${note.time}</span>
            <div class="note-content">${note.contentHTML}</div>
        `;
        container.appendChild(noteBlock);
    });
    
    renderPagination(allNotesData.length);
}

/**
 * 渲染页码系统
 * @param {number} totalNotes - 笔记总数
 */
function renderPagination(totalNotes) {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';

    const totalPages = Math.ceil(totalNotes / NOTES_PER_PAGE);

    if (totalPages <= 1) return;

    // 渲染页码按钮
    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.classList.add('page-btn');
        button.textContent = i;
        
        if (i === currentPage) {
            button.classList.add('active');
        }

        button.addEventListener('click', () => {
            // 切换页码并渲染
            currentPage = i;
            renderNotes(currentPage);
            // 平滑滚动到页面顶部
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        paginationContainer.appendChild(button);
    }
}

/**
 * 主函数：加载所有 Markdown 文件
 */
async function loadAllNotes() {
    const container = document.getElementById('notes-container');
    container.innerHTML = '<p style="text-align: center; color:#666;">正在努力加载笔记...</p>';

    try {
        // 使用 Promise.all 并行请求所有 Markdown 文件
        const fetchPromises = NOTE_FILES.map(fileUrl => 
            fetch(fileUrl).then(response => {
                if (!response.ok) {
                    throw new Error(`无法加载文件: ${fileUrl} (状态码: ${response.status})`);
                }
                return response.text();
            })
        );
        
        // 等待所有文件内容获取完毕
        const allMarkdownTexts = await Promise.all(fetchPromises);
        
        // 解析所有 Markdown 文本
        allNotesData = allMarkdownTexts.map(parseMarkdown).filter(note => note.title !== '无标题笔记');
        
        // 🚨 排序逻辑：默认按数组顺序（即 NOTE_FILES 列表顺序）。
        // 如果需要按时间排序，需要确保笔记第二行的时间格式是标准的日期格式。
        // allNotesData.sort((a, b) => new Date(b.time) - new Date(a.time)); 

        // 渲染第一页内容
        renderNotes(currentPage);

    } catch (error) {
        console.error('加载笔记失败:', error);
        container.innerHTML = `<p style="text-align: center; color:red;">加载笔记出错，请检查 MARK 文件夹和 jilu.js 中的路径是否正确。<br>错误信息: ${error.message}</p>`;
    }
}

// 页面加载完成后开始执行
document.addEventListener('DOMContentLoaded', loadAllNotes);
