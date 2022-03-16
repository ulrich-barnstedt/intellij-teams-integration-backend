const AdmZip = require("adm-zip");
const glob = require("glob-gitignore").glob;

class ZipCompressor {
    constructor (args) {
        this.args = args;
    }

    async compress () {
        let zip = new AdmZip();

        let files = await glob(["**"], {
            cwd : this.args.projectDir,
            nodir : true,
            dot : true,
            ignore : [
                "*.class",
                //".idea"
            ]
        });

        for (let file of files) {
            let internalPath = file.includes("/") ? file.split("/").slice(0, -1).join("/") : "";
            zip.addLocalFile(`${this.args.projectDir}/${file}`, internalPath);
        }

        await new Promise(resolve => zip.writeZip(this.args.zipPath, () => resolve()));
    }
}

module.exports = ZipCompressor;