# Simple zip manager

Is a simple CLI tool to compress and extract files.

## Installation

```bash
npm install -g @danixl30/zipcli
```

## Usage

### Extract

You can extract ZIP, RAR, 7z and tar.gz files. If the file don't specify the extension you can choose one of these extractors.

To extract file use. 

```bash
zipm e --file {FILE_PATH} --p {PASSWORD_OPTIONAL} --o {OUTPUTDIR_OPTIONAL}
```
```--p``` Is for password it's optional.

```--o``` Is for alternative output dir it's optional for default use the working directory. 

 ```--file``` Pass the name of the file to extract

### Compress

You can compress dir to ZIP, RAR and 7z  file. These script will compress all files at directory.

To compress file use. 

```bash
zipm c --path {DIR_PATH_OPTIONAL} --type {COMPRESSION_TYPE_OPTIONAL} --o {OUTDIR_OPTIONAL}
```
```--path``` You can specify custom path to compress. If you don't specify the path will use working directory.

```--o``` Is for alternative output dir it's optional for default use the working directory. 

 ```--type``` You can specify which type of file do you want like ZIP, RAR or 7z. If you don't pass the program will ask you.

