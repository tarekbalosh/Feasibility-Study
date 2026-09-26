/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://feasibility-study-saas.vercel.app',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: ['/dashboard*', '/admin*', '/api*', '/workspace*', '/tool*', '/tools*', '/invite*'],
  transform: async (config, path) => {
    let priority = config.priority;
    let changefreq = config.changefreq;
    
    if (path === '/') {
      priority = 1.0;
      changefreq = 'weekly';
    } else if (['/pricing', '/features', '/about', '/contact'].includes(path)) {
      priority = 0.8;
      changefreq = 'monthly';
    } else if (path.startsWith('/auth')) {
      priority = 0.5;
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
