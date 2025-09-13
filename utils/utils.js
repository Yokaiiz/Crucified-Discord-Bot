// Folder for utils that will be used across the codebase

// All list of jobs used in the work command, includes there requirements, wage, and experience gain
const job = {
  begger: {
    name: 'Begger',
    experience_required: 0,
    wage: 5000,
    experience_gain: 750,
    description: 'You beg for money on the streets.',
  },
  exotic_dancer: {
    name: "Exotic Dancer",
    experience_required: 10000,
    wage: 17500,
    experience_gain: 1000,
    description: "You work as an exotic dancer in your local gentlemens club",
  },
  janitor: {
    name: "Janitor",
    experience_required: 15000,
    wage: 20000,
    experience_gain: 1500,
    description: "You work as a janitor in your local school.",
  },
  waitress: {
    name: "Waitress",
    experience_required: 50000,
    wage: 75000,
    experience_gain: 5000,
    description: "You work as a waitress in your local café.",
  },
  cashier: {
    name: "Cashier",
    experience_required: 80000,
    wage: 90000,
    experience_gain: 7500,
    description: "You work as a cashier at your local supermarket.",
  },
  teacher: {
    name: "Teacher",
    experience_required: 100000,
    wage: 120000,
    experience_gain: 10000,
    description: "You work as a teacher in your local high-school.",
  },
  care_taker: {
    name: "Care Taker",
    experience_required: 150000,
    wage: 150000,
    experience_gain: 12500,
    description: "You work as a care-taker for a person in need.",
  },
  police_officer: {
    name: "Police Officer",
    experience_required: 200000,
    wage: 1000000,
    experience_gain: 15000,
    description: "You work as a police officer for your local county",
  },
  bank_employee: {
    name: "Bank Employee",
    experience_required: 250000,
    wage: 1500000,
    experience_gain: 17500,
    description: "You work as a bank employee in your local bank",
  },
  engineer: {
    name: "Engineer",
    experience_required: 300000,
    wage: 2000000,
    experience_gain: 20000,
    description: "You work as an engineer at your local engineering company",
  },
  business_ceo: {
    name: "Business CEO",
    experience_required: 350000,
    wage: 2500000,
    experience_gain: 22500,
    description: "You work as a business CEO of your own financials-based company",
  },
  tech_ceo: {
    name: "Tech CEO (Tony Stark)",
    experience_required: 400000,
    wage: 3000000,
    experience_gain: 25000,
    description: "You work as a tech CEO of your own technology-based company (as Tony Stark, idea was by MrBoby)",
  },
  scuba_diver: {
    name: "Scuba Diver",
    experience_required: 450000,
    wage: 3500000,
    experience_gain: 27500,
    description: "You work as a scuba diver",
  },
};

const BusinessTypes = {
  Cafe: {
    cost: 100000,
    income: 10000,
    incomeRate: 60000,
    description: 'You open a small café that serves coffee and snacks.',
  },
  Restaurant: {
    cost: 500000,
    income: 50000,
    incomeRate: 300000,
    description: 'You open a fancy restaurant that serves gourmet meals.',
  },
  Shop: {
    cost: 200000,
    income: 20000,
    incomeRate: 120000,
    description: 'You open a retail shop that sells various goods.',
  },
  Factory: {
    cost: 1000000,
    income: 100000,
    incomeRate: 600000,
    description: 'You open a factory that produces goods on a large scale.',
  },
};

async function createDynamicColour() {
  const colour = Math.floor(Math.random() * 16777215);
  return `#${colour.toString(16)}`;
}

module.exports = { job, createDynamicColour, BusinessTypes };
