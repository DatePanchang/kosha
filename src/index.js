const m2j = require("markdown-to-json");
const core = require("@actions/core");
// const github = require("@actions/github");
const fs = require("fs");
const Handlebars = require("handlebars");
const customFileUtils = require("./customFileUtils");

main();

async function main() {
  console.log("dirname--", __dirname);

  const templateFilePath = "src/template/template.html";
  if (!fs.existsSync(templateFilePath)) {
    throw Error("Template HTML doesnt exist");
  }

  let templateHTMLAsString = fs.readFileSync(templateFilePath, "utf8");

  var fileNames =
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

  const deletedFiles = fileNames
    .filter(
      (fileName) =>
        !fs.existsSync(fileName) &&
        (fileName.includes(".md") ||
          fileName.includes(".jpg") ||
          fileName.includes(".png"))
    )
    .map((fileName) => fileName.replace("src/", "").replace(".md", ".html"));

  var parsedJsons = filteredFileNames.map((fileName) => {
    console.log("FileName: ", fileName);
    var jsonString = JSON.parse(m2j.parse([fileName], {}));
    return { [fileName.replace("src/", "")]: Object.values(jsonString)[0] };
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

  core.setOutput("deletedFiles", deletedFiles);
  core.setOutput("parsedHtmls", parsedHtmls);
  core.setOutput("changedJPGs", changedJPGs);
}
