/*
 * This file includes various necessary utilities & build tools for the generator. 
 * Copyright (c) 2023 AmazinAxel (Alec) <amazinaxel.com>
 * This program is licensed under the GPLv3.
 */

// REMINDER: Make sure to make a new Alecshome logo, we're using the AmazinAxel logo currently

import fs from 'fs'; // Filesystem dependency
import { marked } from 'marked'; // Markdown parser
import dayjs from 'dayjs'; // Main date & time converter
import * as Sqrl from 'squirrelly'; // Templating engine
Sqrl.defaultConfig.async = true;

export const ordinal = (number) => { // Get time ordinal from number
  const suffix = ['th', 'st', 'nd', 'rd']; // Add ordinal suffixes to array
  const day = number % 100; // Prepare variable for calculation
  return number + (suffix[(day - 20) % 10] || suffix[day] || suffix[0]); // Advanced calculation to create ordinal suffix
};

// Get all files within a directory that matches a file extension
export async function getFiles(dirPath, fileExt) {
     const dirents = fs.readdirSync(dirPath, { withFileTypes: true });
     return (
       dirents
         .filter(dirent => dirent.isFile() && dirent.name.endsWith(fileExt) && !dirent.name.includes('LICENSE')) // Get only the right files
         .map(dirent => dirent.name) // Return a list of file names
  );
}

// Deletes all previously generated files from the public directory
export async function purgePublicDir(dirPath, extensions) {
  const files = await fs.promises.readdir(dirPath); // Get all files within the public directory
  const fileNames = files.filter(file => extensions.includes(file.split('.').pop())); // Get only the files matching the passed extensions
  const filesToRemove = fileNames.map(fileName => fs.unlinkSync(dirPath + fileName)); // Remove the files passing the passed extensions
  return Promise.all(filesToRemove); // Return after waiting for all files to be removed
}

export async function getFromTemplate(templatePath, postData) {
  var header = await Sqrl.renderFile('./templates/header.sqrl', { 
    version: global.version, // Include cache busting version
    description: postData.description, // Include description for metadata
    title: postData.title, // Include title for metadata
    slug: postData.slug || postData.title // Include slug for header handling
  });
  var footer = await Sqrl.renderFile('./templates/footer.sqrl', {
    year: postData.year || global.year, // Include footer year if set by page, if not use current year
    version: global.version, // Include cache busting version
    genDate: global.genDate // Include footer generation date
   });
  const allPostData = { ...postData, header, footer, version: global.version }
  const template = await Sqrl.compile(fs.readFileSync(templatePath, 'utf-8'));
  return await template(allPostData, Sqrl.defaultConfig) // Returns as fileData
}

export function basename(path) { return path.split('.')[0]; } // Simply splits the '.' in the path and returns the first part
  
// Purge the entire directory of all files, regardless of the file extension
// This method removes EVERY file within this directory without running any checks, thereby making it faster & more efficent than removeFiles()
export function purgeDir(dirPath) {
  try {
      fs.mkdirSync(dirPath, {recursive: true}); // Make sure the directory exists
      fs.readdirSync(dirPath).forEach(file => { fs.rmSync(dirPath + file); }); // Remove each file in the directory
  } catch (error) { console.log(error); }
}

// Get all posts & return post data 
export async function getPosts(folder, isPage = null) {
  const fileNames = await getFiles(folder, '.md'); // List all markdown files within that directory
  const filesToRead = fileNames.map(fileName => fs.readFileSync(folder + fileName, 'utf-8')); // Read file data

  const fileData = await Promise.all(filesToRead); // Wait to finish reading files before moving on

  return fileNames.map((fileName, i) => parsePost(fileName, fileData[i], isPage)); // Return all post data with parsed content
};

// Simply turns Markdown to HTML with preset settings
export function markdownToHTML(markdown) { return marked(markdown, { mangle: false, headerIds: false }); } // Generate Markdown without warnings


// Parses post and returns metadata (using gray-matter), body, and the slug
export function parsePost(fileName, fileData, isPage) {
  const slug = basename(fileName); // Get slug from filename
  
  if (isPage) { return { body: fileData, slug }; } // Return just the body and slug
  const parsedData = fileData.split("|"); // Parse information split by |
  const title = parsedData[0]; // Get title from first object split by |
  const description = parsedData[1]; // Parse date
  const body = parsedData[2]; // Main item content

  return { title, body, description, slug }; // Return all metadata, body, and post slug
};

// Generates and saves the sitemap
export async function generateSitemap(url, publicDir) {
  const allLinks = await getFiles(publicDir, '.html'); // Initialize empty array for sitemap
  var sitemapContent = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">';
  sitemapContent = sitemapContent + '<url><loc>' + url + '</loc></url>'; // Add home URL
  
  for(const link of allLinks) { if (!link.includes('404')) { sitemapContent = sitemapContent + '<url><loc>' + url + '/' + link + '</loc></url>'; }} // Adds link to sitemap

  // Just a nice little comment for visitors checking out the sitemap 
  sitemapContent = sitemapContent + `</urlset>
<!--   If you are a human visitor, you should probably head back to my homepage over at ${url}   -->
<!--                 This page is intended for robots to help index my site so I can improve my SEO.                 -->`;

  fs.writeFileSync(publicDir + '/sitemap.xml', sitemapContent, 'utf-8'); // Save file

  return; // This is called as an async function so we have to return
}

/* Generates the split pages & saves the files */
const createSplitFile = async (post, dirPath, prefix, suffix, customMeta, description) => {
  const posts = post.body.toString().split('~~'); // Parse all posts divided by ~~
  let fileData; let postObjects; // Initalize variables outside the if/else statement
  
  if (customMeta) { // If metadata is set, use this meta parser
    const parsedItems = posts.map(post => post.split("|")); // Parse all posts split by |
    postObjects = parsedItems.map(item => ({ // Map all items to the post
      title: item[0], // Get title from first object split by |
      date: `${dayjs(new Date(item[1])).format('MMM')} ${ordinal(dayjs(new Date(item[1])).date())}, ${dayjs(new Date(item[1])).format('YYYY')}`, // Parse date
      badge: item[2], // Add badge from 3rd object split by |
      content: markdownToHTML(item[3]) // Render Markdown to HTML
    }));
    fileData = await getFromTemplate('templates/posts.sqrl', { // Render page using the template
      posts: postObjects, // All posts with metadata
      prefix, // Header prefix
      suffix, // Header suffix
      customMeta, // Pass the customMeta variable to let Squirrelly know to render the posts with extra options
      slug: post.slug, // The post slug will let Squirrelly know what page this is (for header purposes)
      title: prefix + post.slug + ' ' + suffix, // The title will be shown on the page metadata to increase SEO
      description, // This will be shown in the page metadata to increase SEO
      year: post.slug, // This will show the year the post was made on the footer
    });
  } else {
    postObjects = posts.map(post => ({ content: markdownToHTML(post) })) // Render all posts to markdown
  
    fileData = await getFromTemplate('templates/posts.sqrl',  { // Render page using the template
      posts: postObjects, // All posts with metadata
      prefix, // Header prefix
      suffix, // Header suffix
      slug: post.slug, // The post slug will let Squirrelly know what page this is (for header purposes)
      title: prefix + post.slug + ' ' + suffix, // The title will be shown on the page metadata to increase SEO
      description, // This will be shown in the page metadata to increase SEO
      year: post.slug, // This is important! This will show the year the item was made on the footer
    });
  }
  
  fs.writeFileSync(dirPath + post.slug + '.html', fileData, 'utf-8');
  return postObjects.length;
};


// SWR post builder, containing everything needed to build the SWR index and all SWR pages
export async function buildSWRPosts(swrDir, publicSWRDir, publicDir) {
  // NOTE: If there are bugs rendering too many SWR posts, we may need to add an async version to keep it all inline!
  
  // Generates the SWR index
  // Get all SWR files in the SWR directory and adds them all to an index file
  async function buildSWRIndex() {
    let fileNames = await getFiles(swrDir, '.md'); // List all markdown files within that directory
    fileNames.reverse() // Reverse order list because it's opposite by default
    const items = []; // Initalize SWR item array
    for (let file of fileNames) { items.push(basename(file)); } // Add all SWR URLs to an array
    const fileData = await getFromTemplate('templates/list.sqrl', { // Generate template
      items,
      title: 'SWR Index',
      description: "Each week on Monday, I make a post about what I've done that past week. See my latest SWR (stuff wrap-up) posts here!",
      prefix: "SWR",
      slug: "swr",
      suffix: ""
    });

    fs.writeFileSync(publicDir + 'swr.html', fileData, 'utf-8'); // Push file
  }

  let totalPosts = 0; // Initalize variable
  const posts = await getPosts(swrDir, 'page'); // Get all SWR posts

  // Create SWR post files
  for (const post of posts) { totalPosts += await createSplitFile(post, publicSWRDir, 'SWR', 'Posts', false, "SWR posts from " + post.slug + ". This is where I update visitors of what I've been working on."); }

  await buildSWRIndex();
  console.log(`[AxelSSG] Finished building the SWR index and ${posts.length} SWR pages containing a total of ${totalPosts} SWR posts.`);
  return; // This is called as an async function so we should return
}


// Builds the homepage, archives page index, and all archives
export async function buildAnnouncements(announcementsDir, publicAnnouncementsDir, publicDir, url, year) {
  
  // Gets the latest 5 announcements to be shown on the homepage and renders the RSS feed
  async function buildHomepageAnnouncements(announcementsDir, url) {
    const fileNames = await getFiles(announcementsDir, '.md'); // Get all files within the announcements dir
    const files = fileNames.reverse(); // Sort the newest files only
    const items = []; // Initalize array

    getLatestPosts: // This custom system only loads the necessary files in order to make the list
    for (const fileName of files) { // Loop as many times as needed to get the 5 posts
      const fileData = fs.readFileSync(announcementsDir + fileName, 'utf-8'); // Load file
      const filePosts = fileData.split('~~'); // Split the file into different posts
    for (let i in filePosts) { // Loop each post
      if (items.length < 5) { items.push(filePosts[i]); } // Add post to array
      else { break getLatestPosts; } // If there's already > 5 posts, break
      }
    }
    const parsedItems = items.map(post => post.split("|")); // Parse metadata

    const posts = parsedItems.map(item => ({ // Map parsed metadata
      title: item[0].replaceAll(/[\n\r]/g, '').trim(), // Get title from first item parsed from |
      date: `${dayjs(new Date(item[1])).format('MMM')} ${ordinal(dayjs(new Date(item[1])).date())}, ${dayjs(new Date(item[1])).format('YYYY')}`, // Parse date 
      badge: item[2], // Get post badge
      content: markdownToHTML(item[3]).replaceAll(/[\n\r]/g, '').trim() // Render Markdown to HTML
    }));
    
    const fileData = await getFromTemplate('templates/index.sqrl', { posts }); // Generate template & HTML
    fs.writeFileSync(publicDir + 'index.html', fileData, 'utf-8'); // Save data

    // Render RSS feed

    var rsscontent = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Alec's Latest Announcements</title>
    <link>${url}</link>
    <description>The latest announcements from AlecsHome.com!</description>
    <language>en-US</language>
    <copyright>Copyright ${year} AmazinAxel (Alec) | All Rights Reserved.</copyright>
    <atom:link href="https://${url}/rss.xml" rel="self" type="application/rss+xml"/>
`; // Create RSS header and basic metadata
      
    for(const post of posts) { // Loop through all 5 posts and add them to the feed
      post.content = post.content.replaceAll('&', 'and').replaceAll( /(<([^>]+)>)/ig, '').replaceAll(/[\n\r]/g, '').trim(); // Clean up post content
      post.title = post.title.replaceAll('&', 'and').replaceAll(/[\n\r]/g, '').trim(); // Clean up post title
      rsscontent = rsscontent + `
    <item>
      <title>${post.title}</title>
      <link>${url}</link>
      <description>${post.content}</description>
    </item>`; }
    
    rsscontent = rsscontent + `
  </channel>
</rss>`; // Add the RSS footer
    fs.writeFileSync(publicDir + '/rss.xml', rsscontent, 'utf-8'); // Save the file
    
    return; // This is called as an async function so we should return
  }

    /* Generates the announcements archive index */
    async function buildAnnouncementsArchive() {
      // Get all announcement files in the announcements directory and print them to the index
      let fileNames = await getFiles(announcementsDir, '.md'); // List all markdown files within that directory
      fileNames.reverse() // Reverse order list because it's opposite by default
      const items = []; // Initalize announcements array
      for (let file of fileNames) { items.push(basename(file)); } // Add all the URLs to an array
  
      const fileData = await getFromTemplate('templates/list.sqrl', { // Generate Archives template
        items,
        title: 'Archives',
        description: "I've made many announcements over the years. See my archived & previous announcements here!",
        prefix: '',
        suffix: 'Announcements',
        slug: "archives",
      });
  
      fs.writeFileSync(publicDir + 'archives.html', fileData, 'utf-8'); // Push file
    }
  
    let totalAnnouncements = 0; // Initalize variable
    const posts = await getPosts(announcementsDir, 'page'); // Get all announcement posts
    await buildHomepageAnnouncements(announcementsDir, url); // Build the homepage
    // Create all archive pages
    for (const post of posts) { totalAnnouncements += await createSplitFile(post, publicAnnouncementsDir, '', 'Announcements', true, 'My personal announcements from ' + post.slug + '.'); }

    await buildAnnouncementsArchive(); // Build the archive index
    console.log(`[AxelSSG] Finished building the homepage, RSS feed, and ${posts.length} archive pages containing a total of ${totalAnnouncements} previous announcements.`);
    return; // This is called as an async function so we should return
}