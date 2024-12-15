// TODO: Implement the chat API with Groq and web scraping with Cheerio and Puppeteer
// Refer to the Next.js Docs on how to read the Request body: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
// Refer to the Groq SDK here on how to use an LLM: https://www.npmjs.com/package/groq-sdk
// Refer to the Cheerio docs here on how to parse HTML: https://cheerio.js.org/docs/basics/loading
// Refer to Puppeteer docs here: https://pptr.dev/guides/what-is-puppeteer

import { NextResponse } from 'next/server';
import axios from 'axios';
import { chromium } from 'playwright';
import Groq from 'groq-sdk';

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { message, url } = await req.json();
    let aiResponse = await groqClient.chat.completions.create({
      messages: [{ role: "user", content: message }],
      model: "mixtral-8x7b-32768",
    });

    let scrapedData: string | null = null;

    if (url) {
      // Check if the URL requires dynamic scraping (Playwright) or static scraping (Axios)
      const isDynamic = await checkIfDynamic(url);

      if (isDynamic) {
        scrapedData = await scrapeWebDataWithPlaywright(url);
      } else {
        scrapedData = await scrapeWebDataWithAxios(url);
      }

      // Summarize the scraped data
      if (scrapedData) {
        const summarizedData = await summarizeWebData(scrapedData);
        aiResponse.choices[0].message.content += `\n\nHere is some additional information from the web:\n${summarizedData}`;
      }
    }

    // Return the response with the combined AI message and web scraped data if available
    return NextResponse.json({ response: aiResponse.choices[0].message.content });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// Check if the URL might be dynamically loaded
async function checkIfDynamic(url: string): Promise<boolean> {
  const dynamicIndicators = ['wiley', 'dynamic', 'content', 'interactive'];  // Example dynamic indicators
  return dynamicIndicators.some((indicator) => url.includes(indicator));
}

// Scrape static web data using Axios
async function scrapeWebDataWithAxios(url: string): Promise<string> {
  try {
    const response = await axios.get(url);
    const htmlContent = response.data;

    // Use regex to extract the article content or use your specific extraction logic
    const articleContent = htmlContent.match(/<article.*?>(.*?)<\/article>/s)?.[1] ||
      htmlContent.match(/<div.*?class=["'][^"']*article[^"']*["'][^>]*>(.*?)<\/div>/s)?.[1] ||
      "No article content found";

    return articleContent?.trim() || 'Failed to scrape static data.';
  } catch (error) {
    console.error("Error scraping static data:", error);
    return 'Failed to scrape data from the provided URL.';
  }
}

// Scrape dynamic web data using Playwright
async function scrapeWebDataWithPlaywright(url: string): Promise<string> {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait for elements to ensure the page has loaded
    await page.waitForSelector('h1'); // Example selector for the title

    // Extract data from the page
    const title = await page.locator('h1').textContent();
    const content = await page.locator('.content').textContent(); // Adjust as needed

    await browser.close();

    return `Title: ${title || 'No title found'}\nContent: ${content || 'No content found'}`;
  } catch (error) {
    console.error("Error scraping dynamic data with Playwright:", error);
    return 'Failed to scrape data from the provided URL with Playwright.';
  }
}

// Summarize the scraped data using the AI model
async function summarizeWebData(data: string): Promise<string> {
  try {
    const summaryResponse = await groqClient.chat.completions.create({
      messages: [
        { role: "system", content: "Summarize the following content." },
        { role: "user", content: `Here is the data:\n\n${data}` },
      ],
      model: "mixtral-8x7b-32768",
    });

    return summaryResponse.choices[0].message.content;
  } catch (error) {
    console.error("Error summarizing data:", error);
    return 'Failed to summarize the scraped content.';
  }
}
