/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://feasibility-study-saas.vercel.app',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
}
