const m2j = require("markdown-to-json");
const core = require("@actions/core");
const github = require("@actions/github");

var jsonString = m2j.parse(process.argv.slice(2), {});

console.log(jsonString);
