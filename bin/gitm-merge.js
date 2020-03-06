#!/usr/bin/env node
const program = require('commander')
const sh = require('shelljs')
const { error, success, config, queue } = require('./index')
/**
 * gitm merge
 */
program
	.name('gitm merge')
	.usage('<name>')
	.arguments('<name>')
	.description('合并分支代码')
	.action(name => {
		let cmd = [
			{
				cmd: `git merge --no-ff ${name}`,
				config: { slient: false, again: false, success: '分支合并成功', fail: '合并失败，请根据提示处理' }
			},
			{
				cmd: `git push`,
				config: { slient: false, again: true, success: '推送成功', fail: '推送失败，请根据提示处理' }
			}
		]
		queue(cmd)
	})
program.parse(process.argv)
