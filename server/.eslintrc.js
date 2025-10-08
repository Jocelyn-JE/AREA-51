module.exports = {
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    root: true,
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname
    },
    plugins: ["@typescript-eslint"],
    ignorePatterns: [".eslintrc.js", "init-mongo.js"],
    rules: {
        indent: ["error", 4],
        "@typescript-eslint/indent": ["error", 4]
    }
};
