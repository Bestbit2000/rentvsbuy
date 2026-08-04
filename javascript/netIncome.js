class NetIncomeCalculator {
    constructor(params) {
        this.params = params;
    }

    // Evaluated dynamically EVERY YEAR based on the person's exact age in that year
    getCareerInflation(currentAgeInYear) {
        let rate = 0;
        for (let band of this.params.career_increases) {
            if (currentAgeInYear >= band.from_age) {
                rate = band.increase_above_inflation;
            } else {
                break; // Because bands are ordered, stop looking once we pass the age
            }
        }
        return rate;
    }

    /**
     * Calculates the Net Income array for a single life.
     * @param {Object} inputs - The specific details for Life 1 or Life 2
     */
    calculateForLife(inputs) {
        const results = [];
        const maxTerm = this.params.general.max_term;

        let slBalance = inputs.slAmount;

        for (let t = 0; t <= maxTerm; t++) {
            let currentAgeInYear = inputs.startAge + t;
            let isRetired = currentAgeInYear >= inputs.retirementAge;

            // 1. Salary calculation (Column F)
            let careerInflation = this.getCareerInflation(currentAgeInYear);
            let grossSalary = 0;
            
            if (!isRetired) {
                if (t === 0) {
                    grossSalary = inputs.salary;
                } else {
                    grossSalary = results[t - 1].grossSalary * (1 + careerInflation);
                }
            }

            // 2. State Pension (Column I)
            let statePension = 0;
            if (currentAgeInYear >= inputs.statePensionAge) {
                statePension = inputs.statePensionAmount;
            }

            // 3. Pension Contributions (Columns R to V)
            let eeContRate = !isRetired ? inputs.eeContRate : 0;
            let erContRate = !isRetired ? inputs.erContRate : 0;

            let eeContAmount = grossSalary * eeContRate;
            let erContAmount = grossSalary * erContRate;

            // 4. Total Taxable Gross Income (Column W)
            // Salary sacrifice assumes EE contributions reduce taxable gross
            let taxableGross = (grossSalary - eeContAmount) + statePension;

            // 5. Student Loan Repayment (Columns J to P)
            let slRepayment = 0;
            if (slBalance > 0 && inputs.slPlan && this.params.student_loans[inputs.slPlan]) {
                let plan = this.params.student_loans[inputs.slPlan];
                
                // Years remaining = MAX(Max_term + Start_age - CurrentAge, 0)
                let yearsRemaining = Math.max((plan.max_years + plan.age_left_uni) - currentAgeInYear, 0);

                if (yearsRemaining > 0) {
                    let salaryAboveThreshold = Math.max(grossSalary - plan.threshold, 0);
                    slRepayment = Math.min(slBalance, salaryAboveThreshold * plan.rate);
                    
                    let interestAdded = (slBalance - slRepayment) * plan.above_inflation_interest;
                    slBalance = slBalance - slRepayment + interestAdded;
                } else {
                    // Loan is written off after max term
                    slBalance = 0; 
                }
            }

            // 6. Income Tax Calculation (Columns X to AJ)
            let tax = 0;
            const itBands = this.params.income_tax;
            for (let i = 0; i < itBands.length; i++) {
                let bandStart = itBands[i].from;
                let bandEnd = itBands[i + 1] ? itBands[i + 1].from : 99999999;
                let rate = itBands[i].rate;

                let amountInBand = Math.max(Math.min(taxableGross, bandEnd) - bandStart, 0);
                tax += amountInBand * rate;
            }

            // 7. National Insurance Calculation (Columns AL to AS)
            let ni = 0;
            // Only pay NI before retirement age on taxable gross (excluding State Pension)
            let niGross = !isRetired ? taxableGross : 0; 
            
            const niBands = this.params.national_insurance;
            for (let i = 0; i < niBands.length; i++) {
                let bandStart = niBands[i].from;
                let bandEnd = niBands[i + 1] ? niBands[i + 1].from : 99999999;
                let rate = niBands[i].rate;

                let amountInBand = Math.max(Math.min(niGross, bandEnd) - bandStart, 0);
                ni += amountInBand * rate;
            }

            // 8. Final Net Income (Column AV)
            let netIncome = taxableGross - tax - ni - slRepayment;

            // Push the row to our array
            results.push({
                term: t,
                age: currentAgeInYear,
                grossSalary: grossSalary,
                statePension: statePension,
                eeContAmount: eeContAmount,
                erContAmount: erContAmount,
                totalPensionCont: eeContAmount + erContAmount,
                taxableGross: taxableGross,
                tax: tax,
                ni: ni,
                slRepayment: slRepayment,
                slBalanceEnd: slBalance,
                netIncome: netIncome
            });
        }

        return results;
    }
}