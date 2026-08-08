// Round to 3 significant figures for display purposes
function roundTo3SigFigs(value) {
    if (value === 0) return 0;
    const absValue = Math.abs(value);
    const magnitude = Math.floor(Math.log10(absValue));
    const decimalPlaces = 2 - magnitude;
    const factor = Math.pow(10, decimalPlaces);
    return Math.round(absValue * factor) / factor * (value < 0 ? -1 : 1);
}

// --- HTML Templates for the Dynamic Hero Card ---
const heroTemplates = {
    buy: (diff) => `
        <div class="result-hero-card theme-buy">
            <div class="hero-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="36" height="36">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    <path d="M12 16l3-3 3 3"></path>
                    <line x1="15" y1="13" x2="15" y2="19"></line>
                </svg>
            </div>
            <div class="hero-text-content">
                <h2 class="hero-title">Buying is likely to be the stronger financial choice</h2>
                <p class="hero-description">Over your chosen timeframe, buying this property could leave you around <span class="hero-highlight">${diff}</span> wealthier than renting.</p>
            </div>
        </div>
    `,
    rent: (diff) => `
        <div class="result-hero-card theme-rent">
            <div class="hero-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="36" height="36">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                    <path d="M9 22v-4h6v4"></path>
                    <path d="M8 6h.01"></path>
                    <path d="M16 6h.01"></path>
                    <path d="M8 10h.01"></path>
                    <path d="M16 10h.01"></path>
                    <path d="M8 14h.01"></path>
                    <path d="M16 14h.01"></path>
                    <circle cx="12" cy="14" r="4" fill="currentColor" opacity="0.2"></circle>
                </svg>
            </div>
            <div class="hero-text-content">
                <h2 class="hero-title">Renting is likely to give higher lifetime wealth</h2>
                <p class="hero-description">Based on your inputs, renting and investing your spare cash could leave you around <span class="hero-highlight">${diff}</span> wealthier than buying.</p>
            </div>
        </div>
    `,
    unaffordable: (hp) => `
        <div class="result-hero-card theme-error">
            <div class="hero-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="36" height="36">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" opacity="0.4"></path>
                    <rect x="9" y="11" width="6" height="8" rx="1" ry="1"></rect>
                    <path d="M10 11V9a2 2 0 0 1 4 0v2"></path>
                </svg>
            </div>
            <div class="hero-text-content">
                <h2 class="hero-title">Adjust your buying plan</h2>
                <p class="hero-description">Based on your current deposit and income, an <span class="hero-highlight">${hp}</span> home looks unlikely to be reachable yet.</p>
            </div>
        </div>
    `,
    tie: () => `
        <div class="result-hero-card theme-buy">
            <div class="hero-icon-wrapper" style="background-color: #e0e6ed; color: #555;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="36" height="36">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
            </div>
            <div class="hero-text-content">
                <h2 class="hero-title" style="color: #333;">This is likely to be a close call</h2>
                <p class="hero-description">Over your chosen timeframe, buying and renting are likely to give similar financial outcomes. Your decision may depend on lifestyle preferences rather than strictly wealth accumulation.</p>
            </div>
        </div>
    `
};

// Icon paths - hardcoded
let iconPaths = {
    property: "M12 2L16 5.2V3H18V6.8L22 10H19V22H5V10H2L12 2 Z M10 14 V22 H14 V14 Z",
    // Retirement umbrella with lean (from retirement.svg)
    retirement: "M12 2.5C7.58 2.5 4 6.08 4 10.5C4 10.78 4.02 11.05 4.05 11.31C4.33 12.3 5.1 13 6 13C6.9 13 7.67 12.3 7.95 11.31C8.23 12.3 9 13 9.91 13C10.82 13 11.59 12.3 11.87 11.31C11.91 11.31 11.96 11.31 12 11.31C12.04 11.31 12.09 11.31 12.13 11.31C12.41 12.3 13.18 13 14.09 13C15 13 15.77 12.3 16.05 11.31C16.33 12.3 17.1 13 18 13C18.9 13 19.67 12.3 19.95 11.31C19.98 11.05 20 10.78 20 10.5C20 6.08 16.42 2.5 12 2.5Z M11 11H13V22H11V11Z"
};

// Cache for retirement icon canvas - created once and reused
let retirementIconCache = {};

const timingTemplate = (titleText, descText) => `
    <div class="timing-hero-card">
        <div class="timing-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" width="32" height="32">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
        </div>
        <div class="timing-text-content">
            <h3 class="timing-title">${titleText}</h3>
            <p class="timing-description">${descText}</p>
        </div>
    </div>
`;

const timingUnaffordableTemplate = (descText) => `
    <div class="timing-hero-card timing-hero-card-warning">
        <div class="timing-icon-wrapper timing-icon-warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" width="32" height="32">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" opacity="0.4"></path>
                <rect x="9" y="11" width="6" height="8" rx="1" ry="1"></rect>
                <path d="M10 11V9a2 2 0 0 1 4 0v2"></path>
            </svg>
        </div>
        <div class="timing-text-content">
            <h3 class="timing-title">The property may not be affordable</h3>
            <p class="timing-description">${descText}</p>
        </div>
    </div>
`;

// --- GLOBALS ---
const formatMoney = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
let currentChart = null;
let debounceTimer = null;
let currentMode = null;
let currentWizIndex = 0;
let stepSequence = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
let savedSettings = {};
let wizardOrigin = null; // Tracks whether wizard opened from external page

let isCompareMode = false;
let baselineInputs = {};
let baselineResults = null;
let changedInputsList = [];

let lastCalcData = null;
let currentProjView = 'revised';

function roundSigFigDown(val) {
    if (!val || val === 0) return 0;
    let absVal = Math.abs(val);
    if (absVal < 100) return val;
    const digits = Math.floor(Math.log10(absVal)) + 1;
    const magnitude = Math.pow(10, digits - 3);
    let rounded = Math.floor(absVal / magnitude) * magnitude;
    return val < 0 ? -rounded : rounded;
}

function formatSigFigDown(val) {
    if (!val || val === 0) return "£0";
    return formatMoney.format(roundSigFigDown(val));
}

document.querySelectorAll('.comma-format').forEach(item => {
    item.addEventListener('input', function(e) {
        let val = this.value.replace(/,/g, '');
        if (!isNaN(val) && val.length > 0) this.value = parseFloat(val).toLocaleString('en-GB');
    });
});

let wExPre = document.getElementById('w_ex_pre');
if(wExPre) {
    wExPre.addEventListener('input', function() {
        let wExPost = document.getElementById('w_ex_post');
        if(wExPost && !wExPost.dataset.userEdited) wExPost.value = this.value;
    });
}
let wExPost = document.getElementById('w_ex_post');
if(wExPost) {
    wExPost.addEventListener('input', function() {
        this.dataset.userEdited = 'true';
    });
}

function applyLimits(el) {
    if (!el) return;
    let valStr = String(el.value).replace(/,/g, '').replace(/£/g, '').replace(/%/g, '');
    if(valStr === '') return;
    let val = parseFloat(valStr);
    if(isNaN(val)) return;

    let isCurrency = el.classList.contains('comma-format');
    let originalVal = val;
    let min = -Infinity, max = Infinity;
    
    if (el.classList.contains('clamp-age')) {
        min = 18; max = 100;
    } else if (el.classList.contains('clamp-ret-age')) {
        max = 75;
        let idPrefix = el.id.charAt(0); 
        let ageId = idPrefix + "_age1";
        let ageEl = document.getElementById(ageId);
        let ageVal = parseFloat(ageEl ? ageEl.value : 0);
        min = Math.max(55, ageVal);
    } else if (el.classList.contains('clamp-1m')) {
        min = 0; max = 1000000;
    } else if (el.classList.contains('clamp-10m')) {
        min = 0; max = 10000000;
    } else if (el.classList.contains('clamp-100')) {
        min = 0; max = 100;
    }

    if (val < min) val = min;
    if (val > max) val = max;

    if (val !== originalVal || isCurrency) {
        el.value = isCurrency ? val.toLocaleString('en-GB') : val;
    }
}

document.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', function() { applyLimits(this); updateDynamicUI(); validateStep(); });
});

function updateDynamicUI() {
    let sR1 = parseInt(document.getElementById('s_ret1')?.value || 68);
    let sA1 = parseInt(document.getElementById('s_age1')?.value || 29);
    let sR2 = document.getElementById('s_ret2');
    if(sR2 && sA1 && sR1) sR2.value = Math.max(0, sR1 - sA1 + parseInt(document.getElementById('s_age2')?.value || 31));

    let lblWPre = document.getElementById('lbl_w_ex_pre');
    let lblWPost = document.getElementById('lbl_w_ex_post');
    let wR1 = parseInt(document.getElementById('w_ret1')?.value || 68);
    if (lblWPre) lblWPre.innerText = `Pre-retirement (age ${wR1} for you)`;
    if (lblWPost) lblWPost.innerText = `Post-retirement (age ${wR1} for you)`;

    let lblSPre = document.getElementById('lbl_s_ex_pre');
    let lblSPost = document.getElementById('lbl_s_ex_post');
    if (lblSPre) lblSPre.innerText = `Pre-retirement (age ${sR1} for you)`;
    if (lblSPost) lblSPost.innerText = `Post-retirement (age ${sR1} for you)`;
}

document.querySelectorAll('.calc-ret-trigger').forEach(input => {
    input.addEventListener('input', updateDynamicUI);
});

function toggleSL() {
    const sl1 = document.querySelector('input[name="s_has_sl1"]:checked')?.value === 'Yes';
    const sl2 = document.querySelector('input[name="s_has_sl2"]:checked')?.value === 'Yes';
    
    const s_f1 = document.getElementById('s_sl_fields1');
    const s_f2 = document.getElementById('s_sl_fields2');
    
    if(s_f1) s_f1.style.display = sl1 ? 'block' : 'none';
    if(s_f2) s_f2.style.display = sl2 ? 'block' : 'none';
}

function handleModeCardKey(e, mode) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        e.stopPropagation();
        setMode(mode);
    }
}

document.addEventListener('keydown', function(e) {
    if (e.key !== 'Enter') return;
    const wizardOverlay = document.getElementById('wizard-overlay');
    if (!wizardOverlay || !wizardOverlay.classList.contains('active')) return;
    const tag = e.target.tagName;
    if (tag === 'BUTTON' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'A') return;
    e.preventDefault();
    const wizNext = document.getElementById('wiz-next');
    if (wizNext && !wizNext.disabled) wizardStep(1);
});

function toggleWizSL(personNum) {
    let has = document.querySelector(`input[name="w_has_sl${personNum}"]:checked`)?.value === 'Yes';
    let f = document.getElementById(`w_sl_fields${personNum}`);
    if (f) f.style.display = has ? 'block' : 'none';
}

function togglePen() {
    const p1 = document.querySelector('input[name="s_has_pen1"]:checked')?.value === 'Yes';
    const p2 = document.querySelector('input[name="s_has_pen2"]:checked')?.value === 'Yes';
    
    const s_f1 = document.getElementById('s_pen_fields1');
    const s_f2 = document.getElementById('s_pen_fields2');
    
    if(s_f1) s_f1.style.display = p1 ? 'block' : 'none';
    if(s_f2) s_f2.style.display = p2 ? 'block' : 'none';
}

function toggleWizPen(personNum) {
    let has = document.querySelector(`input[name="w_has_pen${personNum}"]:checked`)?.value === 'Yes';
    let f = document.getElementById(`w_pen_fields${personNum}`);
    if (f) f.style.display = has ? 'block' : 'none';
}

function switchTab(btnElement, tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    btnElement.classList.add('active');
    const viewSection = document.getElementById('view-' + tabId);
    if(viewSection) viewSection.classList.add('active');
}

function toggleDataView(viewType) {
    const graphContainer = document.getElementById('graph-container');
    const tableContainer = document.getElementById('table-container');
    if (viewType === 'graph') {
        if(graphContainer) graphContainer.style.display = 'flex';
        if(tableContainer) tableContainer.style.display = 'none';
    } else {
        if(graphContainer) graphContainer.style.display = 'none';
        if(tableContainer) tableContainer.style.display = 'flex';
    }
}

function switchPerson(person) {
    if (person === 'you') {
        document.querySelectorAll('.show-partner').forEach(el => el.classList.add('is-hidden'));
        document.querySelectorAll('.show-you').forEach(el => el.classList.remove('is-hidden'));
        document.querySelectorAll('input[id$="_you"]').forEach(el => el.checked = true);
    } else {
        document.querySelectorAll('.show-you').forEach(el => el.classList.add('is-hidden'));
        document.querySelectorAll('.show-partner').forEach(el => el.classList.remove('is-hidden'));
        document.querySelectorAll('input[id$="_part"]').forEach(el => el.checked = true);
    }
}

function toggleCompareMode() {
    const compareSwitch = document.getElementById('compare-switch');
    isCompareMode = compareSwitch ? compareSwitch.checked : false;

    if (isCompareMode) {
        baselineInputs = gatherRawInputs();
        try {
            const engine = new ActuarialEngine(gatherEngineInputs(baselineInputs), globalParams);
            baselineResults = engine.runFullProjection();
        } catch(e) { console.error("Engine failed on baseline snapshot", e); }

        const footer = document.getElementById('compare-actions-footer');
        if(footer) footer.style.display = 'block';
        const summaryBlock = document.getElementById('compare-summary-block');
        if(summaryBlock) summaryBlock.style.display = 'block';

        // Show the "Your changes" tab when compare mode is on
        const changesTab = document.getElementById('tab-changes');
        if(changesTab) changesTab.style.display = 'block';
    } else {
        discardWhatIf();
        const footer = document.getElementById('compare-actions-footer');
        if(footer) footer.style.display = 'none';
        const summaryBlock = document.getElementById('compare-summary-block');
        if(summaryBlock) summaryBlock.style.display = 'none';
        baselineInputs = {};
        baselineResults = null;
        updateResultsOverlay('normal');

        // Hide the "Your changes" tab when compare mode is off
        const changesTab = document.getElementById('tab-changes');
        if(changesTab) changesTab.style.display = 'none';

        // Also switch away from the changes view if it's currently active
        const viewChanges = document.getElementById('view-changes');
        if(viewChanges && viewChanges.classList.contains('active')) {
            switchTab(document.querySelector('.tab-btn:not(#tab-changes)'), 'overview');
        }
    }
}

function makeBaseScenario() {
    if(!isCompareMode) return;
    baselineInputs = gatherRawInputs();
    try {
        const engine = new ActuarialEngine(gatherEngineInputs(baselineInputs), globalParams);
        baselineResults = engine.runFullProjection();
    } catch(e) { console.error("Engine failed on base snapshot", e); }
    runCalculation();
}

function discardWhatIf() {
    if(!isCompareMode) return;
    Object.keys(baselineInputs).forEach(id => {
        let el = document.getElementById(id);
        if (el) {
            if (el.type === 'radio' || el.type === 'checkbox') {
                el.checked = baselineInputs[id];
            } else {
                el.value = baselineInputs[id];
            }
            if (el.classList.contains('compare-track')) {
                let wrapper = el.closest('.input-wrapper') || el.closest('.toggle-container');
                if (wrapper) wrapper.classList.remove('is-modified');
            }
        }
    });

    changedInputsList = [];
    const changesList = document.getElementById('compare-changes-list');
    if(changesList) changesList.innerHTML = '';
    toggleSL();
    togglePen();
    updateDynamicUI();
    forceCalculation();
}

function gatherRawInputs() {
    let data = {};
    document.querySelectorAll('.compare-track').forEach(el => {
        if (el.type === 'radio' || el.type === 'checkbox') {
            data[el.id] = el.checked;
        } else {
            data[el.id] = el.value;
        }
    });
    return data;
}

function checkCompareModifications() {
    if(!isCompareMode) return;
    changedInputsList = [];
    const ul = document.getElementById('compare-changes-list');
    if (!ul) return;
    ul.innerHTML = '';
    let currentRaw = gatherRawInputs();
    
    document.querySelectorAll('.compare-track').forEach(el => {
        let isChanged = (currentRaw[el.id] !== baselineInputs[el.id]);
        let wrapper = el.closest('.input-wrapper') || el.closest('.toggle-container');
        if (isChanged) {
            if (wrapper) wrapper.classList.add('is-modified');
            if (el.type !== 'radio' || (el.type === 'radio' && el.checked)) {
                let labelText = el.getAttribute('data-label') || el.id;
                let oldVal = baselineInputs[el.id];
                let newVal = el.value;
                if(el.type === 'radio') {
                    let group = document.querySelectorAll(`input[name="${el.name}"]`);
                    let oldRadio = Array.from(group).find(r => baselineInputs[r.id] === true);
                    oldVal = oldRadio ? (document.querySelector(`label[for="${oldRadio.id}"]`)?.textContent.trim() || oldRadio.value) : "Previous";
                    newVal = document.querySelector(`label[for="${el.id}"]`)?.textContent.trim() || el.value;
                }
                changedInputsList.push(`${labelText}: ${oldVal} ➔ ${newVal}`);
                let li = document.createElement('li');
                li.innerHTML = `<strong>${labelText}:</strong> ${oldVal} ➔ ${newVal}`;
                ul.appendChild(li);
            }
        } else {
            if (wrapper && el.type !== 'radio') wrapper.classList.remove('is-modified');
        }
    });
}

function getVal(id) {
    let el = document.getElementById(id);
    if(!el) return 0;
    let val = el.value.replace(/,/g, '').replace(/£/g, '').replace(/%/g, '');
    return parseFloat(val) || 0;
}

function gatherEngineInputs(sourceDataObj = null) {
    const fetchVal = (id) => {
        if(sourceDataObj) {
            let val = String(sourceDataObj[id] || "0").replace(/,/g, '').replace(/£/g, '').replace(/%/g, '');
            return parseFloat(val) || 0;
        }
        return getVal(id);
    };

    const fetchRadio = (name) => {
        if(sourceDataObj) {
             let checkedId = Object.keys(sourceDataObj).find(key => key.startsWith(name) && sourceDataObj[key] === true);
             return checkedId ? document.getElementById(checkedId)?.value || 'No' : 'No';
        }
        return document.querySelector(`input[name="${name}"]:checked`)?.value || 'No';
    };

    const slp1 = document.getElementById('s_slp1')?.value || "2";
    const slp2 = document.getElementById('s_slp2')?.value || "2";
    const m = currentMode === 'couple' ? 1 : 0;
    const inflation = fetchVal('set_inf');
    const toReal = (nominalStr) => {
        let nominal = parseFloat(nominalStr) || 0;
        return nominal - inflation;
    };

    return {
        Case_Life_1_Current_age: fetchVal('s_age1'),
        Case_Life_1_Retirement_age: fetchVal('s_ret1'),
        Case_Life_1_Plan_end_age: fetchVal('set_end'),
        Case_Life_1_Gross_salary: fetchVal('s_sal1'),
        Case_Life_1_State_pension: fetchRadio('s_has_pen1') === 'Yes' ? fetchVal('s_sp1') : 0,
        Case_Life_1_Pension_cont_Ee: fetchRadio('s_has_pen1') === 'Yes' ? fetchVal('s_pee1') : 0,
        Case_Life_1_Pension_cont_Er: fetchRadio('s_has_pen1') === 'Yes' ? fetchVal('s_per1') : 0,
        Case_Life_1_Pension_initial_value: fetchRadio('s_has_pen1') === 'Yes' ? fetchVal('s_pval1') : 0,
        Case_Life_1_Spend_TFC: document.getElementById('s_tfc1')?.value || "No",
        Case_Life_1_Student_loan: fetchRadio('s_has_sl1') === 'Yes' ? fetchVal('s_sl1') : 0,
        Case_Life_1_Student_loan_plan: fetchRadio('s_has_sl1') === 'Yes' ? slp1 : "",
        Case_Life_2_Current_age: fetchVal('s_age2') || fetchVal('s_age1'),
        Case_Life_2_Gross_salary: fetchVal('s_sal2') * m,
        Case_Life_2_State_pension: (fetchRadio('s_has_pen2') === 'Yes') ? (fetchVal('s_sp2') * m) : 0,
        Case_Life_2_Pension_cont_Ee: (fetchRadio('s_has_pen2') === 'Yes') ? (fetchVal('s_pee2') * m) : 0,
        Case_Life_2_Pension_cont_Er: (fetchRadio('s_has_pen2') === 'Yes') ? (fetchVal('s_per2') * m) : 0,
        Case_Life_2_Pension_initial_value: (fetchRadio('s_has_pen2') === 'Yes') ? (fetchVal('s_pval2') * m) : 0,
        Case_Life_2_Spend_TFC: document.getElementById('s_tfc2')?.value || "No",
        Case_Life_2_Student_loan: (fetchRadio('s_has_sl2') === 'Yes') ? (fetchVal('s_sl2') * m) : 0,
        Case_Life_2_Student_loan_plan: (fetchRadio('s_has_sl2') === 'Yes' && m) ? slp2 : "",
        Case_Joint_Savings_initial_value: fetchVal('s_cash'),
        Case_Joint_Save_to_pension: fetchVal('s_save_pen'),
        Case_Joint_Expenses_pre_ret: fetchVal('s_ex_pre') * 12,
        Case_Joint_Expenses_in_ret: fetchVal('s_ex_post') * 12,
        Case_Joint_Rent: fetchVal('s_rent') * 12,
        Case_Joint_House_price: fetchVal('s_hp'),
        Case_Joint_First_Time_Buyer: fetchRadio('s_ftb'),
        Case_Joint_House_purchase_costs: fetchVal('s_fees'),
        Case_Joint_Expenses_house: fetchVal('s_maint'),
        Case_Joint_Mortgage_multiplier: fetchVal('set_mult'),
        Case_Joint_Mortgage_LTV: fetchVal('set_ltv'),
        Case_Joint_Mortgage_term_maximum: fetchVal('set_term'),
        Case_Joint_Rent_increases: toReal(document.getElementById('set_rent_inc')?.value || "3.4"),
        Returns_House_price_increase: toReal(document.getElementById('set_hp_inc')?.value || "3.2"),
        Returns_cash: toReal(document.getElementById('set_cash')?.value || "2.0"),
        Returns_pension: toReal(document.getElementById('set_pen')?.value || "5.5"),
        Returns_inflation: inflation
    };
}

function updateWizardProgress() {
    const progressContainer = document.getElementById('wizard-progress-container');
    if(!progressContainer) return;
    progressContainer.style.display = currentWizIndex === 0 ? 'none' : 'flex';
    progressContainer.innerHTML = '';
    if(currentWizIndex > 0) {
        for(let i = 1; i < stepSequence.length; i++) {
            let dot = document.createElement('div');
            dot.className = 'progress-dot' + (i === currentWizIndex ? ' active' : '');
            progressContainer.appendChild(dot);
        }
    }
}

function validateWizardFieldValue(inputEl, mustBePositive = false) {
    if (!inputEl) return true;
    const raw = String(inputEl.value || '').replace(/,/g, '').trim();
    return mustBePositive ? (raw !== '' && parseFloat(raw) > 0) : raw !== '';
}

function clearFieldError(inputEl) {
    if (!inputEl) return;
    const wrapper = inputEl.closest('.input-wrapper') || inputEl.closest('.toggle-container');
    if (wrapper) {
        wrapper.classList.remove('has-error');
        const errEl = wrapper.nextElementSibling;
        if (errEl && errEl.classList.contains('field-error-text')) {
            errEl.classList.remove('visible');
        }
    }
}

function validateStep() {
    const nextBtn = document.getElementById('wiz-next');
    if (!nextBtn) return;
    let isValid = true;
    let step = stepSequence[currentWizIndex];

    if (step === 0) {
        isValid = currentMode !== null;
    } else {
        const currentStepEl = document.getElementById(`step-${step}`);
        if (currentStepEl) {
            const radioGroups = currentStepEl.querySelectorAll('input[type="radio"]');
            if (radioGroups.length > 0) {
                const names = [...new Set(Array.from(radioGroups).map(r => r.name))];
                for (let name of names) {
                    if (!currentStepEl.querySelector(`input[name="${name}"]:checked`)) {
                        isValid = false;
                        break;
                    }
                }
            }

            // Additional validation for student loan steps (4 and 5)
            if ((step === 4 || step === 5) && isValid) {
                const personNum = step === 4 ? 1 : 2;
                const hasLoanRadio = currentStepEl.querySelector(`input[name="w_has_sl${personNum}"]:checked`);
                if (hasLoanRadio && hasLoanRadio.value === 'Yes') {
                    const loanPlanSelect = currentStepEl.querySelector(`select[id="w_slp${personNum}"]`);
                    if (loanPlanSelect && loanPlanSelect.value === '') {
                        isValid = false;
                    }
                }
            }
        }
    }

    if (isValid) {
        nextBtn.disabled = false;
        nextBtn.style.opacity = '1';
        nextBtn.style.cursor = 'pointer';
    } else {
        nextBtn.disabled = true;
        nextBtn.style.opacity = '0.5';
        nextBtn.style.cursor = 'not-allowed';
    }
}

// Validate when user tries to proceed (click Next) - shows all errors
function validateStepBeforeAdvance() {
    const step = stepSequence[currentWizIndex];
    const currentStepEl = document.getElementById(`step-${step}`);
    if (!currentStepEl) return true;

    let allValid = true;
    let firstErrorEl = null;
    const isCouple = currentMode === 'couple';

    // Field type mappings for proper error messages
    const ageFields = ['w_age1', 'w_age2', 'w_ret1'];
    const currencyFields = ['w_sal1', 'w_sal2', 'w_sl1', 'w_sl2', 'w_cash', 'w_ex_pre', 'w_ex_post'];

    const checkNumberField = (id) => {
        const el = currentStepEl.querySelector(`#${id}`);
        if (!el) return true;
        const isValid = validateWizardFieldValue(el, true);
        if (!isValid) {
            const errorMsg = ageFields.includes(id) ? 'Enter a value greater than 0.' : 'Enter an amount greater than £0.';
            setFieldValidity(el, false, errorMsg);
            if (!firstErrorEl) firstErrorEl = el;
            allValid = false;
        }
        return isValid;
    };

    const checkOptionalNumberField = (id) => {
        const el = currentStepEl.querySelector(`#${id}`);
        if (!el) return true;
        return true; // Optional fields always pass
    };

    const checkRadio = (name) => {
        const anyRadio = currentStepEl.querySelector(`input[name="${name}"]`);
        const checkedEl = currentStepEl.querySelector(`input[name="${name}"]:checked`);
        if (!checkedEl) {
            setFieldValidity(anyRadio, false, 'Please make a selection.');
            if (!firstErrorEl) firstErrorEl = anyRadio;
            allValid = false;
        }
        return checkedEl;
    };

    const checkSelect = (id) => {
        const el = currentStepEl.querySelector(`#${id}`);
        if (!el) return true;
        if (el.value === '') {
            setFieldValidity(el, false, 'Please make a selection.');
            if (!firstErrorEl) firstErrorEl = el;
            allValid = false;
        }
        return el.value !== '';
    };

    // Step-specific validation
    if (step === 1) {
        if (!checkNumberField('w_age1')) allValid = false;
        if (isCouple && !checkNumberField('w_age2')) allValid = false;
    } else if (step === 2) {
        if (!checkNumberField('w_ret1')) allValid = false;
    } else if (step === 3) {
        if (!checkNumberField('w_sal1')) allValid = false;
        if (isCouple && !checkNumberField('w_sal2')) allValid = false;
    } else if (step === 4) {
        const hasLoan = currentStepEl.querySelector('input[name="w_has_sl1"]:checked');
        checkRadio('w_has_sl1');
        if (hasLoan && hasLoan.value === 'Yes') {
            if (!checkNumberField('w_sl1')) allValid = false;
            if (!checkSelect('w_slp1')) allValid = false;
        }
    } else if (step === 5) {
        const hasLoan = currentStepEl.querySelector('input[name="w_has_sl2"]:checked');
        checkRadio('w_has_sl2');
        if (hasLoan && hasLoan.value === 'Yes') {
            if (!checkNumberField('w_sl2')) allValid = false;
            if (!checkSelect('w_slp2')) allValid = false;
        }
    } else if (step === 6) {
        const hasPen = currentStepEl.querySelector('input[name="w_has_pen1"]:checked');
        checkRadio('w_has_pen1');
        if (hasPen && hasPen.value === 'Yes') {
            checkOptionalNumberField('w_pval1');
            checkOptionalNumberField('w_pee1');
            checkOptionalNumberField('w_per1');
        }
    } else if (step === 7) {
        const hasPen = currentStepEl.querySelector('input[name="w_has_pen2"]:checked');
        checkRadio('w_has_pen2');
        if (hasPen && hasPen.value === 'Yes') {
            checkOptionalNumberField('w_pval2');
            checkOptionalNumberField('w_pee2');
            checkOptionalNumberField('w_per2');
        }
    } else if (step === 8) {
        if (!checkNumberField('w_cash')) allValid = false;
        if (!checkNumberField('w_ex_pre')) allValid = false;
        if (!checkNumberField('w_ex_post')) allValid = false;
    } else if (step === 9) {
        if (!checkNumberField('w_pval1')) allValid = false;
    }

    // Focus on first error if validation fails
    if (!allValid && firstErrorEl) {
        firstErrorEl.focus();
        firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return allValid;
}


function setMode(mode) {
    const modeSingle = document.getElementById('w-mode-single');
    const modeCouple = document.getElementById('w-mode-couple');
    if(modeSingle) { modeSingle.classList.remove('active'); modeSingle.setAttribute('aria-pressed', 'false'); }
    if(modeCouple) { modeCouple.classList.remove('active'); modeCouple.setAttribute('aria-pressed', 'false'); }

    let sideSingle = document.getElementById('side_single');
    let sideCouple = document.getElementById('side_couple');

    // Check if switching from single to couple mode outside of wizard
    const isOutsideWizard = !document.getElementById('wizard-overlay')?.classList.contains('active');
    const wasSingleMode = currentMode === 'single' && mode === 'couple' && isOutsideWizard;

    currentMode = mode;

    if (mode === 'single') {
        if(modeSingle) { modeSingle.classList.add('active'); modeSingle.setAttribute('aria-pressed', 'true'); }
        if(sideSingle) sideSingle.checked = true;
        document.querySelectorAll('.partner-toggle-wrapper').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.show-partner').forEach(el => el.classList.add('is-hidden'));
        const step1Title = document.getElementById('step1-title');
        if(step1Title) step1Title.textContent = "Let's start with your age";
        // Only call switchPerson if not in wizard (wizard is active when wizard-overlay has 'active' class)
        const wizardOverlay = document.getElementById('wizard-overlay');
        if (!wizardOverlay || !wizardOverlay.classList.contains('active')) {
            switchPerson('you');
        }
        stepSequence = [0, 1, 2, 3, 4, 6, 8, 9, 10];
    } else if (mode === 'couple') {
        if(modeCouple) { modeCouple.classList.add('active'); modeCouple.setAttribute('aria-pressed', 'true'); }
        if(sideCouple) sideCouple.checked = true;
        document.querySelectorAll('.partner-toggle-wrapper').forEach(el => el.style.display = 'flex');
        document.querySelectorAll('.show-partner').forEach(el => el.classList.remove('is-hidden'));
        const step1Title = document.getElementById('step1-title');
        if(step1Title) step1Title.textContent = "Let's start with your ages";
        // Only call switchPerson if not in wizard (wizard is active when wizard-overlay has 'active' class)
        const wizardOverlay2 = document.getElementById('wizard-overlay');
        if (!wizardOverlay2 || !wizardOverlay2.classList.contains('active')) {
            switchPerson('you');
        }
        stepSequence = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

        // If switching from single to couple outside wizard, check if partner details exist
        if (isOutsideWizard) {
            const hasPartnerAge = document.getElementById('s_age2')?.value;
            const hasPartnerSalary = document.getElementById('s_sal2')?.value;
            // Only show wizard if partner details are missing
            if (!hasPartnerAge || !hasPartnerSalary) {
                setTimeout(() => showPartnerOnboarding(), 100);
                return; // Don't proceed with normal mode switch yet
            }
            // If partner details exist, just recalculate
        }
    }

    // Trigger recalculation if engine is available (non-wizard mode)
    if (typeof updateDynamicUI === 'function') {
        updateDynamicUI();
    }

    updateWizardProgress();
    validateStep(); // Ensures next button unlocks properly once selected
}

let partnerWizIndex = 0;
const partnerWizSteps = [0, 1, 2, 3];

function showPartnerOnboarding() {
    partnerWizIndex = 0;
    const modal = document.getElementById('partner-onboarding-modal');
    if (modal) {
        modal.classList.add('active');
        renderPartnerWizardProgress();
        attachPartnerValidationListeners();
        showPartnerStep(0);
    }
}

function closePartnerOnboarding(revertToSingle = true) {
    const modal = document.getElementById('partner-onboarding-modal');
    if (modal) {
        modal.classList.remove('active');
    }
    // Reset form when closing
    resetPartnerOnboardingForm();

    if (revertToSingle) {
        // Revert to single mode if closed without completing
        const sideSingle = document.getElementById('side_single');
        if (sideSingle) sideSingle.checked = true;
        currentMode = 'single';
        const modeSingle = document.getElementById('w-mode-single');
        const modeCouple = document.getElementById('w-mode-couple');
        if(modeSingle) { modeSingle.classList.add('active'); modeSingle.setAttribute('aria-pressed', 'true'); }
        if(modeCouple) { modeCouple.classList.remove('active'); modeCouple.setAttribute('aria-pressed', 'false'); }
        document.querySelectorAll('.partner-toggle-wrapper').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.show-partner').forEach(el => el.classList.add('is-hidden'));
        if (typeof handleInputChanged === 'function') {
            handleInputChanged();
        } else if (typeof updateDynamicUI === 'function') {
            updateDynamicUI();
        }
    }
}

function resetPartnerOnboardingForm() {
    document.getElementById('partner-age').value = '';
    document.getElementById('partner-salary').value = '';
    document.querySelectorAll('input[name="partner-has-sl"]').forEach(el => el.checked = false);
    document.querySelectorAll('input[name="partner-has-pension"]').forEach(el => el.checked = false);
    document.getElementById('partner-sl-plan').value = '';
    document.getElementById('partner-sl-balance').value = '';
    document.getElementById('partner-pension-balance').value = '';
    document.getElementById('partner-pee').value = '';
    document.getElementById('partner-per').value = '';
    document.getElementById('partner-sl-details').style.display = 'none';
    document.getElementById('partner-pension-details').style.display = 'none';
}

function renderPartnerWizardProgress() {
    const container = document.getElementById('partner-wizard-progress-container');
    if (!container) return;
    container.innerHTML = '';

    partnerWizSteps.forEach((stepNum, idx) => {
        const dot = document.createElement('div');
        dot.className = 'progress-dot' + (idx === partnerWizIndex ? ' active' : '');
        container.appendChild(dot);
    });
}

function showPartnerStep(stepNum) {
    // Hide all steps
    document.querySelectorAll('#partner-onboarding-modal .wizard-step').forEach(el => {
        el.classList.remove('active');
    });
    // Show current step
    const currentStep = document.getElementById(`partner-step-${stepNum}`);
    if (currentStep) currentStep.classList.add('active');

    // Update buttons
    const backBtn = document.getElementById('partner-back-btn');
    const nextBtn = document.getElementById('partner-next-btn');
    if (backBtn) backBtn.style.visibility = stepNum > 0 ? 'visible' : 'hidden';
    if (nextBtn) nextBtn.textContent = stepNum === 3 ? 'Finish' : 'Next';

    // Reset button state and validate
    validatePartnerStep();

    // Focus first input
    focusFirstPartnerField(stepNum);
}

function focusFirstPartnerField(stepNum) {
    const stepEl = document.getElementById(`partner-step-${stepNum}`);
    if (!stepEl) return;
    const candidates = stepEl.querySelectorAll('input, select');
    for (const el of candidates) {
        if (el.disabled || el.type === 'hidden') continue;
        if (el.offsetParent === null) continue;
        el.focus();
        break;
    }
}

function attachPartnerValidationListeners() {
    // Attach listeners to partner age field
    const ageField = document.getElementById('partner-age');
    if (ageField) {
        ageField.addEventListener('input', validatePartnerStep);
        ageField.addEventListener('change', validatePartnerStep);
    }

    // Attach listeners to partner salary field
    const salaryField = document.getElementById('partner-salary');
    if (salaryField) {
        salaryField.addEventListener('input', validatePartnerStep);
        salaryField.addEventListener('change', validatePartnerStep);
    }

    // Attach listeners to student loan radio buttons
    const slRadios = document.querySelectorAll('input[name="partner-has-sl"]');
    slRadios.forEach(radio => {
        radio.addEventListener('change', validatePartnerStep);
    });

    // Attach listeners to student loan details
    const slBalance = document.getElementById('partner-sl-balance');
    if (slBalance) {
        slBalance.addEventListener('input', validatePartnerStep);
        slBalance.addEventListener('change', validatePartnerStep);
    }

    const slPlan = document.getElementById('partner-sl-plan');
    if (slPlan) {
        slPlan.addEventListener('change', validatePartnerStep);
    }

    // Attach listeners to pension radio buttons
    const penRadios = document.querySelectorAll('input[name="partner-has-pension"]');
    penRadios.forEach(radio => {
        radio.addEventListener('change', validatePartnerStep);
    });

    // Attach listeners to pension details
    const penBalance = document.getElementById('partner-pension-balance');
    if (penBalance) {
        penBalance.addEventListener('input', validatePartnerStep);
        penBalance.addEventListener('change', validatePartnerStep);
    }

    const penContrib = document.getElementById('partner-pee');
    if (penContrib) {
        penContrib.addEventListener('input', validatePartnerStep);
        penContrib.addEventListener('change', validatePartnerStep);
    }

    const penEmp = document.getElementById('partner-per');
    if (penEmp) {
        penEmp.addEventListener('input', validatePartnerStep);
        penEmp.addEventListener('change', validatePartnerStep);
    }
}

function togglePartnerSL() {
    const hasSL = document.querySelector('input[name="partner-has-sl"]:checked')?.value;
    const slDetails = document.getElementById('partner-sl-details');
    if (slDetails) {
        slDetails.style.display = hasSL === 'Yes' ? 'block' : 'none';
    }
    validatePartnerStep();
}

function togglePartnerPen() {
    const hasPension = document.querySelector('input[name="partner-has-pension"]:checked')?.value;
    const pensionDetails = document.getElementById('partner-pension-details');
    if (pensionDetails) {
        pensionDetails.style.display = hasPension === 'Yes' ? 'block' : 'none';
    }
    validatePartnerStep();
    // Focus first field if showing details
    if (hasPension === 'Yes') {
        setTimeout(() => {
            const firstField = document.getElementById('partner-pension-balance');
            if (firstField) firstField.focus();
        }, 100);
    }
}

function validatePartnerStep() {
    const step = partnerWizSteps[partnerWizIndex];
    let isValid = false;

    if (step === 0) {
        const age = document.getElementById('partner-age')?.value;
        isValid = age && String(age).trim() !== '';
    } else if (step === 1) {
        const salary = document.getElementById('partner-salary')?.value;
        isValid = salary && String(salary).trim() !== '';
    } else if (step === 2) {
        const hasSL = document.querySelector('input[name="partner-has-sl"]:checked')?.value;
        isValid = hasSL !== undefined && hasSL !== null && hasSL !== '';
        if (isValid && hasSL === 'Yes') {
            const plan = document.getElementById('partner-sl-plan')?.value;
            const balance = document.getElementById('partner-sl-balance')?.value;
            isValid = (plan && String(plan).trim() !== '') && (balance && String(balance).trim() !== '');
        }
    } else if (step === 3) {
        const hasPension = document.querySelector('input[name="partner-has-pension"]:checked')?.value;
        isValid = hasPension !== undefined && hasPension !== null && hasPension !== '';
    }

    const nextBtn = document.getElementById('partner-next-btn');
    if (nextBtn) {
        nextBtn.disabled = !isValid;
        if (isValid) {
            nextBtn.style.opacity = '1';
            nextBtn.style.cursor = 'pointer';
        } else {
            nextBtn.style.opacity = '0.5';
            nextBtn.style.cursor = 'not-allowed';
        }
    }
}

function partnerNextStep() {
    if (!validateCurrentPartnerStep()) return;

    if (partnerWizIndex === 3) {
        completePartnerOnboarding();
    } else {
        partnerWizIndex++;
        renderPartnerWizardProgress();
        showPartnerStep(partnerWizIndex);
    }
}

function partnerPrevStep() {
    if (partnerWizIndex > 0) {
        partnerWizIndex--;
        renderPartnerWizardProgress();
        showPartnerStep(partnerWizIndex);
    }
}

function validateCurrentPartnerStep() {
    const step = partnerWizSteps[partnerWizIndex];

    if (step === 0) {
        const age = document.getElementById('partner-age')?.value;
        if (!age || age.trim() === '') {
            alert('Please enter your partner\'s age');
            return false;
        }
    } else if (step === 1) {
        const salary = document.getElementById('partner-salary')?.value;
        if (!salary || salary.trim() === '') {
            alert('Please enter your partner\'s salary');
            return false;
        }
    } else if (step === 2) {
        const hasSL = document.querySelector('input[name="partner-has-sl"]:checked')?.value;
        if (!hasSL) {
            alert('Please select Yes or No for student loan');
            return false;
        }
        if (hasSL === 'Yes') {
            const plan = document.getElementById('partner-sl-plan')?.value;
            const balance = document.getElementById('partner-sl-balance')?.value;
            if (!plan || plan.trim() === '') {
                alert('Please select a loan plan');
                return false;
            }
            if (!balance || balance.trim() === '') {
                alert('Please enter the loan balance');
                return false;
            }
        }
    } else if (step === 3) {
        const hasPension = document.querySelector('input[name="partner-has-pension"]:checked')?.value;
        if (!hasPension) {
            alert('Please select Yes or No for pension');
            return false;
        }
    }

    return true;
}

function completePartnerOnboarding() {
    // Copy values to main form
    const age2 = document.getElementById('partner-age')?.value;
    const sal2 = document.getElementById('partner-salary')?.value;

    document.getElementById('s_age2').value = age2;
    document.getElementById('s_sal2').value = sal2;

    // Student loan info
    const hasSL = document.querySelector('input[name="partner-has-sl"]:checked')?.value;
    const slYesRadio = document.getElementById('s_has_sl2_y');
    const slNoRadio = document.getElementById('s_has_sl2_n');
    if (hasSL === 'Yes') {
        if (slYesRadio) slYesRadio.checked = true;
        const slPlan = document.getElementById('partner-sl-plan')?.value;
        const slBalance = document.getElementById('partner-sl-balance')?.value;
        document.getElementById('s_slp2').value = slPlan;
        document.getElementById('s_sl2').value = slBalance;
    } else if (hasSL === 'No') {
        if (slNoRadio) slNoRadio.checked = true;
    }

    // Pension info
    const hasPension = document.querySelector('input[name="partner-has-pension"]:checked')?.value;
    const penYesRadio = document.getElementById('s_has_pen2_y');
    const penNoRadio = document.getElementById('s_has_pen2_n');
    if (hasPension === 'Yes') {
        if (penYesRadio) penYesRadio.checked = true;
        const pensionBalance = document.getElementById('partner-pension-balance')?.value;
        const pensionContrib = document.getElementById('partner-pee')?.value;
        const pensionEmp = document.getElementById('partner-per')?.value;
        if (pensionBalance) document.getElementById('s_pval2').value = pensionBalance;
        if (pensionContrib) document.getElementById('s_pee2').value = pensionContrib;
        if (pensionEmp) document.getElementById('s_per2').value = pensionEmp;
    } else if (hasPension === 'No') {
        if (penNoRadio) penNoRadio.checked = true;
    }

    closePartnerOnboarding(false);

    // Trigger full recalculation
    if (typeof handleInputChanged === 'function') {
        handleInputChanged();
    } else if (typeof updateDynamicUI === 'function') {
        updateDynamicUI();
    }
}

function focusFirstWizardField(stepNum) {
    const stepEl = document.getElementById(`step-${stepNum}`);
    if (!stepEl) return;
    if (stepNum === 0) {
        const card = stepEl.querySelector('.mode-card.active') || stepEl.querySelector('.mode-card');
        if (card) card.focus();
        return;
    }
    const candidates = stepEl.querySelectorAll('input, select');
    for (const el of candidates) {
        if (el.disabled || el.type === 'hidden') continue;
        if (el.offsetParent === null) continue; // hidden by a display:none ancestor
        el.focus();
        break;
    }
}

function attachWizardValidationListeners() {
    // Attach blur listeners to validate when user leaves a field
    const wizardInputs = document.querySelectorAll('.wizard-step input[type="text"], .wizard-step input[type="number"], .wizard-step select');
    wizardInputs.forEach(input => {
        // Remove old listeners
        input.removeEventListener('input', validateStep);
        input.removeEventListener('change', validateStep);
        input.removeEventListener('blur', validateFieldOnBlur);
        input.removeEventListener('focus', clearFieldError);

        // Add new listeners
        input.addEventListener('blur', validateFieldOnBlur);
        // Don't clear errors on focus - let validation control error display
        // Only clear if user starts typing
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });

    // Update Next button click to validate before advancing
    const nextBtn = document.getElementById('wiz-next');
    if (nextBtn) {
        nextBtn.removeEventListener('click', wizardStepNextClick);
        nextBtn.addEventListener('click', wizardStepNextClick);
    }

    // Attach Back button click handler
    const backBtn = document.getElementById('wiz-back');
    if (backBtn) {
        backBtn.removeEventListener('click', () => wizardStep(-1));
        backBtn.addEventListener('click', () => wizardStep(-1));
    }
}

function validateFieldOnBlur(e) {
    const input = e.target;
    const step = stepSequence[currentWizIndex];
    const currentStepEl = document.getElementById(`step-${step}`);
    if (!currentStepEl) return;

    // Determine what validation to apply based on field ID
    const fieldId = input.id;
    let isValid = true;
    let errorMsg = 'This field is required.';
    const isCouple = currentMode === 'couple';

    // Check if this is a required field (must be > 0)
    const requiredFields = [
        'w_age1', 'w_age2', 'w_ret1', 'w_sal1', 'w_sal2',
        'w_sl1', 'w_sl2', 'w_cash', 'w_ex_pre', 'w_ex_post'
    ];

    const optionalFields = ['w_pval1', 'w_pval2', 'w_pee1', 'w_pee2', 'w_per1', 'w_per2'];

    // Determine the right error message based on field type
    const ageFields = ['w_age1', 'w_age2', 'w_ret1'];
    const currencyFields = ['w_sal1', 'w_sal2', 'w_sl1', 'w_sl2', 'w_cash', 'w_ex_pre', 'w_ex_post'];

    if (optionalFields.includes(fieldId)) {
        // Optional fields always pass validation
        isValid = true;
    } else if (requiredFields.includes(fieldId)) {
        isValid = validateWizardFieldValue(input, true);
        if (ageFields.includes(fieldId)) {
            errorMsg = 'Enter a value greater than 0.';
        } else {
            errorMsg = 'Enter an amount greater than £0.';
        }
    } else {
        // Default validation for other fields
        isValid = validateWizardFieldValue(input, false);
    }

    setFieldValidity(input, isValid, errorMsg);
}

function wizardStepNextClick() {
    if (validateStepBeforeAdvance()) {
        wizardStep(1);
    }
}

function openWizard(origin = 'external') {
    wizardOrigin = origin; // Track where wizard was opened from ('external' or 'internal')
    currentWizIndex = 0;

    // Set mode to 'single' by default, which also sets up the UI correctly
    setMode('single');

    // Clear all error messages from all wizard steps on initial load
    document.querySelectorAll('.wizard-step').forEach(stepEl => {
        stepEl.querySelectorAll('.field-error-text').forEach(el => {
            el.remove(); // Actually remove the error elements
        });
        stepEl.querySelectorAll('.input-wrapper, .toggle-container').forEach(el => {
            el.classList.remove('has-error');
        });
        stepEl.classList.remove('active');
    });

    let step0 = document.getElementById('step-0');
    if(step0) step0.classList.add('active');
    let wizBack = document.getElementById('wiz-back');
    if(wizBack) wizBack.style.visibility = 'hidden';
    let wizNext = document.getElementById('wiz-next');
    if(wizNext) wizNext.innerText = "Next";

    attachWizardValidationListeners();
    updateWizardProgress();
    validateStep();

    let wizardOverlay = document.getElementById('wizard-overlay');
    if(wizardOverlay) wizardOverlay.classList.add('active');
    let wizScroll = document.getElementById('wiz-scroll');
    if(wizScroll) wizScroll.scrollTop = 0;
    focusFirstWizardField(0);
}

function wizardStep(dir) {
    let prevStep = stepSequence[currentWizIndex];
    let prevEl = document.getElementById(`step-${prevStep}`);
    if (prevEl) prevEl.classList.remove('active');

    currentWizIndex += dir;
    if (currentWizIndex < 0) currentWizIndex = 0;

    if (currentWizIndex >= stepSequence.length) {
        try { saveWizardAndClose(); } catch(e) {
            let wizardOverlay = document.getElementById('wizard-overlay');
            if(wizardOverlay) wizardOverlay.classList.remove('active');
        }
        return;
    }

    let nextStep = stepSequence[currentWizIndex];
    let nextEl = document.getElementById(`step-${nextStep}`);
    if (nextEl) {
        // Clear all error messages on the new step by removing error elements and has-error class
        nextEl.querySelectorAll('.field-error-text').forEach(el => {
            el.remove(); // Actually remove the element instead of just hiding
        });
        nextEl.querySelectorAll('.input-wrapper, .toggle-container').forEach(el => {
            el.classList.remove('has-error');
        });
        nextEl.classList.add('active');
    }

    let scrollEl = document.getElementById('wiz-scroll');
    if (scrollEl) scrollEl.scrollTop = 0;

    let wizBack = document.getElementById('wiz-back');
    if(wizBack) wizBack.style.visibility = currentWizIndex === 0 ? 'hidden' : 'visible';
    let wizNext = document.getElementById('wiz-next');
    if(wizNext) wizNext.innerText = currentWizIndex === stepSequence.length - 1 ? "Finish" : "Next";

    updateWizardProgress();
    validateStep();
    focusFirstWizardField(nextStep);
}

function closeWizard() {
    let wizardOverlay = document.getElementById('wizard-overlay');
    if(wizardOverlay) wizardOverlay.classList.remove('active');

    // Handle different close scenarios
    if (wizardOrigin === 'internal') {
        // Wizard opened from "Start over" - stay on page and restore saved state
        restoreCalculatorState();
        forceCalculation();
    } else if (wizardOrigin === 'external') {
        // Wizard opened from external page - navigate back
        window.history.back();
    } else {
        // Default behavior - just close the wizard and show calculator
        forceCalculation();
    }

    // Reset wizardOrigin for next time
    wizardOrigin = null;
}


function saveWizardAndClose() {
    try {
        if (!currentMode) setMode('couple'); 
        const map = [
            ['w_age1','s_age1'], ['w_age2','s_age2'], ['w_ret1','s_ret1'],
            ['w_sal1','s_sal1'], ['w_sal2','s_sal2'], ['w_cash','s_cash'],
            ['w_pval1','s_pval1'], ['w_pval2','s_pval2'], ['w_pee1','s_pee1'],
            ['w_pee2','s_pee2'], ['w_per1','s_per1'], ['w_per2','s_per2'],
            ['w_sl1','s_sl1'], ['w_sl2','s_sl2'], ['w_slp1','s_slp1'], ['w_slp2','s_slp2'],
            ['w_rent','s_rent'], ['w_ex_pre','s_ex_pre'], ['w_hp','s_hp'], ['w_spare_pension','s_save_pen']
        ];
        map.forEach(pair => {
            let el1 = document.getElementById(pair[0]);
            let el2 = document.getElementById(pair[1]);
            if (el1 && el2 && el1.value) el2.value = el1.value;
        });

        let w_ex_post = document.getElementById('w_ex_post');
        let s_ex_post = document.getElementById('s_ex_post');
        if (w_ex_post && s_ex_post && w_ex_post.value) s_ex_post.value = w_ex_post.value;
        
        let w_hp = document.getElementById('w_hp');
        if (w_hp && w_hp.value) {
            let hpStr = w_hp.value.replace(/,/g, '').replace(/£/g, '');
            let hpVal = parseFloat(hpStr) || 0;
            let s_maint = document.getElementById('s_maint');
            if(s_maint) s_maint.value = (hpVal * 0.01).toLocaleString('en-GB'); 
        }

        let s_fees = document.getElementById('s_fees');
        if(s_fees && !s_fees.value) s_fees.value = "5,000";

        let s_sp1 = document.getElementById('s_sp1');
        if(s_sp1 && !s_sp1.value) s_sp1.value = "12,000";
        let s_sp2 = document.getElementById('s_sp2');
        if(s_sp2 && !s_sp2.value) s_sp2.value = "12,000";
        
        let s_tfc1 = document.getElementById('s_tfc1');
        if(s_tfc1 && !s_tfc1.value) s_tfc1.value = "No";
        let s_tfc2 = document.getElementById('s_tfc2');
        if(s_tfc2 && !s_tfc2.value) s_tfc2.value = "No";
        
        let s_save_pen = document.getElementById('s_save_pen');
        if(s_save_pen && !s_save_pen.value) s_save_pen.value = "0";

        const hasPen1Node = document.querySelector('input[name="w_has_pen1"]:checked');
        if(!hasPen1Node || hasPen1Node.value !== 'Yes') {
            let pval1 = document.getElementById('s_pval1'); if(pval1 && !pval1.value) pval1.value = "0";
            let pee1 = document.getElementById('s_pee1'); if(pee1 && !pee1.value) pee1.value = "0";
            let per1 = document.getElementById('s_per1'); if(per1 && !per1.value) per1.value = "0";
        }
        
        const hasPen2Node = document.querySelector('input[name="w_has_pen2"]:checked');
        if(!hasPen2Node || hasPen2Node.value !== 'Yes') {
            let pval2 = document.getElementById('s_pval2'); if(pval2 && !pval2.value) pval2.value = "0";
            let pee2 = document.getElementById('s_pee2'); if(pee2 && !pee2.value) pee2.value = "0";
            let per2 = document.getElementById('s_per2'); if(per2 && !per2.value) per2.value = "0";
        }

        const syncRadio = (name, idPrefix) => {
            let node = document.querySelector(`input[name="${name}"]:checked`);
            if(node) {
                let target = document.getElementById(node.value === 'Yes' ? `${idPrefix}_y` : `${idPrefix}_n`);
                if(target) target.checked = true;
            }
        };
        syncRadio('w_has_sl1', 's_has_sl1');
        syncRadio('w_has_sl2', 's_has_sl2');
        syncRadio('w_has_pen1', 's_has_pen1');
        syncRadio('w_has_pen2', 's_has_pen2');
        syncRadio('w_ftb', 's_ftb');

        toggleSL();
        togglePen();
        updateDynamicUI();
        
        let overlay = document.getElementById('wizard-overlay');
        if(overlay) overlay.classList.remove('active');
        
        // The compare switch is enabled by runCalculation() below, but only once
        // every required field has actually been filled in.
        runCalculation();
    } catch(e) {
        let overlay = document.getElementById('wizard-overlay');
        if(overlay) overlay.classList.remove('active');
    }
}

function openSettings() { 
    const settingsInputs = document.querySelectorAll('#settings-overlay input');
    settingsInputs.forEach(input => {
        savedSettings[input.id] = (input.type === 'checkbox' || input.type === 'radio') ? input.checked : input.value;
    });
    const settingsOverlay = document.getElementById('settings-overlay');
    if(settingsOverlay) settingsOverlay.classList.add('active'); 
}

function cancelSettings() { 
    const settingsInputs = document.querySelectorAll('#settings-overlay input');
    settingsInputs.forEach(input => {
        if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = savedSettings[input.id];
        } else {
            input.value = savedSettings[input.id];
        }
    });
    const settingsOverlay = document.getElementById('settings-overlay');
    if(settingsOverlay) settingsOverlay.classList.remove('active'); 
}

function saveSettings() {
    const settingsOverlay = document.getElementById('settings-overlay');
    if(settingsOverlay) settingsOverlay.classList.remove('active');
    handleInputChanged(); 
}

window.addEventListener('load', function() {
    // Hide the "Your changes" tab initially (only show when compare mode is active)
    const changesTab = document.getElementById('tab-changes');
    if(changesTab) changesTab.style.display = 'none';

    const sidebarInputs = document.querySelectorAll('.sidebar input, .sidebar select');
    sidebarInputs.forEach(input => {
        input.addEventListener('input', handleInputChanged);
    });

    // Check if skipWizard parameter is passed via sample input button
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('skipWizard') === 'true') {
        const overlay = document.getElementById('wizard-overlay');
        if (overlay) overlay.classList.remove('active');

        // Set default sample values
        const defaults = {
            's_age1': '29',
            's_age2': '31',
            's_ret1': '68',
            's_sal1': '42000',
            's_sal2': '42000',
            's_hp': '400000',
            's_rent': '1000',
            's_ex_pre': '1500',
            's_ex_post': '1200',
            's_cash': '15000',
            's_maint': '4000',
            's_fees': '5000',
            's_has_sl1_n': true,
            's_has_sl2_n': true,
            's_has_pen1_y': true,
            's_has_pen2_y': true,
            's_pval1': '25000',
            's_pval2': '25000',
            's_pee1': '5',
            's_pee2': '5',
            's_per1': '3',
            's_per2': '3',
            's_sp1': '12000',
            's_sp2': '12000',
            's_tfc1': 'No',
            's_tfc2': 'No',
            's_ftb_y': true,
            's_slp1': '2',
            's_slp2': '2'
        };

        for (const [id, value] of Object.entries(defaults)) {
            const el = document.getElementById(id);
            if (el) {
                if (el.type === 'radio' || el.type === 'checkbox') {
                    el.checked = value === true;
                } else {
                    el.value = value;
                }
            }
        }

        // Apply comma formatting to currency inputs
        document.querySelectorAll('.comma-format').forEach(el => {
            if (el.value && !isNaN(el.value)) {
                el.value = parseFloat(el.value).toLocaleString('en-GB');
            }
        });

        setMode('couple');
        toggleSL();
        togglePen();
        updateDynamicUI();
        forceCalculation();
    } else {
        openWizard();
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { runCalculation() }, 200);
    });
});

function handleInputChanged() {
    const wizardOverlay = document.getElementById('wizard-overlay');
    if(wizardOverlay && wizardOverlay.classList.contains('active')) return;
    const resultsPane = document.getElementById('results-pane');
    if(resultsPane) resultsPane.classList.add('stale');
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => { runCalculation(); }, 400); 
}

function forceCalculation() {
    clearTimeout(debounceTimer);
    runCalculation();
}

function setFieldValidity(inputEl, isValid, message) {
    if (!inputEl) return;
    const wrapper = inputEl.closest('.input-wrapper') || inputEl.closest('.toggle-container');
    if (!wrapper) return;
    const row = wrapper.closest('.input-row-single') || wrapper.parentElement;
    let errEl = row.querySelector('.field-error-text');
    if (!errEl) {
        errEl = document.createElement('div');
        errEl.className = 'field-error-text';
        wrapper.insertAdjacentElement('afterend', errEl);
    }
    if (isValid) {
        wrapper.classList.remove('has-error');
        errEl.classList.remove('visible');
    } else {
        wrapper.classList.add('has-error');
        errEl.textContent = message || 'This field is required.';
        errEl.classList.add('visible');
    }
}

function validateRequiredFields() {
    // Don't validate main page fields if wizard is open
    const wizardOverlay = document.getElementById('wizard-overlay');
    if (wizardOverlay && wizardOverlay.classList.contains('active')) {
        return [];
    }

    const isCouple = currentMode === 'couple';
    const missing = [];

    const checkNumber = (id, mustBePositive) => {
        const el = document.getElementById(id);
        if (!el) return true;
        const raw = String(el.value || '').replace(/,/g, '').trim();
        const ok = mustBePositive ? (raw !== '' && parseFloat(raw) > 0) : raw !== '';
        setFieldValidity(el, ok, mustBePositive ? 'Enter an amount greater than £0.' : 'This field is required.');
        if (!ok) missing.push(id);
        return ok;
    };

    const checkRadio = (name) => {
        const anyRadio = document.querySelector(`input[name="${name}"]`);
        const checkedEl = document.querySelector(`input[name="${name}"]:checked`);
        setFieldValidity(anyRadio, !!checkedEl, 'Please make a selection.');
        if (!checkedEl) missing.push(name);
        return checkedEl;
    };

    const checkSelect = (id) => {
        const el = document.getElementById(id);
        if (!el) return true;
        const ok = el.value !== '';
        setFieldValidity(el, ok, 'Please make a selection.');
        if (!ok) missing.push(id);
        return ok;
    };

    const clearField = (id) => setFieldValidity(document.getElementById(id), true);
    const clearRadio = (name) => setFieldValidity(document.querySelector(`input[name="${name}"]`), true);

    checkNumber('s_hp', true);
    checkRadio('s_ftb');
    checkNumber('s_ex_pre', false);
    checkNumber('s_ex_post', false);
    checkNumber('s_age1', false);
    checkNumber('s_ret1', false);
    checkNumber('s_sal1', false);

    const sl1 = checkRadio('s_has_sl1');
    if (sl1 && sl1.value === 'Yes') {
        checkNumber('s_sl1', false);
        checkSelect('s_slp1');
    } else {
        clearField('s_sl1');
        clearField('s_slp1');
    }

    checkRadio('s_has_pen1');

    if (isCouple) {
        checkNumber('s_age2', false);
        checkNumber('s_sal2', false);
        const sl2 = checkRadio('s_has_sl2');
        if (sl2 && sl2.value === 'Yes') {
            checkNumber('s_sl2', false);
            checkSelect('s_slp2');
        } else {
            clearField('s_sl2');
            clearField('s_slp2');
        }
        checkRadio('s_has_pen2');
    } else {
        clearField('s_age2');
        clearField('s_sal2');
        clearField('s_sl2');
        clearField('s_slp2');
        clearRadio('s_has_sl2');
        clearRadio('s_has_pen2');
    }

    return missing;
}

const INCOMPLETE_DATA_MESSAGE = 'Fill in the highlighted fields on the left to see your results.';

// Enables/disables the "Compare a scenario" switch (desktop and mobile) so a
// comparison can only be started once every required input has been supplied.
function updateCompareAvailability(isComplete) {
    const desktopSwitch = document.getElementById('compare-switch');
    const mobileSwitch = document.getElementById('compare-switch-mob');

    // Never lock the user out of a comparison they have already started.
    if (!isComplete && desktopSwitch && desktopSwitch.checked) return;

    [desktopSwitch, mobileSwitch].forEach(el => {
        if (el) el.disabled = !isComplete;
    });

    const tooltip = isComplete ? '' : 'Fill in all the required fields to compare a scenario';
    ['compare-toggle-desktop', 'compare-toggle-mobile'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.toggle('is-disabled', !isComplete);
        if (tooltip) el.setAttribute('title', tooltip);
        else el.removeAttribute('title');
    });
}

// Hides the projections chart/table while required inputs are missing and shows
// the same message used on the Overview and Property details tabs.
function updateProjectionsOverlay(state) {
    const blockedMsg = document.getElementById('proj-blocked-msg');
    const mainWrapper = document.getElementById('proj-main-wrapper');
    const controlsRow = document.getElementById('projections-controls-row');
    const isBlocked = state === 'blocked';

    if (blockedMsg) {
        blockedMsg.textContent = INCOMPLETE_DATA_MESSAGE;
        blockedMsg.style.display = isBlocked ? 'flex' : 'none';
    }
    if (mainWrapper) mainWrapper.style.display = isBlocked ? 'none' : 'flex';
    if (controlsRow) controlsRow.style.display = isBlocked ? 'none' : '';
}

function updateResultsOverlay(state) {
    const zones = ['hero', 'timing', 'wealth', 'prop-cost', 'prop-funding'];
    const messages = {
        blocked: INCOMPLETE_DATA_MESSAGE,
        empty: 'This matches your original scenario. Change something on the left to see the effect.'
    };

    updateProjectionsOverlay(state);

    zones.forEach(key => {
        const activeEl = document.getElementById(`active-${key}`);
        if (!activeEl) return;
        let ph = activeEl.querySelector('.results-placeholder');
        if (!ph) {
            ph = document.createElement('div');
            ph.className = 'results-placeholder baseline-placeholder is-hidden';
            activeEl.insertBefore(ph, activeEl.firstChild);
        }
        const realChildren = Array.from(activeEl.children).filter(c => c !== ph);
        if (state === 'normal') {
            ph.classList.add('is-hidden');
            realChildren.forEach(c => c.classList.remove('is-hidden'));
        } else {
            ph.textContent = messages[state];
            ph.classList.remove('is-hidden');
            realChildren.forEach(c => c.classList.add('is-hidden'));
        }
    });

    if (state === 'blocked') {
        setPropertyAffordability(true);
        setWealthAffordability(true);
    }
}

// Switches the Property details tab between the affordable breakdown and the
// "not affordable" message. CSS decides whether that message is shown once
// (single scenario) or per column (compare mode), so both columns survive.
function setPropertyAffordability(isAffordable) {
    const propCard = document.getElementById('prop-card');
    if (propCard) propCard.classList.toggle('is-unaffordable', !isAffordable);

    ['active-prop-cost', 'active-prop-funding'].forEach(id => {
        const container = document.getElementById(id);
        if (!container) return;
        const realPanel = container.querySelector('.prop-panel:not(.prop-panel-empty)');
        const emptyPanel = container.querySelector('.prop-panel-empty');
        if (realPanel) realPanel.style.display = isAffordable ? 'flex' : 'none';
        if (emptyPanel) emptyPanel.style.display = isAffordable ? 'none' : 'flex';
    });
}

// There is no buying outcome to compare when the home can't be bought, so the
// wealth bars are replaced with an explanation rather than two matching totals.
function setWealthAffordability(isAffordable) {
    const barsCard = document.getElementById('wealth-bars-card');
    const emptyCard = document.getElementById('wealth-empty-card');
    if (barsCard) barsCard.style.display = isAffordable ? 'flex' : 'none';
    if (emptyCard) emptyCard.style.display = isAffordable ? 'none' : 'flex';
}

function runCalculation() {
    if (typeof globalParams === 'undefined') { return; }

    // Skip calculation if wizard is open
    const wizardOverlay = document.getElementById('wizard-overlay');
    if (wizardOverlay && wizardOverlay.classList.contains('active')) {
        return;
    }

    const missingFields = validateRequiredFields();
    checkCompareModifications();

    updateCompareAvailability(missingFields.length === 0);

    if (missingFields.length > 0) {
        const resultsPane = document.getElementById('results-pane');
        if(resultsPane) resultsPane.classList.remove('stale');
        updateResultsOverlay('blocked');
        return;
    }

    const inputs = gatherEngineInputs();
    let engine, results;
    
    try {
        engine = new ActuarialEngine(inputs, globalParams);
        results = engine.runFullProjection();
    } catch(e) { return; }

    const resultsPane = document.getElementById('results-pane');
    if(resultsPane) resultsPane.classList.remove('stale');
    
    const heroContainer = document.getElementById('hero-card-container');
    const timingContainer = document.getElementById('timing-card-container');

    const planEnd = getVal('set_end');
    const startAge = getVal('s_age1');
    let targetTerm = planEnd - startAge;
    if (targetTerm < 0) targetTerm = 0;
    
    const maxIdx = Math.min(targetTerm + 1, results.labels.length);
    const buyEndVal = results.buyWealth[maxIdx - 1] || 0;
    const rentEndVal = results.rentWealth[maxIdx - 1] || 0;
    let benefit = buyEndVal - rentEndVal;

    const canBuyBeforeRetirement = results.purchaseAge !== null && results.purchaseAge < inputs.Case_Life_1_Retirement_age;

    if (!canBuyBeforeRetirement) {
        if(heroContainer) heroContainer.innerHTML = heroTemplates.unaffordable(`£${getVal('s_hp').toLocaleString('en-GB')}`);
    } else if (benefit > 100) {
        if(heroContainer) heroContainer.innerHTML = heroTemplates.buy(formatSigFigDown(benefit));
    } else if (benefit < -100) {
        if(heroContainer) heroContainer.innerHTML = heroTemplates.rent(formatSigFigDown(Math.abs(benefit)));
    } else {
        if(heroContainer) heroContainer.innerHTML = heroTemplates.tie();
    }

    let purcTerm = canBuyBeforeRetirement ? results.purchaseAge - inputs.Case_Life_1_Current_age : -1;

    if (purcTerm >= 0) {
        const currentYear = new Date().getFullYear();
        const purchaseYear = currentYear + purcTerm;
        const age1AtPurc = inputs.Case_Life_1_Current_age + purcTerm;
        let titleText = `On track to buy around age ${age1AtPurc}`;
        let descText = `This home could become affordable around <strong>${purchaseYear}</strong>.`;

        if (currentMode === 'couple') {
            const age2AtPurc = (getVal('s_age2') || getVal('s_age1')) + purcTerm;
            titleText = `On track to buy around age ${age1AtPurc}`;
            descText = `This home could become affordable around <strong>${purchaseYear}</strong>, when your partner is around <strong>${age2AtPurc}</strong>.`;
        }
        if(timingContainer) { timingContainer.innerHTML = timingTemplate(titleText, descText); timingContainer.style.display = 'flex'; }
    } else {
        if(timingContainer) { timingContainer.innerHTML = timingUnaffordableTemplate(`Based on your current deposit and income, this home looks unlikely to be affordable before retirement.`); timingContainer.style.display = 'flex'; }
    }

    let maxW = Math.max(buyEndVal, rentEndVal, 1);
    const uiBuyWealth = document.getElementById('ui-buy-wealth');
    if(uiBuyWealth) uiBuyWealth.innerText = formatSigFigDown(buyEndVal);
    const uiBuyBar = document.getElementById('ui-buy-bar');
    if(uiBuyBar) uiBuyBar.style.width = `${(buyEndVal / maxW) * 100}%`;
    const uiRentWealth = document.getElementById('ui-rent-wealth');
    if(uiRentWealth) uiRentWealth.innerText = formatSigFigDown(rentEndVal);
    const uiRentBar = document.getElementById('ui-rent-bar');
    if(uiRentBar) uiRentBar.style.width = `${(rentEndVal / maxW) * 100}%`;

    let benBox = document.getElementById('ui-benefit-box');
    if(benBox) benBox.classList.remove('negative', 'neutral');
    let baseDelta = document.getElementById('ui-compare-delta');
    if(baseDelta) baseDelta.style.display = 'none';

    const uiBenefitVal = document.getElementById('ui-benefit-val');
    const absThreshold = 100;
    if (benefit > absThreshold) {
        if(uiBenefitVal) uiBenefitVal.innerHTML = `<strong>Buying could give ${formatSigFigDown(benefit)} more wealth</strong> compared to renting.`;
    } else if (benefit < -absThreshold) {
        if(uiBenefitVal) uiBenefitVal.innerHTML = `<strong>Renting could give ${formatSigFigDown(Math.abs(benefit))} more wealth</strong> compared to buying.`;
    } else {
        if(uiBenefitVal) uiBenefitVal.innerHTML = `Both renting and buying will give around the same wealth.`;
    }

    setPropertyAffordability(purcTerm >= 0);
    setWealthAffordability(purcTerm >= 0);

    if (purcTerm >= 0) {
        let totalCost = results.buyHouseCostEval[purcTerm] || 0;
        let houseVal = results.buyHouseVal[purcTerm] || 0;
        let fees = results.buyPurchaseFeesEval[purcTerm] || 0;
        let sdlt = Math.max(0, totalCost - houseVal - fees);
        let mortgage = results.buyMortgageEval[purcTerm] || 0;

        let houseValR = roundSigFigDown(houseVal);
        let sdltR = roundSigFigDown(sdlt);
        let feesR = roundSigFigDown(fees);
        let totalCostR = houseValR + sdltR + feesR;

        let mortgageR = roundSigFigDown(mortgage);
        let cashNeededR = Math.max(0, totalCostR - mortgageR);

        const uiPropPrice = document.getElementById('ui-prop-price');
        if(uiPropPrice) uiPropPrice.innerText = formatMoney.format(houseValR);
        const uiPropSdlt = document.getElementById('ui-prop-sdlt');
        if(uiPropSdlt) uiPropSdlt.innerText = formatMoney.format(sdltR);
        const uiPropFees = document.getElementById('ui-prop-fees');
        if(uiPropFees) uiPropFees.innerText = formatMoney.format(feesR);
        const uiPropTotal = document.getElementById('ui-prop-total');
        if(uiPropTotal) uiPropTotal.innerText = formatMoney.format(totalCostR);
        const uiPropTotalFunding = document.getElementById('ui-prop-total-funding');
        if(uiPropTotalFunding) uiPropTotalFunding.innerText = formatMoney.format(totalCostR);
        const uiLegendMort = document.getElementById('ui-legend-mort');
        if(uiLegendMort) uiLegendMort.innerText = formatMoney.format(mortgageR);
        const uiLegendCash = document.getElementById('ui-legend-cash');
        if(uiLegendCash) uiLegendCash.innerText = formatMoney.format(cashNeededR);

        let pricePct = totalCostR > 0 ? (houseValR / totalCostR) * 100 : 0;
        let sdltPct = totalCostR > 0 ? (sdltR / totalCostR) * 100 : 0;
        let feesPct = totalCostR > 0 ? (feesR / totalCostR) * 100 : 0;
        
        let costPriceBar = document.querySelector('#active-prop-cost .cost-price') || document.getElementById('ui-cost-price-bar');
        if(costPriceBar) costPriceBar.style.width = `${pricePct}%`;
        let costSdltBar = document.querySelector('#active-prop-cost .cost-sdlt') || document.getElementById('ui-cost-sdlt-bar');
        if(costSdltBar) costSdltBar.style.width = `${sdltPct}%`;
        let costFeesBar = document.querySelector('#active-prop-cost .cost-fees') || document.getElementById('ui-cost-fees-bar');
        if(costFeesBar) costFeesBar.style.width = `${feesPct}%`;

        let mortPct = totalCostR > 0 ? (mortgageR / totalCostR) * 100 : 0;
        let cashPct = totalCostR > 0 ? (cashNeededR / totalCostR) * 100 : 0;
        
        let fundMortBar = document.querySelector('#active-prop-funding .fund-mortgage') || document.getElementById('ui-fund-mort-bar');
        if(fundMortBar) fundMortBar.style.width = `${mortPct}%`;
        let fundCashBar = document.querySelector('#active-prop-funding .fund-cash') || document.getElementById('ui-fund-cash-bar');
        if(fundCashBar) fundCashBar.style.width = `${cashPct}%`;
    }

    const cLabels = results.labels.slice(0, maxIdx);
    const cBuy = results.buyWealth.slice(0, maxIdx);
    const cRent = results.rentWealth.slice(0, maxIdx);

    lastCalcData = {
        current: {
            labels: cLabels, buy: cBuy, rent: cRent,
            purchaseAge: canBuyBeforeRetirement ? results.purchaseAge : null,
            retirementAge: inputs.Case_Life_1_Retirement_age,
            maxIdx: maxIdx
        },
        baseline: null
    };

    if (isCompareMode && baselineResults) {
        let baseRetAge = parseFloat(baselineInputs['s_ret1']) || inputs.Case_Life_1_Retirement_age;
        let baseCanBuy = baselineResults.purchaseAge !== null && baselineResults.purchaseAge < baseRetAge;
        lastCalcData.baseline = {
            labels: cLabels,
            buy: baselineResults.buyWealth.slice(0, maxIdx),
            rent: baselineResults.rentWealth.slice(0, maxIdx),
            purchaseAge: baseCanBuy ? baselineResults.purchaseAge : null,
            retirementAge: baseRetAge,
            maxIdx: maxIdx
        };
    }

    renderProjectionsView(currentProjView);

    updateResultsOverlay(isCompareMode && changedInputsList.length === 0 ? 'empty' : 'normal');
}

function renderProjectionsView(viewType) {
    currentProjView = viewType || 'revised';
    if (!lastCalcData) return;

    let source = lastCalcData.current;
    if (currentProjView === 'current' && lastCalcData.baseline) {
        source = lastCalcData.baseline;
    }

    drawChartAndTable(source.labels, source.buy, source.rent, source.purchaseAge, source.retirementAge, source.maxIdx);
}
window.renderProjectionsView = renderProjectionsView;

function drawChartAndTable(labels, buyData, rentData, purchaseAge, retirementAge, maxIdx) {
    const canvas = document.getElementById('wealthChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (currentChart) currentChart.destroy();

    // Check if dark mode is enabled
    const isDarkMode = document.body.classList.contains('dark-mode');

    // Determine standardized axis scale (all £m or all £k based on max value)
    const maxValue = Math.max(
        ...buyData.map(v => Math.abs(Number(v))),
        ...rentData.map(v => Math.abs(Number(v)))
    );
    const useMillions = maxValue >= 1000000;

    // Create standardized formatter function
    const formatAxisValue = (value) => {
        if (value === 0) return '£0';
        if (useMillions) {
            return '£' + (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
        } else {
            return '£' + (value / 1000) + 'k';
        }
    };

    // Pre-generate retirement icon canvas for stable rendering
    const retirementColor = isDarkMode ? '#90caf9' : '#003a5d';
    const retirementCacheKey = retirementColor;
    if (!retirementIconCache[retirementCacheKey]) {
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = 24;
        offscreenCanvas.height = 24;
        const offCtx = offscreenCanvas.getContext('2d');

        const svgString = `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <g transform="rotate(15 12 22)">
                <path d="M12 2.5C7.58 2.5 4 6.08 4 10.5C4 10.78 4.02 11.05 4.05 11.31C4.33 12.3 5.1 13 6 13C6.9 13 7.67 12.3 7.95 11.31C8.23 12.3 9 13 9.91 13C10.82 13 11.59 12.3 11.87 11.31C11.91 11.31 11.96 11.31 12 11.31C12.04 11.31 12.09 11.31 12.13 11.31C12.41 12.3 13.18 13 14.09 13C15 13 15.77 12.3 16.05 11.31C16.33 12.3 17.1 13 18 13C18.9 13 19.67 12.3 19.95 11.31C19.98 11.05 20 10.78 20 10.5C20 6.08 16.42 2.5 12 2.5Z" fill="${retirementColor}"/>
                <path d="M11 11H13V22H11V11Z" fill="${retirementColor}"/>
            </g>
        </svg>`;

        const img = new Image();
        img.onload = function() {
            offCtx.drawImage(img, 0, 0);
            retirementIconCache[retirementCacheKey] = offscreenCanvas;
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
    }

    const eventMarkersPlugin = {
        id: 'eventMarkers',
        afterDatasetsDraw(chart) {
            if (!chart.chartArea) return;
            const { ctx, data, chartArea: { top, bottom }, scales: { x } } = chart;

            const drawMarker = (age, iconPath, color, isRetirement = false) => {
                if (age === null || age === undefined || age === "") return;
                const idx = data.labels.indexOf(Number(age));
                if (idx === -1) return;
                const xPos = x.getPixelForValue(idx);
                ctx.save();
                ctx.beginPath();
                ctx.setLineDash([5, 5]);
                ctx.moveTo(xPos, top + 25);
                ctx.lineTo(xPos, bottom);
                ctx.lineWidth = 2;
                ctx.strokeStyle = color;
                ctx.stroke();

                // Draw SVG icon
                ctx.restore();
                ctx.save();
                ctx.translate(xPos - 12, top - 8);

                if (isRetirement && retirementIconCache[retirementCacheKey]) {
                    // Use cached retirement icon canvas
                    ctx.drawImage(retirementIconCache[retirementCacheKey], 0, 0, 24, 24);
                } else if (!isRetirement) {
                    // Property icon uses simple path rendering
                    ctx.fillStyle = color;
                    const path = new Path2D(iconPath);
                    ctx.fill(path);
                }
                ctx.restore();
            };

            drawMarker(purchaseAge, iconPaths.property, isDarkMode ? '#90caf9' : '#003a5d', false);
            drawMarker(retirementAge, iconPaths.retirement, isDarkMode ? '#90caf9' : '#003a5d', true);
        }
    };

    // Wealth running out is the headline risk, so make the £0 line unmissable
    // and tint everything below it when the projection dips negative.
    const goesNegative = buyData.concat(rentData).some(v => Number(v) < 0);

    const negativeZonePlugin = {
        id: 'negativeZone',
        beforeDatasetsDraw(chart) {
            if (!goesNegative || !chart.chartArea) return;
            const { ctx, chartArea: { left, right, top, bottom }, scales: { y } } = chart;
            const zeroY = y.getPixelForValue(0);
            if (!isFinite(zeroY) || zeroY <= top || zeroY >= bottom) return;

            ctx.save();
            ctx.fillStyle = 'rgba(198, 40, 40, 0.08)';
            ctx.fillRect(left, zeroY, right - left, bottom - zeroY);
            ctx.beginPath();
            ctx.moveTo(left, zeroY);
            ctx.lineTo(right, zeroY);
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = 'rgba(198, 40, 40, 0.9)';
            ctx.stroke();
            ctx.restore();
        }
    };

    // Space the renting markers out so the line stays readable on long projections.
    const rentPointRadius = (ctx) => {
        const total = ctx.dataset.data.length;
        if (total === 0) return 0;
        const step = Math.max(1, Math.round(total / 14));
        const isMarker = ctx.dataIndex % step === 0 || ctx.dataIndex === total - 1;
        return isMarker ? 4 : 0;
    };

    let datasets = [
        { label: 'Total Wealth (Buying)', data: buyData, borderColor: isDarkMode ? '#90caf9' : '#003a5d', backgroundColor: 'transparent', borderWidth: 3, fill: false, tension: 0.3, pointRadius: 0, pointHoverRadius: 6 },
        { label: 'Total Wealth (Renting)', data: rentData, borderColor: '#bfa15d', backgroundColor: 'transparent', borderWidth: 3, fill: false, tension: 0.3, pointStyle: 'circle', pointRadius: rentPointRadius, pointBackgroundColor: '#bfa15d', pointBorderColor: '#ffffff', pointBorderWidth: 1.5, pointHoverRadius: 6 }
    ];

    currentChart = new Chart(ctx, {
        type: 'line',
        data: { labels: labels, datasets: datasets },
        options: {
            responsive: true, maintainAspectRatio: false, animation: { duration: 0 }, interaction: { mode: 'index', intersect: false, },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: false,
                    external: function(context) {
                        const tooltipEl = document.getElementById('chartTooltip') || (() => {
                            const div = document.createElement('div');
                            div.id = 'chartTooltip';
                            document.body.appendChild(div);
                            return div;
                        })();

                        if (context.tooltip.opacity === 0) {
                            tooltipEl.style.display = 'none';
                            return;
                        }

                        let tooltipHTML = '<div style="' +
                            'background-color: ' + (isDarkMode ? '#1a1a1a' : '#fff') + '; ' +
                            'border: 1px solid ' + (isDarkMode ? '#444' : '#ddd') + '; ' +
                            'border-radius: 8px; ' +
                            'padding: 12px 16px; ' +
                            'font-family: inherit; ' +
                            'font-size: 13px; ' +
                            'box-shadow: 0 2px 8px ' + (isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)') + '; ' +
                            '">';

                        if (context.tooltip.title && context.tooltip.title.length > 0) {
                            const hoveredAge = Number(context.tooltip.title[0]);
                            tooltipHTML += '<div style="font-weight: bold; margin-bottom: 8px; color: ' + (isDarkMode ? '#fff' : '#000') + ';">Age ' +
                                context.tooltip.title[0] + '</div>';

                            // Show event if hovering over purchase or retirement age
                            const isPurchase = hoveredAge === Number(purchaseAge) && purchaseAge !== null;
                            const isRetirement = hoveredAge === Number(retirementAge);

                            if (isPurchase && isRetirement) {
                                tooltipHTML += '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding: 8px; background: ' + (isDarkMode ? 'rgba(144, 202, 249, 0.1)' : 'rgba(0, 58, 93, 0.05)') + '; border-radius: 4px; color: ' + (isDarkMode ? '#90caf9' : '#003a5d') + ';">';
                                tooltipHTML += '<svg width="16" height="16" viewBox="0 0 24 24" fill="' + (isDarkMode ? '#90caf9' : '#003a5d') + '" style="flex-shrink: 0;"><path d="' + iconPaths.property + '"/></svg>';
                                tooltipHTML += '<strong>Purchase & Retirement</strong></div>';
                            } else if (isPurchase) {
                                tooltipHTML += '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding: 8px; background: ' + (isDarkMode ? 'rgba(144, 202, 249, 0.1)' : 'rgba(0, 58, 93, 0.05)') + '; border-radius: 4px; color: ' + (isDarkMode ? '#90caf9' : '#003a5d') + ';">';
                                tooltipHTML += '<svg width="16" height="16" viewBox="0 0 24 24" fill="' + (isDarkMode ? '#90caf9' : '#003a5d') + '" style="flex-shrink: 0;"><path d="' + iconPaths.property + '"/></svg>';
                                tooltipHTML += '<strong>Property Purchase</strong></div>';
                            } else if (isRetirement) {
                                tooltipHTML += '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding: 8px; background: ' + (isDarkMode ? 'rgba(255, 213, 79, 0.1)' : 'rgba(191, 161, 93, 0.1)') + '; border-radius: 4px; color: ' + (isDarkMode ? '#ffd54f' : '#8a733e') + ';">';
                                tooltipHTML += '<svg width="16" height="16" viewBox="0 0 24 24" fill="' + (isDarkMode ? '#ffd54f' : '#8a733e') + '" style="flex-shrink: 0;"><g transform="rotate(15 12 22)"><path d="M12 2.5C7.58 2.5 4 6.08 4 10.5C4 10.78 4.02 11.05 4.05 11.31C4.33 12.3 5.1 13 6 13C6.9 13 7.67 12.3 7.95 11.31C8.23 12.3 9 13 9.91 13C10.82 13 11.59 12.3 11.87 11.31C11.91 11.31 11.96 11.31 12 11.31C12.04 11.31 12.09 11.31 12.13 11.31C12.41 12.3 13.18 13 14.09 13C15 13 15.77 12.3 16.05 11.31C16.33 12.3 17.1 13 18 13C18.9 13 19.67 12.3 19.95 11.31C19.98 11.05 20 10.78 20 10.5C20 6.08 16.42 2.5 12 2.5Z" /><path d="M11 11H13V22H11V11Z" /></g></svg>';
                                tooltipHTML += '<strong>Retirement</strong></div>';
                            }
                        }

                        context.tooltip.body.forEach((item, index) => {
                            const isRenting = index === 1;
                            const lineColor = isRenting ? '#bfa15d' : (isDarkMode ? '#90caf9' : '#003a5d');
                            const fullText = item.lines[0];
                            let valueOnly = fullText.split(': ').pop().replace(/[£,]/g, '');
                            valueOnly = parseFloat(valueOnly.replace(/,/g, ''));
                            const roundedValue = roundTo3SigFigs(valueOnly);
                            const formattedValue = formatMoney.format(roundedValue);

                            tooltipHTML += '<div style="display: flex; align-items: center; gap: 8px; margin: 4px 0; color: ' + (isDarkMode ? '#e0e0e0' : '#333') + ';">';

                            if (isRenting) {
                                tooltipHTML += '<svg width="40" height="12" style="vertical-align: middle;"><line x1="0" y1="6" x2="40" y2="6" stroke="' + lineColor + '" stroke-width="3"/><circle cx="20" cy="6" r="5" fill="' + lineColor + '"/><circle cx="20" cy="6" r="5" fill="none" stroke="white" stroke-width="1.5"/></svg>';
                            } else {
                                tooltipHTML += '<svg width="40" height="12" style="vertical-align: middle;"><line x1="0" y1="6" x2="40" y2="6" stroke="' + lineColor + '" stroke-width="3"/></svg>';
                            }

                            tooltipHTML += '<div>' + (isRenting ? 'Total Wealth (Renting)' : 'Total Wealth (Buying)') + ': <strong>' + formattedValue + '</strong></div></div>';
                        });

                        tooltipHTML += '</div>';

                        tooltipEl.innerHTML = tooltipHTML;
                        tooltipEl.style.display = 'block';
                        tooltipEl.style.position = 'fixed';
                        tooltipEl.style.pointerEvents = 'none';
                        tooltipEl.style.zIndex = '1000';

                        const canvasRect = ctx.canvas.getBoundingClientRect();
                        const tooltipWidth = tooltipEl.offsetWidth;
                        let x = canvasRect.left + context.tooltip.caretX + 12;
                        let y = canvasRect.top + context.tooltip.caretY - tooltipEl.offsetHeight - 8;

                        // Better mobile tooltip positioning
                        const padding = 10;
                        if (x + tooltipWidth > window.innerWidth - padding) {
                            x = canvasRect.left + context.tooltip.caretX - tooltipWidth - 12;
                        }
                        if (x < padding) {
                            x = padding;
                        }
                        if (y < padding) {
                            y = canvasRect.top + context.tooltip.caretY + 8;
                        }

                        tooltipEl.style.left = x + 'px';
                        tooltipEl.style.top = y + 'px';
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Age (You)', color: isDarkMode ? '#e0e0e0' : '#666' },
                    ticks: { maxTicksLimit: 10, maxRotation: 0, autoSkip: true, color: isDarkMode ? '#e0e0e0' : '#666' }
                },
                y: {
                    title: { display: true, text: 'Total Wealth (£)', color: isDarkMode ? '#e0e0e0' : '#666' },
                    grid: {
                        color: (c) => (goesNegative && c.tick.value === 0) ? 'rgba(198, 40, 40, 0.9)' : (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                        lineWidth: (c) => (goesNegative && c.tick.value === 0) ? 2.5 : 1
                    },
                    ticks: {
                        color: isDarkMode ? '#e0e0e0' : '#666',
                        font: (c) => (goesNegative && c.tick && c.tick.value === 0) ? { weight: 'bold' } : {},
                        callback: function(value) {
                            return formatAxisValue(value);
                        }
                    }
                }
            }
        },
        plugins: [eventMarkersPlugin, negativeZonePlugin]
    });

    let tableHTML = `<thead><tr><th>Age</th><th>Buying wealth</th><th>Renting wealth</th><th style="text-align: left;">Life event</th></tr></thead><tbody>`;
    for (let i = 0; i < labels.length; i++) {
        let age = labels[i];
        let isPurc = (age === Number(purchaseAge) && purchaseAge !== null);
        let isRet = (age === Number(retirementAge));

        let rowClass = "";
        let eventText = "-";
        let iconHTML = "";

        if (isPurc && isRet) {
            rowClass = "row-purchase";
            eventText = "Purchase & Retirement";
            iconHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style="display: inline; margin-left: 6px; vertical-align: middle;"><path d="${iconPaths.property}" /></svg>`;
        } else if (isPurc) {
            rowClass = "row-purchase";
            eventText = "Property purchase";
            iconHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style="display: inline; margin-left: 6px; vertical-align: middle;"><path d="${iconPaths.property}" /></svg>`;
        } else if (isRet) {
            rowClass = "row-retire";
            eventText = "Retirement";
            iconHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style="display: inline; margin-left: 6px; vertical-align: middle;"><g transform="rotate(15 12 22)"><path d="M12 2.5C7.58 2.5 4 6.08 4 10.5C4 10.78 4.02 11.05 4.05 11.31C4.33 12.3 5.1 13 6 13C6.9 13 7.67 12.3 7.95 11.31C8.23 12.3 9 13 9.91 13C10.82 13 11.59 12.3 11.87 11.31C11.91 11.31 11.96 11.31 12 11.31C12.04 11.31 12.09 11.31 12.13 11.31C12.41 12.3 13.18 13 14.09 13C15 13 15.77 12.3 16.05 11.31C16.33 12.3 17.1 13 18 13C18.9 13 19.67 12.3 19.95 11.31C19.98 11.05 20 10.78 20 10.5C20 6.08 16.42 2.5 12 2.5Z" /><path d="M11 11H13V22H11V11Z" /></g></svg>`;
        }

        tableHTML += `
        <tr class="${rowClass}">
            <td>${age}${iconHTML}</td>
            <td>${formatMoney.format(roundTo3SigFigs(buyData[i]))}</td>
            <td>${formatMoney.format(roundTo3SigFigs(rentData[i]))}</td>
            <td style="text-align: left;">${eventText}</td>
        </tr>`;
    }
    
    tableHTML += `</tbody>`;
    let tbl = document.getElementById('wealth-table');
    if (tbl) tbl.innerHTML = tableHTML;
}