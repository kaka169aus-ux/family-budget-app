var port = process.env.PORT || "8081";
process.chdir(__dirname);
require("child_process").spawn(
  process.execPath,
  [__dirname + "/node_modules/expo/bin/cli", "start", "--web", "--port", port],
  { stdio: "inherit", cwd: __dirname, env: { ...process.env, PATH: "/opt/homebrew/bin:" + (process.env.PATH || "") } }
);
