import {createReadStream, readFileSync, statSync} from "fs"
import {join, resolve} from "path"
import express from "express"
import sendRanges from "send-ranges"
import {createLogger} from 'logger'
import {config} from "dotenv";
import routes from "./routes/index.js";
import {createDeflateRaw} from "zlib";
import {pipeline} from "stream";
import ByteRangeStream from "byte-range-stream";
// import {createPartialContentHandler} from "express-partial-content";

config()

const logger = createLogger()
const app = express()
app.use(express.json());
app.use('/', routes);
const port = 3000

// import timeout from 'connect-timeout';
//
// function haltOnTimedout(req, res, next) {
//   if (!req.timedout) next();
// }
//
// app.use(timeout(60 * 1000))
app.use((req, res, next) => haltOnTimedout(req, res, next))

function getMimeType(extension) {
  switch (extension.toLowerCase()) {
    case 'appimage': return 'application/x-executable'
    case 'yml': return 'text/yaml'
    // TODO тут добавь остальные типы
    default: return 'application/binary'
  }
}

// async function contentProvider(request) {
//   const fileName = request.params.filename
//   const splittedFileName = fileName.split('.')
//   const extension = splittedFileName[splittedFileName.length - 1]
//
//   let os = ''
//   switch (extension) {
//     case 'AppImage':
//       os = 'linux'
//       break
//     case 'exe':
//       os = 'win'
//       break
//     case 'dmg':
//       os = 'mac'
//       break
//     case 'yml': {
//       const fName = splittedFileName[0]
//       const platform = fName.split('-')[1]
//       switch (platform) {
//         case 'linux':
//           os = 'linux'
//           break
//         case 'win16':
//           os = 'win'
//           break
//         case 'darwin':
//           os = 'mac'
//           break
//         default: {
//           return null
//         }
//       }
//       break
//     }
//     default: {
//       return null
//     }
//   }
//   console.log(os)
//
//   const updates = JSON.parse(await readFileSync(process.env.UPDATES_JSON_PATH))
//   const update = updates['launcher'][os].find(update => update['latest'] === true)
//
//   console.log(fileName === update.executable)
//   const filePath = resolve(process.env.UPDATES_FOLDER_PATH, update.id, fileName)
//   const getStream = (range) => createReadStream(filePath, range)
//   const mimeType = getMimeType(extension)
//   const totalSize = statSync(filePath).size
//
//   console.log(mimeType)
//   return {
//     fileName,
//     totalSize,
//     mimeType,
//     getStream
//   }
// }

// app.get('/api/update/:filename', async (req, res) => {
//   const fileName = req.params.filename
//   const splittedFileName = fileName.split('.')
//   const extension = splittedFileName[splittedFileName.length - 1]
//   if (extension === 'yml') {
//     const fName = splittedFileName[0]
//     const platform = fName.split('-')[1]
//     let os = ''
//     switch (platform) {
//       case 'linux':
//         os = 'linux'
//         break
//       case 'win16':
//         os = 'win'
//         break
//       case 'darwin':
//         os = 'mac'
//         break
//       default: {
//         res.statusMessage = `OS ${ platform } is not found`// TODO not allowed? Может не найден? Ну или не поддерживается
//         return res.status(404).end()
//       }
//     }
//     const updates = JSON.parse(await readFileSync(process.env.UPDATES_JSON_PATH))
//     const update = updates.launcher[os].find(update => update.latest === true)
//     const fileStat = statSync(join(process.env.UPDATES_FOLDER_PATH, update.id, fileName))
//     res.writeHead(200, {
//       'Content-Disposition': `attachment; filename=\"${ fileName }\"`,
//       'Content-Type': `text/yaml`,
//       'Content-Length': fileStat.size,
//     })
//
//     const readStream = createReadStream(join(process.env.UPDATES_FOLDER_PATH, update.id, fileName))
//     readStream.pipe(res)
//     res.on('close', async () => {
//
//     })
//   } else {
//     console.log(req.headers)
//     // console.log(connections, fileName)
//     // if (connections >= process.env.UPDATES_MAX_CONNECTIONS) {
//     //   return res.status(429).end()
//     // } else {
//     //   connections++
//     let os = ''
//     switch (extension) {
//       case 'AppImage':
//         os = 'linux'
//         break
//       case 'exe':
//         os = 'win'
//         break
//       case 'dmg':
//         os = 'mac'
//         break
//       default: {
//         res.statusMessage = `Update with extension ${ extension } not found` // TODO not allowed? Может не найден?
//         return res.status(404).end()
//       }
//     }
//
//     const updates = JSON.parse(await readFileSync(process.env.UPDATES_JSON_PATH))
//     const update = updates.launcher[os].find(update => {
//       if (typeof update.latest === 'boolean') {
//         return update.latest === true
//       } else {
//         res.statusMessage = `Latest update not found`
//         res.status(404).end()
//       }
//     }) // TODO что будет, если его нет? Вангую: сервер упадет
//
//     if (req.headers.range) {
//       const filePath = join(process.env.UPDATES_FOLDER_PATH, update.id, update.executable)
//       const totalSize = statSync(filePath).size
//
//       const getChunk = range => createReadStream(filePath, range)
//
//       const byteStream = new ByteRangeStream({
//         range: req.headers.range,
//         getChunk,
//         totalSize,
//         contentType: getMimeType(extension)
//       })
//
//       const headers = byteStream.getHeaders()
//
//       const ranges = req.headers.range.replace(/bytes=/, "").split(', ').map((range) => {
//         let [start, end] = range.split('-')
//         start = parseInt(start, 10) // TODO make it safely
//         end = end ? parseInt(end, 10) : totalSize - 1 // TODO make it safely
//         return { start, end }
//       })
//
//       headers['Content-Length'] = ranges.reduce((acc, range) => acc + (range.end - range.start + 1), 0)
//       console.log(headers)
//       console.log(byteStream.getRanges())
//
//       res.writeHead(206, headers)
//
//       // pipeline(byteStream, res, err => {
//       //   if (err) console.log(err)
//       // })
//
//       const gzip = createDeflateRaw()
//       byteStream.pipe(gzip).pipe(res)
//
//       res.on('close', async () => {
//         // connections = 0
//         // await broadcastAlert(process.env.AUTH_TOKEN)
//       })
//     } else {
//       const fileStat = statSync(join(process.env.UPDATES_FOLDER_PATH, update.id, update.executable))
//
//       res.writeHead(200, {
//         'Content-Disposition': `attachment; filename=\"${ update.executable }\"`,
//         'Content-Type': getMimeType(extension),
//         'Content-Length': fileStat.size, // TODO с ренжами так нельзя делать
//       })
//       const readStream = createReadStream(join(process.env.UPDATES_FOLDER_PATH, update.id, update.executable))
//       pipeline(readStream, res, err => {
//         if (err) console.log(err)
//       })
//       res.on('close', async () => {
//         // connections = 0
//         // await broadcastAlert(process.env.AUTH_TOKEN)
//       })
//     }
//     // }
//   }
// })

// const handler = createPartialContentHandler(contentProvider, logger)
// app.get('/api/update/:filename', handler)

// app.get('/api/update/:filename', async (req, res) => {
//   const fileName = req.params.filename
//   const splittedFileName = fileName.split('.')
//   const extension = splittedFileName[splittedFileName.length - 1]
//   let os = ''
//   console.log(fileName)
//   if (extension === 'yml') {
//     const fName = splittedFileName[0]
//     const platform = fName.split('-')[1]
//     switch (platform) {
//       case 'linux':
//         os = 'linux'
//         break
//       case 'win16':
//         os = 'win'
//         break
//       case 'darwin':
//         os = 'mac'
//         break
//       default: {
//         res.statusMessage = `OS ${platform} for filename ${fileName} is not found`
//         return res.status(404).end()
//       }
//     }
//     const updates = JSON.parse(await readFileSync(process.env.UPDATES_JSON_PATH))
//     const update = updates['launcher'][os].find(update => update['latest'] === true)
//     console.log(resolve(process.env.UPDATES_FOLDER_PATH, update.id, fileName))
//     res.sendFile(resolve(process.env.UPDATES_FOLDER_PATH, update.id, fileName))
//   } else {
//     await createPartialContentHandler(await contentProvider(req), logger)
//   }
// })

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})