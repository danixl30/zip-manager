#! /usr/bin/env node
import { spawn } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { join } from 'node:path'
import archiver from 'archiver'
import inquirer from 'inquirer'
import { createSpinner } from 'nanospinner'
import Seven from 'node-7z'

const formats = ['ZIP', 'RAR', '7z'] as const
type Format = (typeof formats)[number]

type Compressor = (path: string, out: string) => Promise<void>

const zipCompressor: Compressor = async (path, out) => {
	const { promise, resolve, reject } = Promise.withResolvers<void>()
	const output = createWriteStream(out)
	const archive = archiver('zip', { zlib: { level: 9 } })
	output.on('error', (error) => reject(error))
	output.on('finish', () => resolve())

	archive.pipe(output)

	archive.glob('**', {
		cwd: path,
		ignore: [out.replaceAll('\\', '/').split('/').at(-1)!],
	})

	archive.finalize()
	return promise
}

const rarCompressor: Compressor = async (path, out) => {
	const { promise, resolve, reject } = Promise.withResolvers<void>()
	const child = spawn(`rar`, ['a', '-r', out, '**'], {
		cwd: path,
	})
	child.on('exit', resolve)
	child.stdout.on('data', (_data) => {})
	child.on('error', reject)
	return promise
}

const z7Compressor: Compressor = async (path, out) => {
	const { promise, resolve, reject } = Promise.withResolvers<void>()
	const stream = Seven.add(out, path)
	stream.on('error', (error) => reject(error))
	stream.on('end', () => resolve())
	return promise
}

const createOutPath = (path: string, extension: string) =>
	join(path, path.replaceAll('\\', '/').split('/').at(-1) + extension)

const strategies: Record<
	Format,
	{
		extension: string
		worker: Compressor
	}
> = {
	ZIP: {
		extension: '.zip',
		worker: zipCompressor,
	},
	RAR: {
		extension: '.rar',
		worker: rarCompressor,
	},
	['7z']: {
		extension: '.7z',
		worker: z7Compressor,
	},
}

const getCompressorFromCLI = async () => {
	const strategy: {
		strategy: Format
	} = await inquirer.prompt({
		message: 'Select one strategy to compress',
		type: 'list',
		name: 'strategy',
		choices: formats,
	})
	return strategies[strategy.strategy] || strategies['ZIP']
}

export async function compressWorker(args: Record<string, string>) {
	const pathToCompress = args.path
		? join(process.cwd(), args.path)
		: process.cwd()
	const strategy =
		strategies[args.type as Format] || (await getCompressorFromCLI())
	const outPath = args.o
		? join(process.cwd(), args.o)
		: createOutPath(pathToCompress, strategy.extension)
	const spinner = createSpinner().start()
	try {
		await strategy.worker(pathToCompress, outPath)
		spinner.success('File compressed')
	} catch (error) {
		spinner.error('Error during compress file')
		console.error(error)
	}
}
