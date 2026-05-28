// VocaScribe 版本号
const VOCASCRIBE_VERSION = '1011';

function toggleAlbumReleaseDate() {
    const albumName = document.getElementById('albumName').value;
    const albumReleaseDateGroup = document.getElementById('albumReleaseDateGroup');
    const otherAlbumsList = document.getElementById('otherAlbumsList');
    const addOtherAlbumGroup = document.getElementById('addOtherAlbumGroup');
    
    if (albumName.trim()) {
        albumReleaseDateGroup.style.display = 'block';
        otherAlbumsList.style.display = 'block';
        addOtherAlbumGroup.style.display = 'block';
    } else {
        albumReleaseDateGroup.style.display = 'none';
        otherAlbumsList.style.display = 'none';
        addOtherAlbumGroup.style.display = 'none';
    }
}

let otherAlbumItemId = 0;

function addOtherAlbumItem() {
    const list = document.getElementById('otherAlbumsList');
    const itemId = otherAlbumItemId++;
    
    const item = document.createElement('div');
    item.className = 'other-submission-item';
    item.draggable = true;
    item.dataset.itemId = itemId;
    
    item.innerHTML = `
        <span class="drag-handle">☰</span>
        <div class="other-submission-content">
            <div class="other-submission-row">
                <div class="form-group" style="margin-bottom: 0; flex: 1;">
                    <input type="text" placeholder="专辑名" data-field="albumName">
                </div>
                <label class="checkbox-label" style="margin-left: 10px;">
                    <input type="checkbox" data-field="albumLj">
                    <span>套用{{lj}}模板</span>
                </label>
            </div>
        </div>
        <button type="button" class="btn-remove" onclick="removeOtherAlbumItem(${itemId})">×</button>
    `;
    
    list.appendChild(item);
    
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
    item.addEventListener('dragover', handleAlbumDragOver);
    item.addEventListener('drop', handleAlbumDrop);
}

function removeOtherAlbumItem(itemId) {
    const item = document.querySelector(`.other-submission-item[data-item-id="${itemId}"]`);
    if (item) {
        item.remove();
    }
}

function handleAlbumDragOver(e) {
    e.preventDefault();
}

function handleAlbumDrop(e) {
    e.preventDefault();
    const draggingId = e.dataTransfer.getData('text/plain');
    const draggingItem = document.querySelector(`.other-submission-item[data-item-id="${draggingId}"]`);
    
    if (draggingItem && this !== draggingItem) {
        const list = document.getElementById('otherAlbumsList');
        const items = [...list.querySelectorAll('.other-submission-item')];
        const draggingIndex = items.indexOf(draggingItem);
        const targetIndex = items.indexOf(this);
        
        if (draggingIndex < targetIndex) {
            this.parentNode.insertBefore(draggingItem, this.nextSibling);
        } else {
            this.parentNode.insertBefore(draggingItem, this);
        }
    }
}

function getOtherAlbumsData() {
    const items = document.querySelectorAll('#otherAlbumsList .other-submission-item');
    const albums = [];
    items.forEach(item => {
        const name = item.querySelector('[data-field="albumName"]')?.value || '';
        const lj = item.querySelector('[data-field="albumLj"]')?.checked || false;
        
        if (name) {
            albums.push({ name, lj });
        }
    });
    return albums;
}

function formatAlbumList(albums, includePrimary = true) {
    if (!albums || albums.length === 0) {
        return '';
    }
    
    const formattedAlbums = albums.map(album => {
        const nameDisplay = applyLjTemplate(album.name, album.lj);
        return `《'''${nameDisplay}'''》`;
    });
    
    if (formattedAlbums.length === 1) {
        return formattedAlbums[0];
    } else if (formattedAlbums.length === 2) {
        return `${formattedAlbums[0]}和${formattedAlbums[1]}`;
    } else {
        const lastAlbum = formattedAlbums.pop();
        return `${formattedAlbums.join('、')}和${lastAlbum}`;
    }
}

function saveFormData() {
    const formData = {
        version: VOCASCRIBE_VERSION,
        timestamp: Date.now(),
        autoSaveEnabled: document.getElementById('autoSaveEnabled')?.checked || false,
        inputs: {},
        checkboxes: {},
        selects: {},
        staffList: getStaffData(),
        mvList: getMvData(),
        vocalistList: getVocalistData(),
        otherSubmissionsList: getOtherSubmissionsData(),
        otherAlbumsList: getOtherAlbumsData()
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
        
        // 恢复自动保存开关状态
        if (formData.autoSaveEnabled !== undefined) {
            const autoSaveCheckbox = document.getElementById('autoSaveEnabled');
            if (autoSaveCheckbox) {
                autoSaveCheckbox.checked = formData.autoSaveEnabled;
            }
        }
        
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

        if (formData.vocalistList && formData.vocalistList.length > 0) {
            const vocalistList = document.getElementById('vocalistList');
            vocalistList.innerHTML = '';
            formData.vocalistList.forEach((vocalist, index) => {
                addVocalistItem();
                const items = vocalistList.querySelectorAll('.vocalist-item');
                const lastItem = items[items.length - 1];
                if (lastItem) {
                    const nameInput = lastItem.querySelector('[data-field="vocalistName"]');
                    if (nameInput) nameInput.value = vocalist.name;
                    const engineInput = lastItem.querySelector('[data-field="vocalistEngine"]');
                    if (engineInput) engineInput.value = vocalist.engine;
                    const templateInput = lastItem.querySelector('[data-field="vocalistTemplate"]');
                    if (templateInput) templateInput.value = vocalist.template;
                }
            });
        }

        if (formData.otherSubmissionsList && formData.otherSubmissionsList.length > 0) {
            const list = document.getElementById('otherSubmissionsList');
            list.innerHTML = '';
            formData.otherSubmissionsList.forEach(submission => {
                addOtherSubmissionItem();
                const items = list.querySelectorAll('.other-submission-item');
                const lastItem = items[items.length - 1];
                if (lastItem) {
                    const platformSelect = lastItem.querySelector('[data-field="platform"]');
                    if (platformSelect) platformSelect.value = submission.platform;
                    const idInput = lastItem.querySelector('[data-field="id"]');
                    if (idInput) idInput.value = submission.id;
                    const dateInput = lastItem.querySelector('[data-field="date"]');
                    if (dateInput) dateInput.value = submission.date;
                    const versionInput = lastItem.querySelector('[data-field="version"]');
                    if (versionInput) versionInput.value = submission.version;
                    const deletedCheckbox = lastItem.querySelector('[data-field="deleted"]');
                    if (deletedCheckbox) deletedCheckbox.checked = submission.deleted;
                    const finalViewInput = lastItem.querySelector('[data-field="final-view"]');
                    if (finalViewInput) finalViewInput.value = submission.finalView;
                    const finalViewGroup = lastItem.querySelector('[data-final-view-group]');
                    if (finalViewGroup) {
                        finalViewGroup.style.display = submission.deleted ? 'flex' : 'none';
                    }
                }
            });
        }

        if (formData.otherAlbumsList && formData.otherAlbumsList.length > 0) {
            const list = document.getElementById('otherAlbumsList');
            list.innerHTML = '';
            formData.otherAlbumsList.forEach(album => {
                addOtherAlbumItem();
                const items = list.querySelectorAll('.other-submission-item');
                const lastItem = items[items.length - 1];
                if (lastItem) {
                    const nameInput = lastItem.querySelector('[data-field="albumName"]');
                    if (nameInput) nameInput.value = album.name;
                    const ljCheckbox = lastItem.querySelector('[data-field="albumLj"]');
                    if (ljCheckbox) ljCheckbox.checked = album.lj;
                }
            });
        }

        if (formData.checkboxes) {
            ['nnd', 'bb', 'yt'].forEach(platform => {
                const deleted = formData.checkboxes[platform + 'Deleted'];
                if (deleted) {
                    toggleDeletedFinalView(platform);
                }
            });
        }

        toggleAlbumReleaseDate();

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
    // 只在 autoSaveEnabled 为 true 时才启动自动保存
    const autoSaveEnabled = document.getElementById('autoSaveEnabled')?.checked || false;
    if (!autoSaveEnabled) return;
    
    saveTimer = setInterval(() => {
        saveFormData();
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        showToast(`表单已于 ${timeStr} 自动暂存`);
    }, 60000);
}

function stopAutoSave() {
    if (saveTimer) clearInterval(saveTimer);
    saveTimer = null;
}

function toggleAutoSave() {
    const autoSaveEnabled = document.getElementById('autoSaveEnabled')?.checked || false;
    if (autoSaveEnabled) {
        startAutoSave();
    } else {
        stopAutoSave();
    }
    // 保存开关状态到本地存储
    saveFormData();
}

document.addEventListener('DOMContentLoaded', function() {
    // 动态设置页脚版本号
    const versionElement = document.getElementById('vocaloid-version');
    if (versionElement) {
        versionElement.textContent = VOCASCRIBE_VERSION;
    }

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
    initVocalistList();
    initOtherSubmissionsList();
    initPlatformCheckboxes();
    toggleProducerEntryName();
    toggleAlbumSongMode();
    toggleAlbumSongBilibiliMode();

    const hasSavedData = localStorage.getItem('vocaScribeFormData');
    if (hasSavedData) {
        setTimeout(() => {
            let savedData;
            try {
                savedData = JSON.parse(hasSavedData);
            } catch (e) {
                savedData = null;
            }
            
            // 先检查版本号是否匹配
            const savedVersion = savedData ? savedData.version : null;
            if (savedVersion === VOCASCRIBE_VERSION) {
                // 版本相同，先恢复自动保存开关状态
                if (savedData && savedData.autoSaveEnabled !== undefined) {
                    const autoSaveCheckbox = document.getElementById('autoSaveEnabled');
                    if (autoSaveCheckbox) {
                        autoSaveCheckbox.checked = savedData.autoSaveEnabled;
                    }
                }
                // 正常询问是否恢复表单
                if (confirm('检测到上次未完成的表单数据，是否恢复？')) {
                    restoreFormData();
                    toggleAlbumSongMode();
                    toggleAlbumSongBilibiliMode();
                    showToast('表单数据已恢复');
                } else {
                    clearSavedFormData();
                }
            } else {
                // 版本不同，提示更新并清除历史数据
                alert('VocaScribe 已更新！\n\n自动保存开关已默认关闭。\nTips: 即使不进行每分钟自动保存，在生成 WikiText 时也会自动保存。');
                clearSavedFormData();
            }
        }, 500);
    }

    // 绑定自动保存开关事件
    const autoSaveCheckbox = document.getElementById('autoSaveEnabled');
    if (autoSaveCheckbox) {
        autoSaveCheckbox.addEventListener('change', toggleAutoSave);
    }
    
    startAutoSave();

    generateBtn.addEventListener('click', function() {
        // 强制保存一次表单
        saveFormData();
        generateWikiText();
    });
    copyOutputBtn.addEventListener('click', function() {
        // 强制保存一次表单
        saveFormData();
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
    const albumReleaseDateGroup = document.getElementById('albumReleaseDateGroup');
    const albumReleaseDateRequiredMark = document.getElementById('albumReleaseDateRequiredMark');
    const mvGroup = document.getElementById('mvGroup');

    if (isAlbumSong) {
        platformContainer.style.display = 'none';
        albumSongContainer.style.display = 'block';
        albumNameGroup.classList.add('required');
        albumRequiredMark.style.display = 'inline';
        albumReleaseDateGroup.classList.add('required');
        albumReleaseDateRequiredMark.style.display = 'inline';
        // 检查是否勾选了"网易云没有这首歌"，如果是则显示MV部分
        toggleAlbumSongBilibiliMode();
    } else {
        platformContainer.style.display = 'block';
        albumSongContainer.style.display = 'none';
        albumNameGroup.classList.remove('required');
        albumRequiredMark.style.display = 'none';
        albumReleaseDateGroup.classList.remove('required');
        albumReleaseDateRequiredMark.style.display = 'none';
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

let vocalistItemId = 0;

function initVocalistList() {
    const vocalistList = document.getElementById('vocalistList');
    if (vocalistList) {
        vocalistList.innerHTML = '';
        addVocalistItem();
    }
}

function addVocalistItem() {
    const vocalistList = document.getElementById('vocalistList');
    const itemId = vocalistItemId++;
    const isFirst = vocalistList.querySelectorAll('.vocalist-item').length === 0;
    
    const vocalistItem = document.createElement('div');
    vocalistItem.className = `vocalist-item${isFirst ? ' vocalist-item-original' : ''}`;
    vocalistItem.dataset.itemId = itemId;
    
    vocalistItem.innerHTML = `
        <input type="text" class="vocalist-name" placeholder="歌姬名称${isFirst ? ' *' : ''}" data-field="vocalistName"${isFirst ? ' required' : ''}>
        <input type="text" class="vocalist-engine" placeholder="合成引擎${isFirst ? ' *' : ''}" data-field="vocalistEngine">
        <input type="text" class="vocalist-template" placeholder="歌姬模板" data-field="vocalistTemplate">
        ${isFirst ? '<span class="vocalist-placeholder" style="width: 28px; flex-shrink: 0;"></span>' : '<button type="button" class="btn-remove" onclick="removeVocalistItem(' + itemId + ')">×</button>'}
    `;
    
    vocalistList.appendChild(vocalistItem);
}

function removeVocalistItem(itemId) {
    const vocalistItem = document.querySelector(`.vocalist-item[data-item-id="${itemId}"]`);
    if (vocalistItem && !vocalistItem.classList.contains('vocalist-item-original')) {
        vocalistItem.remove();
    }
}

function getVocalistData() {
    const vocalistItems = document.querySelectorAll('.vocalist-item');
    const vocalistData = [];
    
    vocalistItems.forEach(item => {
        const nameInput = item.querySelector('[data-field="vocalistName"]');
        const engineInput = item.querySelector('[data-field="vocalistEngine"]');
        const templateInput = item.querySelector('[data-field="vocalistTemplate"]');
        
        const name = nameInput ? nameInput.value.trim() : '';
        const engine = engineInput ? engineInput.value.trim() : '';
        const template = templateInput ? templateInput.value.trim() : '';
        
        if (name) {
            vocalistData.push({ name, engine, template });
        }
    });
    
    return vocalistData;
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
        <input type="text" class="mv-version" placeholder="版本名（如：本家Remix）" data-field="mvVersion">
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

function toggleDeletedFinalView(platform) {
    const deleted = document.getElementById(platform + 'Deleted');
    const finalViewGroup = document.getElementById(platform + 'FinalViewGroup');
    if (deleted && finalViewGroup) {
        finalViewGroup.style.display = deleted.checked ? 'block' : 'none';
    }
}

function initOtherSubmissionsList() {
    const list = document.getElementById('otherSubmissionsList');
    if (list) {
        list.innerHTML = '';
    }
}

function addOtherSubmissionItem() {
    const list = document.getElementById('otherSubmissionsList');
    const itemId = otherSubmissionItemId++;

    const submissionItem = document.createElement('div');
    submissionItem.className = 'other-submission-item';
    submissionItem.draggable = true;
    submissionItem.dataset.itemId = itemId;

    submissionItem.innerHTML = `
        <span class="drag-handle">☰</span>
        <div class="other-submission-content">
            <div class="other-submission-row">
                <div class="form-group" style="flex: 1;">
                    <select class="other-submission-platform" data-field="platform">
                                <option value="nnd">niconico</option>
                                <option value="yt">YouTube</option>
                                <option value="bb">bilibili</option>
                                <option value="ac">AcFun</option>
                                <option value="wyy">网易云音乐</option>
                            </select>
                </div>
                <div class="form-group" style="flex: 1;">
                    <input type="text" class="other-submission-id" data-field="id" placeholder="稿件ID">
                </div>
            </div>
            <div class="other-submission-row">
                <div class="form-group" style="flex: 1;">
                    <input type="text" class="other-submission-version" data-field="version" placeholder="版本（可选）">
                </div>
                <div class="form-group" style="flex: 1;">
                    <label class="checkbox-label standalone">
                        <input type="checkbox" class="other-submission-deleted" data-field="deleted" onchange="toggleOtherSubmissionFinalView(this)">
                        <span>已删稿</span>
                    </label>
                </div>
                <div class="form-group other-submission-final-view-group" data-final-view-group style="display: none; flex: 1;">
                    <input type="text" class="other-submission-final-view" data-field="final-view" placeholder="最终播放数">
                </div>
            </div>
            <div class="other-submission-row">
                <div class="form-group" style="flex: 1;">
                    <div class="date-input-group unified-date-group">
                        <input type="date" class="other-submission-date-picker" data-field="date-picker" lang="zh-CN">
                        <input type="text" class="other-submission-date" data-field="date" placeholder="20070831">
                    </div>
                </div>
            </div>
        </div>
        <button type="button" class="btn-remove" onclick="removeOtherSubmissionItem(${itemId})">×</button>
    `;

    list.appendChild(submissionItem);

    const datePicker = submissionItem.querySelector('.other-submission-date-picker');
    const dateInput = submissionItem.querySelector('.other-submission-date');
    if (datePicker && dateInput) {
        datePicker.addEventListener('change', function() {
            if (this.value) {
                const date = new Date(this.value);
                const year = date.getFullYear();
                const month = date.getMonth() + 1;
                const day = date.getDate();
                dateInput.value = `${year}年${month}月${day}日`;
            }
        });
        dateInput.addEventListener('input', function() {
            const value = this.value.trim();
            if (/^\d{8}$/.test(value)) {
                const year = value.substring(0, 4);
                const month = value.substring(4, 6);
                const day = value.substring(6, 8);
                this.value = `${year}年${parseInt(month)}月${parseInt(day)}日`;
            }
        });
    }

    submissionItem.addEventListener('dragstart', handleOtherSubmissionDragStart);
    submissionItem.addEventListener('dragend', handleOtherSubmissionDragEnd);
    submissionItem.addEventListener('dragover', handleOtherSubmissionDragOver);
    submissionItem.addEventListener('drop', handleOtherSubmissionDrop);
}

function toggleOtherSubmissionFinalView(checkbox) {
    const item = checkbox.closest('.other-submission-item');
    if (item) {
        const finalViewGroup = item.querySelector('[data-final-view-group]');
        if (finalViewGroup) {
            finalViewGroup.style.display = checkbox.checked ? 'flex' : 'none';
        }
    }
}

function removeOtherSubmissionItem(itemId) {
    const item = document.querySelector(`.other-submission-item[data-item-id="${itemId}"]`);
    if (item) {
        item.remove();
    }
}

function handleOtherSubmissionDragStart(e) {
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.itemId);
}

function handleOtherSubmissionDragEnd(e) {
    this.classList.remove('dragging');
}

function handleOtherSubmissionDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleOtherSubmissionDrop(e) {
    e.preventDefault();
    const draggingId = e.dataTransfer.getData('text/plain');
    const draggingItem = document.querySelector(`.other-submission-item[data-item-id="${draggingId}"]`);

    if (draggingItem && this !== draggingItem) {
        const list = document.getElementById('otherSubmissionsList');
        const items = [...list.querySelectorAll('.other-submission-item')];
        const draggingIndex = items.indexOf(draggingItem);
        const targetIndex = items.indexOf(this);

        if (draggingIndex < targetIndex) {
            this.parentNode.insertBefore(draggingItem, this.nextSibling);
        } else {
            this.parentNode.insertBefore(draggingItem, this);
        }
    }
}

function getOtherSubmissionsData() {
    const items = document.querySelectorAll('.other-submission-item');
    const submissions = [];
    items.forEach(item => {
        const platform = item.querySelector('[data-field="platform"]')?.value || '';
        const id = item.querySelector('[data-field="id"]')?.value || '';
        const date = item.querySelector('[data-field="date"]')?.value || '';
        const version = item.querySelector('[data-field="version"]')?.value || '';
        const deleted = item.querySelector('[data-field="deleted"]')?.checked || false;
        const finalView = item.querySelector('[data-field="final-view"]')?.value || '';
        
        if (id || date) {
            submissions.push({
                platform,
                id,
                date,
                version,
                deleted,
                finalView
            });
        }
    });
    return submissions;
}

let otherSubmissionItemId = 0;

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

function formatNumberWithCommas(num) {
    if (!num) return '';
    const n = num.toString().replace(/[^\d]/g, '');
    if (!n) return num;
    return parseInt(n).toLocaleString();
}

function initDatePickers() {
    const datePairs = [
        ['nndDatePicker', 'nndDate'],
        ['bbDatePicker', 'bbDate'],
        ['ytDatePicker', 'ytDate'],
        ['albumReleaseDatePicker', 'albumReleaseDate']
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
    const vocalistData = getVocalistData();
    const producerTemplate = getFormValue('producerTemplate');
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
    const nndDeleted = getCheckboxValue('nndDeleted');
    const nndFinalView = getFormValue('nndFinalView');
    const bbId = getFormValue('bbId');
    const bbDate = getFormValue('bbDate');
    const bbDeleted = getCheckboxValue('bbDeleted');
    const bbFinalView = getFormValue('bbFinalView');
    const ytId = getFormValue('ytId');
    const ytDate = getFormValue('ytDate');
    const ytDeleted = getCheckboxValue('ytDeleted');
    const ytFinalView = getFormValue('ytFinalView');
    const mvId = getFormValue('mvId');
    const otherSubmissions = getOtherSubmissionsData();
    const otherAlbums = getOtherAlbumsData();

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

    const hasValidVocalist = vocalistData.some(v => v.name && v.engine);
    if (!songNameOriginal || !producerName || vocalistData.length === 0 || !hasValidVocalist) {
        showToast('请填写所有必填项（歌姬名称和合成引擎）！', 'error');
        return;
    }

    if (isAlbumSong && !albumName) {
        showToast('专辑曲必须填写收录专辑！', 'error');
        return;
    }

    const albumReleaseDate = getFormValue('albumReleaseDate');
    if (isAlbumSong && !albumReleaseDate) {
        showToast('专辑曲必须填写专辑发行日期！', 'error');
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

    const allEngines = vocalistData.map(v => v.engine).filter(e => e);
    const uniqueEngines = [...new Set(allEngines.join('、').split(/[、,，]/).map(e => e.trim()).filter(e => e))];
    const engineParts = uniqueEngines;
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

    const vocalistNamesDisplay = vocalistData.map(v => v.name).filter(n => n).map(n => {
        const names = n.split(/[、,，]/).map(name => name.trim()).filter(name => name);
        return names.map(name => `[[${name}]]`).join('、');
    }).join('、');
    wikiText += `|演唱 = ${vocalistNamesDisplay}\n`;

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

    const postCards = [];

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

    if (hasNiconico && nndId && !nndDeleted) {
        wikiText += `|nnd_id = ${nndId}\n`;
    }
    if (hasNiconico && nndDate && !useUnifiedPostTime && !nndDeleted) {
        wikiText += `|nnd_date = ${nndDate}\n`;
    }

    if (hasBilibili && bbId && !bbDeleted) {
        wikiText += `|bb_id = ${bbId}\n`;
    }
    if (hasBilibili && bbDate && !useUnifiedPostTime && !bbDeleted) {
        wikiText += `|bb_date = ${bbDate}\n`;
    }

    if (hasYouTube && ytId && !ytDeleted) {
        wikiText += `|yt_id = ${ytId}\n`;
    }
    if (hasYouTube && ytDate && !useUnifiedPostTime && !ytDeleted) {
        wikiText += `|yt_date = ${ytDate}\n`;
    }

    if (hasNiconico && nndId && nndDeleted) {
        let card = `{{VOCALOID Songbox/card|nnd|${nndId}|${nndDate}`;
        if (nndFinalView) {
            card += `|再生=${formatNumberWithCommas(nndFinalView)}|class=deleted`;
        } else {
            card += `|class=deleted`;
        }
        card += `}}`;
        postCards.push(card);
    }

    if (hasBilibili && bbId && bbDeleted) {
        let card = `{{VOCALOID Songbox/card|bb|${bbId}|${bbDate}`;
        if (bbFinalView) {
            card += `|再生=${formatNumberWithCommas(bbFinalView)}|class=deleted`;
        } else {
            card += `|class=deleted`;
        }
        card += `}}`;
        postCards.push(card);
    }

    if (hasYouTube && ytId && ytDeleted) {
        let card = `{{VOCALOID Songbox/card|yt|${ytId}|${ytDate}`;
        if (ytFinalView) {
            card += `|再生=${formatNumberWithCommas(ytFinalView)}|class=deleted`;
        } else {
            card += `|class=deleted`;
        }
        card += `}}`;
        postCards.push(card);
    }

    otherSubmissions.forEach(submission => {
        let card = `{{VOCALOID Songbox/card|${submission.platform}|${submission.id}|${submission.date}`;
        if (submission.version) {
            card += `|${submission.version}`;
        }
        if (submission.finalView) {
            card += `|再生=${formatNumberWithCommas(submission.finalView)}`;
        }
        if (submission.deleted) {
            card += `|class=deleted`;
        }
        card += `}}`;
        postCards.push(card);
    });

    if (postCards.length > 0) {
        wikiText += `|投稿 = ${postCards.join('')}\n`;
    }

    if (albumName) {
        let allAlbums = [{ name: albumName, lj: albumNameLj }];
        if (otherAlbums && otherAlbums.length > 0) {
            allAlbums = allAlbums.concat(otherAlbums);
        }
        
        const albumParam = formatAlbumList(allAlbums);
        wikiText += `|收录专辑 = ${albumParam}\n`;
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

    const vocalistNamesSimple = vocalistData.map(v => v.name).filter(n => n).map(n => {
        const names = n.split(/[、,，]/).map(name => name.trim()).filter(name => name);
        return names.join('、');
    }).join('、');

    const engineDisplay = engineParts.map(e => `[[${e}]]`).join('和');

    if (isAlbumSong) {
        // 专辑曲模式：《'''歌名'''》是[[P主]]于发行日期发售的专辑《'''专辑名'''》的收录曲目，由[[歌姬]]演唱。
        const albumDisplay = applyLjTemplate(albumName, albumNameLj);
        wikiText += `是${producerDisplayLink}于${albumReleaseDate}发售的${engineDisplay}专辑《'''${albumDisplay}'''》的收录曲目，由${vocalistNamesSimple}演唱。`;
        
        if (otherAlbums && otherAlbums.length > 0) {
            const otherAlbumsText = formatAlbumList(otherAlbums);
            wikiText += `也被收录于专辑${otherAlbumsText}中。`;
        }
        wikiText += '\n';
    } else {
            // 非专辑曲模式
            wikiText += `是${producerDisplayLink}`;

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
                wikiText += `于`;
                if (useUnifiedPostTime) {
                    wikiText += `${unifiedPostTime}投稿至[[${postSites.join(']]、[[')}]]的`;
                } else {
                    for (let i = 0; i < postDates.length; i++) {
                        if (i > 0) wikiText += '、';
                        wikiText += `${postDates[i].date}投稿至[[${postDates[i].site}]]`;
                    }
                    wikiText += '的';
                }
            } else {
                wikiText += `投稿的`;
            }

            wikiText += `${engineDisplay}${songLanguage}${songType}歌曲，由${vocalistNamesSimple}演唱`;

        if (albumName) {
            let allAlbums = [{ name: albumName, lj: albumNameLj }];
            if (otherAlbums && otherAlbums.length > 0) {
                allAlbums = allAlbums.concat(otherAlbums);
            }
            const albumText = formatAlbumList(allAlbums);
            wikiText += `，并被收录于${albumText}中`;
        }
        wikiText += `。\n`;
    }

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

        const vocalistForStaff = vocalistData.map(v => v.name).filter(n => n).map(n => {
            const names = n.split(/[、,，]/).map(name => name.trim()).filter(name => name);
            return names.join('、');
        }).join('、');
        staffContent += `|group${groupNum} = 演唱\n`;
        staffContent += `|list${groupNum} = ${vocalistForStaff}\n`;

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

    vocalistData.forEach(v => {
        if (v.template) {
            wikiText += `{{${v.template}}}\n`;
        }
    });

    if (additionalTemplates) {
        const templates = additionalTemplates.split('\n').filter(t => t.trim());
        for (const template of templates) {
            wikiText += `{{${template.trim()}}}\n`;
        }
    }

    const finalNationality = producerNationality === '其他' ? otherNationality : producerNationality;
    wikiText += `\n[[Category:${finalNationality}音乐作品]]\n`;
    
    vocalistData.forEach(v => {
        if (!v.template && v.name) {
            const names = v.name.split(/[、,，]/).map(n => n.trim()).filter(n => n);
            names.forEach(name => {
                wikiText += `[[Category:${name}歌曲]]\n`;
            });
        }
    });

    for (const engine of engineParts) {
        wikiText += `[[Category:使用${engine}的歌曲]]\n`;
    }

    wikiText += `[[Category:${songLanguage}歌曲]]\n`;

    if (songType === '翻唱') {
        wikiText += `[[Category:翻唱歌曲]]\n`;
    }

    if (isAlbumSong) {
        wikiText += `[[Category:专辑歌曲]]\n`;
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
            checkbox.checked = checkbox.hasAttribute('checked');
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
        initVocalistList();
        initOtherSubmissionsList();
        toggleAlbumReleaseDate();
        
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
