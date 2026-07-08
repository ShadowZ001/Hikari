import { ContainerBuilder, MessageFlags } from 'discord.js';

export class BaseLayout {

  constructor(accentColor = 0x9b5de5) {
    this.container = new ContainerBuilder();
    this.container.setAccentColor(accentColor);

    this.componentsCount = 0;
    this.totalCharacterCount = 0;
  }

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
