const { Client, GatewayIntentBits, ButtonStyle } = require("discord.js"); //Requiring Client and GatewayIntentBits classes from Discord.js module.
const sleep = require("util").promisify(setTimeout);
const {
  createPages,
  buttonInteraction,
} = require("./index" /* normally you would put 'discord-button-pages' here */);
const client = new Client({ intents: [GatewayIntentBits.Guilds] }); //Creating and assigning the Discord.js Client constructor with basic intent provided.

client.on("ready", async () => {
  console.log(`Logged in as ${client.user?.username}!`);
  await sleep(1000);
  await client.application?.commands.set([
    {
      name: "example",
      description:
        "example command from example djs bot code using discord-button-pages module",
    },
  ]);
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) await buttonInteraction(interaction);
  else if (interaction.isChatInputCommand()) {
    if (interaction.commandName == "example") {
      const embeds = [
        { title: "Embed 0", color: 0x000000 },
        { title: "Embed 1", color: 0x0000ff },
        { title: "Embed 2", color: 0x00ffff },
        { title: "Embed 3", color: 0x00ff00 },
        { title: "Embed 4", color: 0xffff00 },
        { title: "Embed 5", color: 0xffffff },
        { title: "Embed 6", color: 0xff00ff },
        { title: "Embed 7", color: 0xff0000 },
      ];
      createPages(
        interaction,
        embeds,
        60_000,
        {
          customId: "example_previous",
          label: "Previous Page",
          style: ButtonStyle.Primary,
          type: 2,
        },
        {
          customId: "example_close",
          label: "Close",
          style: ButtonStyle.Danger,
          type: 2,
        },
        {
          customId: "example_next",
          label: "Next Page",
          style: ButtonStyle.Primary,
          type: 2,
        }
      );
    }
  }
});

//!!! Remember to set `token` env variable to your discord bot token !!!

client.login(process.env.token);
