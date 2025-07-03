// استبدل محتوى الـ Event Listener بالكامل
// استبدل كل ما بداخل document.addEventListener('DOMContentLoaded', ...) بهذا الكود الكامل
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

    // التعامل مع الأحداث على العناصر التي تُضاف ديناميكياً
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
    
    // أزرار التحكم بالمشروع الجديدة
    const saveProjectBtn = document.getElementById('saveProjectBtn');
    const clearProjectBtn = document.getElementById('clearProjectBtn');

    if (saveProjectBtn) saveProjectBtn.addEventListener('click', saveProject);
    if (clearProjectBtn) clearProjectBtn.addEventListener('click', clearProject);

    // أداة استخراج الكلمات المفتاحية من الرابط
    const convertBtnExtractor = document.getElementById('convertBtn');
    const copyBtnExtractor = document.getElementById('copyBtn');
    if (convertBtnExtractor) convertBtnExtractor.addEventListener('click', handleUrlConversion);
    if (copyBtnExtractor) copyBtnExtractor.addEventListener('click', handleCopyResults);

    // --- تحميل المشروع المحفوظ عند فتح الصفحة ---
    loadProject(); 

    // --- NEW: Keyword Manager ---
    const saveKeywordsBtn = document.getElementById('saveKeywordsBtn');
    if (saveKeywordsBtn) saveKeywordsBtn.addEventListener('click', saveAndAnalyzeKeywords);

    document.querySelectorAll('.main-tab-btn').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-main-tab');
            switchMainTab(tabName, tab);
        });
    });
    loadMasterKeywords();
});

// --- NEW: Main Tab Switcher ---
function switchMainTab(tabName, clickedTab) {
    document.querySelectorAll('.main-tab-btn').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.main-tab-content').forEach(c => c.classList.remove('active'));
    
    clickedTab.classList.add('active');
    document.getElementById(tabName + '-content').classList.add('active');
}


// ---- للتأكد من أن دوال أداة استخراج الكلمات المفتاحية موجودة ومستقلة ----
// (سنقوم بإنشاء دوال جديدة لها لتجنب أي تداخل)

function handleUrlConversion() {
    const urlsInput = document.getElementById('urlsInput');
    const outputArea = document.getElementById('output');
    const copyBtn = document.getElementById('copyBtn');

    const urlsText = urlsInput.value.trim();
    if (!urlsText) {
        outputArea.value = 'الرجاء إدخال رابط واحد على الأقل.';
        copyBtn.style.display = 'none';
        return;
    }

    const urlsArray = urlsText.split('\n').filter(Boolean);
    const results = urlsArray.map(url => {
        try {
            const path = new URL(url.trim()).pathname;
            const encodedSlug = path.split('/').filter(Boolean).pop() || '';
            const decodedSlug = decodeURIComponent(encodedSlug);
            const keyword = decodedSlug.replace(/[-_]/g, ' '); // استبدال الشرطة العادية والسفلية بمسافة
            return `${keyword} | ${url.trim()} | ${keyword}`;
        } catch (error) {
            return `رابط غير صالح | ${url.trim()} | رابط غير صالح`;
        }
    });

    outputArea.value = results.join('\n');
    if (results.length > 0) {
        copyBtn.style.display = 'inline-block';
    }
}

function handleCopyResults() {
    const outputArea = document.getElementById('output');
    const copyBtn = document.getElementById('copyBtn');
    outputArea.select();
    document.execCommand('copy');
    copyBtn.textContent = 'تم النسخ!';
    setTimeout(() => {
        copyBtn.textContent = 'نسخ النتائج';
    }, 2000);
}

// =================== دوال إدارة المشاريع الجديدة ===================

// دالة لحفظ المشروع الحالي في localStorage
// استبدل دالة الحفظ القديمة بهذه النسخة الجديدة
function saveProject() {
    try {
        // يجب أن نتحقق أولاً إذا تم إنشاء linkingMap
        if (typeof generatedLinkingMap === 'undefined' || Object.keys(generatedLinkingMap).length === 0) {
            alert("يرجى إنشاء الروابط أولاً قبل حفظ المشروع لضمان حفظ نتائج التحليل.");
            return;
        }

        const projectData = {
            pillarPage: {
                title: document.getElementById('pillarTitle').value.trim(),
                url: document.getElementById('pillarUrl').value.trim(),
                keyword: document.getElementById('pillarKeyword').value.trim()
            },
            articlesInput: document.getElementById('bulkInput').value.trim(),
            advancedSettings: {
                linksPerArticle: document.getElementById('linksPerArticle').value,
                linkingTemplates: document.getElementById('linkingTemplates').value.trim()
            },
            // حفظ نتائج التحليل (الجزء الجديد والمهم)
            linkingMap: generatedLinkingMap 
        };

        localStorage.setItem('seoInternalLinkingProject', JSON.stringify(projectData));
        alert('تم حفظ المشروع ونتائج التحليل بنجاح!');
    } catch (e) {
        console.error("فشل حفظ المشروع:", e);
        alert("حدث خطأ أثناء حفظ المشروع. قد تكون مساحة التخزين ممتلئة.");
    }
}

// دالة لتحميل المشروع من localStorage عند فتح الصفحة
// استبدل دالة التحميل القديمة بهذه النسخة الذكية
function loadProject() {
    const savedProject = localStorage.getItem('seoInternalLinkingProject');
    if (!savedProject) {
        console.log("لا يوجد مشروع محفوظ.");
        return;
    }

    try {
        const projectData = JSON.parse(savedProject);
        
        document.getElementById('pillarTitle').value = projectData.pillarPage.title;
        document.getElementById('pillarUrl').value = projectData.pillarPage.url;
        document.getElementById('pillarKeyword').value = projectData.pillarPage.keyword;
        document.getElementById('bulkInput').value = projectData.articlesInput;
        document.getElementById('linksPerArticle').value = projectData.advancedSettings.linksPerArticle;
        document.getElementById('linkingTemplates').value = projectData.advancedSettings.linkingTemplates;
        
        // الجزء الأهم: عرض النتائج المحفوظة
        if (projectData.linkingMap && Object.keys(projectData.linkingMap).length > 0) {
            console.log("تم تحميل المشروع والنتائج المحفوظة بنجاح.");
            articles = parseBulkInput(); // تأكد من أن قائمة المقالات محدّثة
            generatedLinkingMap = projectData.linkingMap; // إعادة إسناد الخريطة المحفوظة
            displayResults(generatedLinkingMap); // عرض كل شيء بناءً على البيانات المحفوظة
        } else {
             console.log("تم تحميل المشروع المحفوظ (بدون نتائج تحليل).");
             const articlesList = parseBulkInput();
             if(articlesList.length > 0) {
                analyzeAndDisplayDashboard(articlesList, {});
             }
        }

    } catch (e) {
        console.error("فشل تحميل المشروع:", e);
        localStorage.removeItem('seoInternalLinkingProject');
    }
}

// دالة لمسح المشروع المحفوظ والواجهة
function clearProject() {
    if (confirm("هل أنت متأكد أنك تريد مسح المشروع المحفوظ نهائياً؟ لا يمكن التراجع عن هذا الإجراء.")) {
        localStorage.removeItem('seoInternalLinkingProject');
        
        // يمكنك استدعاء دالة المسح الحالية أو إعادة تعيين الحقول هنا
        window.location.reload(); // أسهل طريقة لإعادة كل شيء لوضعه الافتراضي
    }
}

// دالة التحليل والعرض (أهم دالة جديدة)
function analyzeAndDisplayDashboard(articlesList, linkingMap) {
    const dashboardContainer = document.getElementById('projectDashboard');
    
    // 1. تهيئة إحصائيات لكل مقال
    const stats = {};
    articlesList.forEach(article => {
        stats[article.id] = { ...article, outbound: 0, inbound: 0 };
    });

    // 2. حساب الروابط الصادرة والواردة من linkingMap
    Object.values(linkingMap).forEach(item => {
        const sourceId = item.article.id;
        if (stats[sourceId]) {
            stats[sourceId].outbound = item.linkedArticles.length;
        }

        item.linkedArticles.forEach(linked => {
            // تحقق مما إذا كان الرابط لمقالة فرعية (وليس المقالة الأساسية)
            if (linked.id && stats[linked.id]) {
                stats[linked.id].inbound += 1;
            }
        });
    });

    // 3. بناء جدول الـ HTML
    let tableHTML = `
        <table id="dashboardTable">
            <thead>
                <tr>
                    <th>عنوان المقالة</th>
                    <th>روابط صادرة</th>
                    <th>روابط واردة</th>
                    <th>الحالة</th>
                </tr>
            </thead>
            <tbody>
    `;

    Object.values(stats).forEach(article => {
        const isOrphan = article.inbound === 0;
        const rowClass = isOrphan ? 'orphan-article' : '';
        const statusBadge = isOrphan 
            ? '<span class="status-badge status-orphan">مقالة يتيمة</span>'
            : '<span class="status-badge status-healthy">سليمة</span>';
        
        tableHTML += `
            <tr class="${rowClass}">
                <td><a href="${article.url}" target="_blank">${article.title}</a></td>
                <td>${article.outbound}</td>
                <td>${article.inbound}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    dashboardContainer.innerHTML = tableHTML;
}


// --- تعريف المتغيرات العامة والدوال ---

let selectedStrategy = 'balanced'; // متغير لتخزين الاستراتيجية المحددة
let articles = []; // متغير لتخزين قائمة المقالات
let pillarPage = {}; // متغير لتخزين بيانات الصفحة الأساسية (Pillar Page)
let manualArticleCount = 0; // متغير لعدد المقالات المحددة يدوياً
let generatedLinkingMap = {}; // متغير لتخزين الخريطة الناتجة عن إنشاء الروابط

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

// دالة جديدة لمسح جميع الحقول
function clearAllFields() {
    // مسح حقول المقالة الأساسية
    document.getElementById('pillarTitle').value = '';
    document.getElementById('pillarUrl').value = '';
    document.getElementById('pillarKeyword').value = '';

    // مسح حقول الإدخال
    document.getElementById('bulkInput').value = '';
    document.getElementById('manualContainer').innerHTML = '';
    manualArticleCount = 0; // إعادة تعيين العداد

    // مسح حقول أداة التنسيق
    document.getElementById('formatTitles').value = '';
    document.getElementById('formatUrls').value = '';
    document.getElementById('formatKeywords').value = '';
    document.getElementById('formattedOutput').value = '';

    // مسح حقول أداة استخراج الكلمات المفتاحية
    document.getElementById('urlsInput').value = '';
    document.getElementById('output').value = '';
    document.getElementById('copyBtn').style.display = 'none';
    
    // إخفاء قسم النتائج
    document.getElementById('resultsSection').style.display = 'none';

    // إعادة تحميل البيانات النموذجية
    loadSampleData();
    for (let i = 0; i < 3; i++) {
        addManualArticle();
    }

    alert('تم مسح جميع الحقول والنتائج.');
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

// دالة جديدة لإنشاء الروابط المتقدمة
function generateAdvancedLinking() {
    console.log('--- بدء عملية التشخيص ---');
    console.log('1. تم الضغط على زر الإنشاء ودخلنا دالة generateAdvancedLinking.');
    
    const btn = document.getElementById('generateBtn');
    btn.classList.add('loading');
    btn.disabled = true;

    setTimeout(() => {
        try {
            pillarPage = {
                title: document.getElementById('pillarTitle').value.trim(),
                url: document.getElementById('pillarUrl').value.trim(),
                keyword: document.getElementById('pillarKeyword').value.trim()
            };

            if (!pillarPage.title || !pillarPage.url || !pillarPage.keyword) {
                alert('خطأ فادح: يرجى إدخال جميع بيانات المقالة الأساسية (العنوان، الرابط، والكلمة المفتاحية) قبل المتابعة.');
                throw new Error("Pillar page data missing");
            }
            console.log('2. تم التحقق من بيانات المقالة الأساسية بنجاح.');
            
            const activeTab = document.querySelector('.tab-content.active');
            if (activeTab.id === 'bulk-content') {
                articles = parseBulkInput();
            } else {
                articles = parseManualInput();
            }
            console.log('3. تم تحليل المقالات من المدخلات. عدد المقالات:', articles.length, 'وهذه هي المقالات:', articles);

            if(articles.length === 0) {
                 alert('خطأ: لم يتم تحليل أي مقالات. تأكد من أن تنسيق الإدخال صحيح (عنوان | رابط | كلمة مفتاحية).');
                 throw new Error("No articles parsed");
            }
            
            const linksPerArticle = parseInt(document.getElementById('linksPerArticle').value, 10);
            console.log('4. عدد الروابط المطلوب لكل مقال:', linksPerArticle);

            if (articles.length < linksPerArticle) {
                alert(`خطأ: عدد المقالات (${articles.length}) أقل من عدد الروابط المطلوب لكل مقال (${linksPerArticle}). يرجى إضافة المزيد من المقالات.`);
                throw new Error("Not enough articles");
            }
            console.log('5. عدد المقالات كافٍ. على وشك إنشاء استراتيجية الربط...');

            generateLinkingStrategy();

        } catch (e) {
            console.error("فشلت عملية إنشاء الروابط بسبب:", e.message);
            document.getElementById('resultsSection').style.display = 'none';
            document.getElementById('projectDashboard').innerHTML = `<p style="color:red; font-weight:bold;">فشلت العملية. يرجى مراجعة رسالة الخطأ في الـ Console (F12) وإصلاح المشكلة ثم المحاولة مرة أخرى.</p>`;
        } finally {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }, 200);
}

// دالة لإنشاء استراتيجية الربط بناءً على الاستراتيجية المختارة
function generateLinkingStrategy() {
    console.log('6. دخلنا دالة generateLinkingStrategy.');
    let linkingMap = {};
    console.log('7. الاستراتيجية المختارة هي:', selectedStrategy);
    switch (selectedStrategy) {
        case 'balanced': linkingMap = generateBalancedLinking(); break;
        case 'authority': linkingMap = generateAuthorityLinking(); break;
        case 'cluster': linkingMap = generateClusterLinking(); break;
    }
    console.log('8. تم إنشاء خريطة الربط. عدد المفاتيح فيها:', Object.keys(linkingMap).length, 'وهذه هي الخريطة:', linkingMap);
    
    generatedLinkingMap = linkingMap;
    displayResults(linkingMap);
}

// استبدل الدالة القديمة بهذه
function generateBalancedLinking() {
    const linkingMap = {};
    const totalArticles = articles.length;
    const linksToSelect = parseInt(document.getElementById('linksPerArticle').value, 10) - 1; // -1 for pillar page

    articles.forEach((article, index) => {
        const linkedArticles = [pillarPage];
        const startIndex = (index * linksToSelect) % totalArticles;
        let selectedCount = 0;

        for (let i = 0; i < totalArticles && selectedCount < linksToSelect; i++) {
            const targetIndex = (startIndex + i) % totalArticles;
            if (articles[targetIndex].id !== article.id) {
                if (!linkedArticles.some(linked => linked.id === articles[targetIndex].id)) {
                    linkedArticles.push(articles[targetIndex]);
                    selectedCount++;
                }
            }
        }
        linkingMap[article.id] = { article, linkedArticles };
    });
    return linkingMap;
}

function generateAuthorityLinking() {
    const linkingMap = {};
    const linksPerArticle = parseInt(document.getElementById('linksPerArticle').value, 10);
    // نعتبر أول 3 مقالات هي المقالات ذات السلطة (Authority)
    const authorityArticles = articles.slice(0, 3);
    const otherArticles = articles.slice(3);

    articles.forEach((article) => {
        const linkedArticles = [pillarPage];
        
        // 1. الربط مع مقالات السلطة
        authorityArticles.forEach(authArticle => {
            if (linkedArticles.length < linksPerArticle && authArticle.id !== article.id) {
                if (!linkedArticles.some(linked => linked.id === authArticle.id)) {
                    linkedArticles.push(authArticle);
                }
            }
        });

        // 2. إذا لم نصل للحد المطلوب، نكمل من باقي المقالات
        otherArticles.forEach(otherArticle => {
            if (linkedArticles.length < linksPerArticle && otherArticle.id !== article.id) {
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
    const linksPerArticle = parseInt(document.getElementById('linksPerArticle').value, 10);
    const clusters = clusterArticles(articles);

    articles.forEach(article => {
        const linkedArticles = [pillarPage];
        const articleCluster = clusters.find(cluster => cluster.some(a => a.id === article.id)) || [];

        // 1. الربط مع المقالات داخل نفس العنقود
        articleCluster.forEach(clusterArticle => {
            if (linkedArticles.length < linksPerArticle && clusterArticle.id !== article.id) {
                 if (!linkedArticles.some(linked => linked.id === clusterArticle.id)) {
                    linkedArticles.push(clusterArticle);
                }
            }
        });

        // 2. إذا لم نصل للحد، نكمل من مقالات خارج العنقود
        // We will shuffle the articles to get more random links
        const remainingArticles = articles.filter(art => art.id !== article.id && !articleCluster.some(ca => ca.id === art.id));
        
        for (let i = remainingArticles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [remainingArticles[i], remainingArticles[j]] = [remainingArticles[j], remainingArticles[i]];
        }

        remainingArticles.forEach(otherArticle => {
            if (linkedArticles.length < linksPerArticle) {
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

// دالة لعرض النتائج النهائية على الشاشة
function displayResults(linkingMap) {
    console.log('9. دخلنا دالة displayResults، على وشك عرض النتائج على الشاشة.');
    displayStats(linkingMap);
    displayLinkingResults(linkingMap);
    document.getElementById('resultsSection').style.display = 'block';
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
    
    analyzeAndDisplayDashboard(articles, linkingMap);
    console.log('10. اكتملت العملية بنجاح! --- نهاية التشخيص ---');
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

// استبدل الدالة القديمة بهذه
function createAdvancedLinkingText(linkedArticles) {
    const templatesInput = document.getElementById('linkingTemplates').value.trim();
    const templates = templatesInput.split('\n').filter(Boolean);

    if (templates.length === 0) {
        // قالب احتياطي في حال كان الحقل فارغاً
        templates.push("يمكنك الاطلاع على خدماتنا الأخرى مثل {links}.");
    }

    const template = templates[Math.floor(Math.random() * templates.length)];
    const links = linkedArticles.map(article => `<a href="${article.url}" target="_blank">${article.keyword}</a>`);
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


// --- NEW: Keyword Manager Functions ---

function saveAndAnalyzeKeywords() {
    const keywordsInput = document.getElementById('masterKeywordsInput');
    const keywords = keywordsInput.value.trim().split('\n').filter(Boolean);
    
    if (keywords.length === 0) {
        alert('الرجاء إدخال كلمة مفتاحية واحدة على الأقل.');
        return;
    }

    localStorage.setItem('masterKeywords', JSON.stringify(keywords));
    alert('تم حفظ قائمة الكلمات المفتاحية بنجاح!');
    
    displayKeywordDashboard();
}

function loadMasterKeywords() {
    const savedKeywords = localStorage.getItem('masterKeywords');
    if (savedKeywords) {
        const keywords = JSON.parse(savedKeywords);
        document.getElementById('masterKeywordsInput').value = keywords.join('\n');
        displayKeywordDashboard();
    }
}

function displayKeywordDashboard() {
    const savedKeywords = localStorage.getItem('masterKeywords');
    const projectArticles = parseBulkInput();
    const linkingMap = generatedLinkingMap || {};
    
    if (!savedKeywords) {
        document.getElementById('keywordDashboard').innerHTML = '<p>لا توجد كلمات مفتاحية محفوظة.</p>';
        return;
    }

    const masterKeywords = JSON.parse(savedKeywords);
    const dashboardContainer = document.getElementById('keywordDashboard');

    // Create stats for all articles in the project
    const articleStats = {};
    projectArticles.forEach(article => {
        articleStats[article.id] = { ...article, outbound: 0, inbound: 0 };
    });

    Object.values(linkingMap).forEach(item => {
        const sourceId = item.article.id;
        if (articleStats[sourceId]) {
            articleStats[sourceId].outbound = item.linkedArticles.length;
        }
        item.linkedArticles.forEach(linked => {
            if (linked.id && articleStats[linked.id]) {
                articleStats[linked.id].inbound += 1;
            }
        });
    });

    let tableHTML = `
        <table id="keywordDashboardTable">
            <thead>
                <tr>
                    <th>الكلمة المفتاحية</th>
                    <th>رابط المقالة</th>
                    <th>روابط واردة</th>
                    <th>روابط صادرة</th>
                    <th>قوة الصفحة</th>
                    <th>الحالة</th>
                    <th>اقتراحات</th>
                </tr>
            </thead>
            <tbody>
    `;

    masterKeywords.forEach(keyword => {
        const matchedArticle = projectArticles.find(a => a.keyword.trim().toLowerCase() === keyword.trim().toLowerCase());
        
        if (matchedArticle) {
            const stats = articleStats[matchedArticle.id];
            const pageStrength = (stats.inbound * 2) + (stats.outbound * 0.5);
            const isOrphan = stats.inbound === 0;
            const status = isOrphan ? '<span class="status-badge status-orphan">مقالة يتيمة</span>' : '<span class="status-badge status-healthy">سليمة</span>';
            let suggestion = '';
            if (isOrphan) {
                suggestion = 'تحتاج لروابط داخلية';
            } else if (pageStrength < 5) {
                suggestion = 'تقوية السلطة بالمزيد من الروابط';
            } else {
                suggestion = '<span style="color: green;">✔ قوية</span>';
            }

            tableHTML += `
                <tr>
                    <td>${keyword}</td>
                    <td><a href="${matchedArticle.url}" target="_blank">${matchedArticle.title}</a></td>
                    <td>${stats.inbound}</td>
                    <td>${stats.outbound}</td>
                    <td>${pageStrength.toFixed(1)}</td>
                    <td>${status}</td>
                    <td>${suggestion}</td>
                </tr>
            `;
        } else {
            tableHTML += `
                <tr>
                    <td>${keyword}</td>
                    <td colspan="6" style="text-align: center; color: #999;">لم يتم العثور على مقالة لهذه الكلمة المفتاحية في المشروع الحالي</td>
                </tr>
            `;
        }
    });

    tableHTML += `</tbody></table>`;
    dashboardContainer.innerHTML = tableHTML;
}
