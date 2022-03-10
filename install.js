const { exec } = require("child_process");
const proc = exec("npm install");

proc.stderr.setEncoding("utf-8");
proc.stdout.setEncoding("utf-8");

proc.stdout.on("data", (d) => console.log(d));
proc.stderr.on("data", (d) => console.log(d));