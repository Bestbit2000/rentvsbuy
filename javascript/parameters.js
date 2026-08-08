// parameters.js
const globalParams = {
  "general": {
    "current_tax_year_beginning": 2026,
    "minimum_age": 20,
    "max_term": 81
  },
  "state_pension_age_table": [
    { "current_age_under": 18, "state_pension_age": 68, "minimum_pension_age": 58 },
    { "current_age_under": 49, "state_pension_age": 68, "minimum_pension_age": 58 },
    { "current_age_under": 69, "state_pension_age": 67, "minimum_pension_age": 57 },
    { "current_age_under": 73, "state_pension_age": 66, "minimum_pension_age": 55 }
  ],
  "career_increases": [
    { "from_age": 18, "increase_above_inflation": 0.019 },
    { "from_age": 35, "increase_above_inflation": 0.005 },
    { "from_age": 45, "increase_above_inflation": 0.000 },
    { "from_age": 55, "increase_above_inflation": 0.000 },
    { "from_age": 67, "increase_above_inflation": 0.000 }
  ],
  "income_tax": [
    { "from": 0, "rate": 0.00 },
    { "from": 12570, "rate": 0.20 },
    { "from": 50270, "rate": 0.40 },
    { "from": 100000, "rate": 0.60 },
    { "from": 125140, "rate": 0.45 },
    { "from": 150000, "rate": 0.45 }
  ],
  "national_insurance": [
    { "from": 0, "rate": 0.00 },
    { "from": 12576, "rate": 0.08 },
    { "from": 50268, "rate": 0.02 }
  ],
  "stamp_duty": {
    "first_time_buyer": {
      "limit": 500000,
      "bands": [
        { "from": 0, "rate": 0.00 },
        { "from": 125000, "rate": 0.00 },
        { "from": 300000, "rate": 0.05 },
        { "from": 500000, "rate": 0.05 },
        { "from": 925000, "rate": 0.10 },
        { "from": 1500000, "rate": 0.12 }
      ]
    },
    "second_time_buyer": {
      "bands": [
        { "from": 0, "rate": 0.00 },
        { "from": 125000, "rate": 0.02 },
        { "from": 250000, "rate": 0.05 },
        { "from": 500000, "rate": 0.05 },
        { "from": 925000, "rate": 0.10 },
        { "from": 1500000, "rate": 0.12 }
      ]
    }
  },
  "pension_taxation": {
    "tax_free_cash_percent": 0.25,
    "tax_rebate_on_contributions": 0.20,
    "use_ufpls": true,
    "tfc_max_withdrawal": 268275
  },
  "mortgages": {
    "max_end_age": 75,
    "rates_by_ltv": [
      { "ltv_from": 0.00, "rate": 0.044 },
      { "ltv_from": 0.50, "rate": 0.044 },
      { "ltv_from": 0.75, "rate": 0.046 },
      { "ltv_from": 0.90, "rate": 0.046 },
      { "ltv_from": 0.95, "rate": 0.052 }
    ]
  },
  "student_loans": {
    "1": { "threshold": 26065, "max_years": 25, "rate": 0.09, "above_inflation_interest": 0.000, "age_left_uni": 21 },
    "2": { "threshold": 28470, "max_years": 30, "rate": 0.09, "above_inflation_interest": 0.015, "age_left_uni": 21 },
    "4": { "threshold": 32745, "max_years": 30, "rate": 0.09, "above_inflation_interest": 0.000, "age_left_uni": 21 },
    "5": { "threshold": 25000, "max_years": 40, "rate": 0.09, "above_inflation_interest": 0.000, "age_left_uni": 21 },
    "PG": { "threshold": 21000, "max_years": 30, "rate": 0.06, "above_inflation_interest": 0.030, "age_left_uni": 25 }
  }
};