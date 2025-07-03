// ننتظر حتى يتم تحميل محتوى الصفحة بالكامل قبل تشغيل الجافاسكريبت
document.addEventListener('DOMContentLoaded', () => {

    // --- الربط بين عناصر الـ HTML والجافاسكريبت (Event Listeners) ---

    // أداة تنسيق المدخلات
    const formatCombineBtn = document.getElementById('formatCombineBtn');
    const clearFormatterBtn = document.getElementById('clearFormatterBtn');
    const copyFormattedBtn = document.getElementById('copyFormattedBtn');

    if (formatCombineBtn) formatCombineBtn.addEventListener('click', formatAndCombine);
    if (clearFormatterBtn) clearFormatterBtn.addEventListener('click', clearFormatter);
    if (copyFormattedBtn) copyFormattedBtn.addEventListener('click', (event) => copyFormattedOutput(event.target));

    // الأداة الرئيسية
    const generateBtn = document.getElementById('generateBtn');
    const addManualArticleBtn = document.getElementById('addManualArticleBtn');
    const resultsContainer = document.getElementById('resultsContainer');
    const manualContainer = document.getElementById('manualContainer');

    if (generateBtn) generateBtn.addEventListener('click', generateAdvancedLinking);
    if (addManualArticleBtn) addManualArticleBtn.addEventListener('click', addManualArticle);

    // التعامل مع الأحداث على العناصر التي تُضاف ديناميكياً (مثل أزرار الحذف والنسخ)
    if (resultsContainer) {
        resultsContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('copy-btn')) {
                const text = event.target.getAttribute('data-text-to-copy');
                copyToClipboard(text, event.target);
            }
        });
    }
    
    if (manualContainer) {
        manualContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('remove-manual-btn')) {
                const id = event.target.getAttribute('data-id');
                removeManualArticle(id);
            }
        });
    }

    // استراتيجيات الربط
    document.querySelectorAll('.strategy-card').forEach(card => {
        card.addEventListener('click', () => {
            const strategy = card.getAttribute('data-strategy');
            selectStrategy(strategy, card);
        });
    });

    // التبويبات (Tabs)
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchTab(tabName, tab);
        });
    });

    // تحميل البيانات المبدئية
    loadSampleData();
    for (let i = 0; i < 3; i++) {
        addManualArticle();
    }
});


// --- تعريف المتغيرات العامة والدوال ---

let selectedStrategy = 'balanced';
let articles = [];
let pillarPage = {};
let manualArticleCount = 0;

// --- الدوال الخاصة بأداة تنسيق المدخلات (الجديدة) ---

function formatAndCombine() {
    const titles = document.getElementById('formatTitles').value.trim().split('\n').filter(Boolean);
    const urls = document.getElementById('formatUrls').value.trim().split('\n').filter(Boolean);
    const keywords = document.getElementById('formatKeywords').value.trim().split('\n').filter(Boolean);

    if (titles.length === 0 || titles.length !== urls.length || urls.length !== keywords.length) {
        alert('خطأ: يرجى التأكد من أن جميع الحقول تحتوي على نفس العدد من الأسطر، وأنها ليست فارغة.');
        return;
    }

    const output = titles.map((title, index) => {
        return `${title.trim()} | ${urls[index].trim()} | ${keywords[index].trim()}`;
    }).join('\n');

    document.getElementById('formattedOutput').value = output;
}

function copyFormattedOutput(button) {
    const outputArea = document.getElementById('formattedOutput');
    if (!outputArea.value) {
        alert('لا يوجد شيء لنسخه!');
        return;
    }
    // استخدام Clipboard API الحديثة لأنها أكثر أمانًا
    navigator.clipboard.writeText(outputArea.value).then(() => {
        const originalText = button.textContent;
        button.textContent = 'تم النسخ ✓';
        button.style.background = '#27ae60';
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 2000);
    }).catch(err => {
        console.error('فشل النسخ: ', err);
        alert('حدث خطأ أثناء النسخ.');
    });
}

function clearFormatter() {
    document.getElementById('formatTitles').value = '';
    document.getElementById('formatUrls').value = '';
    document.getElementById('formatKeywords').value = '';
    document.getElementById('formattedOutput').value = '';
}


// --- دوال الأداة الرئيسية ---

function selectStrategy(strategy, clickedCard) {
    selectedStrategy = strategy;
    document.querySelectorAll('.strategy-card').forEach(card => {
        card.classList.remove('selected');
    });
    clickedCard.classList.add('selected');
}

function switchTab(tabName, clickedTab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    clickedTab.classList.add('active');
    document.getElementById(tabName + '-content').classList.add('active');
}

function addManualArticle() {
    manualArticleCount++;
    const container = document.getElementById('manualContainer');
    const articleDiv = document.createElement('div');
    articleDiv.className = 'article-item';
    articleDiv.id = `manualArticle${manualArticleCount}`;
    articleDiv.style.cssText = `
        background: white; padding: 20px; border-radius: 10px; margin-bottom: 15px;
        border: 1px solid #dee2e6; display: grid; grid-template-columns: 1fr 1fr 1fr auto;
        gap: 15px; align-items: end;
    `;
    
    articleDiv.innerHTML = `
        <div class="form-group"><label>عنوان المقالة:</label><input type="text" class="manualTitle" placeholder="كاميرات مراقبة دسمان"></div>
        <div class="form-group"><label>رابط المقالة:</label><input type="url" class="manualUrl" placeholder="https://example.com/article"></div>
        <div class="form-group"><label>الكلمة المفتاحية:</label><input type="text" class="manualKeyword" placeholder="كاميرات مراقبة دسمان"></div>
        <button class="remove-manual-btn" data-id="${manualArticleCount}" style="background: #e74c3c; margin-bottom: 20px;">حذف</button>
    `;
    container.appendChild(articleDiv);
}

function removeManualArticle(id) {
    const article = document.getElementById(`manualArticle${id}`);
    if(article) article.remove();
}


function parseManualInput() {
    const articles = [];
    document.querySelectorAll('.article-item').forEach((item, index) => {
        const title = item.querySelector('.manualTitle').value.trim();
        const url = item.querySelector('.manualUrl').value.trim();
        const keyword = item.querySelector('.manualKeyword').value.trim();

        if (title && url && keyword) {
            articles.push({ id: `manual_${index}`, title, url, keyword });
        }
    });
    return articles;
}

function parseBulkInput() {
    const bulkText = document.getElementById('bulkInput').value.trim();
    if (!bulkText) return [];
    
    const lines = bulkText.split('\n').filter(line => line.trim());
    const articles = [];
    
    lines.forEach((line, index) => {
        let parts = line.split('|');
        if (parts.length < 3) parts = line.split(',');
        if (parts.length < 3) parts = line.split(';');
        
        if (parts.length >= 3) {
            articles.push({
                id: index + 1,
                title: parts[0].trim(),
                url: parts[1].trim(),
                keyword: parts[2].trim()
            });
        }
    });
    
    return articles;
}

function generateAdvancedLinking() {
    pillarPage = {
        title: document.getElementById('pillarTitle').value.trim(),
        url: document.getElementById('pillarUrl').value.trim(),
        keyword: document.getElementById('pillarKeyword').value.trim()
    };

    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab.id === 'bulk-content') {
        articles = parseBulkInput();
    } else {
        articles = parseManualInput();
    }

    if (articles.length < 5) {
        alert('يرجى إدخال 5 مقالات على الأقل لضمان فعالية الربط الداخلي');
        return;
    }

    if (!pillarPage.title || !pillarPage.url || !pillarPage.keyword) {
        alert('يرجى إدخال بيانات المقالة الأساسية كاملة');
        return;
    }

    generateLinkingStrategy();
}

function generateLinkingStrategy() {
    let linkingMap = {};
    switch (selectedStrategy) {
        case 'balanced': linkingMap = generateBalancedLinking(); break;
        case 'authority': linkingMap = generateAuthorityLinking(); break;
        case 'cluster': linkingMap = generateClusterLinking(); break;
    }
    displayResults(linkingMap);
}

function generateBalancedLinking() {
    const linkingMap = {};
    const totalArticles = articles.length;
    articles.forEach((article, index) => {
        const linkedArticles = [pillarPage];
        const startIndex = (index * 4) % totalArticles;
        let selectedCount = 0;
        for (let i = 0; i < totalArticles && selectedCount < 4; i++) {
            const targetIndex = (startIndex + i) % totalArticles;
            if (articles[targetIndex].id !== article.id) {
                linkedArticles.push(articles[targetIndex]);
                selectedCount++;
            }
        }
        linkingMap[article.id] = { article, linkedArticles };
    });
    return linkingMap;
}

function generateAuthorityLinking() {
    const linkingMap = {};
    articles.forEach((article) => {
        const linkedArticles = [pillarPage];
        const priorityArticles = articles.slice(0, Math.min(3, articles.length));
        const otherArticles = articles.slice(3);
        
        priorityArticles.forEach(priorityArticle => {
            if (priorityArticle.id !== article.id && linkedArticles.length < 5) {
                linkedArticles.push(priorityArticle);
            }
        });
        
        otherArticles.forEach(otherArticle => {
            if (otherArticle.id !== article.id && linkedArticles.length < 5) {
                if (!linkedArticles.some(linked => linked.id === otherArticle.id)) {
                     linkedArticles.push(otherArticle);
                }
            }
        });
        
        linkingMap[article.id] = { article, linkedArticles };
    });
    return linkingMap;
}

function generateClusterLinking() {
    const linkingMap = {};
    const clusters = clusterArticles(articles);
    articles.forEach(article => {
        const linkedArticles = [pillarPage];
        const articleCluster = clusters.find(cluster => cluster.some(a => a.id === article.id));
        
        if (articleCluster) {
            articleCluster.forEach(clusterArticle => {
                if (clusterArticle.id !== article.id && linkedArticles.length < 5) {
                    linkedArticles.push(clusterArticle);
                }
            });
        }
        
        articles.forEach(otherArticle => {
            if (otherArticle.id !== article.id && linkedArticles.length < 5) {
                if (!linkedArticles.some(linked => linked.id === otherArticle.id)) {
                    linkedArticles.push(otherArticle);
                }
            }
        });
        
        linkingMap[article.id] = { article, linkedArticles };
    });
    return linkingMap;
}

function clusterArticles(articles) {
    const clusters = [];
    const processed = new Set();
    articles.forEach(article => {
        if (processed.has(article.id)) return;
        
        const cluster = [article];
        processed.add(article.id);
        const articleWords = article.keyword.toLowerCase().split(' ');
        
        articles.forEach(otherArticle => {
            if (processed.has(otherArticle.id)) return;
            
            const otherWords = otherArticle.keyword.toLowerCase().split(' ');
            const commonWords = articleWords.filter(word => otherWords.includes(word) && word.length > 2);
            
            if (commonWords.length >= 2) {
                cluster.push(otherArticle);
                processed.add(otherArticle.id);
            }
        });
        clusters.push(cluster);
    });
    return clusters;
}

function displayResults(linkingMap) {
    displayStats(linkingMap);
    displayLinkingResults(linkingMap);
    document.getElementById('resultsSection').style.display = 'block';
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
}

function displayStats(linkingMap) {
    const statsContainer = document.getElementById('statsContainer');
    const totalArticles = articles.length;
    const totalLinks = Object.values(linkingMap).reduce((sum, item) => sum + item.linkedArticles.length, 0);
    const mentionCount = {};
    Object.values(linkingMap).forEach(item => {
        item.linkedArticles.forEach(linked => {
            const key = linked.id || 'pillar';
            mentionCount[key] = (mentionCount[key] || 0) + 1;
        });
    });
    const avgMentions = Object.keys(mentionCount).length > 0 ? (Object.values(mentionCount).reduce((sum, count) => sum + count, 0) / Object.keys(mentionCount).length) : 0;
    const maxMentions = Object.keys(mentionCount).length > 0 ? Math.max(...Object.values(mentionCount)) : 0;
    const minMentions = Object.keys(mentionCount).length > 0 ? Math.min(...Object.values(mentionCount)) : 0;
    
    statsContainer.innerHTML = `
        <div class="stat-card"><h3>${totalArticles}</h3><p>إجمالي المقالات</p></div>
        <div class="stat-card"><h3>${totalLinks}</h3><p>إجمالي الروابط</p></div>
        <div class="stat-card"><h3>${avgMentions.toFixed(1)}</h3><p>متوسط الإشارات</p></div>
        <div class="stat-card"><h3>${maxMentions - minMentions}</h3><p>فرق التوزيع</p></div>
    `;
}

function displayLinkingResults(linkingMap) {
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '';

    Object.values(linkingMap).forEach(item => {
        const linkingText = createAdvancedLinkingText(item.linkedArticles);
        const escapedText = escapeHtml(linkingText);
        
        const resultDiv = document.createElement('div');
        resultDiv.className = 'article-links';
        resultDiv.innerHTML = `
            <h3>🔗 <a href="${item.article.url}" target="_blank">${item.article.title}</a></h3>
            <div class="linking-text">${linkingText}</div>
            <button class="copy-btn" data-text-to-copy="${escapedText}">نسخ النص</button>
        `;
        resultsContainer.appendChild(resultDiv);
    });
}

function createAdvancedLinkingText(linkedArticles) {
    const templates = [
        "نحن نسعى دائماً لتقديم أفضل الخدمات المتكاملة في جميع أنحاء المنطقة، حيث نوفر لعملائنا الكرام {links} بأعلى معايير الجودة والاحترافية المطلوبة.",
        "لضمان توفير حماية شاملة ومتكاملة، فإننا لا نقتصر على تقديم خدماتنا في منطقة واحدة فقط، بل نعتبر أنفسنا جزءاً من شبكة واسعة ومتخصصة تقدم {links} لتلبية جميع احتياجاتكم.",
        "يمكنكم الاعتماد على خبراتنا الواسعة والمتنوعة في مختلف المجالات المتخصصة، حيث نقدم لكم {links} مع ضمان الحصول على أفضل النتائج والخدمات المتميزة.",
        "نحن فخورون بكوننا جزءاً من منظومة متكاملة من الخدمات المتخصصة، والتي تشمل {links} لضمان تقديم حلول شاملة ومبتكرة تلبي جميع متطلباتكم بكفاءة عالية.",
        "بفضل شبكة خدماتنا المتطورة والمتنوعة، نضمن لكم الحصول على {links} التي تتميز بالجودة العالية والاحترافية المطلقة في جميع مراحل التنفيذ.",
        "تتميز خدماتنا بالشمولية والتكامل، حيث نوفر لعملائنا الكرام {links} مع الحرص على تطبيق أحدث المعايير التقنية والمهنية في كل مشروع."
    ];
    const template = templates[Math.floor(Math.random() * templates.length)];
    const links = linkedArticles.map(article => `<a href="${article.url}">${article.keyword}</a>`);
    let linkText = '';
    if (links.length === 1) {
        linkText = links[0];
    } else if (links.length === 2) {
        linkText = `${links[0]} و${links[1]}`;
    } else if (links.length > 2) {
        const lastLink = links.pop();
        linkText = `${links.join('، ')}، و${lastLink}`;
    }
    return `<p>${template.replace('{links}', linkText)}</p>`;
}

function copyToClipboard(text, buttonElement) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text; // استخدم innerHTML لفك تشفير الـ HTML entities
    
    navigator.clipboard.writeText(textarea.value).then(() => {
        const originalText = buttonElement.textContent;
        buttonElement.textContent = 'تم النسخ ✓';
        buttonElement.style.background = '#27ae60';
        
        setTimeout(() => {
            buttonElement.textContent = originalText;
            buttonElement.style.background = '';
        }, 2000);
    }).catch(err => {
        console.error('فشل النسخ: ', err);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    // استبدال إضافي للتعامل مع السلاسل النصية داخل سمات الـ HTML
    return div.innerHTML.replace(/'/g, "'").replace(/"/g, "");
}

function loadSampleData() {
    const pillarTitle = document.getElementById("pillarTitle");
    const pillarUrl = document.getElementById("pillarUrl");
    const pillarKeyword = document.getElementById("pillarKeyword");
    const bulkInput = document.getElementById("bulkInput");

    if (pillarTitle) pillarTitle.value = 'كاميرات مراقبة الكويت - الدليل الشامل';
    if (pillarUrl) pillarUrl.value = 'https://example.com/cameras-kuwait';
    if (pillarKeyword) pillarKeyword.value = 'كاميرات مراقبة الكويت';
    if (bulkInput) bulkInput.value = "";
}

// بداية اداة استخراج الكلمات المفتاحية من الرابط 
    // --- JavaScript Logic ---

        // 1. DOM Elements
        const urlsInput = document.getElementById('urlsInput');
        const convertBtn = document.getElementById('convertBtn');
        const outputArea = document.getElementById('output');
        const copyBtn = document.getElementById('copyBtn');

        // 2. Event Listener for the convert button
        convertBtn.addEventListener('click', () => {
            const urlsText = urlsInput.value.trim();
            if (!urlsText) {
                outputArea.value = 'الرجاء إدخال رابط واحد على الأقل.';
                copyBtn.style.display = 'none';
                return;
            }

            const urlsArray = urlsText.split('\n').filter(Boolean); // Split by line and remove empty lines
            
            const results = urlsArray.map(url => {
                try {
                    // Extract the keyword (slug) from the URL
                    const path = new URL(url.trim()).pathname;
                    const encodedSlug = path.split('/').filter(Boolean).pop() || '';

                    // Decode the slug from percent-encoding to readable text
                    const decodedSlug = decodeURIComponent(encodedSlug);
                    
                    // Replace dashes with spaces to get the final keyword
                    const keyword = decodedSlug.replace(/-/g, ' ');

                    // Format the output string as "keyword | url | keyword"
                    return `${keyword} | ${url.trim()} | ${keyword}`;
                } catch (error) {
                    console.error(`Invalid URL: ${url}`, error);
                    return `رابط غير صالح | ${url.trim()} | رابط غير صالح`;
                }
            });

            // Display the results in the output textarea
            outputArea.value = results.join('\n');

            // Show the copy button if there are results
            if (results.length > 0) {
                copyBtn.style.display = 'inline-block';
            }
        });
        
        // 3. Event Listener for the copy button
        copyBtn.addEventListener('click', () => {
            outputArea.select(); // Select the text
            document.execCommand('copy'); // Execute copy command (works on most browsers)
            
            // Provide user feedback
            copyBtn.textContent = 'تم النسخ!';
            setTimeout(() => {
                copyBtn.textContent = 'نسخ النتائج';
            }, 2000); // Reset button text after 2 seconds
        });