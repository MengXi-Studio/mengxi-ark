#!/usr/bin/env node
import { run } from '../dist/index.js'

run().catch(error => {
	console.error('[create-mengxi-ark] 执行异常', error)
	process.exitCode = 1
})
