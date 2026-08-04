/**
 * compareUI.js
 * Handles the Compare Mode logic, Custom Undo Modal, Table collapsing, and UI event listeners.
 */

// -------------------------------------------------------------
// 1. Tooltips, Parameters, Menu, Chart Override, and Utilities
// -------------------------------------------------------------

// We must override Chart.js prototype globally BEFORE engine.js starts drawing.
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

window.addEventListener('DOMContentLoaded', () => {
    // Help Text Tooltips
    if (typeof helpText !== 'undefined') {
        for (const [key, text] of Object.entries(helpText)) {
            ['w_', 's_'].forEach(prefix => {
                const inputId = prefix + key;
                const input = document.getElementById(inputId) || document.querySelector(`input[name="${inputId}"]`);
                if (input) {
                    const row = input.closest('.input-row-single');
                    if (row) {
                        const label = row.querySelector('label');
                        if (label && !label.querySelector('.info-tip')) {
                            label.innerHTML += ` <span tabindex="0" class="info-tip">?<span class="tip-text">${text}</span></span>`;
                        }
                    }
                }
            });
        }
    }

    // Populate readonly parameters in the Rates and rules modal
    if (typeof globalParams !== 'undefined') {
        const badge = document.getElementById('tax-year-badge');
        const badge2 = document.getElementById('tax-year-badge-2');
        const taxYearText = `Tax Year ${globalParams.general.current_tax_year_beginning}/${globalParams.general.current_tax_year_beginning + 1}`;
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

            if (globalParams.income_tax) grid.innerHTML += `<div class="param-box"><h4>Income Tax Bands</h4>${formatBands(globalParams.income_tax)}</div>`;
            if (globalParams.national_insurance) grid.innerHTML += `<div class="param-box"><h4>National Insurance</h4>${formatBands(globalParams.national_insurance)}</div>`;
            if (globalParams.stamp_duty && globalParams.stamp_duty.first_time_buyer) {
                let html = `<div class="param-box"><h4>Stamp Duty (First Time Buyer)</h4>`;
                html += formatBands(globalParams.stamp_duty.first_time_buyer.bands);
                html += `<div style="margin-top: 12px; font-size: 0.8rem; color: var(--ifoa-blue); font-style: italic;">First Time Buyer (FTB) relief limit: £${globalParams.stamp_duty.first_time_buyer.limit.toLocaleString()}</div></div>`;
                grid.innerHTML += html;
            }
            if (globalParams.stamp_duty && globalParams.stamp_duty.second_time_buyer) {
                let html = `<div class="param-box"><h4>Stamp Duty (Next Home)</h4>`;
                html += formatBands(globalParams.stamp_duty.second_time_buyer.bands);
                html += `</div>`;
                grid.innerHTML += html;
            }
            if (globalParams.pension_taxation) {
                let html = `<div class="param-box"><h4>Pension Rules</h4><ul style="margin-top:15px;">`;
                html += `<li style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;"><span>Tax Free Cash (TFC) Max:</span> <strong>${globalParams.pension_taxation.tax_free_cash_percent * 100}%</strong></li>`;
                html += `<li style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;"><span>TFC Lifetime Limit:</span> <strong>£${globalParams.pension_taxation.tfc_max_withdrawal.toLocaleString()}</strong></li>`;
                html += `<li style="display:flex; justify-content:space-between; margin-bottom:8px; padding-bottom:6px;"><span>Basic Rate Rebate:</span> <strong>${globalParams.pension_taxation.tax_rebate_on_contributions * 100}%</strong></li>`;
                html += `</ul></div>`;
                grid.innerHTML += html;
            }
        }

        const grid2 = document.getElementById('readonly-params-grid-2');
        if (grid2) {
            if (globalParams.state_pension_age_table) {
                let html = `<div class="param-box"><h4>State Pension Age</h4><ul style="margin-top:15px;">`;
                let prevAge = 0;
                globalParams.state_pension_age_table.forEach((row, i) => {
                    let toAge = row.current_age_under - 1;
                    let ageRange = i === globalParams.state_pension_age_table.length - 1 ? `${prevAge}+` : `${prevAge} to ${toAge}`;
                    html += `<li style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;"><span>Current Age ${ageRange}:</span> <strong>${row.state_pension_age} (Min ${row.minimum_pension_age})</strong></li>`;
                    prevAge = row.current_age_under;
                });
                html += `</ul></div>`;
                grid2.innerHTML += html;
            }
            if (globalParams.career_increases) {
                let html = `<div class="param-box"><h4>Real Career Salary Growth</h4><ul style="margin-top:15px;">`;
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
                let html = `<div class="param-box"><h4>Mortgage Rates by LTV</h4><ul style="margin-top:15px;">`;
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
                let html = `<div class="param-box"><h4>Student Loan Thresholds</h4><ul style="margin-top:15px;">`;
                for (const [plan, data] of Object.entries(globalParams.student_loans)) {
                    let threshold = '£' + data.threshold.toLocaleString();
                    let rate = (data.rate * 100).toFixed(0) + '%';
                    html += `<li style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;"><span>Plan ${plan}:</span> <strong>${threshold} (${rate})</strong></li>`;
                }
                html += `</ul></div>`;
                grid2.innerHTML += html;
            }
        }
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        const menu = document.getElementById('calc-mobile-menu');
        const btn = document.getElementById('calc-burger-btn');
        if (menu && menu.classList.contains('open')) {
            if (!menu.contains(event.target) && !btn.contains(event.target)) {
                menu.classList.remove('open');
            }
        }
        
        // Sync Dropdown with tab button clicks
        if(event.target.classList.contains('tab-btn')) {
            const select = document.getElementById('mobile-tab-select');
            if(select) {
                const match = event.target.getAttribute('onclick').match(/'([^']+)'/);
                if(match) select.value = match[1];
            }
        }
    });

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
                
                const sections = ['hero', 'timing', 'wealth', 'prop'];
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
                
                document.getElementById('legend-baseline-buy').style.display = 'none';
                document.getElementById('legend-baseline-rent').style.display = 'none';
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
            
            const summaryBlock = document.getElementById('compare-summary-block');
            const noChangesMsg = document.getElementById('no-changes-msg');
            if (this.checked && summaryBlock && noChangesMsg) {
                setTimeout(() => {
                    noChangesMsg.style.display = summaryBlock.style.display === 'none' ? 'block' : 'none';
                }, 50);
            }
        });
        
        if(compareSwitch.checked) {
            resultsPane.classList.add('compare-mode-active');
            if(projControls) projControls.style.display = 'flex';
        }
    }
});

window.applyChartVisibility = function() {
    if (typeof Chart !== 'undefined') {
        const chart = Chart.getChart("wealthChart");
        if(chart && chart.data.datasets.length >= 4) {
            const compareSwitch = document.getElementById('compare-switch');
            if(!compareSwitch || !compareSwitch.checked) {
                chart.setDatasetVisibility(0, true);
                chart.setDatasetVisibility(1, true);
                chart.setDatasetVisibility(2, false);
                chart.setDatasetVisibility(3, false);
            } else {
                const viewRadio = document.querySelector('input[name="proj_compare_view"]:checked');
                const viewType = viewRadio ? viewRadio.value : 'revised';
                
                if(viewType === 'current') {
                    chart.setDatasetVisibility(0, false);
                    chart.setDatasetVisibility(1, false);
                    chart.setDatasetVisibility(2, true);
                    chart.setDatasetVisibility(3, true);
                } else {
                    chart.setDatasetVisibility(0, true);
                    chart.setDatasetVisibility(1, true);
                    chart.setDatasetVisibility(2, false);
                    chart.setDatasetVisibility(3, false);
                }
            }
            chart.update();
        }
    }
};

window.syncProjViewSelect = function(val) {
    const select = document.getElementById('mobile-proj-compare-select');
    if (select) select.value = val;
    const radio = document.getElementById('pcv_' + val);
    if (radio) radio.checked = true;
    window.toggleProjView(val);
};

window.toggleProjView = function(viewType) {
    const mainWrapper = document.getElementById('proj-main-wrapper');
    
    const legBuy = document.querySelector('.line-buy')?.parentElement;
    const legRent = document.querySelector('.line-rent')?.parentElement;
    const legBaseBuy = document.getElementById('legend-baseline-buy');
    const legBaseRent = document.getElementById('legend-baseline-rent');

    mainWrapper.style.display = 'block';

    if(legBuy && legRent && legBaseBuy && legBaseRent) {
        if (viewType === 'current') {
            legBuy.style.display = 'none';
            legRent.style.display = 'none';
            legBaseBuy.style.display = 'flex';
            legBaseRent.style.display = 'flex';
        } else {
            legBuy.style.display = 'flex';
            legRent.style.display = 'flex';
            legBaseBuy.style.display = 'none';
            legBaseRent.style.display = 'none';
        }
    }
    window.applyChartVisibility();
};

document.getElementById('main-sidebar').addEventListener('change', () => {
    setTimeout(window.applyChartVisibility, 100);
});
document.getElementById('main-sidebar').addEventListener('input', () => {
    setTimeout(window.applyChartVisibility, 100);
});


// -------------------------------------------------------------
// 3. Formatting Observers (Tables and Changes List)
// -------------------------------------------------------------

// Projections Data Table Formatting
const tableObserver = new MutationObserver(() => {
    const table = document.getElementById('wealth-table');
    if(!table || table.rows.length === 0) return;
    
    let lifeEventIdx = -1;
    const headerRow = table.rows[0];
    for(let i=0; i<headerRow.cells.length; i++) {
        if(headerRow.cells[i].innerText.includes('Life Event')) {
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

// "Your Changes" Formatting and Custom Undo Modal Logic
let pendingUndo = null;

const changesObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
                if (node.tagName === 'LI' && !node.dataset.formatted) {
                    const rawHTML = node.innerHTML;
                    const match = rawHTML.match(/<strong>(.*?)<\/strong>\s*(.*?)\s*(?:&rarr;|➔|->)\s*(.*)/);
                    
                    if (match) {
                        const rawLabel = match[1].replace(':', '').trim();
                        let oldValRaw = match[2].trim();
                        let newValRaw = match[3].trim();
                        
                        let formattedOld = oldValRaw;
                        let formattedNew = newValRaw;

                        const isPureNumeric = (str) => /^[\d,]+(\.\d+)?$/.test(str);
                        const isNotAgeOrPct = !rawLabel.toLowerCase().includes('age') && !rawLabel.toLowerCase().includes('proportion') && !rawLabel.toLowerCase().includes('contribution') && !rawLabel.toLowerCase().includes('plan');

                        if (isPureNumeric(oldValRaw) && isPureNumeric(newValRaw) && isNotAgeOrPct) {
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
                                <button class="btn-undo" onclick="promptUndo(this, '${rawLabel.replace(/'/g, "\\'")}', '${oldValRaw.replace(/'/g, "\\'")}')" title="Revert this change">Undo</button>
                            </div>
                        `;
                        node.dataset.formatted = 'true';
                    }
                }
            });
        }
    });
});

window.addEventListener('DOMContentLoaded', () => {
    const changesList = document.getElementById('compare-changes-list');
    if(changesList) changesObserver.observe(changesList, { childList: true });
});

// The initial click maps the context and displays the modal
window.promptUndo = function(btnElement, label, rawOldValue) {
    pendingUndo = { btnElement, label, rawOldValue };
    document.getElementById('undo-confirm-modal').classList.add('active');
};

// Closes the modal without action
window.closeUndoModal = function() {
    pendingUndo = null;
    document.getElementById('undo-confirm-modal').classList.remove('active');
};

// Executes the action if the user confirms inside the modal
window.confirmUndoAction = function() {
    if (pendingUndo) {
        const { btnElement, label, rawOldValue } = pendingUndo;
        const input = document.querySelector(`input[data-label="${label}"], select[data-label="${label}"]`);
        
        if (input) {
            const cleanVal = rawOldValue.replace(/,/g, '');
            if (input.type === 'text' && input.classList.contains('comma-format')) {
                input.value = rawOldValue;
            } else if (input.type === 'radio') {
                const radio = document.querySelector(`input[name="${input.name}"][value="${rawOldValue}"]`);
                if (radio) radio.checked = true;
            } else {
                input.value = cleanVal;
            }

            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));

            const li = btnElement.closest('li');
            if(li) li.remove();

            const list = document.getElementById('compare-changes-list');
            if (list && list.children.length === 0) {
                document.getElementById('compare-summary-block').style.display = 'none';
                document.getElementById('no-changes-msg').style.display = 'block';
            }
        } else {
            console.error("Could not find input for label: " + label);
        }
    }
    closeUndoModal();
};