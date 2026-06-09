import { ContainerBuilder, MessageFlags } from 'discord.js';

/**
 * Base layout representing a Discord Components V2 (Cv2) message structure.
 * Provides professional error handling and validations for Discord API limits
 * (max 40 components, max 4000 characters across text displays).
 */
export class BaseLayout {
  /**
   * @param {number} accentColor Hexadecimal color value for the container border
   */
  constructor(accentColor = 0x9b5de5) {
    this.container = new ContainerBuilder();
    this.container.setAccentColor(accentColor);
    
    // Limits tracking
    this.componentsCount = 0;
    this.totalCharacterCount = 0;
  }

  /**
   * Registers a sub-component and validates it against Discord API constraints.
   * Throws detailed errors if limits are violated to prevent silent failures or API rejections.
   * @param {any} component The builder component instance
   * @param {number} [textLength=0] The length of any text content in the component
   */
  registerComponent(component, textLength = 0) {
    if (!component) {
      throw new TypeError('[Hikari Layout Error] Cannot register an undefined or null component.');
    }

    if (this.componentsCount >= 40) {
      throw new RangeError(
        `[Hikari Layout Error] Component limit exceeded. Discord limits messages to 40 components maximum. Current: ${this.componentsCount}.`
      );
    }

    if (this.totalCharacterCount + textLength > 4000) {
      throw new RangeError(
        `[Hikari Layout Error] Character limit exceeded. Discord limits total text across components to 4000 characters. Trying to add ${textLength} characters (total would be ${this.totalCharacterCount + textLength}).`
      );
    }

    this.componentsCount += 1;
    this.totalCharacterCount += textLength;
  }

  /**
   * Compiles the layout into a complete Discord message payload object.
   * @param {object} [extraOptions] Additional options (e.g. ephemeral: true)
   * @returns {object} Discord API message payload
   */
  toPayload(extraOptions = {}) {
    if (this.componentsCount === 0) {
      throw new Error('[Hikari Layout Error] Cannot generate payload for an empty container.');
    }

    return {
      components: [this.container],
      flags: MessageFlags.IsComponentsV2,
      ...extraOptions
    };
  }
}
