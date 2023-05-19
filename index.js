const { InteractionResponse, User, ButtonInteraction } = require("discord.js");

const wait = require("util").promisify(setTimeout);
/** Type for responses
 * @typedef {Object} EmbedResponses
 * @property {(import("discord.js").APIEmbed | import("discord.js").JSONEncodable<import("discord.js").APIEmbed>)[]}    embeds          - Array of embeds
 * @property {number}                                                                                                   currentPage     - The page that the user is currently on
 * @property {number}                                                                                                   duration        - Duration
 * @property {User}                                                                                user            - User object.
 * @property {Number}                                                                                                   buttonStartTime - When it starts.
 * @property {import("discord.js").ActionRowData}                                                                       row      - Buttons used.
 * @property {string}                                                                                                   messageId      - Buttons used.
 */

/** @type {Map<string,EmbedResponses>}*/
const pages = new Map();

module.exports = {
  /**
   *
   * @param {ButtonInteraction} interaction
   * @param {(import("discord.js").APIEmbed | import("discord.js").JSONEncodable<import("discord.js").APIEmbed>)[]}   embeds
   * @param {Number}                                                                                                  duration
   * @param {import("discord.js").InteractionButtonComponentData}                                                     rightButton
   * @param {import("discord.js").InteractionButtonComponentData}                                                     leftButton
   * @param {import("discord.js").InteractionButtonComponentData}                                                     cancelButton
   * @returns {Promise<void>}
   */
  createPages: async (
    interaction,
    embeds,
    duration,
    rightButton,
    leftButton,
    cancelButton
  ) => {
    if (!rightButton)
      throw new TypeError(`A button to go to the next page was not provided.`);
    if (!leftButton)
      throw new TypeError(
        `A button to go to the previous page was not provided.`
      );
    if (!cancelButton)
      throw new TypeError(
        `A button to go cancel the embed page was not provided.`
      );

    const interactiveButtons = {
      type: 1,
      components: [rightButton, cancelButton, leftButton],
    };

    const msg = (await interaction.channel?.send({
      components: [interactiveButtons],
      embeds: [embeds[0]],
    })) || { id: "" };

    let response = {
      embeds: embeds,
      currentPage: 0,
      duration: duration,
      user: interaction.user,
      buttonStartTime: Date.now(),
      row: interactiveButtons,
      messageId: msg.id,
    };
    pages.set(msg.id, response);
  },

  /**
   *
   * @param {import("discord.js").ButtonInteraction} interaction
   * @returns {Promise<void|boolean|InteractionResponse>}
   */
  buttonInteraction: async (interaction) => {
    const responses = pages.get(interaction.message.id);
    if (!responses || interaction.user.id != responses.user.id) return false;
    if (Date.now() - responses.buttonStartTime >= responses.duration) {
      return true;
    }
    switch (interaction.customId) {
      case "next-page":
        responses.currentPage =
          responses.currentPage + 1 < responses.embeds.length
            ? (responses.currentPage += 1)
            : (responses.currentPage = 0);
        await interaction.update({
          embeds: [responses.embeds[responses.currentPage]],
        });
        pages.set(interaction.message.id, responses);
        break;
      case "back-page":
        responses.currentPage =
          responses.currentPage > 0
            ? (responses.currentPage -= 1)
            : (responses.currentPage = responses.embeds.length - 1);
        await interaction.update({
          embeds: [responses.embeds[responses.currentPage]],
        });
        break;
      case "delete-page":
        await interaction.message.edit(`:white_check_mark: Interaction ended.`);
        wait(5000).then(async () => {
          await interaction.message.delete();
        });
        break;
    }
  },
  /**
   *
   * @param {ButtonInteraction} interaction
   * @returns
   */
  endPages: async (interaction) => {
    const responses = pages.get(interaction.message.id);
    if (!responses) return;
    pages.delete(interaction.message.id);
    await interaction.update({
      components: responses.row.components.map((e) => ({
        ...e,
        disabled: true,
      })),
    });
  },
};
