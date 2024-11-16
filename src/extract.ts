#! /usr/bin/env node
import { join, parse } from 'node:path'
import decompress from 'decompress'
import decompressTargz from 'decompress-targz'
import inquirer from 'inquirer'
import { createSpinner } from 'nanospinner'
import Seven from 'node-7z'
import { createExtractorFromFile } from 'node-unrar-js'
import yargs from 'yargs'

const argsProm = yargs(process.argv)
	.options({
		file: {
			type: 'string',
		},
		o: {
			type: 'string',
		},
		p: {
			type: 'string',
		},
	})
	.parse()

type Extractor = (
	filename: string,
	dest: string,
	pass?: string,
) => Promise<void>

const zipExtractor = async (filename: string, dest: string, _pass?: string) => {
	await decompress(filename, dest)
}

const rarExtractor = async (filename: string, dest: string, pass?: string) => {
	const extractor = await createExtractorFromFile({
		filepath: filename,
		targetPath: dest,
		password: pass,
	})
	;[
		...extractor.extract({
			files: () => true,
			password: pass,
		}).files,
	]
}

const z7Extractor: Extractor = async (filename, dest, pass) => {
	const { promise, resolve, reject } = Promise.withResolvers<void>()
	const stream = Seven.extractFull(filename, dest, {
		password: pass,
	})
	stream.on('error', (error) => reject(error))
	stream.on('end', () => resolve())
	return promise
}

const tarGzExtractor: Extractor = async (filename, dest, _pass) => {
	await decompress(filename, dest, {
		plugins: [decompressTargz()],
	})
}

const extractStrategySelector = (filename: string): Extractor | undefined => {
	const normalizedFilename = filename.toLowerCase()
	if (normalizedFilename.endsWith('.zip')) {
		return zipExtractor
	}
	if (normalizedFilename.endsWith('.rar')) return rarExtractor
	if (normalizedFilename.endsWith('.7z')) return z7Extractor
	if (normalizedFilename.endsWith('.tar.gz')) return tarGzExtractor
}

const getExtractorFromCLI = async () => {
	const strategy = await inquirer.prompt({
		message: 'Select one strategy to extract',
		type: 'list',
		name: 'strategy',
		choices: ['ZIP', 'RAR', '7z', 'TarGz'],
	})
	const strategies: Record<string, Extractor> = {
		ZIP: zipExtractor,
		RAR: rarExtractor,
		['7z']: z7Extractor,
		TarGz: tarGzExtractor,
	}
	return strategies[strategy.strategy] || zipExtractor
}

const getDirName = (filename: string) => parse(filename).name

export async function extractWorker() {
	const args = await argsProm
	const filename: string = args.file!
	let extractor = extractStrategySelector(filename)
	if (!extractor) extractor = await getExtractorFromCLI()
	const finalDir = args.o
		? join(process.cwd(), args.o)
		: join(
				process.cwd(),
				getDirName(
					filename.replaceAll('\\', '/').split('/').at(-1) || '',
				),
			)
	const spinner = createSpinner().start()
	try {
		await extractor(join(process.cwd(), filename), finalDir, args.p)
		spinner.success('File extracted')
	} catch (error) {
		spinner.error('Error during extract file')
		console.error(error)
	}
}
