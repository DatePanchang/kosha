const m2j = require("markdown-to-json");
const core = require("@actions/core");
// const github = require("@actions/github");
const fs = require("fs");
const Handlebars = require("handlebars");
const customFileUtils = require("./customFileUtils");
const path = require("path");

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
          (fileName.includes(".md") || fileName.includes(".jpg") || fileName.includes(".png"))
        )
      : process.argv[2].replace("[", "").replace("]", "").split(",");

  console.log("FileNames: ", fileNames);

  const filteredFileNames = fileNames.filter(
    (fileName) => fs.existsSync(fileName) && fileName.includes(".md")
  );

  function trimName(name) {
    return name.substr(name.indexOf("src/") + 4);
  }

  const deletedFileNames = fileNames
    .filter(
      (fileName) =>
        !fs.existsSync(fileName) &&
        (fileName.includes(".md") ||
          fileName.includes(".jpg") ||
          fileName.includes(".png"))
    )
    .map((fileName) => trimName(fileName).replace(".md", ".html"));

  await customFileUtils.makeDir("rendered/");

  fileNames
    .filter(
      (fileName) =>
        fs.existsSync(fileName) &&
        (fileName.includes(".jpg") || fileName.includes(".png"))
    )
    .forEach(async (fileName) => {
      await customFileUtils.makeDir(
        "rendered/" + trimName(fileName)
      );
      fs.copyFile(
        path.normalize(__dirname + "/" + trimName(fileName)),
        path.normalize(
          __dirname + "/rendered/" + trimName(fileName)
        ),
        (err) => {
          if (err) throw err;
          console.log("image copied to destination");
        }
      );
    });

  var parsedJsons = filteredFileNames.map((fileName) => {
    var jsonString = JSON.parse(m2j.parse([fileName], {}));

    return { [trimName(fileName)]: Object.values(jsonString)[0] };
  });

  parsedJsons.forEach(async (parsedJson) => {
    const template = Handlebars.compile(templateHTMLAsString);
    console.log(template(Object.values(parsedJson)[0]));

    await customFileUtils.makeDir(
      "rendered/" + Object.keys(parsedJson)[0]
    );

    const fileNameForWriting =
      __dirname +
      "/rendered/" +
      Object.keys(parsedJson)[0].replace(".md", ".html");
    fs.writeFile(
      fileNameForWriting,
      template(Object.values(parsedJson)[0]),
      function (err) {
        if (err) throw err;
        console.log(Object.values(parsedJson)[0], "Saved!");
      }
    );
    // return {
    //   [Object.keys(parsedJson)[0]]: template(Object.values(parsedJson)[0]),
    // };
  });

  core.setOutput("deletedFileNames", deletedFileNames);
  // core.setOutput("parsedHtmls", parsedHtmls);
  // core.setOutput("changedImages", changedImages);
}
