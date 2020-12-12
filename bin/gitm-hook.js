#!/usr/bin/env node
const program = require('commander')
const fs = require('fs')
const sh = require('shelljs')
const { options, args } = require('./conf/build')
const { queue, success, warning, getCurrent, getLogs, compareVersion } = require('./js/index')
const { createHooks, removeHooks, createHookShell, removeHookShell, createLocalShell, removeLocalShell } = require('./js/hook')
const gitRevParse = require('./js/gitRevParse')
const getConfig = require('./js/getConfig')
const global = require('./js/global')
const { pwd, gitDir, gitHookDir } = require('./js/global')
const ora = require('ora')
const ciInfo = require('ci-info')

/**
 * gitm hook
 * gitm hook init
 * gitm hook test
 * gitm hook remove
 * gitm hook config
 */
program
	.name('gitm hook')
	.usage('[command]')
	.description('git hook钩子')
	.arguments('[command]')
	.option('--no-verify', '是否需要跳过校验权限', false)
	.option('-s, --since [since]', '查询在某个时间之后的日志，填写格式：10s/2m/2h/3d/4M/5y', '7d')
	.option('-l, --limit [limit]', '最多查询的日志条数')
	.option('-b, --branches [branches]', '要查询的分支')
	.action(async (command, opt) => {
		/**
		 * 1. 是否合并过dev post-merge
		 * 2. 1周内是否同步过上游分支代码
		 * 3. 主干分支推送的内容是否是merge内容，暂时只检测最后一条记录
		 * 4.
		 */
		const current = getCurrent()
		const config = getConfig()
		// 1. 获取是否合并过dev
		const getIsMergedBranch = (branch = 'dev') => {
			const result = sh.exec(`git branch --contains ${current}`, { silent: true }).stdout.replace(/[\n\s]*$/g, '')
			return result.split('\n').includes(branch)
		}
		// 2. 获取一周内是否同步过上游分支代码
		const getIsUpdatedInTime = () => {
			let isUpdated = false,
				mainVers = [],
				currentVers = []
			const mainLogs = getLogs({
				since: opt.since,
				limit: opt.limit,
				branches: opt.branches
			})
			const currentLogs = getLogs({
				since: opt.since,
				limit: opt.limit,
				branches: current
			})
			mainLogs.forEach(log => {
				mainVers.push(log['%H'])
			})
			currentLogs.forEach(log => {
				let arr = log['%P'] ? log['%P'].split(' ') : []
				arr.forEach(item => {
					currentVers.push(item)
				})
			})
			mainVer: for (let ver of mainVers) {
				if (currentVers.includes(ver)) {
					isUpdated = true
					break mainVer
				}
			}
			// console.log(current, mainLogs, currentLogs)
			console.log(mainVers, currentVers)
			return isUpdated
		}
		// 3. 获取主干分支推送的内容是否是merge内容，暂时只检测最后一条记录
		const getIsMergeAction = () => {
			const currentLogs = getLogs({
				limit: 1,
				branches: current
			})
			let p = currentLogs[0]['%P'] ? currentLogs[0]['%P'].split(' ') : []
			// console.log(currentLogs)
			return p.length > 1
		}
		// 4. 获取当前本地分支与远程分支的差别
		const getIsNeedPull = () => {
			sh.exec(`git fetch`, { silent: true })
			const result = sh.exec(`git log ${current}..origin/${current}`, { silent: true }).stdout.replace(/[\n\s]*$/g, '')
			return !!result
		}
		// 获取git版本
		const getGitVersion = () => {
			let version = sh
				.exec('git --version', { silent: true })
				.stdout.replace(/\s*$/g, '')
				.match(/[\d.?]+/g)
			if (!version) {
				sh.echo(warning('没有找到git'))
				sh.exit(1)
				return
			}
			version = version[0]
			return version
		}

		// 不检测直接返回
		if (opt.noVerify) {
			sh.exit(0)
			return
		}
		if (command === 'init') {
			// 初始化钩子
			const gitVersion = getGitVersion()
			const gitVersionIsNew = compareVersion(gitVersion, '2.13.0')
			const { prefix } = gitRevParse()
			// 集成环境不安装
			if (ciInfo.isCI && config.skipCI) {
				console.log('持续集成环境，跳过钩子安装')
				return
			}
			// 如果没有hooks文件夹，创建
			if (!fs.existsSync(gitHookDir)) {
				fs.mkdirSync(gitHookDir)
			}
			if (['1', 'true'].includes(process.env.GITMARS_SKIP_HOOKS || '')) {
				sh.echo(warning('已存在环境变量GITMARS_SKIP_HOOKS，跳过安装'))
				process.exit(0)
			}
			// git版本过旧
			if (!gitVersionIsNew) {
				sh.echo(warning('Gitmars需要使用2.13.0以上版本的Git，当前版本：' + gitVersion))
				process.exit(0)
			}
			createHooks(gitHookDir)
			createHookShell(gitHookDir)
			createLocalShell(gitHookDir, 'yarn', prefix)
		} else if (command === 'remove') {
			// 移除钩子
			removeHooks()
			removeHookShell()
			removeLocalShell()
		} else {
			// 检测权限
		}
		console.log('1. 当前分支是否合并过dev', getIsMergedBranch())
		console.log('2. 一周内是否同步过上游分支代码', getIsUpdatedInTime())
		console.log('3. 最后一条记录是否merge记录', getIsMergeAction())
		console.log('4. 是否需要pull代码', getIsNeedPull())
		console.log('gitm hook working!', gitHookDir)
		sh.exit(1)
	})
program.parse(process.argv)