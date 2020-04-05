import resolve from "@rollup/plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";
import pkg from "./package.json";

export default {
  input: "src/index.ts",
  output: [
    {
      file: pkg.main,
      format: "umd",
      name: "slot"
    },
    {
      file: pkg.module,
      format: "es",
      name: "slot"
    }
  ],
  plugins: [
    typescript({
      typescript: require("typescript")
    }),
    resolve()
  ]
};
