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
                <h2 class="hero-title">Buying is the stronger financial choice</h2>
                <p class="hero-description">Over your chosen timeframe, buying this property leaves you <span class="hero-highlight">${diff}</span> wealthier than renting.</p>
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
                <h2 class="hero-title">Renting yields higher lifetime wealth</h2>
                <p class="hero-description">Based on your inputs, renting and investing your spare cash leaves you <span class="hero-highlight">${diff}</span> wealthier than buying.</p>
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
                <h2 class="hero-title">Let's adjust your buying plan</h2>
                <p class="hero-description">Based on your current deposit and income limits, a <span class="hero-highlight">${hp}</span> home isn't reachable yet.</p>
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
                <h2 class="hero-title" style="color: #333;">It's a break-even scenario</h2>
                <p class="hero-description">Over your chosen timeframe, buying and renting yield nearly identical financial outcomes. Your decision may depend on lifestyle preferences rather than strictly wealth accumulation.</p>
            </div>
        </div>
    `
};

const timingTemplate = (year, ageText) => `
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
            <h3 class="timing-title">Projected Purchase Year: ${year}</h3>
            <p class="timing-description">You can afford to buy this home in <strong>${year}</strong> ${ageText}.</p>
        </div>
    </div>
`;

// --- GLOBALS ---
const formatMoney = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
let currentChart = null;
let debounceTimer = null;
let currentMode = null; 
let currentWizIndex = 0;
let stepSequence = [];
let savedSettings = {}; 

// Compare Mode State
let isCompareMode = false;
let baselineInputs = {};
let baselineResults = null;
let changedInputsList = [];

// --- UTILS ---
function formatSigFigDown(val) {
    if (!val || val === 0) return "£0";
    let absVal = Math.abs(val);
    if (absVal < 100) return formatMoney.format(val);
    const digits = Math.floor(Math.log10(absVal)) + 1;
    const magnitude = Math.pow(10, digits - 3);
    let rounded = Math.floor(absVal / magnitude) * magnitude;
    if (val < 0) rounded = -rounded;
    return formatMoney.format(rounded);
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
        document.getElementById('w_ex_post').value = this.value;
    });
}

// --- VALIDATION & DYNAMIC UI ---
function applyLimits(el) {
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
        let ageVal = parseFloat(document.getElementById(ageId)?.value || 0);
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
    input.addEventListener('change', function() { applyLimits(this); updateDynamicUI();});
});

function updateDynamicUI() {
    let wA1 = parseInt(document.getElementById('w_age1').value) || 0;
    let wA2 = parseInt(document.getElementById('w_age2').value) || 0;
    let wR1 = parseInt(document.getElementById('w_ret1').value) || 0;
    
    let sA1 = parseInt(document.getElementById('s_age1').value) || 0;
    let sA2 = parseInt(document.getElementById('s_age2').value) || 0;
    let sR1 = parseInt(document.getElementById('s_ret1').value) || 0;
    if(sA1 && sA2 && sR1) document.getElementById('s_ret2').value = Math.max(0, sR1 - sA1 + sA2);

    let lblWPre = document.getElementById('lbl_w_ex_pre');
    let lblWPost = document.getElementById('lbl_w_ex_post');
    if (lblWPre) lblWPre.innerText = `Pre-retirement (age ${wR1 || 68} for you)`;
    if (lblWPost) lblWPost.innerText = `Post-retirement (age ${wR1 || 68} for you)`;

    let lblSPre = document.getElementById('lbl_s_ex_pre');
    let lblSPost = document.getElementById('lbl_s_ex_post');
    if (lblSPre) lblSPre.innerText = `Pre-retirement (age ${sR1 || 68} for you)`;
    if (lblSPost) lblSPost.innerText = `Post-retirement (age ${sR1 || 68} for you)`;
}

document.querySelectorAll('.calc-ret-trigger').forEach(input => {
    input.addEventListener('input', updateDynamicUI);
});

// --- TOGGLES ---
function toggleSL() {
    const sl1 = document.querySelector('input[name="s_has_sl1"]:checked')?.value === 'Yes';
    const sl2 = document.querySelector('input[name="s_has_sl2"]:checked')?.value === 'Yes';
    
    const s_f1 = document.getElementById('s_sl_fields1');
    const s_f2 = document.getElementById('s_sl_fields2');
    
    if(s_f1) s_f1.style.display = sl1 ? 'block' : 'none';
    if(s_f2) s_f2.style.display = sl2 ? 'block' : 'none';

    handleInputChanged();
}

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

    handleInputChanged();
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
    document.getElementById('view-' + tabId).classList.add('active');
}

function toggleDataView(viewType) {
    if (viewType === 'graph') {
        document.getElementById('graph-container').style.display = 'flex';
        document.getElementById('table-container').style.display = 'none';
    } else {
        document.getElementById('graph-container').style.display = 'none';
        document.getElementById('table-container').style.display = 'block';
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

// --- COMPARE MODE LOGIC ---
function toggleCompareMode() {
    isCompareMode = document.getElementById('compare-switch').checked;
    
    if (isCompareMode) {
        baselineInputs = gatherRawInputs();
        
        try {
            const engine = new ActuarialEngine(gatherEngineInputs(baselineInputs), globalParams);
            baselineResults = engine.runFullProjection();
        } catch(e) { console.error("Engine failed on baseline snapshot", e); }

        document.getElementById('discard-whatif-btn').style.display = 'block';
        document.getElementById('compare-summary-block').style.display = 'block';
        
        document.getElementById('legend-baseline-buy').style.display = 'flex';
        document.getElementById('legend-baseline-rent').style.display = 'flex';

    } else {
        discardWhatIf();
        document.getElementById('discard-whatif-btn').style.display = 'none';
        document.getElementById('compare-summary-block').style.display = 'none';
        
        document.getElementById('legend-baseline-buy').style.display = 'none';
        document.getElementById('legend-baseline-rent').style.display = 'none';
        
        baselineInputs = {};
        baselineResults = null;
    }
    
    handleInputChanged();
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
    document.getElementById('compare-changes-list').innerHTML = '';
    
    toggleSL();
    togglePen();
    updateDynamicUI();
    
    handleInputChanged();
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
    ul.innerHTML = '';
    
    let currentRaw = gatherRawInputs();
    
    document.querySelectorAll('.compare-track').forEach(el => {
        let isChanged = false;
        
        if (el.type === 'radio' || el.type === 'checkbox') {
            isChanged = (currentRaw[el.id] !== baselineInputs[el.id]);
        } else {
            isChanged = (currentRaw[el.id] !== baselineInputs[el.id]);
        }

        let wrapper = el.closest('.input-wrapper') || el.closest('.toggle-container');
        
        if (isChanged) {
            if (wrapper) wrapper.classList.add('is-modified');
            
            if (el.type !== 'radio' || (el.type === 'radio' && el.checked)) {
                let labelText = el.getAttribute('data-label') || el.id;
                let oldVal = baselineInputs[el.id];
                if(el.type === 'radio') {
                     oldVal = "Previous";
                }
                
                changedInputsList.push(`${labelText}: ${oldVal} ➔ ${el.value}`);
                
                let li = document.createElement('li');
                li.innerHTML = `<strong>${labelText}:</strong> ${oldVal} ➔ ${el.value}`;
                ul.appendChild(li);
            }
        } else {
            if (wrapper && el.type !== 'radio') wrapper.classList.remove('is-modified');
        }
    });

    if(changedInputsList.length === 0) {
        ul.innerHTML = '<li style="color: #888; font-style: italic;">No changes made yet. Edit inputs to see what-if differences.</li>';
    }
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
             return checkedId ? document.getElementById(checkedId).value : 'No';
        }
        return document.querySelector(`input[name="${name}"]:checked`)?.value || 'No';
    };

    const slp1 = document.getElementById('s_slp1').value;
    const slp2 = document.getElementById('s_slp2').value;
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
        Case_Life_1_Spend_TFC: document.getElementById('s_tfc1').value,
        
        Case_Life_1_Student_loan: fetchRadio('s_has_sl1') === 'Yes' ? fetchVal('s_sl1') : 0,
        Case_Life_1_Student_loan_plan: fetchRadio('s_has_sl1') === 'Yes' ? slp1 : "",

        Case_Life_2_Current_age: fetchVal('s_age2') || fetchVal('s_age1'),
        Case_Life_2_Gross_salary: fetchVal('s_sal2') * m,
        
        Case_Life_2_State_pension: (fetchRadio('s_has_pen2') === 'Yes') ? (fetchVal('s_sp2') * m) : 0,
        Case_Life_2_Pension_cont_Ee: (fetchRadio('s_has_pen2') === 'Yes') ? (fetchVal('s_pee2') * m) : 0,
        Case_Life_2_Pension_cont_Er: (fetchRadio('s_has_pen2') === 'Yes') ? (fetchVal('s_per2') * m) : 0,
        Case_Life_2_Pension_initial_value: (fetchRadio('s_has_pen2') === 'Yes') ? (fetchVal('s_pval2') * m) : 0,
        Case_Life_2_Spend_TFC: document.getElementById('s_tfc2').value,
        
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
        
        Case_Joint_Rent_increases: toReal(document.getElementById('set_rent_inc').value),
        Returns_House_price_increase: toReal(document.getElementById('set_hp_inc').value),
        Returns_cash: toReal(document.getElementById('set_cash').value),
        Returns_pension: toReal(document.getElementById('set_pen').value),
        Returns_inflation: inflation
    };
}


// --- WIZARD LOGIC ---
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

function validateStep() {
    const nextBtn = document.getElementById('wiz-next');
    if (!nextBtn) return;

    let isValid = true;
    let step = stepSequence[currentWizIndex];

    if (step === 0) {
        isValid = currentMode !== null;
    } else if (step === 3) {
        isValid = document.querySelector('input[name="w_has_sl1"]:checked') !== null;
    } else if (step === 4) {
        isValid = document.querySelector('input[name="w_has_sl2"]:checked') !== null;
    } else if (step === 5) {
        isValid = document.querySelector('input[name="w_has_pen1"]:checked') !== null;
    } else if (step === 6) {
        isValid = document.querySelector('input[name="w_has_pen2"]:checked') !== null;
    } else if (step === 9) {
        isValid = document.querySelector('input[name="w_ftb"]:checked') !== null;
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

function setMode(mode) {
    currentMode = mode;
    
    document.getElementById('w-mode-single').classList.remove('active');
    document.getElementById('w-mode-couple').classList.remove('active');
    
    if (mode === 'single') {
        document.getElementById('w-mode-single').classList.add('active');
        document.getElementById('side_single').checked = true;
        document.querySelectorAll('.partner-toggle-wrapper').forEach(el => el.style.display = 'none');
        switchPerson('you');
        stepSequence = [0, 1, 3, 5, 7, 8, 9];
    } else {
        document.getElementById('w-mode-couple').classList.add('active');
        document.getElementById('side_couple').checked = true;
        document.querySelectorAll('.partner-toggle-wrapper').forEach(el => el.style.display = 'flex');
        stepSequence = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    }
    
    updateWizardProgress();
    validateStep();

    if(document.getElementById('wizard-overlay').classList.contains('active') === false) {
        handleInputChanged();
    }
}

function openWizard() {
    currentWizIndex = 0;
    currentMode = null;
    stepSequence = [0];
    
    document.getElementById('w-mode-single').classList.remove('active');
    document.getElementById('w-mode-couple').classList.remove('active');
    
    const radiosToClear = ['w_has_sl1', 'w_has_sl2', 'w_has_pen1', 'w_has_pen2', 'w_ftb'];
    radiosToClear.forEach(name => {
        document.querySelectorAll(`input[name="${name}"]`).forEach(r => r.checked = false);
    });

    document.getElementById('w_sl_fields1').style.display = 'none';
    document.getElementById('w_sl_fields2').style.display = 'none';
    document.getElementById('w_pen_fields1').style.display = 'none';
    document.getElementById('w_pen_fields2').style.display = 'none';

    document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));
    document.getElementById('step-0').classList.add('active');
    document.getElementById('wiz-back').style.visibility = 'hidden';
    document.getElementById('wiz-next').innerText = "Next";
    
    updateWizardProgress();
    validateStep();
    
    document.getElementById('wizard-overlay').classList.add('active');
    document.getElementById('wiz-scroll').scrollTop = 0;
    
    document.getElementById('compare-switch').checked = false;
    isCompareMode = false;
    discardWhatIf(); 
}

function wizardStep(dir) {
    // Only restrict movement if trying to advance without validating
    if (dir === 1) {
        validateStep();
        if (document.getElementById('wiz-next').disabled) return;
    }

    let prevStep = stepSequence[currentWizIndex];
    let prevEl = document.getElementById(`step-${prevStep}`);
    if (prevEl) prevEl.classList.remove('active');
    
    currentWizIndex += dir;
    if (currentWizIndex < 0) currentWizIndex = 0; // Prevent out of bounds
    
    if (currentWizIndex >= stepSequence.length) {
        try {
            closeWizard();
        } catch(e) {
            console.error("Error closing wizard: ", e);
            document.getElementById('wizard-overlay').classList.remove('active');
        }
        return;
    }

    let nextStep = stepSequence[currentWizIndex];
    let nextEl = document.getElementById(`step-${nextStep}`);
    if (nextEl) nextEl.classList.add('active');
    
    let scrollEl = document.getElementById('wiz-scroll');
    if (scrollEl) scrollEl.scrollTop = 0;
    
    document.getElementById('wiz-back').style.visibility = currentWizIndex === 0 ? 'hidden' : 'visible';
    document.getElementById('wiz-next').innerText = currentWizIndex === stepSequence.length - 1 ? "Finish" : "Next";
    
    updateWizardProgress();
    validateStep();
}

function closeWizard() {
    try {
        if (!currentMode) setMode('couple'); 

        const map = [
            ['w_age1','s_age1'], ['w_age2','s_age2'], ['w_ret1','s_ret1'],
            ['w_sal1','s_sal1'], ['w_sal2','s_sal2'], ['w_cash','s_cash'],
            ['w_pval1','s_pval1'], ['w_pval2','s_pval2'], ['w_pee1','s_pee1'],
            ['w_pee2','s_pee2'], ['w_per1','s_per1'], ['w_per2','s_per2'],
            ['w_sl1','s_sl1'], ['w_sl2','s_sl2'], ['w_slp1','s_slp1'], ['w_slp2','s_slp2'], 
            ['w_rent','s_rent'], ['w_ex_pre','s_ex_pre'], ['w_hp','s_hp']
        ];
        
        map.forEach(pair => {
            let el1 = document.getElementById(pair[0]);
            let el2 = document.getElementById(pair[1]);
            if (el1 && el2) el2.value = el1.value;
        });

        let w_ex_post = document.getElementById('w_ex_post');
        let s_ex_post = document.getElementById('s_ex_post');
        if (w_ex_post && s_ex_post) s_ex_post.value = w_ex_post.value;
        
        let w_hp = document.getElementById('w_hp');
        if (w_hp) {
            let hpStr = w_hp.value.replace(/,/g, '').replace(/£/g, '');
            let hpVal = parseFloat(hpStr) || 0;
            let s_maint = document.getElementById('s_maint');
            if(s_maint) s_maint.value = (hpVal * 0.01).toLocaleString('en-GB'); 
        }

        let s_fees = document.getElementById('s_fees');
        if(s_fees) s_fees.value = "5,000";

        let s_sp1 = document.getElementById('s_sp1');
        if(s_sp1) s_sp1.value = "12,000";
        let s_sp2 = document.getElementById('s_sp2');
        if(s_sp2) s_sp2.value = "12,000";
        
        let s_tfc1 = document.getElementById('s_tfc1');
        if(s_tfc1) s_tfc1.value = "No";
        let s_tfc2 = document.getElementById('s_tfc2');
        if(s_tfc2) s_tfc2.value = "No";
        
        let s_save_pen = document.getElementById('s_save_pen');
        if(s_save_pen) s_save_pen.value = "0";

        // Handle "No" selections zeroing out nested values
        const hasPen1Node = document.querySelector('input[name="w_has_pen1"]:checked');
        if(!hasPen1Node || hasPen1Node.value !== 'Yes') {
            if(document.getElementById('s_pval1')) document.getElementById('s_pval1').value = "0";
            if(document.getElementById('s_pee1')) document.getElementById('s_pee1').value = "0";
            if(document.getElementById('s_per1')) document.getElementById('s_per1').value = "0";
        }
        
        const hasPen2Node = document.querySelector('input[name="w_has_pen2"]:checked');
        if(!hasPen2Node || hasPen2Node.value !== 'Yes') {
            if(document.getElementById('s_pval2')) document.getElementById('s_pval2').value = "0";
            if(document.getElementById('s_pee2')) document.getElementById('s_pee2').value = "0";
            if(document.getElementById('s_per2')) document.getElementById('s_per2').value = "0";
        }

        // Sync Radios
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
        
        let compSwitch = document.getElementById('compare-switch');
        if(compSwitch) compSwitch.disabled = false;
        
        let compToggle = document.querySelector('.compare-toggle');
        if(compToggle) {
            compToggle.style.opacity = '1';
            compToggle.style.cursor = 'pointer';
        }

        runCalculation(); 
    } catch(e) {
        console.error("Close Wizard Error: ", e);
        let overlay = document.getElementById('wizard-overlay');
        if(overlay) overlay.classList.remove('active');
    }
}

function openSettings() { 
    const settingsInputs = document.querySelectorAll('#settings-overlay input');
    settingsInputs.forEach(input => {
        savedSettings[input.id] = (input.type === 'checkbox' || input.type === 'radio') ? input.checked : input.value;
    });
    document.getElementById('settings-overlay').classList.add('active'); 
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
    document.getElementById('settings-overlay').classList.remove('active'); 
}

function saveSettings() {
    document.getElementById('settings-overlay').classList.remove('active');
    handleInputChanged(); 
}

window.onload = function() {
    const sidebarInputs = document.querySelectorAll('.sidebar input, .sidebar select');
    sidebarInputs.forEach(input => {
        input.addEventListener('input', handleInputChanged);
    });
    
    openWizard();

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { runCalculation() }, 200);
    });
};

function handleInputChanged() {
    if(document.getElementById('wizard-overlay').classList.contains('active')) return;
    document.getElementById('results-pane').classList.add('stale');
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => { runCalculation(); }, 400); 
}

function forceCalculation() {
    clearTimeout(debounceTimer);
    runCalculation();
}

function runCalculation() {
    if (typeof globalParams === 'undefined') { return; }

    checkCompareModifications(); 

    const inputs = gatherEngineInputs();
    let engine, results;
    
    try {
        engine = new ActuarialEngine(inputs, globalParams);
        results = engine.runFullProjection();
    } catch(e) {
        console.error("Projection engine failed: ", e);
        return;
    }

    document.getElementById('results-pane').classList.remove('stale');
    
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

    if (results.purchaseAge === null) {
        heroContainer.innerHTML = heroTemplates.unaffordable(`£${getVal('s_hp').toLocaleString('en-GB')}`);
    } else if (benefit > 100) {
        heroContainer.innerHTML = heroTemplates.buy(formatSigFigDown(benefit));
    } else if (benefit < -100) {
        heroContainer.innerHTML = heroTemplates.rent(formatSigFigDown(Math.abs(benefit)));
    } else {
        heroContainer.innerHTML = heroTemplates.tie();
    }

    let purcTerm = results.purchaseAge !== null ? results.purchaseAge - inputs.Case_Life_1_Current_age : -1;
    
    if (purcTerm >= 0) {
        const currentYear = new Date().getFullYear();
        const purchaseYear = currentYear + purcTerm;
        const age1AtPurc = inputs.Case_Life_1_Current_age + purcTerm;
        
        let ageText = `(at age ${age1AtPurc})`;
        if (currentMode === 'couple') {
            const age2AtPurc = (getVal('s_age2') || getVal('s_age1')) + purcTerm;
            ageText = `(at ages ${age1AtPurc} & ${age2AtPurc})`;
        }
        
        timingContainer.innerHTML = timingTemplate(purchaseYear, ageText);
        timingContainer.style.display = 'flex';
    } else {
        timingContainer.style.display = 'none';
    }

    let maxW = Math.max(buyEndVal, rentEndVal, 1);
    document.getElementById('ui-buy-wealth').innerText = formatSigFigDown(buyEndVal);
    document.getElementById('ui-buy-bar').style.width = `${(buyEndVal / maxW) * 100}%`;
    document.getElementById('ui-rent-wealth').innerText = formatSigFigDown(rentEndVal);
    document.getElementById('ui-rent-bar').style.width = `${(rentEndVal / maxW) * 100}%`;

    let benBox = document.getElementById('ui-benefit-box');
    benBox.classList.remove('negative', 'neutral');
    
    let baseDelta = document.getElementById('ui-compare-delta');
    
    if (benefit > 100) {
        document.getElementById('ui-benefit-val').innerText = "+" + formatSigFigDown(benefit) + " (Buying Wins)";
    } else if (benefit < -100) {
        benBox.classList.add('negative');
        document.getElementById('ui-benefit-val').innerText = formatSigFigDown(Math.abs(benefit)) + " (Renting Wins)";
    } else {
        benBox.classList.add('neutral');
        document.getElementById('ui-benefit-val').innerText = "Break-even scenario";
    }

    if (isCompareMode && baselineResults) {
        baseDelta.style.display = 'block';
        
        let currentDiff = buyEndVal - rentEndVal; 
        
        let baseBuyVal = baselineResults.buyWealth[maxIdx - 1] || 0;
        let baseRentVal = baselineResults.rentWealth[maxIdx - 1] || 0;
        let baseDiff = baseBuyVal - baseRentVal;

        let deltaOfDeltas = currentDiff - baseDiff;

        if (Math.abs(deltaOfDeltas) < 100) {
            baseDelta.innerText = "No change vs baseline";
            baseDelta.style.color = "#555";
        } else if (deltaOfDeltas > 0) {
            baseDelta.innerText = `Buying is +${formatSigFigDown(deltaOfDeltas)} better than baseline`;
            baseDelta.style.color = "var(--success)";
        } else {
            baseDelta.innerText = `Renting is +${formatSigFigDown(Math.abs(deltaOfDeltas))} better than baseline`;
            baseDelta.style.color = "var(--danger)";
        }
    } else {
        baseDelta.style.display = 'none';
    }

    let propCard = document.getElementById('prop-card');

    if (purcTerm >= 0) {
        document.getElementById('prop-breakdown-content').style.display = 'block';
        document.getElementById('prop-breakdown-empty').style.display = 'none';

        let totalCost = results.buyHouseCostEval[purcTerm] || 0;
        let houseVal = results.buyHouseVal[purcTerm] || 0;
        let fees = results.buyPurchaseFeesEval[purcTerm] || 0;
        let sdlt = Math.max(0, totalCost - houseVal - fees);
        let mortgage = results.buyMortgageEval[purcTerm] || 0;
        let deposit = Math.max(0, totalCost - mortgage);

        document.getElementById('ui-prop-price').innerText = formatSigFigDown(houseVal);
        document.getElementById('ui-prop-sdlt').innerText = formatSigFigDown(sdlt);
        document.getElementById('ui-prop-fees').innerText = formatSigFigDown(fees);
        document.getElementById('ui-prop-total').innerText = formatSigFigDown(totalCost);

        document.getElementById('ui-legend-dep').innerText = formatSigFigDown(deposit);
        document.getElementById('ui-legend-mort').innerText = formatSigFigDown(mortgage);

        let depPct = totalCost > 0 ? (deposit / totalCost) * 100 : 0;
        let mortPct = totalCost > 0 ? (mortgage / totalCost) * 100 : 0;

        document.getElementById('ui-fund-dep-bar').style.width = `${depPct}%`;
        document.getElementById('ui-fund-mort-bar').style.width = `${mortPct}%`;
    } else {
        document.getElementById('prop-breakdown-content').style.display = 'none';
        document.getElementById('prop-breakdown-empty').style.display = 'block';
    }

    const cLabels = results.labels.slice(0, maxIdx);
    const cBuy = results.buyWealth.slice(0, maxIdx);
    const cRent = results.rentWealth.slice(0, maxIdx);

    drawChartAndTable(cLabels, cBuy, cRent, results.purchaseAge, inputs.Case_Life_1_Retirement_age, maxIdx);
}

function drawChartAndTable(labels, buyData, rentData, purchaseAge, retirementAge, maxIdx) {
    
    const ctx = document.getElementById('wealthChart').getContext('2d');
    if (currentChart) currentChart.destroy();

    const eventMarkersPlugin = {
        id: 'eventMarkers',
        afterDatasetsDraw(chart) {
            if (!chart.chartArea) return; 
            const { ctx, data, chartArea: { top, bottom }, scales: { x } } = chart;
            
            const drawMarker = (age, emoji, color) => {
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
                ctx.font = '24px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(emoji, xPos, top + 20);
                ctx.restore();
            };

            drawMarker(purchaseAge, '🏠', '#003a5d');
            drawMarker(retirementAge, '☂️', '#bfa15d');
        }
    };

    let datasets = [
        { label: 'Total Wealth (Buying)', data: buyData, borderColor: '#003a5d', backgroundColor: 'transparent', borderWidth: 3, fill: false, tension: 0.3, pointRadius: 0, pointHoverRadius: 6 },
        { label: 'Total Wealth (Renting)', data: rentData, borderColor: '#bfa15d', backgroundColor: 'transparent', borderWidth: 3, borderDash: [6, 6], fill: false, tension: 0.3, pointRadius: 0, pointHoverRadius: 6 }
    ];

    if (isCompareMode && baselineResults) {
        datasets.push({
            label: 'Baseline (Buying)', 
            data: baselineResults.buyWealth.slice(0, maxIdx), 
            borderColor: '#999', backgroundColor: 'transparent', borderWidth: 2, borderDash: [2, 4], fill: false, tension: 0.3, pointRadius: 0, pointHoverRadius: 0
        });
        datasets.push({
            label: 'Baseline (Renting)', 
            data: baselineResults.rentWealth.slice(0, maxIdx), 
            borderColor: '#ccc', backgroundColor: 'transparent', borderWidth: 2, borderDash: [2, 4], fill: false, tension: 0.3, pointRadius: 0, pointHoverRadius: 0
        });
    }

    currentChart = new Chart(ctx, {
        type: 'line',
        data: { labels: labels, datasets: datasets },
        options: {
            responsive: true, maintainAspectRatio: false, animation: { duration: 0 }, interaction: { mode: 'index', intersect: false, },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#222', titleColor: '#fff', bodyColor: '#fff', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 12, boxPadding: 6, cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                label += formatMoney.format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: { 
                    title: { display: true, text: 'Age (You)' },
                    ticks: { maxTicksLimit: 10, maxRotation: 0, autoSkip: true }
                },
                y: { title: { display: true, text: 'Total Wealth (£)' }, ticks: { callback: function(value) { return '£' + (value / 1000) + 'k'; } } }
            }
        },
        plugins: [eventMarkersPlugin]
    });

    let tableHTML = `<thead><tr><th>Age</th><th>Buying Wealth</th><th>Renting Wealth</th><th style="text-align: left;">Life Event</th></tr></thead><tbody>`;
    
    for (let i = 0; i < labels.length; i++) {
        let age = labels[i];
        let isPurc = (age === Number(purchaseAge) && purchaseAge !== null);
        let isRet = (age === Number(retirementAge));
        
        let rowClass = "";
        let eventText = "-";
        
        if (isPurc && isRet) {
            rowClass = "row-purchase"; 
            eventText = "🏠 Purchase & ☂️ Retirement";
        } else if (isPurc) {
            rowClass = "row-purchase"; 
            eventText = "🏠 House purchase";
        } else if (isRet) {
            rowClass = "row-retire"; 
            eventText = "☂️ Retirement";
        }
        
        tableHTML += `
        <tr class="${rowClass}">
            <td>${age}</td>
            <td>${formatMoney.format(buyData[i])}</td>
            <td>${formatMoney.format(rentData[i])}</td>
            <td style="text-align: left;">${eventText}</td>
        </tr>`;
    }
    
    tableHTML += `</tbody>`;
    document.getElementById('wealth-table').innerHTML = tableHTML;
}