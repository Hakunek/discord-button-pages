const {
  ChatInputCommandInteraction,
  ButtonStyle,
  InteractionResponse,
  User,
  ButtonInteraction,
} = require("discord.js");

const sleep = require("util").promisify(setTimeout);

/**
 * @typedef {Object} ButtonLabel
 * @property {ButtonStyle.Primary|ButtonStyle.Danger|ButtonStyle.Secondary|ButtonStyle.Success} style
 * @property {String} customId
 * @property {String} label
 * @property {boolean} [disabled]
 * @property {2} type
 */
/**
 * @typedef {Object} ButtonEmoji
 * @property {ButtonStyle.Primary|ButtonStyle.Danger|ButtonStyle.Secondary|ButtonStyle.Success} style
 * @property {String} customId
 * @property {String} emoji
 * @property {boolean} [disabled]
 * @property {2} type
 */
/**
 * @typedef {Object} ButtonLabelEmoji
 * @property {ButtonStyle.Primary|ButtonStyle.Danger|ButtonStyle.Secondary|ButtonStyle.Success} style
 * @property {String} customId
 * @property {String} label
 * @property {String} emoji
 * @property {boolean} [disabled]
 * @property {2} type
 */

/** Type for responses
 * @typedef {Object} EmbedResponses
 * @property {(import("discord.js").APIEmbed | import("discord.js").JSONEncodable<import("discord.js").APIEmbed>)[]} embeds - Array of embeds
 * @property {number} currentPage - The page that the user is currently on
 * @property {number} duration - Duration
 * @property {User} user - User object.
 * @property {Number} buttonStartTime - When it starts.
 * @property {ButtonLabel|ButtonLabelEmoji|ButtonEmoji} previous
 * @property {ButtonLabel|ButtonLabelEmoji|ButtonEmoji} close
 * @property {ButtonLabel|ButtonLabelEmoji|ButtonEmoji} next
 * @property {string} messageId - Buttons used.
 */

/** @type {Map<string,EmbedResponses>}*/
const pages = new Map();

module.exports = {
  /** Needed to be used when creating pages
   * @param {ChatInputCommandInteraction} interaction
   * @param {(import("discord.js").APIEmbed | import("discord.js").JSONEncodable<import("discord.js").APIEmbed>)[]} embeds
   * @param {Number} duration
   * @param {ButtonLabel|ButtonLabelEmoji|ButtonEmoji} leftButton
   * @param {ButtonLabel|ButtonLabelEmoji|ButtonEmoji} closeButton
   * @param {ButtonLabel|ButtonLabelEmoji|ButtonEmoji} rightButton
   * @returns {Promise<void>}
   */
  createPages: async (
    interaction,
    embeds,
    duration,
    leftButton,
    closeButton,
    rightButton
  ) => {
    if (!rightButton)
      throw new TypeError(`A button to go to the next page was not provided.`);
    if (!leftButton)
      throw new TypeError(
        `A button to go to the previous page was not provided.`
      );
    if (!closeButton)
      throw new TypeError(
        `A button to go cancel the embed page was not provided.`
      );

    rightButton.type = 2;
    closeButton.type = 2;
    leftButton.type = 2;

    const interactiveButtons = {
      type: 1,
      components: [rightButton, closeButton, leftButton],
    };

    const msg = (await interaction.channel?.send({
      components: [
        {
          type: 1,
          components: [rightButton],
        },
      ],
      embeds: [embeds[0]],
    })) || { id: "" };

    let response = {
      embeds: embeds,
      currentPage: 0,
      duration: duration,
      user: interaction.user,
      buttonStartTime: Date.now(),
      previous: leftButton,
      close: closeButton,
      next: rightButton,
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
        sleep(5000).then(async () => {
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
    responses.previous.disabled = true;
    responses.close.disabled = true;
    responses.next.disabled = true;
    const row = {
      type: 1,
      components: [responses.previous, responses.close, responses.next],
    };
    await interaction.update({
      components: [row],
    });
  },
};
