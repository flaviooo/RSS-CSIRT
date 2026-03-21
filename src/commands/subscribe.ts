import TelegramBot from 'node-telegram-bot-api';
import { connectDB } from '../config/database.js';
import { User } from '../models/User.js';

export function registerSubscribeCommand(bot: TelegramBot): void {
  bot.onText(/\/subscribe/, async (msg) => {
    const chatId = msg.chat.id.toString();
    const username = msg.from?.username || msg.from?.first_name || 'Unknown';

    try {
      await connectDB();

      const existingUser = await User.findOne({ chatId });

      if (existingUser && existingUser.subscribed) {
        bot.sendMessage(chatId, '✅ You are already subscribed to alerts.');
        return;
      }

      if (existingUser) {
        existingUser.subscribed = true;
        existingUser.username = username;
        await existingUser.save();
      } else {
        const newUser = new User({
          chatId,
          username,
          subscribed: true,
        });
        await newUser.save();
      }

      bot.sendMessage(
        chatId,
        '✅ Successfully subscribed to CVE alerts!\n\n' +
        'You will receive notifications when new alerts are published.\n\n' +
        'Commands:\n' +
        '/alerts - View latest alerts\n' +
        '/lastcheck - Check last update time\n' +
        '/unsubscribe - Stop receiving alerts'
      );
    } catch (error) {
      console.error('Error subscribing user:', error);
      bot.sendMessage(chatId, '❌ Error subscribing. Please try again later.');
    }
  });

  bot.onText(/\/unsubscribe/, async (msg) => {
    const chatId = msg.chat.id.toString();

    try {
      await connectDB();

      const user = await User.findOne({ chatId });

      if (!user || !user.subscribed) {
        bot.sendMessage(chatId, 'You are not subscribed to alerts.');
        return;
      }

      user.subscribed = false;
      await user.save();

      bot.sendMessage(chatId, '❌ You have been unsubscribed from CVE alerts.');
    } catch (error) {
      console.error('Error unsubscribing user:', error);
      bot.sendMessage(chatId, '❌ Error unsubscribing. Please try again later.');
    }
  });
}
