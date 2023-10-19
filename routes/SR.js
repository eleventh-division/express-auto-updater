import { Router } from "express"
import { createReadStream, readFileSync, statSync } from "fs"
import { resolve } from "path"
import sendRanges from "send-ranges"
import getMimeType from "../utils/getMimeType.js"
import { rateLimit, MemoryStore } from 'express-rate-limit'

const SR = Router()

function getOsFromFileName(fileName) {
  const splittedFileName = fileName.split('.')
  const extension = splittedFileName[splittedFileName.length - 1]
  const [, platform] = splittedFileName[0].split('-')

  switch (extension) {
    case 'yml':
      return platform
    case 'AppImage':
      return 'linux'
    case 'exe':
      return 'win16'
    case 'dmg':
      return 'darwin'
    default: {
      return null
    }
  }
}

const RLHandler = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many requests',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // store: new MemoryStore(),
  // handler: (request, response, next, options) => console.log(`${request}`),
  // response.status(options.statusCode).send(options.message),
  // keyGenerator: (request, response) => request.connection.remoteAddress.match(/((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)(\.(?!$)|$)){4}/)[0],
  // skip: (request, response) => allowlist.includes(request.ip),
})

SR.get('/:filename',
  RLHandler,
  sendRanges(retrieveFile, {
    maxRanges: Number.MAX_SAFE_INTEGER,
  }),
  async (req, res, next) => {
    const fileName = req.params.filename
    console.log(req.params.filename)
    const os = getOsFromFileName(fileName)
    if (!os) {
      // res.statusMessage = `OS ${platform} for filename ${fileName} is not found`
      res.statusMessage = `OS for filename ${fileName} is not found`
      return res.status(404).end()
    }

    const updates = JSON.parse(await readFileSync(process.env.UPDATES_JSON_PATH))
    const update = updates['launcher'][os].find(update => update['latest'] === true)
    // console.dir(updates, { depth: null })

    if (!fileName.endsWith('yml')) {
      return null
    }

    return res.sendFile(resolve(process.env.UPDATES_FOLDER_PATH, update.id, fileName))
  }
)

async function retrieveFile(request) {
  const fileName = request.params.filename
  const splittedFileName = fileName.split('.')
  const extension = splittedFileName[splittedFileName.length - 1]

  if (extension !== 'yml') {
    const os = getOsFromFileName(fileName)

    const updates = JSON.parse(await readFileSync(process.env.UPDATES_JSON_PATH))
    const update = updates['launcher'][os].find(update => update['latest'] === true)

    const filePath = resolve(process.env.UPDATES_FOLDER_PATH, update.id, fileName)

    const getStream = async (range) => createReadStream(filePath, range)

    const mimeType = getMimeType(extension)
    const fileSize = statSync(filePath).size

    return { getStream, type: mimeType, size: fileSize }
  }
}

export default SR