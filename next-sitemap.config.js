/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://feasibilitysuite.com',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: ['/dashboard*', '/admin*', '/api*', '/workspace*', '/tools/*/start', '/invite*', '/auth*', '/tool/*'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard*', '/admin*', '/api*', '/workspace*', '/tools/*/start', '/tool/steps/*', '/invite*', '/auth*'],
      }
    ]
  },
  transform: async (config, path) => {
    let priority = config.priority;
    let changefreq = config.changefreq;
    
    if (path === '/') {
      priority = 1.0;
      changefreq = 'weekly';
    } else if (['/pricing', '/features', '/about', '/about-platform', '/contact'].includes(path)) {
      priority = 0.8;
      changefreq = 'monthly';
    }

    return {
      loc: path,
      changefreq: changefreq,
      priority: priority,
      lastmod: new Date().toISOString(),
      alternateRefs: config.alternateRefs ?? [],
    }
  },
}
