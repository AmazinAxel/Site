/*
 * This is the main script handler and handles the building of the site.
 * Copyright (c) 2023 AmazinAxel (Alec) <amazinaxel.com>
 * This program is licensed under the GPLv3.
 */

import fs from 'fs'; // Filesystem library
import dayjs from 'dayjs'; // Main date & time converter
import * as utils from './utils.js'; // Various utilities required within the program

const publicDir = 'public/'; // Pointer to the main content output directory
const year = new Date().getFullYear(); // Get current year for the footer

// Site URL for easily updating where the current live site should be
if (typeof CF_PAGES_URL !== 'undefined') { var url = CF_PAGES_URL; } else { var url = "https://alecshome.com"; }

global.year = year; // Footer year
global.version = '?v1.4'; // Cache busting version, update after CSS or JS changes
// There might be problems with this being an hour ahead or behind (daylight savings)
const currDate = dayjs(); // Initalize current day using Day.js
global.genDate = `${currDate.format('dddd, MMMM')} ${utils.ordinal(currDate.date())}, ${currDate.format('YYYY [at] h:mm A')}.`; // Include generation date

// Turns HTML to markdown, generates a template, and saves the file

export const createPage = async (post, dirPath) => {
  const fileData = await utils.getFromTemplate('templates/page.sqrl', { // Render HTML
    post, // Contains all post metadata
    body: utils.markdownToHTML(post.body), // Turn content to markdown
    year: global.year, // Create the page using the global year
    version: global.version, // Include cache busting version
    genDate: global.genDate, // Include footer generation date
    slug: post.title.trim(), // Remove the whitespace from the slug
    title: post.title, // Include the page title from metadata
    description: post.description, // Include the page description from metadata
  });

  fs.writeFileSync(dirPath + '/' + post.slug + '.html', fileData, 'utf-8'); // Save the file
  return post; // Once finished, return
};

// Main build script
const build = async () => {
  // Delete any previously-generated HTML & XML files in the public directory
  await utils.purgePublicDir(publicDir, ['.xml', '.html']); // Removes all previously generated files from the public directory
  await utils.purgeDir('public/swr/'); // Purge previous SWR files
  await utils.purgeDir('public/archives/'); // Purge all previous announcements

  const contentItems = await utils.getPosts('content/'); // Get all pages in the content directory
  const generatedContent = contentItems.map(post => createPage(post, publicDir)); // Create page

  await utils.buildSWRPosts('content/swr/', 'public/swr/', publicDir); // Build all SWR posts + SWR index
  await utils.buildAnnouncements('content/announcements/', 'public/archives/', publicDir, url); // Build archive index, archive pages and homepage
  await utils.generateSitemap(url, publicDir); // Build website sitemap
  return generatedContent.length; // Return how many posts were created
};

console.log('[AxelSSG] Starting build process...')
build().then(total => console.log('[AxelSSG] Build successful. Generated ' + total + ' pages.')) // Finished!
       .catch(err => console.error(err)); // Log any errors, don't fail silently
