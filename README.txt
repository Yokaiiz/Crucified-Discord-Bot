Guide on how to use Crucified bot:

- npm install if it's you're first time with this repo//project
- Enter your discord bot token inside of the .env file.
- Start it with npm start in the terminal and or visual studios F5, note F5 May not work.


- Commands.js is where you would add new command data like:

    async function handlesigmacommand(interaction) {
        Command Here!
}

- index.js is where the main data is stored like starting the bot and adding new commands, to add a new command you simply declare the name then do await [COMMAND FUNCTION]