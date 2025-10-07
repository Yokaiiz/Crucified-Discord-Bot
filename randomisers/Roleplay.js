const randomRoleplayaction = [
	'Kill',
	'Punch',
	'Knockout',
]
const selectedRoleplayaction = Math.floor(Math.random() * randomRoleplayaction.length);
console.log(randomRoleplayaction[selectedRoleplayaction]);
