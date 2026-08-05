/**
 * compareUI.js
 * Handles the Compare Mode logic, Custom Undo Modal, Table collapsing, and UI event listeners.
 */

window.addEventListener('DOMContentLoaded', () => {
    patchChartParasol();
    setInterval(patchChartParasol, 200);
});

let chartPatched = false;
function patchChartParasol() {
    if (typeof Chart !== 'undefined' && !chartPatched) {
        chartPatched = true;
        const originalChartUpdate = Chart.prototype.update;
        Chart.prototype.update = function() {
            if (this.options?.plugins?.annotation?.annotations) {
                const annotations = this.options.plugins.annotation.annotations;
                Object.values(annotations).forEach(anno => {
                    ['content', 'text'].forEach(prop => {
                        if (anno[prop]) {
                            if (Array.isArray(anno[prop])) {
                                anno[prop] = anno[prop].map(t => typeof t === 'string' ? t.replace(/☂️/g, '⛱️') : t);
                            } else if (typeof anno[prop] === 'string') {
                                anno[prop] = anno[prop].replace(/☂️/g, '⛱️');
                            }
                        }
                    });
                    if (anno.label && typeof anno.label.content === 'string') {
                        anno.label.content = anno.label.content.replace(/☂️/g, '⛱️');
                    }
                });
            }
            originalChartUpdate.apply(this, arguments);
        };
    }
}

// Attach UI specific utilities to the global window
window.showToast = function(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast toast-visible';
    toast.innerHTML = `<span class="toast-message">${message}</span>`;
    container.appendChild(toast);
    
    const reduceMotion = document.body.classList.contains('reduce-motion');
    
    const dismiss = () => {
        if (reduceMotion) { 
            toast.remove(); 
            return; 
        }
        toast.classList.remove('toast-visible');
        toast.classList.add('toast-hiding');
        setTimeout(() => toast.remove(), 250);
    };

    setTimeout(dismiss, 3000);
};

window.handleSaveBaseScenario = function() {
    if (typeof makeBaseScenario === 'function') {
        makeBaseScenario();
    }
    window.showToast('Scenario saved as original scenario');
    
    // Clear list so button instantly disables
    const list = document.getElementById('compare-changes-list');
    if(list) list.innerHTML = '';
    window.updateCompareActionsState();
};

window.formatTimingTitlesSingleAge = function() {
    const timingTitles = document.querySelectorAll('.timing-title');
    timingTitles.forEach(el => {
        if (el.textContent.includes('Buy at ages') || el.textContent.includes('&')) {
            el.textContent = el.textContent.replace(/Buy at ages (\d+)\s*&\s*\d+/, 'Buy at age $1');
        }
    });
};

window.startOver = function() {
    // 1. Turn off compare mode if it is active
    const compareSwitch = document.getElementById('compare-switch');
    if (compareSwitch && compareSwitch.checked) {
        compareSwitch.checked = false;
        compareSwitch.dispatchEvent(new Event('change'));
    }

    // 2. Revert all text and number inputs to their original HTML values
    document.querySelectorAll('input[type="text"].compare-track, input[type="number"].compare-track').forEach(input => {
        if (input.hasAttribute('value')) {
            input.value = input.getAttribute('value');
        }
    });
    
    // 3. Revert all radio buttons to their original HTML checked states
    document.querySelectorAll('input[type="radio"].compare-track').forEach(radio => {
        if (radio.hasAttribute('checked')) {
            radio.checked = true;
        }
    });

    // 4. Revert all dropdown selects to their default option
    document.querySelectorAll('select.compare-track').forEach(select => {
        const defaultOpt = select.querySelector('option[selected]');
        if (defaultOpt) {
            select.value = defaultOpt.value;
        } else {
            select.selectedIndex = 0;
        }
    });

    // 5. Fire the UI updates so the sidebars visually reset
    if (typeof toggleSL === 'function') toggleSL();
    if (typeof togglePen === 'function') togglePen();
    if (typeof updateDynamicUI === 'function') updateDynamicUI();
    
    // 6. Relaunch the wizard
    const wiz = document.getElementById('wizard-overlay');
    if (wiz) wiz.classList.add('active');
    if (typeof openWizard === 'function') openWizard();
};

window.updateCompareActionsState = function() {
    const list = document.getElementById('compare-changes-list');
    const hasChanges = list && list.children.length > 0;
    
    const makeBaseBtn = document.getElementById('make-base-btn');
    const discardBtn = document.getElementById('discard-whatif-btn');
    
    if (makeBaseBtn) {
        makeBaseBtn.disabled = !hasChanges;
    }
    if (discardBtn) {
        discardBtn.style.opacity = hasChanges ? '1' : '0.5';
        discardBtn.style.pointerEvents = hasChanges ? 'auto' : 'none';
    }
};

window.saveA11ySetting = function(key, value) {
    localStorage.setItem('a11y_' + key, value);
};

window.addEventListener('DOMContentLoaded', () => {
    // Load A11y Settings from LocalStorage
    if (localStorage.getItem('a11y_dark') === 'on') { document.body.classList.add('dark-mode'); const r = document.getElementById('a11y_dark_on'); if(r) r.checked = true; }
    if (localStorage.getItem('a11y_font') === 'on') { document.body.classList.add('dyslexia-font'); const r = document.getElementById('a11y_font_on'); if(r) r.checked = true; }
    if (localStorage.getItem('a11y_motion') === 'on') { document.body.classList.add('reduce-motion'); const r = document.getElementById('a11y_motion_on'); if(r) r.checked = true; }
    
    const size = localStorage.getItem('a11y_size');
    if (size === 'large') { document.documentElement.classList.add('text-large'); const r = document.getElementById('a11y_size_large'); if(r) r.checked = true; }
    else if (size === 'xl') { document.documentElement.classList.add('text-xlarge'); const r = document.getElementById('a11y_size_xl'); if(r) r.checked = true; }

    // Focus-revealed helper text
    if (typeof helpText !== 'undefined') {
        for (const [key, text] of Object.entries(helpText)) {
            ['w_', 's_'].forEach(prefix => {
                const inputId = prefix + key;
                const input = document.getElementById(inputId) || document.querySelector(`input[name="${inputId}"]`);
                if (input) {
                    const row = input.closest('.input-row-single');
                    if (row && !row.querySelector('.helper-text')) {
                        row.insertAdjacentHTML('beforeend', `<div class="helper-text">${text}</div>`);
                    }
                }
            });
        }
    }

    // Populate readonly parameters
    if (typeof globalParams !== 'undefined') {
        const badge = document.getElementById('tax-year-badge');
        const badge2 = document.getElementById('tax-year-badge-2');
        const taxYearText = `Tax year ${globalParams.general.current_tax_year_beginning}/${globalParams.general.current_tax_year_beginning + 1}`;
        if (badge) badge.innerText = taxYearText;
        if (badge2) badge2.innerText = taxYearText;
        
        const grid = document.getElementById('readonly-params-grid');
        if (grid) {
            const formatBands = (bands) => {
                let html = '<ul style="margin-top:15px;">';
                for(let i=0; i<bands.length; i++) {
                    let fromStr = bands[i].from.toLocaleString();
                    let rateStr = (bands[i].rate * 100).toFixed(0) + '%';
                    if (i < bands.length - 1) {
                        let toStr = (bands[i+1].from - 1).toLocaleString();
                        html += `<li style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;"><span>£${fromStr} to £${toStr}:</span> <strong>${rateStr}</strong></li>`;
                    } else {
                        html += `<li style="display:flex; justify-content:space-between; margin-bottom:8px; padding-bottom:6px;"><span>Over £${fromStr}:</span> <strong>${rateStr}</strong></li>`;
                    }
                }
                html += '</ul>';
                return html;
            };

            if (globalParams.income_tax) grid.innerHTML += `<div class="param-box"><h4>Income tax bands</h4>${formatBands(globalParams.income_tax)}</div>`;
            if (globalParams.national_insurance) grid.innerHTML += `<div class="param-box"><h4>National insurance</h4>${formatBands(globalParams.national_insurance)}</div>`;
            if (globalParams.stamp_duty && globalParams.stamp_duty.first_time_buyer) {
                let html = `<div class="param-box"><h4>Stamp duty (first time buyer)</h4>`;
                html += formatBands(globalParams.stamp_duty.first_time_buyer.bands);
                html += `<div style="margin-top: 12px; font-size: 0.8rem; color: var(--ifoa-blue); font-style: italic;">First time buyer (FTB) relief limit: £${globalParams.stamp_duty.first_time_buyer.limit.toLocaleString()}</div></div>`;
                grid.innerHTML += html;
            }
            if (globalParams.stamp_duty && globalParams.stamp_duty.second_time_buyer) {
                let html = `<div class="param-box"><h4>Stamp duty (next home)</h4>`;
                html += formatBands(globalParams.stamp_duty.second_time_buyer.bands);
                html += `</div>`;
                grid.innerHTML += html;
            }
            if (globalParams.pension_taxation) {
                let html = `<div class="param-box"><h4>Pension rules</h4><ul style="margin-top:15px;">`;
                html += `<li style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;"><span>Tax free cash (TFC) max:</span> <strong>${globalParams.pension_taxation.tax_free_cash_percent * 100}%</strong></li>`;
                html += `<li style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;"><span>TFC lifetime limit:</span> <strong>£${globalParams.pension_taxation.tfc_max_withdrawal.toLocaleString()}</strong></li>`;
                html += `<li style="display:flex; justify-content:space-between; margin-bottom:8px; padding-bottom:6px;"><span>Basic rate rebate:</span> <strong>${globalParams.pension_taxation.tax_rebate_on_contributions * 100}%</strong></li>`;
                html += `</ul></div>`;
                grid.innerHTML += html;
            }
        }

        const grid2 = document.getElementById('readonly-params-grid-2');
        if (grid2) {
            if (globalParams.state_pension_age_table) {
                let htmlSpa = `<div class="param-box"><h4>State pension age</h4><ul style="margin-top:15px;">`;
                let htmlMin = `<div class="param-box"><h4>Minimum pension age</h4><ul style="margin-top:15px;">`;
                
                let prevAge = 0;
                globalParams.state_pension_age_table.forEach((row, i) => {
                    let toAge = row.current_age_under - 1;
                    let ageRange = i === globalParams.state_pension_age_table.length - 1 ? `${prevAge}+` : `${prevAge} to ${toAge}`;
                    htmlSpa += `<li style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;"><span>Current age ${ageRange}:</span> <strong>${row.state_pension_age}</strong></li>`;
                    htmlMin += `<li style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;"><span>Current age ${ageRange}:</span> <strong>${row.minimum_pension_age}</strong></li>`;
                    prevAge = row.current_age_under;
                });
                htmlSpa += `</ul></div>`;
                htmlMin += `</ul></div>`;
                grid2.innerHTML += htmlSpa + htmlMin;
            }
            if (globalParams.career_increases) {
                let html = `<div class="param-box"><h4>Real career salary growth</h4><ul style="margin-top:15px;">`;
                let c = globalParams.career_increases;
                for (let i=0; i<c.length; i++) {
                    let fromAge = c[i].from_age;
                    let rate = (c[i].increase_above_inflation * 100).toFixed(1) + '%';
                    if (i < c.length - 1) {
                        let toAge = c[i+1].from_age - 1;
                        html += `<li style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;"><span>Age ${fromAge} to ${toAge}:</span> <strong>${rate}</strong></li>`;
                    } else {
                        html += `<li style="display:flex; justify-content:space-between; margin-bottom:8px; padding-bottom:6px;"><span>Age ${fromAge}+:</span> <strong>${rate}</strong></li>`;
                    }
                }
                html += `</ul></div>`;
                grid2.innerHTML += html;
            }
            if (globalParams.mortgages && globalParams.mortgages.rates_by_ltv) {
                let html = `<div class="param-box"><h4>Mortgage rates by LTV</h4><ul style="margin-top:15px;">`;
                let m = globalParams.mortgages.rates_by_ltv;
                for (let i=0; i<m.length; i++) {
                    let fromLTV = (m[i].ltv_from * 100).toFixed(0) + '%';
                    let rate = (m[i].rate * 100).toFixed(2) + '%';
                    if (i < m.length - 1) {
                        let toLTV = (m[i+1].ltv_from * 100).toFixed(0) + '%';
                        html += `<li style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;"><span>${fromLTV} to ${toLTV}:</span> <strong>${rate}</strong></li>`;
                    } else {
                        html += `<li style="display:flex; justify-content:space-between; margin-bottom:8px; padding-bottom:6px;"><span>Above ${fromLTV}:</span> <strong>${rate}</strong></li>`;
                    }
                }
                html += `</ul></div>`;
                grid2.innerHTML += html;
            }
            if (globalParams.student_loans) {
                let htmlSlThresh = `<div class="param-box"><h4>Student loan thresholds</h4><ul style="margin-top:15px;">`;
                let htmlSlRate = `<div class="param-box"><h4>Student loan repayment rates</h4><ul style="margin-top:15px;">`;
                for (const [plan, data] of Object.entries(globalParams.student_loans)) {
                    let threshold = '£' + data.threshold.toLocaleString();
                    let rate = (data.rate * 100).toFixed(0) + '%';
                    htmlSlThresh += `<li style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;"><span>Plan ${plan}:</span> <strong>${threshold}</strong></li>`;
                    htmlSlRate += `<li style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;"><span>Plan ${plan}:</span> <strong>${rate}</strong></li>`;
                }
                htmlSlThresh += `</ul></div>`;
                htmlSlRate += `</ul></div>`;
                grid2.innerHTML += htmlSlThresh + htmlSlRate;
            }
        }
    }

    // Initialize compare actions state (buttons disabled on empty list)
    window.updateCompareActionsState();

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        const menu = document.getElementById('calc-mobile-menu');
        const btn = document.getElementById('calc-burger-btn');
        if (menu && menu.classList.contains('open')) {
            if (!menu.contains(event.target) && !btn.contains(event.target)) {
                menu.classList.remove('open');
            }
        }
        
        if(event.target.classList.contains('tab-btn')) {
            const select = document.getElementById('mobile-tab-select');
            if(select) {
                const match = event.target.getAttribute('onclick').match(/'([^']+)'/);
                if(match) select.value = match[1];
            }
        }
    });
    
    // Auto-update formatting for Timing cards
    const observer = new MutationObserver(window.formatTimingTitlesSingleAge);
    const activeTiming = document.getElementById('active-timing');
    if (activeTiming) observer.observe(activeTiming, { childList: true, subtree: true });

    // Skip Wizard check
    if (window.location.search.includes('skipWizard=true')) {
        const style = document.createElement('style');
        style.innerHTML = '#wizard-overlay { display: none !important; opacity: 0 !important; pointer-events: none !important; }';
        document.head.appendChild(style);
        setTimeout(() => {
            if (typeof closeWizard === 'function') closeWizard();
            else {
                const skipBtn = document.querySelector('button[onclick="closeWizard()"]');
                if (skipBtn) skipBtn.click();
                const wizard = document.getElementById('wizard-overlay');
                if (wizard) wizard.classList.remove('active');
            }
        }, 50);
    }
});


// -------------------------------------------------------------
// 2. Compare Mode Toggles & Chart Interactions
// -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    const compareSwitch = document.getElementById('compare-switch');
    const resultsPane = document.getElementById('results-pane');
    const projControls = document.getElementById('projections-compare-controls');
    
    if (compareSwitch && resultsPane) {
        compareSwitch.addEventListener('change', function() {
            if (this.checked) {
                resultsPane.classList.add('compare-mode-active');
                if(projControls) projControls.style.display = 'flex';
                
                const sections = ['hero', 'timing', 'wealth', 'prop-cost', 'prop-funding'];
                sections.forEach(sec => {
                    const activeEl = document.getElementById(`active-${sec}`);
                    const baselineEl = document.getElementById(`baseline-${sec}`);
                    if (activeEl && baselineEl) {
                        let html = activeEl.innerHTML;
                        html = html.replace(/id="/g, 'data-cloned-id="');
                        baselineEl.innerHTML = html;
                    }
                });
                
                window.syncProjViewSelect('revised');
            } else {
                resultsPane.classList.remove('compare-mode-active');
                if(projControls) projControls.style.display = 'none';
                window.syncProjViewSelect('revised');
            }
            
            const tabChanges = document.getElementById('tab-changes');
            const mobTabChanges = document.getElementById('mob-opt-changes');
            if (tabChanges) {
                tabChanges.style.display = this.checked ? 'block' : 'none';
                if(mobTabChanges) mobTabChanges.style.display = this.checked ? 'block' : 'none';
                
                if (!this.checked && tabChanges.classList.contains('active')) {
                    const overviewBtn = document.querySelector('.tab-btn[onclick*="overview"]');
                    if (overviewBtn) overviewBtn.click();
                }
            }
        });
        
        if(compareSwitch.checked) {
            resultsPane.classList.add('compare-mode-active');
            if(projControls) projControls.style.display = 'flex';
        }
    }
});

window.syncProjViewSelect = function(val) {
    const select = document.getElementById('mobile-proj-compare-select');
    if (select) select.value = val;
    const radio = document.getElementById('pcv_' + val);
    if (radio) radio.checked = true;
    window.toggleProjView(val);
};

window.toggleProjView = function(viewType) {
    const mainWrapper = document.getElementById('proj-main-wrapper');
    if (mainWrapper) mainWrapper.style.display = 'block';

    if (typeof window.renderProjectionsView === 'function') {
        window.renderProjectionsView(viewType);
    }
};


// -------------------------------------------------------------
// 3. Formatting Observers (Tables and Changes List)
// -------------------------------------------------------------

const tableObserver = new MutationObserver(() => {
    const table = document.getElementById('wealth-table');
    if(!table || table.rows.length === 0) return;
    
    let lifeEventIdx = -1;
    const headerRow = table.rows[0];
    for(let i=0; i<headerRow.cells.length; i++) {
        if(headerRow.cells[i].innerText.includes('Life event')) {
            lifeEventIdx = i;
            break;
        }
    }
    
    if(lifeEventIdx > -1) {
        for(let i=0; i<table.rows.length; i++) {
            const row = table.rows[i];
            if(i === 0) {
                 row.deleteCell(lifeEventIdx);
            } else {
                 const cell = row.cells[lifeEventIdx];
                 if(cell) {
                     const text = cell.innerText.trim();
                     let icon = '';
                     if(text.includes('Purchase')) icon = '🏠';
                     if(text.includes('Retire') || text.includes('☂️') || text.includes('⛱️')) icon = '⛱️';
                     
                     if(icon) {
                         if (!row.cells[0].innerHTML.includes(icon)) {
                            row.cells[0].innerHTML += ` <span style="margin-left: 10px; cursor: help;" title="${text.replace(/☂️|⛱️/g, '').trim()}">${icon}</span>`;
                         }
                     }
                     row.deleteCell(lifeEventIdx);
                 }
            }
        }
    }
});

window.addEventListener('DOMContentLoaded', () => {
    const tableContainer = document.getElementById('table-container');
    if(tableContainer) tableObserver.observe(tableContainer, { childList: true, subtree: true });
});

// "Your Changes" Robust Observer
const changesObserver = new MutationObserver((mutations) => {
    let listChanged = false;
    
    mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
            listChanged = true;
            mutation.addedNodes.forEach(node => {
                if (node.tagName === 'LI' && !node.dataset.formatted) {
                    try {
                        const rawHTML = node.innerHTML;
                        const match = rawHTML.match(/<strong>(.*?)<\/strong>\s*(.*?)\s*(?:&rarr;|➔|->)\s*(.*)/);
                        
                        if (match) {
                            const rawLabel = match[1].replace(':', '').trim();
                            let oldValRaw = match[2].trim();
                            let newValRaw = match[3].trim();
                            
                            let formattedOld = oldValRaw;
                            let formattedNew = newValRaw;

                            const isPureNumeric = (str) => /^[\d,]+(\.\d+)?$/.test(str);
                            const rawLabelLower = rawLabel.toLowerCase();
                            const isPercentField = rawLabelLower.includes('spare income') || rawLabelLower.includes('contribution') || rawLabelLower.includes('proportion');
                            const isNotAgeOrPct = !rawLabelLower.includes('age') && !isPercentField && !rawLabelLower.includes('plan');

                            if (isPercentField && isPureNumeric(oldValRaw) && isPureNumeric(newValRaw)) {
                                formattedOld = oldValRaw + '%';
                                formattedNew = newValRaw + '%';
                            } else if (isPureNumeric(oldValRaw) && isPureNumeric(newValRaw) && isNotAgeOrPct) {
                                formattedOld = '£' + oldValRaw;
                                formattedNew = '£' + newValRaw;
                            }

                            node.innerHTML = `
                                <div style="display: flex; align-items: center; width: 100%; justify-content: space-between;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <strong style="color: var(--ifoa-blue); min-width: 140px;">${rawLabel}:</strong>
                                        <del style="color: #888; font-size: 0.95rem;">${formattedOld}</del>
                                        <span style="color: #aaa; margin: 0 4px;">➔</span>
                                        <span class="new-val">${formattedNew}</span>
                                    </div>
                                    <button class="btn-undo" onclick="handleUndoClick(this, '${rawLabel.replace(/'/g, "\\'")}', '${oldValRaw.replace(/'/g, "\\'")}', '${newValRaw.replace(/'/g, "\\'")}')" title="Revert this change">Undo</button>
                                </div>
                            `;
                            node.dataset.formatted = 'true';
                        }
                    } catch(e) {
                        console.error('Error formatting change row:', e);
                    }
                }
            });
        }
    });

    if (listChanged) {
        const list = document.getElementById('compare-changes-list');
        const summaryBlock = document.getElementById('compare-summary-block');
        const noChangesMsg = document.getElementById('no-changes-msg');
        
        if (list && summaryBlock && noChangesMsg) {
            const hasChanges = list.children.length > 0;
            summaryBlock.style.display = hasChanges ? 'block' : 'none';
            noChangesMsg.style.display = hasChanges ? 'none' : 'block';
        }

        window.updateCompareActionsState();
    }
});

window.addEventListener('DOMContentLoaded', () => {
    const changesList = document.getElementById('compare-changes-list');
    if(changesList) changesObserver.observe(changesList, { childList: true });
});

function applyChangeValue(label, rawValue) {
    const input = document.querySelector(`input[data-label="${label}"], select[data-label="${label}"]`);
    if (!input) return false;

    const cleanVal = rawValue.replace(/,/g, '');
    if (input.type === 'text' && input.classList.contains('comma-format')) {
        input.value = rawValue;
    } else if (input.type === 'radio') {
        const radio = document.querySelector(`input[name="${input.name}"][value="${rawValue}"]`);
        if (radio) radio.checked = true;
    } else {
        input.value = cleanVal;
    }

    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
}

function collapseChangeRow(li, onDone) {
    if (!li) { if (onDone) onDone(); return; }

    const reduceMotion = document.body.classList.contains('reduce-motion');
    if (reduceMotion) {
        li.remove();
        if (onDone) onDone();
        return;
    }

    const startHeight = li.getBoundingClientRect().height;
    li.style.height = startHeight + 'px';
    li.style.overflow = 'hidden';
    li.style.boxSizing = 'border-box';
    void li.offsetHeight; 

    li.classList.add('row-collapsing');

    let finished = false;
    const finish = () => {
        if (finished) return;
        finished = true;
        li.removeEventListener('transitionend', onTransitionEnd);
        clearTimeout(fallbackTimer);
        li.remove();
        if (onDone) onDone();
    };
    const onTransitionEnd = (e) => { if (e.target === li && e.propertyName === 'height') finish(); };
    li.addEventListener('transitionend', onTransitionEnd);
    const fallbackTimer = setTimeout(finish, 400);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            li.style.height = '0px';
            li.style.marginTop = '0px';
            li.style.marginBottom = '0px';
            li.style.paddingTop = '0px';
            li.style.paddingBottom = '0px';
            li.style.borderWidth = '0px';
            li.style.opacity = '0';
        });
    });
}

window.handleUndoClick = function(btnElement, label, oldValRaw, newValRaw) {
    const li = btnElement.closest('li');
    if (!applyChangeValue(label, oldValRaw)) return;

    collapseChangeRow(li, () => {
        const list = document.getElementById('compare-changes-list');
        if (list && list.children.length === 0) {
            document.getElementById('compare-summary-block').style.display = 'none';
            document.getElementById('no-changes-msg').style.display = 'block';
        }
        window.updateCompareActionsState();
    });

    showUndoToast('Change reverted', () => { applyChangeValue(label, newValRaw); });
};

function showUndoToast(message, onUndo) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-message">${message}</span><button type="button" class="toast-undo-btn">Undo</button>`;
    container.appendChild(toast);

    const reduceMotion = document.body.classList.contains('reduce-motion');

    const dismiss = () => {
        clearTimeout(autoDismissTimer);
        if (reduceMotion) { toast.remove(); return; }
        toast.classList.remove('toast-visible');
        toast.classList.add('toast-hiding');
        setTimeout(() => toast.remove(), 250);
    };

    const autoDismissTimer = setTimeout(dismiss, 6000);

    toast.querySelector('.toast-undo-btn').addEventListener('click', () => {
        if (onUndo) onUndo();
        dismiss();
    });

    if (reduceMotion) {
        toast.classList.add('toast-visible');
    } else {
        requestAnimationFrame(() => toast.classList.add('toast-visible'));
    }
}