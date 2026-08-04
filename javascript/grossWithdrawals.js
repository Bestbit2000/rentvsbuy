class GrossWithdrawalsCalculator {
    constructor(params) {
        this.params = params;
    }

    calculateForLife(inputs, arrays) {
        const results = [];
        const maxTerm = this.params.general?.max_term || 81;
        
        let rawBands = null;

        if (this.params.taxation?.income_tax?.bands) rawBands = this.params.taxation.income_tax.bands;
        else if (Array.isArray(this.params.taxation?.income_tax)) rawBands = this.params.taxation.income_tax;
        else if (this.params.income_tax?.bands) rawBands = this.params.income_tax.bands;
        else if (Array.isArray(this.params.income_tax)) rawBands = this.params.income_tax;
        else if (this.params.taxation?.bands) rawBands = this.params.taxation.bands;
        else if (Array.isArray(this.params.taxation)) rawBands = this.params.taxation;
        else if (Array.isArray(this.params.tax_bands)) rawBands = this.params.tax_bands;
        
        if (!rawBands) {
            const searchForBands = (obj, isTaxPath) => {
                if (!obj || typeof obj !== 'object') return null;
                if (Array.isArray(obj)) {
                    if (obj.length > 0 && obj[0].rate !== undefined && (obj[0].from !== undefined || obj[0].limit !== undefined)) {
                        return isTaxPath ? obj : null;
                    }
                    return null;
                }
                for (let k in obj) {
                    if (k.includes('stamp') || k.includes('mortgage') || k.includes('state_pension')) continue;
                    let res = searchForBands(obj[k], isTaxPath || k.includes('tax'));
                    if (res) return res;
                }
                return null;
            };
            rawBands = searchForBands(this.params, false);
        }

        if (!rawBands || rawBands.length === 0) {
            rawBands = [
                { from: 0, rate: 0.00 },
                { from: 12570, rate: 0.20 },
                { from: 50270, rate: 0.40 },
                { from: 125140, rate: 0.45 }
            ];
        }

        let bands = rawBands.map(b => ({
            from: b.from !== undefined ? b.from : (b.limit !== undefined ? b.limit : 0),
            rate: b.rate !== undefined ? (b.rate > 1 ? b.rate / 100 : b.rate) : 0
        })).sort((a, b) => a.from - b.from);

        let isUFPLS = inputs.spendTFC !== 'Yes';
        let tfcPercent = this.params.pension_taxation?.tax_free_cash_percent || 0.25;
        let taxableMultiplier = isUFPLS ? (1 - tfcPercent) : 1.0;

        // FIX: Helper Function to reverse-engineer Net Income back to Gross Income
        const getGrossFromNet = (netVal, taxBands) => {
            let remainingNet = netVal;
            let totalGross = 0;
            
            for (let i = 0; i < taxBands.length; i++) {
                if (remainingNet <= 0.001) break;
                
                let currentBand = taxBands[i];
                let nextBand = taxBands[i + 1];
                let limit = nextBand ? nextBand.from : Infinity;
                
                let grossSpaceInBand = limit - currentBand.from;
                let netSpaceInBand = grossSpaceInBand * (1 - currentBand.rate);
                
                if (remainingNet <= netSpaceInBand) {
                    totalGross += remainingNet / (1 - currentBand.rate);
                    remainingNet = 0;
                } else {
                    totalGross += grossSpaceInBand;
                    remainingNet -= netSpaceInBand;
                }
            }
            
            if (remainingNet > 0.001) {
                let topRate = taxBands[taxBands.length - 1].rate;
                totalGross += remainingNet / (1 - topRate);
            }
            
            return totalGross;
        };

        for (let t = 0; t <= maxTerm; t++) {
            let netReq = arrays.netWithdrawalRequired[t] || 0;
            let otherIncNet = (arrays.otherNetIncome && arrays.otherNetIncome[t]) || 
                              (arrays.otherIncome && arrays.otherIncome[t]) || 0;
            
            let totalGrossWd = 0;
            let ufplsAdj = 0;

            if (netReq > 0) {
                let remainingNet = netReq;
                
                // FIX: Gross up the Other Net Income first to find our true starting position in the tax bands
                let currentTaxableIncome = getGrossFromNet(otherIncNet, bands); 

                for (let i = 0; i < bands.length; i++) {
                    if (remainingNet <= 0.001) break;

                    let currentBand = bands[i];
                    let nextBand = bands[i + 1];
                    let limit = nextBand ? nextBand.from : Infinity;
                    
                    if (currentTaxableIncome >= limit) continue;

                    let taxRate = currentBand.rate;
                    
                    let availableTaxableSpace = limit - Math.max(currentTaxableIncome, currentBand.from);
                    let availableTotalWithdrawalSpace = availableTaxableSpace / taxableMultiplier;
                    
                    let netMultiplier = 1 - (taxableMultiplier * taxRate);
                    let availableNetSpace = availableTotalWithdrawalSpace * netMultiplier;

                    if (remainingNet <= availableNetSpace) {
                        let withdrawalNeeded = remainingNet / netMultiplier;
                        totalGrossWd += withdrawalNeeded;
                        currentTaxableIncome += (withdrawalNeeded * taxableMultiplier);
                        remainingNet = 0;
                    } else {
                        totalGrossWd += availableTotalWithdrawalSpace;
                        currentTaxableIncome = limit;
                        remainingNet -= availableNetSpace;
                    }
                }

                if (remainingNet > 0.001) {
                    let topRate = bands[bands.length - 1].rate;
                    let topNetMultiplier = 1 - (taxableMultiplier * topRate);
                    totalGrossWd += remainingNet / topNetMultiplier;
                }

                if (isUFPLS) {
                    ufplsAdj = totalGrossWd * tfcPercent;
                }
            }

            results.push({
                term: t,
                netWithdrawalRequired: netReq,
                otherIncome: otherIncNet, // Just returning the Net input for tracing purposes
                ufplsAdjustment: ufplsAdj,
                totalGrossWithdrawal: Math.round(totalGrossWd),
                tfcTaken: isUFPLS ? ufplsAdj : 0,
                tfcLimitEnd: 0 
            });
        }

        return results;
    }
}