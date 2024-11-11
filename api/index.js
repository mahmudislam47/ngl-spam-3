const crypto = require("crypto");
const axios = require("axios");
const chalk = require("chalk");

// Array of User-Agents for randomization
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36",
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2919.83 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2866.71 Safari/537.36",
  "Mozilla/5.0 (X11; Ubuntu; Linux i686 on x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2820.59 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2762.73 Safari/537.36"
];

// Function that sends the message repeatedly
const sendMessage = async (username, message, amount) => {
  let successCount = 0;
  let failureCount = 0;
  let counter = 0;

  while (counter < amount) {
    try {
      const date = new Date();
      const formattedDate = date.toTimeString().split(" ")[0];
      const deviceId = crypto.randomBytes(21).toString("hex");

      // Select a random User-Agent
      const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

      const url = "https://ngl.link/api/submit";
      const headers = {
        "User-Agent": randomUserAgent,
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Referer": `https://ngl.link/${username}`,
        "Origin": "https://ngl.link",
      };

      const body = `username=${username}&question=${encodeURIComponent(message)}&deviceId=${deviceId}`;

      const response = await axios.post(url, body, { headers });

      if (response.status !== 200) {
        console.log(chalk.red(`[ERROR] [${formattedDate}] [${counter + 1}/${amount}] - [${username}]`));
        failureCount++;
      } else {
        successCount++;
        counter++;
        console.log(
          chalk.green(`[SUCCESS] `) +
          chalk.yellow(`[${formattedDate}] `) +
          chalk.hex("#FFA500")(`[${counter}/${amount}] `) +
          chalk.blue(`[${username}]`)
        );
      }
    } catch (error) {
      console.error(chalk.red(`[ERROR] [${formattedDate}] [${counter + 1}/${amount}] - [${username}]`));
      failureCount++;
    }
  }

  return { successCount, failureCount };
};

// Vercel serverless function handler
module.exports = async (req, res) => {
  const { u: username, m: message, a: amount } = req.query;
  const parsedAmount = parseInt(amount, 10);

  // Validate parameters
  if (!username || !message || isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({
      result: {
        error: "Invalid query parameters. Make sure 'u' (username), 'm' (message), and 'a' (amount) are properly specified."
      }
    });
  }

  try {
    const { successCount, failureCount } = await sendMessage(username, message, parsedAmount);

    // Respond with the custom JSON format
    return res.status(200).json({
      result: {
        status: "success",
        message: `Spammed ${username} ${successCount} out of ${parsedAmount} times.`,
        success: successCount,
        failed: failureCount,
        author: "lolbot",
      }
    });
  } catch (error) {
    return res.status(500).json({
      result: {
        status: "error",
        message: "An error occurred while processing your request, please try again later!",
        author: "lolbot",
        details: error.message
      }
    });
  }
};
