const puppeteer = require("puppeteer");
const fs = require("fs");

const assignmentSelector = `div[class^="assignment-card-grid__"]`;
const openedAssigmentSelector = `div[class^="assignment-details-container__"]`;
const uploadButtonSelector = `button[data-test="attach-file"]`;
const uploadFromDeviceSelector = `label[data-test="filePicker-tab"]`

class Runner {
    constructor (args, done) {
        this.baseUrl = `https://teams.microsoft.com/_#/school/classroom/General?threadId=${args.teamsID}@thread.tacv2&ctx=channel`;
        this.started = false;
        this.args = args;
        this.done = done;
    }

    async #error (msg) {
        console.error(`ERROR: ${msg}`);
        await this.browser.close();
        process.exit(1);
    }

    #log (msg) {
        console.log(`[PPTR] ${msg}`);
    }

    async launch () {
        this.#log("Starting ...");

        //launch browser
        this.browser = await puppeteer.launch({
            headless: false,
            userDataDir: "./.cookies"
        });
        this.page = await this.browser.newPage();

        //handle page changes
        this.page.on("load", () => {
            this.#pageLoad();
        })

        //open teams url
        await this.page.goto(this.baseUrl);
    }

    async #pageLoad () {
        //await new Promise(resolve => setTimeout(resolve, 5000));

        if (this.page.url().slice(8).startsWith("teams.microsoft.com/_#/school") && !this.started) {
            this.started = true;
            await this.#determineFrame();
        }
    }

    async #determineFrame () {
        this.#log("Determining frame ...");

        this.assignmentFrame = await this.page.waitForFrame(async (frame) => {
            try {
                let expected = await frame.$("html > head > title");
                if (expected === null) return false;

                return (await expected.evaluate(e => e.textContent)).includes("Assignments");
            } catch (e) {
                return false;
            }
        }, {
            timeout : 0
        });

        //select the current assigment after determining the frame
        await this.#selectAssignment();
    }

    async #selectAssignment () {
        this.#log("Opening assignment ...");
        await this.assignmentFrame.waitForSelector(assignmentSelector);
        await new Promise(resolve => setTimeout(resolve, 2000));

        let assignments = await this.assignmentFrame.$$(assignmentSelector);
        if (assignments.length === 0) await this.#error("Could not find any assignments");

        if (assignments.length === 1) {
            await assignments[0].click();
        }

        if (assignments.length > 1) {
            let titles = [];

            for (let i = 0; i < assignments.length; i++) {
                titles.push(
                    (await assignments[i].evaluate(e => e.textContent))
                        .split("•")[0]
                        .toLowerCase()
                        .replaceAll(" ", "")
                );
            }

            let search = this.args.projectName.toLowerCase().replaceAll(" ", "");
            let targetIndex = titles.findIndex((e => e.includes(search) || search.includes(e)));

            if (targetIndex === -1) {
                this.#log("Waiting for the user to select an assigment as none could be determined automatically ... ");
            } else {
                await assignments[targetIndex].click();
            }
        }

        await this.#uploadFiles();
    }

    async #uploadFiles () {
        await this.assignmentFrame.waitForSelector(openedAssigmentSelector, {
            timeout : 0
        });

        this.#log("Uploading files to assigment ...");

        let button = await this.assignmentFrame.waitForSelector(uploadButtonSelector);
        await button.click();

        let uploadFromDevice = await this.assignmentFrame.waitForSelector(uploadFromDeviceSelector);
        await uploadFromDevice.click();

        let fileChooser = await this.page.waitForFileChooser();
        await fileChooser.accept(this.args.zipPath);
        fs.unlinkSync(this.args.zipPath);
    }
}

module.exports = Runner;