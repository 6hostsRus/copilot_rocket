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
];
