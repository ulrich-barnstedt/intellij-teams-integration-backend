const puppeteer = require("puppeteer");

class Runner {
    async constructor (args) {
        this.baseUrl = `https://teams.microsoft.com/_#/school/classroom/General?threadId=${args.teamsID}@thread.tacv2&ctx=channel`;
    }

    async launch () {
        this.browser = await puppeteer.launch({ headless: false });
        this.page = await this.browser.newPage();

        await this.page.goto(this.baseUrl);

        this.page.on("domcontentloaded", () => {
            this.#pageLoad(this.page.url());
        })
    }

    async #pageLoad (url) {
        if (url.slice(8).startsWith("teams.")) {
            await this.#mainFunctionality();
        }
    }

    async #mainFunctionality () {

    }
}

module.exports = Runner;