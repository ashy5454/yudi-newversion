// import { dirname } from "path";
// import { fileURLToPath } from "url";
// import { FlatCompat } from "@eslint/eslintrc";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const compat = new FlatCompat({
//   baseDirectory: __dirname,
// });

// const eslintConfig = [
//   // ...compat.extends("next/core-web-vitals", "next/typescript"),
//   ...compat.config({
//     extends: ['next/core-web-vitals', 'next/typescript'],
//     rules: {
//       'react/no-unescaped-entities': 'off',
//       '@next/next/no-page-custom-font': 'off',
//     },
//   })
// ];

// export default eslintConfig;

// eslint.config.mjs
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.config({
    // Your extends might look like this based on the guide:
    extends: [
      'next/core-web-vitals',
      'next/typescript'
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/exhaustive-deps": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "prefer-const": "off",
      "no-var": "off",
      "@next/next/no-img-element": "off",
      "@typescript-eslint/no-unused-vars": "off"
    },
  }),
];

export default eslintConfig;