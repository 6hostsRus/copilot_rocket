const markdownPlugin = require('eslint-plugin-markdown');

module.exports = [
  // ignore node_modules and build artifacts
  { ignores: ['node_modules/**', 'dist/**', 'coverage/**'] },

  // JS/ESM files
  {
    files: ['**/*.mjs', '**/*.js', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {},
  },
  // Markdown files processed by @eslint/markdown
  {
    files: ['**/*.md'],
    // register the markdown processor from eslint-plugin-markdown
    plugins: { markdown: markdownPlugin },
    processor: 'markdown/markdown',
  },
];
