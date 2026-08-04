class PurchaseTimingCalculator {
    constructor(params) {
        this.params = params;
    }

    calculateSDLT(price, isFTB) {
        let sdlt = 0;
        let p = this.params.stamp_duty;
        
        // Re-enabled the Cliff-Edge rule: 
        // If price exceeds the limit, FTB status is revoked and standard rates apply.
        let ftbLimit = (p.first_time_buyer && p.first_time_buyer.limit) ? p.first_time_buyer.limit : Infinity;
        let isEligibleFTB = isFTB && (price <= ftbLimit);
        
        let bands = isEligibleFTB ? p.first_time_buyer.bands : p.second_time_buyer.bands;

        for (let i = 0; i < bands.length; i++) {
            let limit = bands[i + 1] ? bands[i + 1].from : 999999999;
            if (price > bands[i].from) {
                let amountInBand = Math.max(Math.min(price, limit) - bands[i].from, 0);
                sdlt += amountInBand * bands[i].rate;
            }
        }
        return sdlt;
    }

    getMortgageRate(ltv) {
        let rate = 0;
        let ratesArr = (this.params.mortgages && this.params.mortgages.rates_by_ltv) ? this.params.mortgages.rates_by_ltv : [];
        
        if (ratesArr.length > 0) {
            let sortedRates = [...ratesArr].sort((a,b) => a.ltv_from - b.ltv_from);
            for (let tier of sortedRates) {
                let tierLTV = tier.ltv_from > 1 ? tier.ltv_from / 100 : tier.ltv_from;
                let tierRate = tier.rate > 1 ? tier.rate / 100 : tier.rate;
                if (ltv >= tierLTV - 0.00001) {
                    rate = tierRate;
                }
            }
        }
        return rate;
    }

    calculateTiming(inputs, arrays) {
        const results = [];
        const maxTerm = this.params.general.max_term;

        for (let t = 0; t <= maxTerm; t++) {
            let age1 = arrays.ageLife1[t];
            let age2 = arrays.ageLife2[t];
            let gross1 = arrays.grossIncomeLife1[t];
            let gross2 = arrays.grossIncomeLife2[t];
            let savingsEnd = arrays.savingsAtEndOfYear[t];
            let amountAvailable = arrays.amountAvailableForMortgage[t];

            let houseValue = Math.round(inputs.housePrice * Math.pow(1 + inputs.houseIncRate, t));
            let sdlt = this.calculateSDLT(houseValue, inputs.isFTB);
            
            let totalHouseCost = sdlt + inputs.purchaseFees + houseValue;
            
            let totalGross = gross1 + gross2;
            let maxMortgageFromSalary = totalGross * inputs.mortgageMultiplier;

            let mortgageFromDeposit = (savingsEnd / (1 - inputs.mortgageLTV)) - savingsEnd;
            let maxAvailableMortgage = Math.min(mortgageFromDeposit, maxMortgageFromSalary);

            let houseValuePossible = totalGross > 0 ? maxAvailableMortgage + savingsEnd : 0;
            let purchasePossible = houseValuePossible >= totalHouseCost ? "Yes" : "No";

            let requiredMortgage = Math.max(0, totalHouseCost - savingsEnd);
            let mortgage = Math.min(maxAvailableMortgage, requiredMortgage);

            let mortgageTerm = 0;
            if (totalGross > 0) {
                mortgageTerm = Math.max(Math.min(age1 + inputs.mortgageTerm, inputs.mortgageMaxAge) - age1, 0);
            }

            let ltv = houseValue === 0 ? 0 : mortgage / houseValue;
            let annualMortgageRate = this.getMortgageRate(ltv);
            let monthlyRate = annualMortgageRate / 12;

            let mortgageAnnualCost = 0;
            let loanAmount = mortgage; 

            if (mortgageTerm > 0 && loanAmount > 0) {
                let n = mortgageTerm * 12;
                let pmt = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
                mortgageAnnualCost = Math.round(pmt * 12);
            }

            let mortgageAffordable = mortgageAnnualCost < amountAvailable ? "Yes" : "No";
            let canBuyThisYear = (purchasePossible === "Yes" && mortgageAffordable === "Yes");

            results.push({
                term: t,
                age1: age1,
                houseValue: houseValue,
                stampDuty: sdlt,
                purchaseFees: inputs.purchaseFees, 
                totalHouseCost: totalHouseCost,
                totalGross: totalGross,
                savingsEnd: savingsEnd,
                maxMortgage: maxMortgageFromSalary,
                maxAvailableMortgage: maxAvailableMortgage, 
                requiredMortgage: requiredMortgage, 
                actualMortgage: mortgage,
                loanAmount: loanAmount,
                houseValuePossible: houseValuePossible,
                purchasePossible: purchasePossible,
                mortgageTerm: mortgageTerm,
                ltv: ltv,
                mortgageRate: annualMortgageRate,
                mortgageAnnualCost: mortgageAnnualCost,
                amountAvailable: amountAvailable,
                mortgageAffordable: mortgageAffordable,
                canBuyThisYear: canBuyThisYear
            });
        }

        return results;
    }
}