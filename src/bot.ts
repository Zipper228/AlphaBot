import dotenv from "dotenv";

dotenv.config();

import { Bot, type Context, session, SessionFlavor } from "grammy";
import {
  checkAccountBalance,
  checkTransactionByUSD,
  make_transaction,
} from "./coin.js";
import {
  type Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";
import {
  createTableUsers,
  createTableLogs,
  getUser,
  getLogs,
  createLog,
  deleteUser,
  createUser,
  updateUsers,
  updateBalance,
  checkUser,
} from "./db.js";

await createTableUsers();
await createTableLogs();

interface SessionData {
  toAddress: string;
  myAddress: string;
  privateKey: string;
  UTXO: string;
  UTXO_value: number;
  UTXO_index: number;
}

function initial(): SessionData {
  return {
    toAddress: "",
    privateKey: "",
    myAddress: "",
    UTXO: "",
    UTXO_value: 0,
    UTXO_index: 0,
  };
}

type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor;

type MyConversation = Conversation<MyContext>;

var botToken = process.env.BOT_TOKEN || "";

export const bot = new Bot<MyContext>(botToken);

bot.use(session({ initial }));
bot.use(conversations());

/** Defines the conversation */
/*async function greeting(conversation: MyConversation, ctx: MyContext) {
  const { message } = await conversation.wait();
  if (message !== undefined) {
    const messageUse = message;
    const messageUseText = messageUse.text;
    const balance = await checkAccountBalance(messageUse.text);
    if (balance !== undefined) {
      if (balance !== "no") {
        await ctx.api.sendMessage(
          messageUse.from.id,
          "Is your balance " + balance + "? | Yes or No"
        );
        const { message } = await conversation.wait();
        if (message !== undefined) {
          if (message.text === "Yes") {
            conversation.session.toAddress = messageUseText || "";
            await ctx.api.sendMessage(
              messageUse.from.id,
              "Your address is saved. Enter your private key."
            );
            const { message } = await conversation.wait();
            if (message !== undefined) {
              conversation.session.privateKey = message.text || "";
              await ctx.api.sendMessage(
                messageUse.from.id,
                "Your priavte key is " + conversation.session.privateKey
              );
              return;
            } else {
              await ctx.api.sendMessage(messageUse.from.id, "Try again");
              return;
            }
          } else {
            await ctx.api.sendMessage(messageUse.from.id, "Try again");
            return;
          }
        }
      } else {
        await ctx.reply("Such account doesn't exist");
      }
    } else {
      await ctx.reply("Such account doesn't exist");
    }
  }
//}

//bot.use(createConversation(greeting));*/

await bot.api.setMyCommands([
  /*{
    command: "changeaddress",
    description:
      "Change address where the litecoin transactions are going to be checked",
  },*/
  {
    command: "changemyaddress",
    description: "Change address where the litecoin is going to be sent",
  },
  {
    command: "checkusd",
    description: "Check if money were sent by USD value",
  },
  {
    command: "checklitecoin",
    description: "Check if money were sent by Litecoin value",
  },
  {
    command: "maketrans",
    description: "Send transaction",
  },
]);

/*bot.command("changeaddress", async (ctx) => {
  await ctx.reply("Enter your address:");
  //await ctx.conversation.enter("greeting");
});*/

async function changeMyAddress(conversation: MyConversation, ctx: MyContext) {
  const { message } = await conversation.wait();
  if (message !== undefined) {
    const messageUse = message;
    const balance = await checkAccountBalance(messageUse.text);
    if (balance !== undefined) {
      if (balance !== "no") {
        await ctx.reply(
          "Баланс на этом аккаунте такой: " + Number(balance).toFixed(8) + "?"
        );
        do {
          await ctx.reply("Формат ответа: Да или Нет");
          let { message } = await conversation.wait();
          if (message !== undefined) {
            if (message.text === "Да") {
              if (ctx.from === undefined) {
                await ctx.reply("Ошибка. Попробуйте еще раз.");
                return;
              }
              if (await checkUser(ctx.from.id)) {
                if (messageUse.text === undefined) {
                  await ctx.reply("Ошибка. Попробуйте еще раз.");
                  return;
                }
                createUser(ctx.from.id, messageUse.text);
              } else {
                updateUsers(ctx.from.id, "address", messageUse.text);
              }
              await ctx.reply("Ваш адрес сохранен.");
              return;
            } else if (message.text === "Нет") {
              await ctx.reply("Ошибка. Попробуйте еще раз.");
              return;
            }
          }
        } while (message.text !== "Да" && message.text !== "Нет");
        return;
      } else {
        await ctx.reply("Такого аккаунта не существует.");
      }
    }
  }
}

bot.use(createConversation(changeMyAddress));

bot.command("changemyaddress", async (ctx) => {
  await ctx.reply("Введите свой адрес:");
  await ctx.conversation.enter("changeMyAddress");
});

async function CheckByUSD(conversation: MyConversation, ctx: MyContext) {
  if (ctx.from === undefined) {
    await ctx.reply("Ошибка. Попробуйте еще раз.");
    return;
  }
  if (await checkUser(ctx.from.id)) {
    ctx.reply("Вы не указали свой адрес.");
    return;
  }
  const { message } = await conversation.wait();
  if (message !== undefined) {
    var reply;

    if (ctx.from === undefined) {
      await ctx.reply("Ошибка. Попробуйте еще раз.");
      return;
    }
    createLog(ctx.from.id, Number(message.text));

    try {
      reply = await checkTransactionByUSD(Number(message.text), true);
    } catch (error) {
      if (error instanceof Error) {
        await ctx.reply("Ошибка в программе.");
      } else {
        await ctx.reply("Ошибка в программе.");
      }
    }

    if (reply === undefined) {
      await ctx.reply("Такой транзакции не существует.");
      return;
    }

    await ctx.reply(
      "Такая транзакция существует: " +
        reply.hash +
        ", индекс: " +
        String(reply.index) +
        ", сумма: " +
        String(reply.value)
    );

    if (ctx.from === undefined) {
      await ctx.reply("Ошибка. Попробуйте еще раз.");
      return;
    }

    updateBalance(ctx.from.id, reply.value, true);
  }
}

bot.use(createConversation(CheckByUSD));

bot.command("checkusd", async (ctx) => {
  await ctx.reply("Введите сумму");
  await ctx.conversation.enter("CheckByUSD");
});

async function CheckByLitecoin(conversation: MyConversation, ctx: MyContext) {
  if (ctx.from === undefined) {
    await ctx.reply("Ошибка. Попробуйте еще раз.");
    return;
  }
  if (await checkUser(ctx.from.id)) {
    ctx.reply("Вы не указали свой адрес.");
    return;
  }
  const { message } = await conversation.wait();
  if (message !== undefined) {
    var reply;

    if (ctx.from === undefined) {
      await ctx.reply("Ошибка. Попробуйте еще раз.");
      return;
    }
    createLog(ctx.from.id, Number(message.text));

    try {
      reply = await checkTransactionByUSD(Number(message.text), false);
    } catch (error) {
      if (error instanceof Error) {
        await ctx.reply("Ошибка в программе.");
      } else {
        await ctx.reply("Ошибка в программе.");
      }
    }

    if (reply === undefined) {
      await ctx.reply("Такой транзакции не существует.");
      return;
    }

    await ctx.reply(
      "Такая транзакция существует: " +
        reply.hash +
        ", индекс: " +
        String(reply.index) +
        ", сумма: " +
        String(reply.value)
    );

    if (ctx.from === undefined) {
      await ctx.reply("Ошибка. Попробуйте еще раз.");
      return;
    }

    updateBalance(ctx.from.id, reply.value, true);
  }
}

bot.use(createConversation(CheckByLitecoin));

bot.command("checklitecoin", async (ctx) => {
  await ctx.reply("Введите сумму:");
  await ctx.conversation.enter("CheckByLitecoin");
});

bot.command("maketrans", async (ctx) => {
  if (ctx.from === undefined) {
    await ctx.reply("Ошибка. Попробуйте еще раз.");
    return;
  }
  const user = await getUser(ctx.from.id);
  if (user.length === 0) {
    await ctx.reply("Вы не указали свой адрес");
  }

  try {
    await ctx.reply("Транзакция в процессе.");
    const transaction = await make_transaction(
      user.balance,
      user.address,
      user.share
    );
    await ctx.reply("Транзакция удалась: " + transaction);
  } catch (error) {
    await ctx.reply("Транзакция не удалась");
  }
});
