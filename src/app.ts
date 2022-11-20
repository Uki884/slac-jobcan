// import chromium from "chrome-aws-lambda";
import playwright, { devices } from "playwright-core";
require("dotenv").config();

const app = async () => {
  const browser = await playwright.chromium.launch({
    // args: chromium.args,
    // executablePath: await chromium.executablePath,
    headless: true,
  });
  const page = await browser.newPage({
    ...devices['Desktop Chrome'],
  });
  await page.goto("https://id.jobcan.jp/users/sign_in");
  await page.type("#user_email", process.env.EMAIL as string);
  await page.type("#user_password", process.env.PASSWORD as string);
  await page.click("#login_button");
  await page.context().storageState({
    path: "storageState.json",
  });
  await page.locator("text=勤怠 >> nth=1").waitFor();
  await page.$eval("text=勤怠 >> nth=1", (el) => el.removeAttribute("target"));
  await page.locator("text=勤怠 >> nth=1").click({ delay: 100 });
  await page.waitForEvent('load');
  await page.locator("text=出勤簿").click();
  await page.locator("text=集計情報の表示ON/OFF").click();
  await page.locator("text=基本項目").waitFor();
  // 勤怠サマリー
  // 稼働日数
  const workingDaysText = await page.locator(":text('実働日数') + td").textContent();
  const workingDays = Number(workingDaysText);
  const prescribedWorkingDays = await page.locator(":text('所定労働日数') + td").textContent();
  const workingHourText = await page.locator(":text('実労働時間') + td").textContent();
  const monthWorkingHourText = await page.locator(":text('月規定労働時間') + td").textContent();
  const workingHour = Number(workingHourText?.replace(":", "."));
  const monthWorkingHour = Number(monthWorkingHourText?.replace(":", "."))
  // 残り稼働日数
  const remainWorkingDays = Number(prescribedWorkingDays?.replace('日', '')) - Number(workingDays);
  const remainWorkingHour = monthWorkingHour - workingHour;
  const averageMonthHour = Math.floor(workingHour / workingDays * Math.pow(10, 2)) / Math.pow(10, 2);
  const averageRemainWorkingHour = Math.floor(remainWorkingHour / remainWorkingDays * Math.pow(10, 2)) / Math.pow(10, 2);
  console.log(
    "残りの勤務日数",
    remainWorkingDays,
    "現在の勤務時間",
    workingHour,
    "勤務時間[平均]",
    averageMonthHour,
    "不足している勤務時間",
    remainWorkingHour,
    "必要な平均時間",
    averageRemainWorkingHour
  );

  await browser.close();
};

app();