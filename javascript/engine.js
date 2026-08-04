class ActuarialEngine {
    constructor(inputs, params) {
        this.inputs = inputs;
        this.params = params;
        this.maxTerm = (params && params.general && params.general.max_term) ? params.general.max_term : 81;
    }

    runFullProjection() {
        const p = this.params;
        const i = this.inputs;

        const getNum = (val) => {
            if (typeof val === 'string') val = val.replace(/,/g, '').replace(/£/g, '').replace(/%/g, '');
            let n = parseFloat(val);
            return isNaN(n) ? 0 : n;
        };

        const getPensionAges = (age) => {
            if (!age) return { spa: 68, mpa: 58 };
            
            let table = p.state_pension_age_table || 
                        (p.state_pension && p.state_pension.state_pension_age_table) ||
                        (p.general && p.general.state_pension_age_table);
                        
            if (!table && p.state_pension) {
                let tableKey = Object.keys(p.state_pension).find(k => Array.isArray(p.state_pension[k]));
                if (tableKey) table = p.state_pension[tableKey];
            }

            if (Array.isArray(table) && table.length > 0) {
                let hasUnder = table.some(r => r.current_age_under !== undefined);
                
                if (hasUnder) {
                    let sorted = [...table].sort((a,b) => a.current_age_under - b.current_age_under);
                    for (let row of sorted) {
                        if (age <= row.current_age_under) {
                            return { 
                                spa: row.spa ?? row.state_pension_age ?? 68,
                                mpa: row.mpa ?? row.minimum_pension_age ?? 58
                            };
                        }
                    }
                    let last = sorted[sorted.length - 1];
                    return { 
                        spa: last.spa ?? last.state_pension_age ?? 66,
                        mpa: last.mpa ?? last.minimum_pension_age ?? 55
                    };
                } else {
                    let exact = table.find(r => r.current_age === age || r.age === age);
                    if (exact && (exact.spa !== undefined || exact.state_pension_age !== undefined)) {
                        return {
                            spa: exact.spa ?? exact.state_pension_age,
                            mpa: exact.mpa ?? exact.minimum_pension_age ?? 58
                        };
                    }
                    let sorted = [...table].sort((a,b) => {
                        let va = a.current_age ?? a.age ?? a.from ?? a.age_from ?? 0;
                        let vb = b.current_age ?? b.age ?? b.from ?? b.age_from ?? 0;
                        return vb - va;
                    });
                    for (let row of sorted) {
                        let th = row.current_age ?? row.age ?? row.from ?? row.age_from ?? 0;
                        if (age >= th) {
                            return {
                                spa: row.spa ?? row.state_pension_age ?? 68,
                                mpa: row.mpa ?? row.minimum_pension_age ?? 58
                            };
                        }
                    }
                }
            }
            return {
                spa: age <= 45 ? 68 : (age <= 60 ? 67 : 66),
                mpa: 58
            };
        };

        const netCalc = new NetIncomeCalculator(p);
        
        const age1 = getNum(i.Case_Life_1_Current_age);
        const age2 = getNum(i.Case_Life_2_Current_age) || age1;
        const retAge1 = getNum(i.Case_Life_1_Retirement_age);
        const retAge2 = retAge1 - age1 + age2; 

        const ages1 = getPensionAges(age1);
        const ages2 = getPensionAges(age2);

        const ni1 = netCalc.calculateForLife({
            startAge: age1,
            retirementAge: retAge1,
            statePensionAge: ages1.spa, 
            salary: getNum(i.Case_Life_1_Gross_salary),
            statePensionAmount: getNum(i.Case_Life_1_State_pension),
            eeContRate: getNum(i.Case_Life_1_Pension_cont_Ee) / 100,
            erContRate: getNum(i.Case_Life_1_Pension_cont_Er) / 100,
            slAmount: getNum(i.Case_Life_1_Student_loan),
            slPlan: i.Case_Life_1_Student_loan_plan
        });

        const ni2 = netCalc.calculateForLife({
            startAge: age2,
            retirementAge: retAge2,
            statePensionAge: ages2.spa, 
            salary: getNum(i.Case_Life_2_Gross_salary),
            statePensionAmount: getNum(i.Case_Life_2_State_pension),
            eeContRate: getNum(i.Case_Life_2_Pension_cont_Ee) / 100,
            erContRate: getNum(i.Case_Life_2_Pension_cont_Er) / 100,
            slAmount: getNum(i.Case_Life_2_Student_loan),
            slPlan: i.Case_Life_2_Student_loan_plan || ""
        });

        const sal1 = getNum(i.Case_Life_1_Gross_salary);
        const sal2 = getNum(i.Case_Life_2_Gross_salary);
        const propPens1 = (sal1 + sal2 > 0) ? sal1 / (sal1 + sal2) : 1;
        const inflation = getNum(i.Returns_inflation) / 100;
        const retCash = getNum(i.Returns_cash) / 100;

        let dRent = [], dLivExp = [], dTotExp = [], dCashStart = [], dCashInYear = [], dCashEnd = [];
        
        let otherGross1Arr = new Array(this.maxTerm + 1).fill(0);
        let otherGross2Arr = new Array(this.maxTerm + 1).fill(0);

        for (let t = 0; t <= this.maxTerm; t++) {
            dRent[t] = t === 0 ? getNum(i.Case_Joint_Rent) : Math.round(dRent[t - 1] * (1 + getNum(i.Case_Joint_Rent_increases) / 100));
            dLivExp[t] = ni1[t].age >= retAge1 ? getNum(i.Case_Joint_Expenses_in_ret) : getNum(i.Case_Joint_Expenses_pre_ret);
            dTotExp[t] = dRent[t] + dLivExp[t];
            dCashStart[t] = t === 0 ? getNum(i.Case_Joint_Savings_initial_value) : dCashEnd[t - 1];
            
            let dummyNet = Math.round((ni1[t]?.netIncome || 0) + (ni2[t]?.netIncome || 0));
            dCashInYear[t] = dummyNet - dTotExp[t];
            dCashEnd[t] = Math.round(dCashInYear[t] * Math.pow(1 + retCash, 0.5) + dCashStart[t] * (1 + retCash));

            otherGross1Arr[t] = (ni1[t].age < retAge1 ? getNum(i.Case_Life_1_Gross_salary) : 0) + (ni1[t].age >= ages1.spa ? getNum(i.Case_Life_1_State_pension) : 0);
            otherGross2Arr[t] = (ni2[t].age < retAge2 ? getNum(i.Case_Life_2_Gross_salary) : 0) + (ni2[t].age >= ages2.spa ? getNum(i.Case_Life_2_State_pension) : 0);
        }

        const houseMaintExpense = getNum(i.Case_Joint_Expenses_house);

        const ptCalc = new PurchaseTimingCalculator(p);
        const timingArrays = {
            ageLife1: ni1.map(x => x.age),
            ageLife2: ni2.map(x => x.age),
            grossIncomeLife1: ni1.map(x => Math.max(0, x.grossSalary - (x.grossSalary * (getNum(i.Case_Life_1_Pension_cont_Ee) / 100)))),
			grossIncomeLife2: ni2.map(x => Math.max(0, x.grossSalary - (x.grossSalary * (getNum(i.Case_Life_2_Pension_cont_Ee) / 100)))),
            savingsAtEndOfYear: dCashStart, 
            amountAvailableForMortgage: dCashInYear.map((val, idx) => val + dRent[idx] - houseMaintExpense)
        };

        const ptResults = ptCalc.calculateTiming({
            housePrice: getNum(i.Case_Joint_House_price),
            isFTB: i.Case_Joint_First_Time_Buyer === 'Yes',
            houseIncRate: getNum(i.Returns_House_price_increase) / 100,
            purchaseFees: getNum(i.Case_Joint_House_purchase_costs),
            mortgageMultiplier: getNum(i.Case_Joint_Mortgage_multiplier),
            mortgageLTV: getNum(i.Case_Joint_Mortgage_LTV) / 100,
            mortgageTerm: getNum(i.Case_Joint_Mortgage_term_maximum),
            mortgageMaxAge: (p.mortgages && p.mortgages.max_end_age) ? p.mortgages.max_end_age : 75
        }, timingArrays);

        const purchaseYear = ptResults.findIndex(r => r.canBuyThisYear);
        const CF_House_buy_term = purchaseYear === -1 ? 999 : purchaseYear;

        let CF_Expense_house = houseMaintExpense;
        let CF_House_buy_cash = 0, CF_Mortgage_cost = 0, CF_House_buy_mortgage = 0, CF_Mortgage_rate = 0, finalMortgageTerm = 0;

        if (CF_House_buy_term !== 999) {
            const tBuy = CF_House_buy_term;
            const buyData = ptResults[tBuy];
            
            CF_House_buy_cash = Math.min(dCashStart[tBuy], buyData.totalHouseCost);
            CF_House_buy_mortgage = Math.max(0, buyData.totalHouseCost - CF_House_buy_cash);
            
            const actualLTV = buyData.houseValue > 0 ? (CF_House_buy_mortgage / buyData.houseValue) : 0;
            CF_Mortgage_rate = ptCalc.getMortgageRate(actualLTV);

            const maxTerm = getNum(i.Case_Joint_Mortgage_term_maximum);
            const maxAge = (p.mortgages && p.mortgages.max_end_age) ? p.mortgages.max_end_age : 75;
            finalMortgageTerm = Math.max(0, Math.min(maxTerm, maxAge - ni1[tBuy].age));

            if (CF_House_buy_mortgage > 0 && finalMortgageTerm > 0) {
                const r12 = CF_Mortgage_rate / 12;
                const n12 = finalMortgageTerm * 12;
                CF_Mortgage_cost = Math.round((CF_House_buy_mortgage * r12 / (1 - Math.pow(1 + r12, -n12))) * 12); 
            }
        }

        let arrNetIncome = [];
        let bRent = [], bLivExp = [], bHouseExp = [], bMortExp = [], bTotExp = [], bExcess = [];
        let bCashStart = [], bAddPens = [], bCashCont = [], bCashEnd = [];
        let buyHouseVal = [], buyMortgageVal = [];
        let buyMortgageStartArr = [], buyMortgageRateArr = [];

        let rRent = [], rTotExp = [], rExcess = [];
        let rCashStart = [], rAddPens = [], rCashCont = [], rCashEnd = [];
        
        let bNetWd1 = new Array(this.maxTerm + 1).fill(0);
        let bNetWd2 = new Array(this.maxTerm + 1).fill(0);
        let rNetWd1 = new Array(this.maxTerm + 1).fill(0);
        let rNetWd2 = new Array(this.maxTerm + 1).fill(0);
        
        let bGrossWd1Arr = new Array(this.maxTerm + 1).fill(0);
        let bGrossWd2Arr = new Array(this.maxTerm + 1).fill(0);
        let rGrossWd1Arr = new Array(this.maxTerm + 1).fill(0);
        let rGrossWd2Arr = new Array(this.maxTerm + 1).fill(0);
        
        let bWdArr = new Array(this.maxTerm + 1).fill(0);
        let rWdArr = new Array(this.maxTerm + 1).fill(0);

        let bProp1Arr = new Array(this.maxTerm + 1).fill(0);
        let bProp2Arr = new Array(this.maxTerm + 1).fill(0);
        let rProp1Arr = new Array(this.maxTerm + 1).fill(0);
        let rProp2Arr = new Array(this.maxTerm + 1).fill(0);

        let bPens1Start = [], bPens1End = [], bPens2Start = [], bPens2End = [];
        let rPens1Start = [], rPens1End = [], rPens2Start = [], rPens2End = [];

        const CF_Prop_to_save = getNum(i.Case_Joint_Save_to_pension) / 100;
        const retPens = getNum(i.Returns_pension) / 100;
        const taxRebate = p.pension_taxation.tax_rebate_on_contributions || 0.2;
        const TFC_prop = p.pension_taxation.tax_free_cash_percent || 0.25;
        const MAX_TFC = p.pension_taxation.tfc_max_withdrawal || 268275;

        const gwCalc = new GrossWithdrawalsCalculator(p);

        for (let t = 0; t <= this.maxTerm; t++) {
            
            let totalNet = Math.round((ni1[t]?.netIncome || 0) + (ni2[t]?.netIncome || 0));
            arrNetIncome[t] = totalNet;

            // --- BUYER CASH FLOW ---
            bRent[t] = t < CF_House_buy_term ? dRent[t] : 0; 
            bLivExp[t] = dLivExp[t];
            bHouseExp[t] = t >= CF_House_buy_term ? CF_Expense_house : 0;
            
            buyMortgageStartArr[t] = t < CF_House_buy_term ? 0 : (t === CF_House_buy_term ? CF_House_buy_mortgage : buyMortgageVal[t-1]);
            buyMortgageRateArr[t] = t >= CF_House_buy_term && t < CF_House_buy_term + finalMortgageTerm ? CF_Mortgage_rate : 0;
            
            if (t === CF_House_buy_term) {
                bMortExp[t] = finalMortgageTerm > 0 ? CF_Mortgage_cost : 0;
            } else if (t > CF_House_buy_term && t < CF_House_buy_term + finalMortgageTerm) {
                bMortExp[t] = Math.round(bMortExp[t - 1] / (1 + inflation));
            } else { 
                bMortExp[t] = 0; 
            }

            if (buyMortgageStartArr[t] >= 0 && bMortExp[t] > buyMortgageStartArr[t]) {
                bMortExp[t] = buyMortgageStartArr[t];
            } else if (buyMortgageStartArr[t] <= 0) {
                bMortExp[t] = 0;
            }

            bTotExp[t] = bRent[t] + bLivExp[t] + bHouseExp[t] + bMortExp[t];
            bExcess[t] = totalNet - bTotExp[t];

            bCashStart[t] = t === 0 ? getNum(i.Case_Joint_Savings_initial_value) : bCashEnd[t - 1];
            
            if (t === CF_House_buy_term) {
                bCashStart[t] = Math.max(0, bCashStart[t] - CF_House_buy_cash);
            }
            
            bAddPens[t] = (t >= CF_House_buy_term && ni1[t].age < retAge1) ? Math.max(Math.round(bExcess[t] * CF_Prop_to_save), 0) : 0;
            bCashCont[t] = bExcess[t] < 0 ? Math.max(-bCashStart[t], bExcess[t]) : (bExcess[t] - bAddPens[t]);
            
            let tempEnd = Math.round(bCashCont[t] * Math.pow(1 + retCash, 0.5) + bCashStart[t] * (1 + retCash));
            bCashEnd[t] = Math.max(0, tempEnd);

            let canDraw1 = ni1[t].age >= ages1.mpa;
            let canDraw2 = ni2[t].age >= ages2.mpa;
            let canDrawAny = canDraw1 || canDraw2;
            
            // FIX: Explicitly rounded base withdrawal needed
            let bWd = canDrawAny ? Math.round(Math.max(-(bExcess[t] - bCashCont[t]), 0)) : 0;
            bWdArr[t] = bWd;

            buyHouseVal[t] = t >= CF_House_buy_term ? Math.round(getNum(i.Case_Joint_House_price) * Math.pow(1 + getNum(i.Returns_House_price_increase) / 100, t)) : 0;
            
            if (t < CF_House_buy_term) {
                buyMortgageVal[t] = 0;
            } else {
                let balAfterPmt = buyMortgageStartArr[t] - bMortExp[t];
                buyMortgageVal[t] = Math.round(Math.max((balAfterPmt / (1 + inflation)) * Math.pow(1 + CF_Mortgage_rate/12, 12), 0));
            }

            let p1S = t === 0 ? getNum(i.Case_Life_1_Pension_initial_value) : bPens1End[t - 1];
            let tfc1 = (ni1[t].age === retAge1 && i.Case_Life_1_Spend_TFC === 'Yes') ? Math.round(Math.min(p1S * TFC_prop, MAX_TFC)) : 0;
            bPens1Start[t] = p1S - tfc1;

            let p2S = t === 0 ? getNum(i.Case_Life_2_Pension_initial_value) : bPens2End[t - 1];
            let tfc2 = (ni2[t].age === retAge2 && (i.Case_Life_2_Spend_TFC || 'No') === 'Yes') ? Math.round(Math.min(p2S * TFC_prop, MAX_TFC)) : 0;
            bPens2Start[t] = p2S - tfc2;

            let baseBProp1;
            if (bPens1Start[t] > 0 && bPens2Start[t] > 0) {
                if (!canDraw2) {
                    baseBProp1 = 1.0;
                } else {
                    baseBProp1 = bPens1Start[t] / (bPens1Start[t] + bPens2Start[t]);
                }
            } else if (bPens1Start[t] > 0 && bPens2Start[t] <= 0) {
                baseBProp1 = 1.0;
            } else if (bPens1Start[t] <= 0 && bPens2Start[t] > 0) {
                baseBProp1 = 0.0;
            } else {
                baseBProp1 = 0.5;
            }

            let actualBProp1 = baseBProp1;
            if (!canDraw1) {
                actualBProp1 = 0.0;
            }

            let actualBProp2 = 1.0 - actualBProp1;
            if (!canDraw2) {
                actualBProp2 = 0.0;
            }
            
            bProp1Arr[t] = actualBProp1;
            bProp2Arr[t] = actualBProp2;

            bNetWd1[t] = Math.round(bWd * actualBProp1);
            if (actualBProp1 + actualBProp2 > 0.99) {
                bNetWd2[t] = bWd - bNetWd1[t]; 
            } else {
                bNetWd2[t] = Math.round(bWd * actualBProp2);
            }

            let tempBGw1 = gwCalc.calculateForLife({ spendTFC: i.Case_Life_1_Spend_TFC }, { netWithdrawalRequired: bNetWd1, otherNetIncome: ni1.map(n => n.netIncome) });
            let tempBGw2 = gwCalc.calculateForLife({ spendTFC: i.Case_Life_2_Spend_TFC || 'No' }, { netWithdrawalRequired: bNetWd2, otherNetIncome: ni2.map(n => n.netIncome) });

            bGrossWd1Arr[t] = tempBGw1[t].totalGrossWithdrawal;
            bGrossWd2Arr[t] = tempBGw2[t].totalGrossWithdrawal;

            // FIX: Explicitly round the grossed up contributions before calculating final pot
            let grossCont1 = Math.round(((bAddPens[t] * propPens1) / (1 - taxRebate)) + ni1[t].totalPensionCont);
            bPens1End[t] = Math.round((grossCont1 - tempBGw1[t].totalGrossWithdrawal) * Math.pow(1 + retPens, 0.5) + bPens1Start[t] * (1 + retPens));

            let grossCont2 = Math.round(((bAddPens[t] * (1 - propPens1)) / (1 - taxRebate)) + ni2[t].totalPensionCont);
            bPens2End[t] = Math.round((grossCont2 - tempBGw2[t].totalGrossWithdrawal) * Math.pow(1 + retPens, 0.5) + bPens2Start[t] * (1 + retPens));

            // --- RENTER CASH FLOW ---
            rRent[t] = dRent[t];
            rTotExp[t] = rRent[t] + dLivExp[t];
            rExcess[t] = totalNet - rTotExp[t];

            rCashStart[t] = t === 0 ? getNum(i.Case_Joint_Savings_initial_value) : rCashEnd[t - 1];
            rAddPens[t] = ni1[t].age < retAge1 ? Math.max(Math.round(rExcess[t] * CF_Prop_to_save), 0) : 0;
            rCashCont[t] = rExcess[t] < 0 ? Math.max(-rCashStart[t], rExcess[t]) : (rExcess[t] - rAddPens[t]);
            rCashEnd[t] = Math.max(Math.round(rCashCont[t] * Math.pow(1 + retCash, 0.5) + rCashStart[t] * (1 + retCash)), 0);

            // FIX: Explicitly rounded base withdrawal needed
            let rWd = canDrawAny ? Math.round(Math.max(-(rExcess[t] - rCashCont[t]), 0)) : 0;
            rWdArr[t] = rWd;

            let rp1S = t === 0 ? getNum(i.Case_Life_1_Pension_initial_value) : rPens1End[t - 1];
            let rtfc1 = (ni1[t].age === retAge1 && i.Case_Life_1_Spend_TFC === 'Yes') ? Math.round(Math.min(rp1S * TFC_prop, MAX_TFC)) : 0;
            rPens1Start[t] = rp1S - rtfc1;

            let rp2S = t === 0 ? getNum(i.Case_Life_2_Pension_initial_value) : rPens2End[t - 1];
            let rtfc2 = (ni2[t].age === retAge2 && (i.Case_Life_2_Spend_TFC || 'No') === 'Yes') ? Math.round(Math.min(rp2S * TFC_prop, MAX_TFC)) : 0;
            rPens2Start[t] = rp2S - rtfc2;

            let baseRProp1;
            if (rPens1Start[t] > 0 && rPens2Start[t] > 0) {
                if (!canDraw2) {
                    baseRProp1 = 1.0;
                } else {
                    baseRProp1 = rPens1Start[t] / (rPens1Start[t] + rPens2Start[t]);
                }
            } else if (rPens1Start[t] > 0 && rPens2Start[t] <= 0) {
                baseRProp1 = 1.0;
            } else if (rPens1Start[t] <= 0 && rPens2Start[t] > 0) {
                baseRProp1 = 0.0;
            } else {
                baseRProp1 = 0.5;
            }

            let actualRProp1 = baseRProp1;
            if (!canDraw1) {
                actualRProp1 = 0.0;
            }

            let actualRProp2 = 1.0 - actualRProp1;
            if (!canDraw2) {
                actualRProp2 = 0.0;
            }

            rProp1Arr[t] = actualRProp1;
            rProp2Arr[t] = actualRProp2;

            rNetWd1[t] = Math.round(rWd * actualRProp1);
            if (actualRProp1 + actualRProp2 > 0.99) {
                rNetWd2[t] = rWd - rNetWd1[t];
            } else {
                rNetWd2[t] = Math.round(rWd * actualRProp2);
            }

            let tempRGw1 = gwCalc.calculateForLife({ spendTFC: i.Case_Life_1_Spend_TFC }, { netWithdrawalRequired: rNetWd1, otherNetIncome: ni1.map(n => n.netIncome) });
            let tempRGw2 = gwCalc.calculateForLife({ spendTFC: i.Case_Life_2_Spend_TFC || 'No' }, { netWithdrawalRequired: rNetWd2, otherNetIncome: ni2.map(n => n.netIncome) });

            rGrossWd1Arr[t] = tempRGw1[t].totalGrossWithdrawal;
            rGrossWd2Arr[t] = tempRGw2[t].totalGrossWithdrawal;

            // FIX: Explicitly round the grossed up contributions before calculating final pot
            let rgrossCont1 = Math.round(((rAddPens[t] * propPens1) / (1 - taxRebate)) + ni1[t].totalPensionCont);
            rPens1End[t] = Math.round((rgrossCont1 - tempRGw1[t].totalGrossWithdrawal) * Math.pow(1 + retPens, 0.5) + rPens1Start[t] * (1 + retPens));

            let rgrossCont2 = Math.round(((rAddPens[t] * (1 - propPens1)) / (1 - taxRebate)) + ni2[t].totalPensionCont);
            rPens2End[t] = Math.round((rgrossCont2 - tempRGw2[t].totalGrossWithdrawal) * Math.pow(1 + retPens, 0.5) + rPens2Start[t] * (1 + retPens));
        }

        let results = { buyWealth: [], rentWealth: [], labels: [], purchaseAge: null };
        for (let t = 0; t <= this.maxTerm; t++) {
            results.labels.push(ni1[t].age);
            results.buyWealth.push(bPens1End[t] + bPens2End[t] + bCashEnd[t] + (buyHouseVal[t] - buyMortgageVal[t]));
            results.rentWealth.push(rPens1End[t] + rPens2End[t] + rCashEnd[t]);
        }

        results.netIncome = arrNetIncome;
        results.buyTotalExp = bTotExp;
        results.buyCashCont = bCashCont;
        results.buyCash = bCashEnd;
        
        results.bPens1Start = bPens1Start;
        results.bPens2Start = bPens2Start;
        
        results.bProp1 = bProp1Arr;
        results.bProp2 = bProp2Arr;

        results.bNetWdReq = bWdArr;
        results.bNetWd1 = bNetWd1;
        results.bNetWd2 = bNetWd2;
        
        results.bGrossWd1 = bGrossWd1Arr;
        results.bGrossWd2 = bGrossWd2Arr;
        
        results.buyPension = bPens1End.map((v, i) => v + bPens2End[i]);
        
        results.rPens1Start = rPens1Start;
        results.rPens2Start = rPens2Start;

        results.rProp1 = rProp1Arr;
        results.rProp2 = rProp2Arr;

        results.rNetWdReq = rWdArr;
        results.rNetWd1 = rNetWd1;
        results.rNetWd2 = rNetWd2;
        
        results.rGrossWd1 = rGrossWd1Arr;
        results.rGrossWd2 = rGrossWd2Arr;

        results.buyHouseCostEval = ptResults.map(r => r ? r.totalHouseCost : 0);
        results.buyPurchaseFeesEval = ptResults.map(r => r ? r.purchaseFees : 0);
        results.buyReqMortEval = ptResults.map(r => r ? r.requiredMortgage : 0);
        results.buyMaxAvailEval = ptResults.map(r => r ? r.maxAvailableMortgage : 0);

        results.buyMortgageEval = ptResults.map(r => r ? r.actualMortgage : 0); 
        results.buyMortgageStart = buyMortgageStartArr;
        results.buyMortgageRate = buyMortgageRateArr;
        results.buyMortgagePmt = bMortExp;
        
        results.buyHouseVal = buyHouseVal;
        results.buyMortgageVal = buyMortgageVal;
        
        results.rentTotalExp = rTotExp;
        results.rentCashCont = rCashCont;
        results.rentCash = rCashEnd;
        results.rentPension = rPens1End.map((v, i) => v + rPens2End[i]);

        const planEndAge = getNum(i.Case_Life_1_Plan_end_age);
        const currentAge = getNum(i.Case_Life_1_Current_age);
        let targetTerm = Math.max(0, planEndAge - currentAge);
        targetTerm = Math.min(targetTerm, this.maxTerm);

        results.purchaseAge = CF_House_buy_term === 999 ? null : currentAge + CF_House_buy_term;
        results.buyEndWealth = results.buyWealth[targetTerm] || 0;
        results.rentEndWealth = results.rentWealth[targetTerm] || 0;
        
        results.netWealthProportion = results.rentEndWealth > 0 ? (results.buyEndWealth / results.rentEndWealth) * 100 : 0;
        results.resultStatus = results.buyEndWealth > results.rentEndWealth ? "Buying is better" : "Renting is better";
        
        return results;
    }
}