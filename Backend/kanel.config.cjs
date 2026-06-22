/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
/** @type {import('kanel').Config} */
require('dotenv').config();

module.exports = {
  connection: process.env.DATABASE_URL,
  outputPath: './src/db/types',
  preDeleteOutputFolder: true,
  enumStyle: 'type',
};
