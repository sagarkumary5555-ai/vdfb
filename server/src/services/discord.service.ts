/**
 * Discord service stub (Standalone mode active)
 */
export class DiscordBridgeService {
  static async init(): Promise<void> {
    // Standalone direct chat mode
  }

  static getStatus() {
    return {
      sagarBotReady: false,
      somethingBotReady: false,
      channelId: '',
    };
  }

  static async sendToDiscord(): Promise<void> {}
  static async editDiscordMessage(): Promise<void> {}
  static async deleteDiscordMessage(): Promise<void> {}
}
