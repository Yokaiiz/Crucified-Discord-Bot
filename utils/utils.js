// Folder for utils that will be used across the codebase

// All list of jobs used in the work command, includes there requirements, wage, and experience gain
const job = {
  exotic_dancer: {
    name: "Exotic Dancer",
    experience_required: 0,
    wage: 750,
    experience_gain: 100,
    description: "You work as an exotic dancer in your local gentlemens club",
  },
  janitor: {
    name: "Janitor",
    experience_required: 150,
    wage: 1000,
    experience_gain: 250,
    description: "You work as a janitor in your local school.",
  },
  waitress: {
    name: "Waitress",
    experience_required: 500,
    wage: 2000,
    experience_gain: 500,
    description: "You work as a waitress in your local café.",
  },
  cashier: {
    name: "Cashier",
    experience_required: 1000,
    wage: 3000,
    experience_gain: 750,
    description: "You work as a cashier at your local supermarket.",
  },
  teacher: {
    name: "Teacher",
    experience_required: 2000,
    wage: 10000,
    experience_gain: 1000,
    description: "You work as a teacher in your local high-school.",
  },
  care_taker: {
    name: "Care Taker",
    experience_required: 5000,
    wage: 50000,
    experience_gain: 1250,
    description: "You work as a care-taker for a person in need.",
  },
  police_officer: {
    name: "Police Officer",
    experience_required: 10000,
    wage: 100000,
    experience_gain: 1500,
    description: "You work as a police officer for your local county",
  },
  bank_employee: {
    name: "Bank Employee",
    experience_required: 50000,
    wage: 500000,
    experience_gain: 1750,
    description: "You work as a bank employee in your local bank",
  },
  engineer: {
    name: "Engineer",
    experience_required: 100000,
    wage: 1000000,
    experience_gain: 2000,
    description: "You work as an engineer at your local engineering company",
  },
  business_ceo: {
    name: "Business CEO",
    experience_required: 120000,
    wage: 1200000,
    experience_gain: 2250,
    description: "You work as a business CEO of your own financials-based company",
  },
  tech_ceo: {
    name: "Tech CEO (Tony Stark)",
    experience_required: 150000,
    wage: 1500000,
    experience_gain: 2500,
    description: "You work as a tech CEO of your own technology-based company (as Tony Stark idea was by MrBoby)",
  },
};

async function createDynamicColour() {
  const colour = Math.floor(Math.random() * 16777215);
  return `#${colour.toString(16)}`;
}

module.exports = { job, createDynamicColour };
