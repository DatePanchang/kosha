const m2j = require("markdown-to-json");
const core = require("@actions/core");
// const github = require("@actions/github");
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

let templateHTMLAsString = fs.readFileSync(
  path.resolve(__dirname, "./template/template.html"),
  "utf8"
);

var fileNames = process.argv[2].replace("[", "").replace("]", "").split(",");

var parsedJsons = fileNames.map((fileName) => {
  var jsonString = JSON.parse(m2j.parse([fileName], {}));

  return { [fileName]: Object.values(jsonString)[0] };
});

console.log(parsedJsons);

var parsedHtmls = parsedJsons.map((parsedJson) => {
  const template = Handlebars.compile(templateHTMLAsString);
  console.log(template(Object.values(parsedJson)[0]));
  return {
    [Object.keys(parsedJson)[0]]: template(Object.values(parsedJson)[0]),
  };
});

console.log(parsedHtmls);

core.setOutput('parsedHtmls', parsedHtmls);
