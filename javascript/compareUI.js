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
    
    const list = document.getElementById('compare-changes-list');
    if(list) list.innerHTML = '';
    window.updateCompareActionsState();
};

// Fix 4: Force precise format "Buy when you are aged X"
window.formatTimingTitlesSingleAge = function() {
    const timingTitles = document.querySelectorAll('.timing-title');
    timingTitles.forEach(el => {
        let text = el.textContent;
        // Match occurrences like "Buy at age 35" or "Buy at ages 35 & 37"
        const match = text.match(/(?:Buy at age[s]?)\s*(\d+)/i);
        if (match) {
            const ageNum = match[1];
            el.textContent = `Buy when you are aged ${ageNum}`;
        }
    });
    
    // Also strip partner references if mode is single
    const isSingle = document.getElementById('side_single') && document.getElementById('side_single').checked;
    if (isSingle) {
        const timingDescs = document.querySelectorAll('.timing-description');
        timingDescs.forEach(desc => {
            if (desc.innerHTML.includes('when your partner would be')) {
                desc.innerHTML = desc.innerHTML.replace(/, when your partner would be \d+/, '');
            }
        });
    }
};

window.startOver = function() {
    const compareSwitch = document.getElementById('compare-switch');
    if (compareSwitch && compareSwitch.checked) {
        compareSwitch.checked = false;
        compareSwitch.dispatchEvent(new Event('change'));
    }

    document.querySelectorAll('input[type="text"].compare-track, input[type="number"].compare-track').forEach(input => {
        if (input.hasAttribute('value')) {
            input.value = input.getAttribute('value');
        }
    });
    
    document.querySelectorAll('input[type="radio"].compare-track').forEach(radio => {
        if (radio.hasAttribute('checked')) {
            radio.checked = true;
        }
    });

    document.querySelectorAll('select.compare-track').forEach(select => {
        const defaultOpt = select.querySelector('option[selected]');
        if (defaultOpt) {
            select.value = defaultOpt.value;
        } else {
            select.selectedIndex = 0;
        }
    });

    if (typeof toggleSL === 'function') toggleSL();
    if (typeof togglePen === 'function') togglePen();
    if (typeof updateDynamicUI === 'function') updateDynamicUI();
    
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

window.switchSettingsTab = function(tabNum, btn) {
    document.querySelectorAll('#settings-tabs .tab-btn, #settings-tabs label').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.getElementById('set-tab-1').style.display = tabNum === 1 ? 'block' : 'none';
    document.getElementById('set-tab-2').style.display = tabNum === 2 ? 'block' : 'none';
    document.getElementById('set-tab-3').style.display = tabNum === 3 ? 'block' : 'none';
};

window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('a11y_dark') === 'on') { document.body.classList.add('dark-mode'); const r = document.getElementById('a11y_dark_toggle'); if(r) r.checked = true; }
	if (localStorage.getItem('a11y_font') === 'on') { document.body.classList.add('dyslexia-font'); const r = document.getElementById('a11y_font_toggle'); if(r) r.checked = true; }
	if (localStorage.getItem('a11y_motion') === 'on') { document.body.classList.add('reduce-motion'); const r = document.getElementById('a11y_motion_toggle'); if(r) r.checked = true; }
    const size = localStorage.getItem('a11y_size');
    if (size === 'large') { document.documentElement.classList.add('text-large'); const r = document.getElementById('a11y_size_large'); if(r) r.checked = true; }
    else if (size === 'xl') { document.documentElement.classList.add('text-xlarge'); const r = document.getElementById('a11y_size_xl'); if(r) r.checked = true; }

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

    window.updateCompareActionsState();

    document.addEventListener('click', function(event) {
        const menu = document.getElementById('calc-mobile-menu');
        const btn = document.getElementById('calc-burger-btn');
        if (menu && menu.classList.contains('open')) {
            if (!menu.contains(event.target) && !btn.contains(event.target)) {
                menu.classList.remove('open');
            }
        }
        
        if(event.target.classList.contains('tab-btn') && !event.target.closest('#settings-tabs') && !event.target.closest('.partner-toggle-wrapper')) {
            const select = document.getElementById('mobile-tab-select');
            if(select) {
                const match = event.target.getAttribute('onclick').match(/'([^']+)'/);
                if(match) select.value = match[1];
            }
        }
    });
    
    const observer = new MutationObserver(window.formatTimingTitlesSingleAge);
    const activeTiming = document.getElementById('active-timing');
    if (activeTiming) observer.observe(activeTiming, { childList: true, subtree: true });

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

// Note: setMode is now defined in main.js and handles both wizard and non-wizard modes
// The main.js version already includes all necessary functionality
// This comment is left for reference to avoid re-implementing the mode-switching logic

// -------------------------------------------------------------
// 2. Compare Mode Toggles & Chart Interactions
// -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    const compareSwitch = document.getElementById('compare-switch');
    const resultsPane = document.getElementById('results-pane');
    const projControls = document.getElementById('projections-compare-controls');
    
    if (compareSwitch && resultsPane) {
        compareSwitch.addEventListener('change', function() {
            const title = document.getElementById('sidebar-title');
            
            if (this.checked) {
                if (title) title.innerText = 'New scenario';
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

                if (typeof window.updateResultsOverlay === 'function') window.updateResultsOverlay('empty');

                window.syncProjViewSelect('revised');
            } else {
                if (title) title.innerText = 'Current scenario';
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
            const title = document.getElementById('sidebar-title');
            if (title) title.innerText = 'New scenario';
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
    if (mainWrapper) mainWrapper.style.display = 'flex';

    if (typeof window.renderProjectionsView === 'function') {
        window.renderProjectionsView(viewType);
    }
};


// -------------------------------------------------------------
// 3. Formatting Observers (Tables and Changes List)
// -------------------------------------------------------------

// Fix 3: Robust Table House Icon Observer
const tableObserver = new MutationObserver(() => {
    const table = document.getElementById('wealth-table');
    if(!table || table.rows.length === 0) return;
    
    let lifeEventIdx = -1;
    const headerRow = table.rows[0];
    for(let i=0; i<headerRow.cells.length; i++) {
        if(headerRow.cells[i].innerText.includes('Life event') || headerRow.cells[i].innerText.includes('Event')) {
            lifeEventIdx = i;
            break;
        }
    }
    
    for(let i=1; i<table.rows.length; i++) {
        const row = table.rows[i];
        if (row.classList.contains('row-purchase') || (row.style && row.style.backgroundColor)) {
            if (!row.cells[0].innerHTML.includes('🏠')) {
                row.cells[0].innerHTML += ` <span style="margin-left: 6px;" title="Purchase">🏠</span>`;
            }
        }
        if (row.classList.contains('row-retire')) {
            if (!row.cells[0].innerHTML.includes('⛱️')) {
                row.cells[0].innerHTML += ` <span style="margin-left: 6px;" title="Retirement">⛱️</span>`;
            }
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

                            const undoSvg = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="undo-icon"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;

                            node.innerHTML = `
                                <div class="change-list-item-inner">
                                    <div class="change-list-text">
                                        <strong>${rawLabel}:</strong>
                                        <div class="change-list-vals">
                                            <del>${formattedOld}</del>
                                            <span class="arrow">➔</span>
                                            <span class="new-val">${formattedNew}</span>
                                        </div>
                                    </div>
                                    <button class="btn-undo" onclick="handleUndoClick(this, '${rawLabel.replace(/'/g, "\\'")}', '${oldValRaw.replace(/'/g, "\\'")}', '${newValRaw.replace(/'/g, "\\'")}')" title="Revert this change">
                                        ${undoSvg}
                                        <span class="undo-text">Undo</span>
                                    </button>
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

// --- Safe Element Null-Check Patch for main.js ---
window.addEventListener('DOMContentLoaded', () => {
    // Prevent crashes if main.js looks for elements that were removed or changed
    const originalGetElementById = document.getElementById;
    document.getElementById = function(id) {
        const el = originalGetElementById.call(document, id);
        if (!el && (id.includes('yrs') || id.includes('suffix'))) {
            // Return a dummy element to prevent reading properties of null crashes
            const dummy = document.createElement('span');
            dummy.value = '';
            dummy.classList = { add: ()=>{}, remove: ()=>{}, contains: ()=>false };
            return dummy;
        }
        return el;
    };
});