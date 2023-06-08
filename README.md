# [AlecsHome.com](https://alecshome.com)'s Custom Static Site Generator
This is the entire source code for [my personal website](https://alecshome.com). It also includes all of my posts & content. All of this stuff is hosted for free by [Cloudflare Pages](https://pages.cloudflare.com/). It's built with Node.js and is transformed into a static site at build time, making it fast, secure, and portable. It includes features that I find useful, such as yearly-organized posts which make this system suitable for handling a very large amount of posts quickly and easily.

# Why did I make this?
I wanted performance. I wanted sustainability. I wanted simplicity. So I made this generator that ticked all my requirements. It can handle hundreds of thousands of posts without a sweat. It's sustainable, it doesn't store each post in it's own file. Instead, it stores these posts in files organized yearly. It's future-proof, stable, and was made for speed (⚡It can build this site consistently under .1s on Cloudflare Pages!). It's simple, just write posts in Markdown, and it appears how you'd expect. It doesn't have any bloat or unnecessary features, just what I need to make a clean-looking website. It has only 3 dependencies, Squirrelly (for fast & light templating), Marked (for converting Markdown to HTML), and Day.js (a lightweight time library), adding up to a mega-lightweight, almost dependency-free system that should work for years to come. 

# Getting Started
First off, you'll need to make a Cloudflare Pages site. Name it whatever you'd like. Then, clone this repository to your account. Connect Cloudflare Pages with your GitHub account and add this site to Cloudflare Pages.

# Configuration
To make everything work properly with Cloudflare Pages, there's a bit of configuration you'll have to do. 
I recommend that you simply leave everything as default and click "Build Site" anyways. This is because there are many other options that aren't shown during this introduction menu. The build will fail, but that's okay. Just click "Continue Anyways". Now, head over to the Settings in your Cloudflare Pages site, and change the following settings:
* In the *Builds & Deployment* tab:
    - Change the "Build Command" to `node .`
    - Change the "Build Output Directory" to `public`
    - Change the "Configure Production build system" to `Version: 2`

* In the *Environment Variables* tab: 
    - Add the `TZ` variable containing your timezone, such as `America/Los_Angeles` (used for build time) under the Production environment

* In the *Functions* tab:
  - Add the `nodejs_compat` flag to the "Production Compatibility Flags"
  - The "Production Compatibility Date" should be on `Latest`, however you can use `2023-05-18` if you encounter any issues.

That's it! Wasn't too hard, was it? Now, simply go back to the 'Deployments' section in the Cloudflare Pages site and rebuild the site based off the previous version. Now, you have a fully functioning static site hosted for free on Cloudflare Pages!

# Local Development
I recommend VSCode for local development because it's lightweight and supports everything you'll need for development. You'll also need to install Node.js 18+ for your operating system. Setup the project how you'd like. Simply run `node .` to run the build tool, and all files will be generated in the public/ directory. If you want to develop with Wrangler to test server-side features such as the contact form, install Wrangler and run `npx wrangler pages dev public` to start the development server. 

# Important Usage Notice
My content is contained within this repository and it's copyrighted, so I would appreciate if you removed all my content contained within the `content` directory before you start redistributing this. Anyways, be creative with this and change the theme! With a bit of tweaking, you can make this feel like your own site quickly and easily.
