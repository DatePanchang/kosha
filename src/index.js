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

  function trimName(name) {
    return name.substr(name.indexOf("src/") + 4);
  }

  fileNames =
    process.argv[2].includes("template.html") ||
    process.argv[2].includes("index.js") ||
    process.argv[2].includes(".yml")
      ? (await customFileUtils.getFiles(__dirname)).filter(
          (fileName) =>
            fileName.includes(".md") ||
            fileName.includes(".jpg") ||
            fileName.includes(".png") ||
            fileName.includes(".html")
        )
      : process.argv[2].replace("[", "").replace("]", "").split(",");

  console.log("FileNames: ", fileNames);

  await customFileUtils.makeDir("rendered/");

  console.log("After mkdir -----------");

  const existingHtmls = fileNames.filter(
    (fileName) => fs.existsSync(fileName) && fileName.includes(".html")
  );

  console.log("existingHtmls: ", existingHtmls);

  var copyHtmlPromises = existingHtmls.map(async (htmlFileName) => {
    await customFileUtils.makeDir("rendered/" + trimName(htmlFileName));
    fs.copyFile(
      path.normalize(__dirname + "/" + trimName(htmlFileName)),
      path.normalize(__dirname + "/rendered/" + trimName(htmlFileName)),
      (err) => {
        if (err) throw err;
        console.log("html copied to destination");
      }
    );
    console.log("Copied file: ", htmlFileName);

    // var htmlImgFileName = htmlFileName.replace(".html", ".jpg");
    // fs.copyFile(
    //   path.normalize(
    //     __dirname +
    //       "/" +
    //       trimName(
    //         fs.existsSync(trimName(fileName))
    //           ? htmlFileName.replace(".html", ".jpg")
    //           : htmlFileName.replace(".html", ".png")
    //       )
    //   ),
    //   path.normalize(__dirname + "/rendered/" + trimName(htmlFileName)),
    //   (err) => {
    //     if (err) throw err;
    //     console.log("html copied to destination");
    //   }
    // );
  });

  await Promise.all(copyHtmlPromises);

  console.log("Copied all html files --------- ");

  const filteredFileNames = fileNames.filter(
    (fileName) => fs.existsSync(fileName) && fileName.includes(".md")
  );

  console.log("filteredFileNames: ", filteredFileNames);

  

  const deletedFileNames = fileNames
    .filter(
      (fileName) =>
        !fs.existsSync(fileName) &&
        (fileName.includes(".md") ||
          fileName.includes(".jpg") ||
          fileName.includes(".png"))
    )
    .map((fileName) => trimName(fileName).replace(".md", ".html"));

  console.log("deletedFileNames: ", deletedFileNames);

  var copyImagesPromises = fileNames
    .filter(
      (fileName) =>
        fs.existsSync(fileName) &&
        (fileName.includes(".jpg") || fileName.includes(".png"))
    )
    .map(async (fileName) => {
      await customFileUtils.makeDir("rendered/" + trimName(fileName));
      fs.copyFile(
        path.normalize(__dirname + "/" + trimName(fileName)),
        path.normalize(__dirname + "/rendered/" + trimName(fileName)),
        (err) => {
          if (err) throw err;
          console.log("image copied to destination");
        }
      );
      console.log("Copied file: ", fileName);
    });

  await Promise.all(copyImagesPromises);

  console.log("Copied all image files --------- ");

  var parsedJsons = filteredFileNames.map((fileName) => {
    var jsonString = JSON.parse(m2j.parse([fileName], {}));

    return { [trimName(fileName)]: Object.values(jsonString)[0] };
  });

  var writeHtmlPromises = parsedJsons.map(async (parsedJson) => {
    const template = Handlebars.compile(templateHTMLAsString);

    console.log("parsedJson: ", parsedJson);

    await customFileUtils.makeDir("rendered/" + Object.keys(parsedJson)[0]);

    const fileNameForWriting =
      __dirname +
      "/rendered/" +
      Object.keys(parsedJson)[0].replace(".md", ".html");
    const json = Object.values(parsedJson)[0];

    if (json.long) {
      json.long = json.long.split("\n");
    }

    if (json.short) {
      json.short = json.short.split("\n");
    }

    fs.writeFile(fileNameForWriting, template(json), function (err) {
      if (err) throw err;
      console.log(json, "Saved!");
    });
    // return {
    //   [Object.keys(parsedJson)[0]]: template(Object.values(parsedJson)[0]),
    // };
  });

  console.log("writeHtmlPromises: ", writeHtmlPromises);

  await Promise.all(writeHtmlPromises);

  console.log("Written all html files --------- ");

  core.setOutput("deletedFileNames", deletedFileNames);
  // core.setOutput("parsedHtmls", parsedHtmls);
  // core.setOutput("changedImages", changedImages);
}
