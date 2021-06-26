const m2j = require("markdown-to-json");
const core = require("@actions/core");
// const github = require("@actions/github");
const fs = require("fs");
const Handlebars = require("handlebars");
const recurrsiveRead = require("./recurrsiveRead");

console.log("dirname--", __dirname);

const templateFilePath = "./template/template.html";
if (!fs.existsSync(templateFilePath)) {
  throw Error("Template HTML doesnt exist");
}

let templateHTMLAsString = fs.readFileSync(templateFilePath, "utf8");

var fileNames =
  process.argv[2].includes("template.html") ||
  process.argv[2].includes("index.js")
    ? recurrsiveRead.walk(__dirname).filter((fileName) => fileName.includes(".md"))
    : process.argv[2].replace("[", "").replace("]", "").split(",");

console.log("FileNames: ", fileNames);

var parsedJsons = fileNames
  .filter((fileName) => fs.existsSync(fileName) && fileName.includes(".md"))
  .map((fileName) => {
    console.log("FileName: ", fileName);
    var jsonString = JSON.parse(m2j.parse([fileName], {}));
    return { [fileName]: Object.values(jsonString)[0] };
  });

var changedJPGs = fileNames.filter(
  (fileName) =>
    fs.existsSync(fileName) &&
    (fileName.includes(".jpg") || fileName.includes(".png"))
);

console.log("parsedJsons: ", parsedJsons);

var parsedHtmls = parsedJsons.map((parsedJson) => {
  const template = Handlebars.compile(templateHTMLAsString);
  console.log(template(Object.values(parsedJson)[0]));
  return {
    [Object.keys(parsedJson)[0]]: template(Object.values(parsedJson)[0]),
  };
});

console.log(parsedHtmls);

core.setOutput("parsedHtmls", parsedHtmls);
core.setOutput("changedJPGs", changedJPGs);
