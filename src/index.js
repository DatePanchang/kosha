const m2j = require("markdown-to-json");
const core = require("@actions/core");
// const github = require("@actions/github");
const fs = require("fs");
const Handlebars = require("handlebars");
const customFileUtils = require("./customFileUtils");

main();

async function main() {

  const templateFilePath = "src/template/template.html";
  if (!fs.existsSync(templateFilePath)) {
    throw Error("Template HTML doesnt exist");
  }

  let templateHTMLAsString = fs.readFileSync(templateFilePath, "utf8");

  var fileNames = ["asd"];

  fileNames =
    process.argv[2].includes("template.html") ||
    process.argv[2].includes("index.js")
      ? (await customFileUtils.getFiles(__dirname)).filter((fileName) =>
          fileName.includes(".md")
        )
      : process.argv[2].replace("[", "").replace("]", "").split(",");

  console.log("FileNames: ", fileNames);

  const filteredFileNames = fileNames.filter(
    (fileName) => fs.existsSync(fileName) && fileName.includes(".md")
  );

  function trimPath(arr) {
    return arr.map((arrItem) => arrItem.substr(arrItem.indexOf("src/") + 4));
  }

  

  const deletedFiles = trimPath(
    fileNames.filter(
      (fileName) =>
        !fs.existsSync(fileName) &&
        (fileName.includes(".md") ||
          fileName.includes(".jpg") ||
          fileName.includes(".png"))
    )
  ).map((fileName) => fileName.replace(".md", ".html"));

  var parsedJsons = filteredFileNames.map((fileName) => {
    var jsonString = JSON.parse(m2j.parse([fileName], {}));
    var index = fileName.indexOf("src/");
    var propName = fileName.substr(index + 4);
    return { [propName]: Object.values(jsonString)[0] };
  });

  var changedJPGs = trimPath(
    fileNames.filter(
      (fileName) =>
        fs.existsSync(fileName) &&
        (fileName.includes(".jpg") || fileName.includes(".png"))
    )
  );

  var parsedHtmls = parsedJsons.map((parsedJson) => {
    const template = Handlebars.compile(templateHTMLAsString);
    console.log(template(Object.values(parsedJson)[0]));
    return {
      [Object.keys(parsedJson)[0]]: template(Object.values(parsedJson)[0]),
    };
  });

  console.log("parsedHtmls: ", parsedHtmls);

  core.setOutput("deletedFiles", deletedFiles);
  core.setOutput("parsedHtmls", parsedHtmls);
  core.setOutput("changedJPGs", changedJPGs);
}
