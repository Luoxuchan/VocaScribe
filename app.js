function saveFormData() {
    const formData = {
        timestamp: Date.now(),
        inputs: {},
        checkboxes: {},
        selects: {},
        staffList: getStaffData(),
        mvList: getMvData()
    };

    document.querySelectorAll('input[type="text"], input[type="date"], textarea').forEach(input => {
        formData.inputs[input.id] = input.value;
    });

    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        formData.checkboxes[checkbox.id] = checkbox.checked;
    });

    document.querySelectorAll('select').forEach(select => {
        formData.selects[select.id] = select.value;
    });

    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        if (radio.checked) {
            formData.inputs[radio.name] = radio.value;
        }
    });

    localStorage.setItem('vocaScribeFormData', JSON.stringify(formData));
}

function restoreFormData() {
    const saved = localStorage.getItem('vocaScribeFormData');
    if (!saved) return false;

    try {
        const formData = JSON.parse(saved);
        
        Object.entries(formData.inputs).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'radio') {
                    const radios = document.querySelectorAll(`input[name="${element.name}"]`);
                    radios.forEach(radio => {
                        radio.checked = radio.value === value;
                    });
                } else {
                    element.value = value;
                }
            }
        });

        Object.entries(formData.checkboxes).forEach(([id, checked]) => {
            const element = document.getElementById(id);
            if (element) {
                element.checked = checked;
            }
        });

        Object.entries(formData.selects).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            }
        });

        if (formData.staffList && formData.staffList.length > 0) {
            const staffList = document.getElementById('staffList');
            staffList.innerHTML = '';
            formData.staffList.forEach(staff => {
                addStaffItem(staff.role);
                const items = staffList.querySelectorAll('.staff-item');
                const lastItem = items[items.length - 1];
                if (lastItem) {
                    lastItem.querySelector('[data-field="name"]').value = staff.name;
                    lastItem.querySelector('[data-field="lj"]').checked = staff.lj;
                }
            });
        }

        if (formData.mvList && formData.mvList.length > 0) {
            const mvList = document.getElementById('mvList');
            mvList.innerHTML = '';
            formData.mvList.forEach((mv, index) => {
                if (index === 0) {
                    addMvOriginalItem();
                } else {
                    addMvVersionItem();
                }
                const items = mvList.querySelectorAll('.mv-item');
                const lastItem = items[items.length - 1];
                if (lastItem) {
                    const idInput = lastItem.querySelector('[data-field="mvId"]');
                    if (idInput) idInput.value = mv.id;
                    const versionInput = lastItem.querySelector('[data-field="mvVersion"]');
                    if (versionInput) versionInput.value = mv.version;
                }
            });
        }

        return true;
    } catch (e) {
        console.error('Failed to restore form data:', e);
        return false;
    }
}

function clearSavedFormData() {
    localStorage.removeItem('vocaScribeFormData');
}

let saveTimer = null;

function startAutoSave() {
    if (saveTimer) clearInterval(saveTimer);
    saveTimer = setInterval(() => {
        saveFormData();
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        showToast(`表单已于 ${timeStr} 自动暂存`);
    }, 60000);
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('songForm');
    const generateBtn = document.getElementById('generateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const saveBtn = document.getElementById('saveBtn');
    const copyOutputBtn = document.getElementById('copyOutputBtn');
    const output = document.getElementById('output');

    initStaffList();
    initDatePickers();
    updateLyricsLineCount();
    initMvList();
    initPlatformCheckboxes();
    toggleProducerEntryName();
    toggleAlbumSongMode();
    toggleAlbumSongBilibiliMode();

    const hasSavedData = localStorage.getItem('vocaScribeFormData');
    if (hasSavedData) {
        setTimeout(() => {
            if (confirm('检测到上次未完成的表单数据，是否恢复？')) {
                restoreFormData();
                toggleAlbumSongMode();
                toggleAlbumSongBilibiliMode();
                showToast('表单数据已恢复');
            } else {
                clearSavedFormData();
            }
        }, 500);
    }

    startAutoSave();

    generateBtn.addEventListener('click', generateWikiText);
    copyOutputBtn.addEventListener('click', function() {
        copyToClipboard(output.value);
    });
    clearBtn.addEventListener('click', clearForm);
    saveBtn.addEventListener('click', function() {
        saveFormData();
        showToast('表单已暂存');
    });
});

function toggleAlbumSongMode() {
    const isAlbumSong = document.getElementById('isAlbumSong').checked;
    const platformContainer = document.getElementById('platformInputsContainer');
    const albumSongContainer = document.getElementById('albumSongContainer');
    const albumNameGroup = document.getElementById('albumNameGroup');
    const albumRequiredMark = document.getElementById('albumRequiredMark');
    const mvGroup = document.getElementById('mvGroup');

    if (isAlbumSong) {
        platformContainer.style.display = 'none';
        albumSongContainer.style.display = 'block';
        albumNameGroup.classList.add('required');
        albumRequiredMark.style.display = 'inline';
        // 检查是否勾选了"网易云没有这首歌"，如果是则显示MV部分
        toggleAlbumSongBilibiliMode();
    } else {
        platformContainer.style.display = 'block';
        albumSongContainer.style.display = 'none';
        albumNameGroup.classList.remove('required');
        albumRequiredMark.style.display = 'none';
        mvGroup.style.display = 'block';
        document.getElementById('music163NotFound').checked = false;
    }
}

function toggleAlbumSongBilibiliMode() {
    const isAlbumSong = document.getElementById('isAlbumSong').checked;
    const notFound = document.getElementById('music163NotFound').checked;
    const albumSongInputGroup = document.getElementById('albumSongInputGroup');
    const mvGroup = document.getElementById('mvGroup');
    
    if (!isAlbumSong) {
        // 不是专辑曲模式，确保mvGroup显示
        mvGroup.style.display = 'block';
        return;
    }
    
    // 是专辑曲模式
    if (notFound) {
        albumSongInputGroup.style.display = 'none';
        mvGroup.style.display = 'block';
    } else {
        albumSongInputGroup.style.display = 'block';
        mvGroup.style.display = 'none';
    }
}

function extractMusic163Id(link) {
    if (!link) return null;
    
    const urlParams = new URLSearchParams(link.split('?')[1]);
    const id = urlParams.get('id');
    
    if (id && /^\d+$/.test(id)) {
        return id;
    }
    
    const match = link.match(/song\/(\d+)/);
    if (match) {
        return match[1];
    }
    
    return null;
}

function initPlatformCheckboxes() {
    const hasNiconico = document.getElementById('hasNiconico');
    const hasBilibili = document.getElementById('hasBilibili');
    const hasYouTube = document.getElementById('hasYouTube');
    
    if (hasNiconico) {
        hasNiconico.addEventListener('change', togglePlatformInputs);
    }
    if (hasBilibili) {
        hasBilibili.addEventListener('change', togglePlatformInputs);
    }
    if (hasYouTube) {
        hasYouTube.addEventListener('change', togglePlatformInputs);
    }
    
    togglePlatformInputs();
}

function togglePlatformInputs() {
    const hasNiconico = document.getElementById('hasNiconico').checked;
    const hasBilibili = document.getElementById('hasBilibili').checked;
    const hasYouTube = document.getElementById('hasYouTube').checked;
    
    const niconicoGroup = document.getElementById('niconicoInputGroup');
    const bilibiliGroup = document.getElementById('bilibiliInputGroup');
    const youtubeGroup = document.getElementById('youtubeInputGroup');
    const mvGroup = document.getElementById('mvGroup');
    
    if (niconicoGroup) {
        niconicoGroup.style.display = hasNiconico ? 'block' : 'none';
    }
    if (bilibiliGroup) {
        bilibiliGroup.style.display = hasBilibili ? 'block' : 'none';
    }
    if (youtubeGroup) {
        youtubeGroup.style.display = hasYouTube ? 'block' : 'none';
    }
    
    if (mvGroup) {
        mvGroup.style.display = 'block';
        
        const mvOriginalIdInput = mvGroup.querySelector('[data-is-original="true"]');
        if (mvOriginalIdInput) {
            if (hasBilibili) {
                mvOriginalIdInput.disabled = true;
                mvOriginalIdInput.style.backgroundColor = '#e9ecef';
                mvOriginalIdInput.style.cursor = 'not-allowed';
                mvOriginalIdInput.value = document.getElementById('bbId').value;
            } else {
                mvOriginalIdInput.disabled = false;
                mvOriginalIdInput.style.backgroundColor = '';
                mvOriginalIdInput.style.cursor = '';
            }
        }
    }
}

function syncBilibiliIdToMv() {
    const hasBilibili = document.getElementById('hasBilibili').checked;
    const bbId = document.getElementById('bbId').value;
    const mvOriginalIdInput = document.querySelector('[data-is-original="true"]');
    
    if (hasBilibili && mvOriginalIdInput) {
        mvOriginalIdInput.value = bbId;
    }
}

function toggleSongLanguageOther() {
    const songLanguage = document.getElementById('songLanguage').value;
    const otherGroup = document.getElementById('songLanguageOtherGroup');
    
    if (otherGroup) {
        otherGroup.style.display = songLanguage === '其他' ? 'block' : 'none';
    }
    
    toggleChineseSongHint();
}

function toggleProducerEntryName() {
    const producerNameLj = document.getElementById('producerNameLj').checked;
    const entryNameGroup = document.getElementById('producerEntryNameGroup');
    
    if (entryNameGroup) {
        entryNameGroup.style.display = producerNameLj ? 'block' : 'none';
    }
}

function toggleMultilinePostText() {
    const isMultiline = document.getElementById('multilinePostText').checked;
    const postTextOriginal = document.getElementById('postTextOriginal');
    const postTextTranslated = document.getElementById('postTextTranslated');
    const postTextOriginalLjLabel = document.querySelector('label[for="postTextOriginalLj"]') || 
                                     document.getElementById('postTextOriginalLj')?.closest('.checkbox-label');
    
    if (postTextOriginal) {
        const originalValue = postTextOriginal.value;
        const originalParent = postTextOriginal.parentNode;
        
        if (isMultiline) {
            const newElement = document.createElement('textarea');
            newElement.id = 'postTextOriginal';
            newElement.name = 'postTextOriginal';
            newElement.rows = '3';
            newElement.placeholder = 'P主在投稿时写的原文...';
            newElement.style.flex = '1';
            newElement.value = originalValue;
            postTextOriginal.replaceWith(newElement);
        } else {
            const newElement = document.createElement('input');
            newElement.type = 'text';
            newElement.id = 'postTextOriginal';
            newElement.name = 'postTextOriginal';
            newElement.placeholder = 'P主在投稿时写的原文...';
            newElement.style.flex = '1';
            newElement.value = originalValue;
            postTextOriginal.replaceWith(newElement);
        }
    }
    
    if (postTextTranslated) {
        const translatedValue = postTextTranslated.value;
        
        if (isMultiline) {
            const newElement = document.createElement('textarea');
            newElement.id = 'postTextTranslated';
            newElement.name = 'postTextTranslated';
            newElement.rows = '3';
            newElement.placeholder = '投稿文的中文翻译...';
            newElement.value = translatedValue;
            postTextTranslated.replaceWith(newElement);
        } else {
            const newElement = document.createElement('input');
            newElement.type = 'text';
            newElement.id = 'postTextTranslated';
            newElement.name = 'postTextTranslated';
            newElement.placeholder = '投稿文的中文翻译...';
            newElement.value = translatedValue;
            postTextTranslated.replaceWith(newElement);
        }
    }
    
    const ljCheckbox = document.getElementById('postTextOriginalLj');
    if (ljCheckbox && ljCheckbox.closest('.checkbox-label')) {
        const ljLabel = ljCheckbox.closest('.checkbox-label');
        const spanElement = ljLabel.querySelector('span');
        if (spanElement) {
            spanElement.textContent = isMultiline ? '套用{{ljd}}模板' : '套用{{lj}}模板';
        }
    }
}

function toggleSongTypeOther() {
    const songType = document.getElementById('songType').value;
    const otherGroup = document.getElementById('songTypeOtherGroup');
    
    if (otherGroup) {
        otherGroup.style.display = songType === '其他' ? 'block' : 'none';
    }
}

function toggleTranslatorUser() {
    const isUser = document.getElementById('translatorIsUser').checked;
    const sourceGroup = document.getElementById('translationSourceGroup');
    const sourceNameGroup = document.getElementById('translationSourceNameGroup');
    
    if (sourceGroup) {
        sourceGroup.style.display = isUser ? 'none' : 'block';
    }
    if (sourceNameGroup) {
        sourceNameGroup.style.display = isUser ? 'none' : 'block';
    }
}

function toggleMultiSingerLyrics() {
    const isChecked = document.getElementById('multiSingerLyrics').checked;
    const options = document.getElementById('multiSingerLyricsOptions');
    
    if (options) {
        options.style.display = isChecked ? 'block' : 'none';
    }
}

function toggleLyricsLanguage() {
    const isChecked = document.getElementById('lyricsNotJapanese').checked;
    const group = document.getElementById('lyricsLanguageGroup');
    const furiganaLabel = document.getElementById('furiganaLabel');
    const useFurigana = document.getElementById('useFurigana');
    
    if (group) {
        group.style.display = isChecked ? 'block' : 'none';
    }
    if (furiganaLabel) {
        furiganaLabel.style.display = isChecked ? 'none' : 'inline-flex';
    }
    if (isChecked && useFurigana) {
        useFurigana.checked = false;
    }
}

let mvItemId = 0;

function initMvList() {
    const mvList = document.getElementById('mvList');
    if (mvList) {
        mvList.innerHTML = '';
        addMvOriginalItem();
    }
}

function addMvOriginalItem() {
    const mvList = document.getElementById('mvList');
    const itemId = mvItemId++;
    
    const mvItem = document.createElement('div');
    mvItem.className = 'mv-item mv-item-original';
    mvItem.dataset.itemId = itemId;
    
    mvItem.innerHTML = `
        <span class="mv-label">原曲</span>
        <input type="text" class="mv-id" placeholder="BV号" data-field="mvId" data-is-original="true">
    `;
    
    mvList.appendChild(mvItem);
}

function addMvVersionItem() {
    const mvList = document.getElementById('mvList');
    const itemId = mvItemId++;
    
    const mvItem = document.createElement('div');
    mvItem.className = 'mv-item';
    mvItem.draggable = true;
    mvItem.dataset.itemId = itemId;
    
    mvItem.innerHTML = `
        <span class="drag-handle">☰</span>
        <input type="text" class="mv-version" placeholder="版本名称（如：本家Remix）" data-field="mvVersion">
        <input type="text" class="mv-id" placeholder="BV号" data-field="mvId">
        <button type="button" class="btn-remove" onclick="removeMvItem(${itemId})">×</button>
    `;
    
    mvList.appendChild(mvItem);
    
    mvItem.addEventListener('dragstart', handleMvDragStart);
    mvItem.addEventListener('dragend', handleMvDragEnd);
    mvItem.addEventListener('dragover', handleMvDragOver);
    mvItem.addEventListener('drop', handleMvDrop);
}

function removeMvItem(itemId) {
    const mvItem = document.querySelector(`.mv-item[data-item-id="${itemId}"]`);
    if (mvItem && !mvItem.classList.contains('mv-item-original')) {
        mvItem.remove();
    }
}

function handleMvDragStart(e) {
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.itemId);
}

function handleMvDragEnd(e) {
    this.classList.remove('dragging');
}

function handleMvDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleMvDrop(e) {
    e.preventDefault();
    const draggingId = e.dataTransfer.getData('text/plain');
    const draggingItem = document.querySelector(`.mv-item[data-item-id="${draggingId}"]`);
    
    if (draggingItem && this !== draggingItem && !this.classList.contains('mv-item-original')) {
        const mvList = document.getElementById('mvList');
        const items = [...mvList.querySelectorAll('.mv-item')];
        const draggingIndex = items.indexOf(draggingItem);
        const targetIndex = items.indexOf(this);
        
        if (draggingIndex < targetIndex) {
            this.parentNode.insertBefore(draggingItem, this.nextSibling);
        } else {
            this.parentNode.insertBefore(draggingItem, this);
        }
    }
}

function getMvData() {
    const mvItems = document.querySelectorAll('.mv-item');
    const mvData = [];
    
    mvItems.forEach(item => {
        const isOriginal = item.classList.contains('mv-item-original');
        const versionInput = item.querySelector('[data-field="mvVersion"]');
        const idInput = item.querySelector('[data-field="mvId"]');
        
        const version = isOriginal ? '原曲' : (versionInput ? versionInput.value.trim() : '');
        const id = idInput ? idInput.value.trim() : '';
        
        if (id) {
            mvData.push({ version, id, isOriginal });
        }
    });
    
    return mvData;
}

let staffItemId = 0;
const defaultStaffRoles = ['作词', '作曲', '编曲', '曲绘'];

function initStaffList() {
    const staffList = document.getElementById('staffList');
    staffList.innerHTML = '';
    
    defaultStaffRoles.forEach(role => {
        addStaffItem(role);
    });
}

function addStaffItem(defaultRole = '') {
    const staffList = document.getElementById('staffList');
    const itemId = staffItemId++;
    
    const staffItem = document.createElement('div');
    staffItem.className = 'staff-item';
    staffItem.draggable = true;
    staffItem.dataset.itemId = itemId;
    
    staffItem.innerHTML = `
        <span class="drag-handle">☰</span>
        <select class="staff-role staff-role-select" data-field="role" onchange="handleStaffRoleChange(this, ${itemId})">
            <option value="">选择职位</option>
            <option value="作词" ${defaultRole === '作词' ? 'selected' : ''}>作词</option>
            <option value="作曲" ${defaultRole === '作曲' ? 'selected' : ''}>作曲</option>
            <option value="编曲" ${defaultRole === '编曲' ? 'selected' : ''}>编曲</option>
            <option value="曲绘" ${defaultRole === '曲绘' ? 'selected' : ''}>曲绘</option>
            <option value="其他" ${defaultRole === '其他' ? 'selected' : ''}>其他</option>
        </select>
        <input type="text" class="staff-role-other" placeholder="输入职位" data-field="roleOther" style="display: none; width: 100px;">
        <input type="text" class="staff-name" placeholder="名称" data-field="name">
        <div class="staff-options">
            <label class="checkbox-label">
                <input type="checkbox" data-field="lj">
                <span>{{lj}}</span>
            </label>
            <button type="button" class="btn-remove" onclick="removeStaffItem(${itemId})">×</button>
        </div>
    `;
    
    staffList.appendChild(staffItem);
    
    staffItem.addEventListener('dragstart', handleDragStart);
    staffItem.addEventListener('dragend', handleDragEnd);
    staffItem.addEventListener('dragover', handleDragOver);
    staffItem.addEventListener('drop', handleDrop);
}

function handleStaffRoleChange(selectElement, itemId) {
    const staffItem = document.querySelector(`.staff-item[data-item-id="${itemId}"]`);
    const roleOtherInput = staffItem.querySelector('[data-field="roleOther"]');
    
    if (selectElement.value === '其他') {
        roleOtherInput.style.display = 'block';
        roleOtherInput.focus();
    } else {
        roleOtherInput.style.display = 'none';
        roleOtherInput.value = '';
    }
}

function removeStaffItem(itemId) {
    const staffItem = document.querySelector(`.staff-item[data-item-id="${itemId}"]`);
    if (staffItem) {
        staffItem.remove();
    }
}

function handleDragStart(e) {
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.itemId);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
    e.preventDefault();
    const draggingId = e.dataTransfer.getData('text/plain');
    const draggingItem = document.querySelector(`.staff-item[data-item-id="${draggingId}"]`);
    
    if (draggingItem && this !== draggingItem) {
        const staffList = document.getElementById('staffList');
        const items = [...staffList.querySelectorAll('.staff-item')];
        const draggingIndex = items.indexOf(draggingItem);
        const targetIndex = items.indexOf(this);
        
        if (draggingIndex < targetIndex) {
            this.parentNode.insertBefore(draggingItem, this.nextSibling);
        } else {
            this.parentNode.insertBefore(draggingItem, this);
        }
    }
}

function getStaffData() {
    const staffItems = document.querySelectorAll('.staff-item');
    const staffData = [];
    
    staffItems.forEach(item => {
        let role = item.querySelector('[data-field="role"]').value;
        const roleOther = item.querySelector('[data-field="roleOther"]').value.trim();
        const name = item.querySelector('[data-field="name"]').value.trim();
        const lj = item.querySelector('[data-field="lj"]').checked;
        
        if (role === '其他' && roleOther) {
            role = roleOther;
        }
        
        if (role && name) {
            staffData.push({ role, name, lj });
        }
    });
    
    return staffData;
}

function initDatePickers() {
    const datePairs = [
        ['nndDatePicker', 'nndDate'],
        ['bbDatePicker', 'bbDate'],
        ['ytDatePicker', 'ytDate']
    ];
    
    datePairs.forEach(([pickerId, inputId]) => {
        const picker = document.getElementById(pickerId);
        const input = document.getElementById(inputId);
        
        if (picker && input) {
            picker.addEventListener('change', function() {
                if (this.value) {
                    const date = new Date(this.value);
                    const year = date.getFullYear();
                    const month = date.getMonth() + 1;
                    const day = date.getDate();
                    input.value = `${year}年${month}月${day}日`;
                }
            });
            
            input.addEventListener('input', function() {
                const value = this.value.trim();
                if (/^\d{8}$/.test(value)) {
                    const year = value.substring(0, 4);
                    const month = value.substring(4, 6);
                    const day = value.substring(6, 8);
                    this.value = `${year}年${parseInt(month)}月${parseInt(day)}日`;
                }
            });
        }
    });
}

function toggleImageCreatorType() {
    const illustratorGroup = document.getElementById('illustratorGroup');
    const animatorGroup = document.getElementById('animatorGroup');
    const selectedType = document.querySelector('input[name="imageCreatorType"]:checked').value;
    
    if (selectedType === 'illustrator') {
        illustratorGroup.style.display = 'block';
        animatorGroup.style.display = 'none';
    } else {
        illustratorGroup.style.display = 'none';
        animatorGroup.style.display = 'block';
    }
}

function toggleChineseSongHint() {
    const songLanguage = document.getElementById('songLanguage').value;
    const hintBox = document.getElementById('chineseSongHint');
    
    if (songLanguage === '汉语') {
        hintBox.style.display = 'block';
    } else {
        hintBox.style.display = 'none';
    }
}

function toggleOtherNationality() {
    const nationality = document.getElementById('producerNationality').value;
    const otherGroup = document.getElementById('otherNationalityGroup');
    
    if (nationality === '其他') {
        otherGroup.style.display = 'block';
    } else {
        otherGroup.style.display = 'none';
    }
}

function toggleVocaloidCollection() {
    const checkbox = document.getElementById('participateVocaloidCollection');
    const options = document.getElementById('vocaloidCollectionOptions');
    
    options.style.display = checkbox.checked ? 'block' : 'none';
}

function updateLyricsLineCount() {
    const original = document.getElementById('lyricsOriginal').value;
    const translated = document.getElementById('lyricsTranslated').value;
    
    const originalLines = original.trim() ? original.trim().split('\n').length : 0;
    const translatedLines = translated.trim() ? translated.trim().split('\n').length : 0;
    
    const originalCountEl = document.getElementById('originalLineCount');
    const translatedCountEl = document.getElementById('translatedLineCount');
    const warningBox = document.getElementById('lyricsLineWarning');
    const warningText = document.getElementById('lyricsLineWarningText');
    
    originalCountEl.textContent = originalLines > 0 ? `(${originalLines}行)` : '';
    translatedCountEl.textContent = translatedLines > 0 ? `(${translatedLines}行)` : '';
    
    if (originalLines > 0 && translatedLines > 0 && originalLines !== translatedLines) {
        originalCountEl.classList.add('error');
        translatedCountEl.classList.add('error');
        warningBox.style.display = 'flex';
        warningText.textContent = `原文与译文行数不一致：原文${originalLines}行，译文${translatedLines}行`;
    } else {
        originalCountEl.classList.remove('error');
        translatedCountEl.classList.remove('error');
        warningBox.style.display = 'none';
    }
}

function getFormValue(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : '';
}

function getCheckboxValue(id) {
    const element = document.getElementById(id);
    return element ? element.checked : false;
}

function applyLjTemplate(text, shouldApply) {
    if (!text) return '';
    return shouldApply ? `{{lj|${text}}}` : text;
}

function formatVocalistName(name) {
    if (!name) return '';
    const names = name.split(/[、,，]/).map(n => n.trim()).filter(n => n);
    return names.map(n => `[[${n}]]`).join('、');
}

function formatVocalistNameSimple(name) {
    if (!name) return '';
    const names = name.split(/[、,，]/).map(n => n.trim()).filter(n => n);
    return names.join('、');
}

function generateWikiText() {
    const songNameOriginal = getFormValue('songNameOriginal');
    const songNameTranslated = getFormValue('songNameTranslated');
    const songNameEnglish = getFormValue('songNameEnglish');
    const producerName = getFormValue('producerName');
    const producerEntryName = getFormValue('producerEntryName');
    const vocalistName = getFormValue('vocalistName');
    const engineName = getFormValue('engineName');
    const producerTemplate = getFormValue('producerTemplate');
    const vocalistTemplate = getFormValue('vocalistTemplate');
    const useNewSongbox = getCheckboxValue('useNewSongbox');

    const imageName = getFormValue('imageName');
    const customColor = getFormValue('customColor');
    const imageCreatorType = document.querySelector('input[name="imageCreatorType"]:checked').value;
    const illustratorName = getFormValue('illustratorName');
    const animatorName = getFormValue('animatorName');
    const illustratorNameLj = getCheckboxValue('illustratorNameLj');
    const animatorNameLj = getCheckboxValue('animatorNameLj');

    const hasNiconico = getCheckboxValue('hasNiconico');
    const hasBilibili = getCheckboxValue('hasBilibili');
    const hasYouTube = getCheckboxValue('hasYouTube');
    const nndId = getFormValue('nndId');
    const nndDate = getFormValue('nndDate');
    const bbId = getFormValue('bbId');
    const bbDate = getFormValue('bbDate');
    const ytId = getFormValue('ytId');
    const ytDate = getFormValue('ytDate');
    const mvId = getFormValue('mvId');

    const nrank = getFormValue('nrank');
    const brank = getFormValue('brank');
    const yrank = getFormValue('yrank');

    const postTextOriginal = getFormValue('postTextOriginal');
    const postTextTranslated = getFormValue('postTextTranslated');
    const postTextOriginalLj = getCheckboxValue('postTextOriginalLj');
    const multilinePostText = getCheckboxValue('multilinePostText');

    let songLanguage = getFormValue('songLanguage');
    const songLanguageOther = getFormValue('songLanguageOther');
    if (songLanguage === '其他' && songLanguageOther) {
        songLanguage = songLanguageOther;
    }
    let songType = getFormValue('songType');
    const songTypeOther = getFormValue('songTypeOther');
    if (songType === '其他' && songTypeOther) {
        songType = songTypeOther;
    }
    const albumName = getFormValue('albumName');
    const albumNameLj = getCheckboxValue('albumNameLj');
    const producerNationality = getFormValue('producerNationality');
    const otherNationality = getFormValue('otherNationality');

    const staffData = getStaffData();

    const translatorName = getFormValue('translatorName');
    const translatorIsUser = getCheckboxValue('translatorIsUser');
    const translationSource = getFormValue('translationSource');
    const translationSourceName = getFormValue('translationSourceName');
    const lyricsOriginal = getFormValue('lyricsOriginal');
    const lyricsTranslated = getFormValue('lyricsTranslated');
    const multiSingerLyrics = getCheckboxValue('multiSingerLyrics');
    const lyricsExtraParams = getFormValue('lyricsExtraParams');
    const lyricsNotJapanese = getCheckboxValue('lyricsNotJapanese');
    const lyricsLanguageTag = getFormValue('lyricsLanguageTag');
    const useFurigana = getCheckboxValue('useFurigana');
    const mvData = getMvData();

    const participateVocaloidCollection = getCheckboxValue('participateVocaloidCollection');
    const vocaloidCollectionSeason = getFormValue('vocaloidCollectionSeason');
    const vocaloidCollectionRank = getFormValue('vocaloidCollectionRank');
    const humanVersion = getFormValue('humanVersion');

    const additionalTemplates = getFormValue('additionalTemplates');
    const additionalCategories = getFormValue('additionalCategories');

    const songNameOriginalLj = getCheckboxValue('songNameOriginalLj');
    const producerNameLj = getCheckboxValue('producerNameLj');
    
    const isAlbumSong = getCheckboxValue('isAlbumSong');
    const music163Link = getFormValue('music163Link');
    const music163NotFound = getCheckboxValue('music163NotFound');

    if (!songNameOriginal || !producerName || !vocalistName || !engineName) {
        showToast('请填写所有必填项！', 'error');
        return;
    }

    if (isAlbumSong && !albumName) {
        showToast('专辑曲必须填写收录专辑！', 'error');
        return;
    }

    if (isAlbumSong && !music163NotFound && !music163Link) {
        showToast('请填写网易云音乐单曲链接！', 'error');
        return;
    }

    let wikiText = '';

    if (songNameOriginalLj) {
        wikiText += `{{标题替换|{{lj|${songNameOriginal}}}}}\n`;
    }

    const engineParts = engineName.split(/[、,，]/).map(e => e.trim()).filter(e => e);
    const engineParam = engineParts.join('|');
    
    let rankParams = '';
    if (nrank) rankParams += `|nrank=${nrank}`;
    if (brank) rankParams += `|brank=${brank}`;
    if (yrank) rankParams += `|yrank=${yrank}`;
    
    if (nrank || brank || yrank) {
        wikiText += `{{虚拟歌手歌曲荣誉题头|${engineParam}${rankParams}}}\n`;
    }

    const songboxTemplate = useNewSongbox ? 'VOCALOID_Songbox/new' : 'VOCALOID_Songbox';
    wikiText += `{{${songboxTemplate}\n`;
    
    if (imageName) {
        wikiText += `|image = ${imageName}\n`;
    }

    let imageInfo = '';
    if (imageCreatorType === 'illustrator' && illustratorName) {
        const formattedIllustrator = applyLjTemplate(illustratorName, illustratorNameLj);
        imageInfo = `Illustration by ${formattedIllustrator}`;
    } else if (imageCreatorType === 'animator' && animatorName) {
        const formattedAnimator = applyLjTemplate(animatorName, animatorNameLj);
        imageInfo = `Movie by ${formattedAnimator}`;
    }
    if (imageInfo) {
        wikiText += `|图片信息 = ${imageInfo}\n`;
    }

    if (customColor) {
        wikiText += `|颜色 = ${customColor}\n`;
    }

    wikiText += `|演唱 = ${formatVocalistName(vocalistName)}\n`;

    let songNameDisplay = applyLjTemplate(songNameOriginal, songNameOriginalLj);
    if (songNameEnglish) {
        songNameDisplay += `<br>${songNameEnglish}`;
    }
    if (songNameTranslated) {
        songNameDisplay += `<br>${songNameTranslated}`;
    }
    wikiText += `|歌曲名称 = ${songNameDisplay}\n`;

    let producerLink;
    if (producerNameLj) {
        if (producerEntryName) {
            producerLink = `[[${producerEntryName}|{{lj|${producerName}}}]]`;
        } else {
            producerLink = `[[${producerName}|{{lj|${producerName}}}]]`;
        }
    } else {
        producerLink = `[[${producerName}]]`;
    }
    wikiText += `|P主 = ${producerLink}\n`;

    const postDatesList = [];
    if (hasNiconico && nndId && nndDate) {
        postDatesList.push(nndDate);
    }
    if (hasBilibili && bbId && bbDate) {
        postDatesList.push(bbDate);
    }
    if (hasYouTube && ytId && ytDate) {
        postDatesList.push(ytDate);
    }

    let useUnifiedPostTime = false;
    let unifiedPostTime = '';
    
    if (postDatesList.length === 1) {
        useUnifiedPostTime = true;
        unifiedPostTime = postDatesList[0];
    } else if (postDatesList.length > 1) {
        const firstDate = postDatesList[0];
        const allSame = postDatesList.every(d => d === firstDate);
        if (allSame) {
            useUnifiedPostTime = true;
            unifiedPostTime = firstDate;
        }
    }

    if (useUnifiedPostTime) {
        wikiText += `|投稿时间 = ${unifiedPostTime}\n`;
    }

    if (hasNiconico && nndId) {
        wikiText += `|nnd_id = ${nndId}\n`;
    }
    if (hasNiconico && nndDate && !useUnifiedPostTime) {
        wikiText += `|nnd_date = ${nndDate}\n`;
    }

    if (hasBilibili && bbId) {
        wikiText += `|bb_id = ${bbId}\n`;
    }
    if (hasBilibili && bbDate && !useUnifiedPostTime) {
        wikiText += `|bb_date = ${bbDate}\n`;
    }

    if (hasYouTube && ytId) {
        wikiText += `|yt_id = ${ytId}\n`;
    }
    if (hasYouTube && ytDate && !useUnifiedPostTime) {
        wikiText += `|yt_date = ${ytDate}\n`;
    }

    wikiText += `}}\n`;

    if (postTextOriginal || postTextTranslated) {
        let formattedPostTextOriginal;
        if (multilinePostText && postTextOriginalLj) {
            formattedPostTextOriginal = `{{ljd|${postTextOriginal}}}`;
        } else {
            formattedPostTextOriginal = applyLjTemplate(postTextOriginal, postTextOriginalLj);
        }
        wikiText += `{{Cquote|${formattedPostTextOriginal}`;
        if (postTextTranslated) {
            wikiText += `\n----\n${postTextTranslated}`;
        }
        wikiText += `|${producerName}投稿文}}\n`;
    }

    wikiText += `\n《'''${applyLjTemplate(songNameOriginal, songNameOriginalLj)}'''》`;
    if (songNameTranslated) {
        wikiText += `（${songNameTranslated}）`;
    }

    let producerDisplayLink;
    if (producerNameLj) {
        if (producerEntryName) {
            producerDisplayLink = `[[${producerEntryName}|{{lj|${producerName}}}]]`;
        } else {
            producerDisplayLink = `[[${producerName}|{{lj|${producerName}}}]]`;
        }
    } else {
        producerDisplayLink = `[[${producerName}]]`;
    }
    wikiText += `是${producerDisplayLink}于`;

    const postDates = [];
    const postSites = [];
    
    if (hasNiconico && nndId) {
        postDates.push({ date: nndDate, site: 'niconico' });
        postSites.push('niconico');
    }
    if (hasYouTube && ytId) {
        postDates.push({ date: ytDate, site: 'YouTube' });
        postSites.push('YouTube');
    }
    if (hasBilibili && bbId) {
        postDates.push({ date: bbDate, site: 'bilibili' });
        postSites.push('bilibili');
    }

    if (postDates.length > 0) {
        if (useUnifiedPostTime) {
            wikiText += `${unifiedPostTime}投稿至[[${postSites.join(']]、[[')}]]的`;
        } else {
            for (let i = 0; i < postDates.length; i++) {
                if (i > 0) wikiText += '、';
                wikiText += `${postDates[i].date}投稿至[[${postDates[i].site}]]`;
            }
            wikiText += '的';
        }
    }

    const engineDisplay = engineParts.map(e => `[[${e}]]`).join('和');
    wikiText += `${engineDisplay}${songLanguage}${songType}歌曲，由${formatVocalistName(vocalistName)}演唱`;

    if (albumName) {
        const albumDisplay = applyLjTemplate(albumName, albumNameLj);
        if (isAlbumSong) {
            wikiText += `，收录于专辑《'''${albumDisplay}'''》中`;
        } else {
            wikiText += `，并被收录于专辑《'''${albumDisplay}'''》中`;
        }
    }
    wikiText += `。\n`;

    if (participateVocaloidCollection && vocaloidCollectionSeason) {
        wikiText += `\n本曲参与了[[The VOCALOID Collection]](${applyLjTemplate(vocaloidCollectionSeason, true)})活动`;
        if (vocaloidCollectionRank) {
            wikiText += `并获得${vocaloidCollectionRank}`;
        }
        wikiText += `。\n`;
    }

    if (humanVersion) {
        wikiText += `\n另有由${humanVersion}演唱的人声本家。\n`;
    }

    wikiText += `\n== 歌曲 ==\n`;

    if (staffData.length > 0) {
        const staffMap = {};
        staffData.forEach(staff => {
            if (!staffMap[staff.name]) {
                staffMap[staff.name] = {
                    roles: [],
                    lj: staff.lj
                };
            }
            staffMap[staff.name].roles.push(staff.role);
            staffMap[staff.name].lj = staffMap[staff.name].lj || staff.lj;
        });

        const uniqueStaffCount = Object.keys(staffMap).length;
        const useHideTemplate = uniqueStaffCount > 5;

        let staffContent = `{{VOCALOID Songbox Introduction\n`;
        
        let groupNum = 1;
        for (const [name, data] of Object.entries(staffMap)) {
            const roleDisplay = data.roles.join('<br>');
            const nameDisplay = applyLjTemplate(name, data.lj);
            staffContent += `|group${groupNum} = ${roleDisplay}\n`;
            staffContent += `|list${groupNum} = ${nameDisplay}\n`;
            groupNum++;
        }

        staffContent += `|group${groupNum} = 演唱\n`;
        staffContent += `|list${groupNum} = ${formatVocalistNameSimple(vocalistName)}\n`;

        staffContent += `}}\n\n`;

        if (useHideTemplate) {
            wikiText += `<div style="float:right">{{Hide|标题=本曲制作人一览|内容=\n`;
            wikiText += staffContent;
            wikiText += `}}</div>\n\n`;
        } else {
            wikiText += staffContent;
        }
    }

    if (isAlbumSong) {
        if (music163NotFound) {
            // 网易云没有这首歌，使用BilibiliVideo
            if (hasBilibili && bbId) {
                wikiText += `{{BilibiliVideo|id=${bbId}}}\n`;
                
                const otherMvVersions = mvData.filter(mv => !mv.isOriginal);
                if (otherMvVersions.length > 0) {
                    wikiText += `\n`;
                    otherMvVersions.forEach((mv, index) => {
                        wikiText += `; ${mv.version}\n`;
                        wikiText += `{{BilibiliVideo|id=${mv.id}}}\n`;
                    });
                }
                wikiText += `\n`;
            } else if (mvData.length > 0) {
                mvData.forEach((mv, index) => {
                    if (mvData.length > 1) {
                        wikiText += `; ${mv.version}\n`;
                    }
                    wikiText += `{{BilibiliVideo|id=${mv.id}}}\n`;
                    if (index < mvData.length - 1) {
                        wikiText += `\n`;
                    }
                });
                wikiText += `\n`;
            }
        } else {
            // 使用网易云音乐模板
            const music163Id = extractMusic163Id(music163Link);
            if (music163Id) {
                wikiText += `{{music163|id=${music163Id}}}\n`;
            }
        }
    } else {
        // 普通模式
        if (hasBilibili && bbId) {
            wikiText += `{{BilibiliVideo|id=${bbId}}}\n`;
            
            const otherMvVersions = mvData.filter(mv => !mv.isOriginal);
            if (otherMvVersions.length > 0) {
                wikiText += `\n`;
                otherMvVersions.forEach((mv, index) => {
                    wikiText += `; ${mv.version}\n`;
                    wikiText += `{{BilibiliVideo|id=${mv.id}}}\n`;
                });
            }
            wikiText += `\n`;
        } else if (mvData.length > 0) {
            mvData.forEach((mv, index) => {
                if (mvData.length > 1) {
                    wikiText += `; ${mv.version}\n`;
                }
                wikiText += `{{BilibiliVideo|id=${mv.id}}}\n`;
                if (index < mvData.length - 1) {
                    wikiText += `\n`;
                }
            });
            wikiText += `\n`;
        }
    }

    wikiText += `== 歌词 ==\n`;

    if (translatorName || translationSource) {
        if (translatorIsUser) {
            wikiText += `*翻译：[[User:${translatorName}|${translatorName}]]\n`;
        } else {
            wikiText += `*翻译：${translatorName}`;
            if (translationSource && translationSourceName) {
                wikiText += `<ref>翻译转载自[${translationSource} ${translationSourceName}]。</ref>`;
            } else if (translationSource) {
                wikiText += `<ref>翻译转载自[${translationSource}]。</ref>`;
            }
            wikiText += `\n`;
        }
    }

    const lyricsTemplate = multiSingerLyrics ? 'LyricsKai/colors' : 'LyricsKai';
    wikiText += `{{${lyricsTemplate}\n`;
    
    if (multiSingerLyrics && lyricsExtraParams) {
        const extraLines = lyricsExtraParams.split('\n').filter(l => l.trim());
        extraLines.forEach(line => {
            wikiText += `|${line.trim()}\n`;
        });
    }
    
    if (lyricsNotJapanese && lyricsLanguageTag) {
        wikiText += `|llang=${lyricsLanguageTag}\n`;
    }
    
    wikiText += `|original=\n`;
    if (lyricsOriginal) {
        if (useFurigana) {
            wikiText += `{{振假名|template=Photrans\n`;
            wikiText += `|${lyricsOriginal}\n`;
            wikiText += `}}\n`;
        } else {
            wikiText += `${lyricsOriginal}\n`;
        }
    }
    wikiText += `|translated=\n`;
    if (lyricsTranslated) {
        wikiText += `${lyricsTranslated}\n`;
    }
    wikiText += `}}\n`;

    wikiText += `\n== 注释与外部链接 ==\n`;
    wikiText += `<references/>\n`;

    if (producerTemplate) {
        wikiText += `{{${producerTemplate}}}\n`;
    }

    if (vocalistTemplate) {
        wikiText += `{{${vocalistTemplate}}}\n`;
    }

    if (additionalTemplates) {
        const templates = additionalTemplates.split('\n').filter(t => t.trim());
        for (const template of templates) {
            wikiText += `{{${template.trim()}}}\n`;
        }
    }

    const finalNationality = producerNationality === '其他' ? otherNationality : producerNationality;
    wikiText += `\n[[Category:${finalNationality}音乐作品]]\n`;
    
    const vocalistNames = vocalistName.split(/[、,，]/).map(n => n.trim()).filter(n => n);
    for (const name of vocalistNames) {
        wikiText += `[[Category:${name}歌曲]]\n`;
    }

    for (const engine of engineParts) {
        wikiText += `[[Category:使用${engine}的歌曲]]\n`;
    }

    wikiText += `[[Category:${songLanguage}歌曲]]\n`;

    if (songType === '翻唱') {
        wikiText += `[[Category:翻唱歌曲]]\n`;
    }

    if (additionalCategories) {
        const categories = additionalCategories.split('\n').filter(c => c.trim());
        for (const category of categories) {
            wikiText += `[[Category:${category.trim()}]]\n`;
        }
    }

    document.getElementById('output').value = wikiText;
    showToast('WikiText生成成功！');
    
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const hintBox = document.getElementById('generationHint');
    hintBox.textContent = `于${timeStr}生成的WikiText，生成之后的所有改动不会被同步。如有必要，请重新生成WikiText。`;
    hintBox.style.display = 'block';
    
    document.getElementById('generateBtn').textContent = '重新生成';
    
    document.getElementById('output').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function copyToClipboard(text) {
    if (!text) {
        showToast('没有可复制的内容！', 'error');
        return;
    }

    navigator.clipboard.writeText(text).then(function() {
        showToast('已复制到剪贴板！');
    }).catch(function(err) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showToast('已复制到剪贴板！');
        } catch (e) {
            showToast('复制失败，请手动复制。', 'error');
        }
        document.body.removeChild(textarea);
    });
}

function clearForm() {
    if (confirm('确定要清空所有表单内容吗？')) {
        document.querySelectorAll('input[type="text"], input[type="date"], textarea').forEach(input => {
            input.value = '';
        });
        
        document.querySelectorAll('select').forEach(select => {
            select.selectedIndex = 0;
        });
        
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.checked = radio.hasAttribute('checked');
        });
        
        document.getElementById('output').value = '';
        document.getElementById('vocaloidCollectionOptions').style.display = 'none';
        document.getElementById('chineseSongHint').style.display = 'none';
        document.getElementById('otherNationalityGroup').style.display = 'none';
        document.getElementById('illustratorGroup').style.display = 'block';
        document.getElementById('animatorGroup').style.display = 'none';
        document.getElementById('lyricsLineWarning').style.display = 'none';
        document.getElementById('originalLineCount').textContent = '';
        document.getElementById('translatedLineCount').textContent = '';
        document.getElementById('originalLineCount').classList.remove('error');
        document.getElementById('translatedLineCount').classList.remove('error');
        document.getElementById('songLanguageOtherGroup').style.display = 'none';
        document.getElementById('songTypeOtherGroup').style.display = 'none';
        document.getElementById('translationSourceGroup').style.display = 'block';
        document.getElementById('translationSourceNameGroup').style.display = 'block';
        document.getElementById('multiSingerLyricsOptions').style.display = 'none';
        document.getElementById('lyricsLanguageGroup').style.display = 'none';
        document.getElementById('furiganaLabel').style.display = 'inline-flex';
        
        const postTextOriginal = document.getElementById('postTextOriginal');
        const postTextTranslated = document.getElementById('postTextTranslated');
        if (postTextOriginal && postTextOriginal.tagName === 'TEXTAREA') {
            const newOriginal = document.createElement('input');
            newOriginal.type = 'text';
            newOriginal.id = 'postTextOriginal';
            newOriginal.name = 'postTextOriginal';
            newOriginal.placeholder = 'P主在投稿时写的原文...';
            newOriginal.style.flex = '1';
            postTextOriginal.replaceWith(newOriginal);
        }
        if (postTextTranslated && postTextTranslated.tagName === 'TEXTAREA') {
            const newTranslated = document.createElement('input');
            newTranslated.type = 'text';
            newTranslated.id = 'postTextTranslated';
            newTranslated.name = 'postTextTranslated';
            newTranslated.placeholder = '投稿文的中文翻译...';
            postTextTranslated.replaceWith(newTranslated);
        }
        
        const ljCheckbox = document.getElementById('postTextOriginalLj');
        if (ljCheckbox && ljCheckbox.closest('.checkbox-label')) {
            const ljLabel = ljCheckbox.closest('.checkbox-label');
            const spanElement = ljLabel.querySelector('span');
            if (spanElement) {
                spanElement.textContent = '套用{{lj}}模板';
            }
        }
        
        document.getElementById('music163NotFound').checked = false;
        toggleProducerEntryName();
        togglePlatformInputs();
        toggleAlbumSongMode();
        initStaffList();
        initMvList();
        
        document.getElementById('generateBtn').textContent = '生成WikiText';
        document.getElementById('generationHint').style.display = 'none';
        
        clearSavedFormData();
        showToast('表单已清空');
    }
}

function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast${type === 'error' ? ' toast-error' : ''}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(function() {
        toast.remove();
    }, 3000);
}
