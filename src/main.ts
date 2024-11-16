#! /usr/bin/env node
import { compressWorker } from './compress.js'
import { extractWorker } from './extract.js'

if (process.argv.includes('c')) await compressWorker()
else if (process.argv.includes('e')) await extractWorker()
else throw new Error('Unvalid mode')
