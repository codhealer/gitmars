const path = require('path')
const { pwd, gitUrl } = require('./global')
const readPkg = require('./readPkg')

/**
 * getHookComment
 * @description 生成hook注释，广告
 * @returns {Object} arr 返回对象
 */
function getHookComment() {
	// const pkgHomepage = process.env.npm_package_homepage
	const { author, homepage: gitmarsHomepage, version: gitmarsVersion } = readPkg(path.join(__dirname, '../..'))
	const createdAt = new Date().toLocaleString()
	return `# Created by gitmars v${gitmarsVersion} (${gitmarsHomepage})
# author: ${author}
# At: ${createdAt}
# From: ${pwd} (${gitUrl})`
}

module.exports = getHookComment
