#! /usr/bin/env node
import { Command } from 'commander'
import { compressWorker } from './compress.js'
import { extractWorker } from './extract.js'

const program = new Command()

let options: Record<string, string> = {}

program
	.command('compress')
	.alias('c')
	.version('2.0.0')
	.description('CLI tool to compress files')
	.option(
		'-p, --path <value>',
		'Path to compress, default is working directory',
	)
	.option(
		'-t, --type <value>',
		'Type of compression, options is RAR, ZIP and 7z',
	)
	.option(
		'-o, --out <value>',
		'Path for output, default is working directory with the name of the current dir',
	)
	.action((opts) => (options = opts))

program
	.command('extract')
	.alias('e')
	.version('2.0.0')
	.description('CLI tool to extract files')
	.option('-p, --password <value>', 'File password to extract (if needs)')
	.option('-f, --file <value>', 'Path to file to extract')
	.option(
		'-o, --out <value>',
		'Path for output, default is working directory with the name of the file without extension',
	)
	.action((opts) => (options = opts))

program.parse(process.argv)

const command = program.args[0]
if (command === 'c' || command === 'compress') await compressWorker(options)
else if (command === 'e' || command === 'extract') await extractWorker(options)
else program.outputHelp()
