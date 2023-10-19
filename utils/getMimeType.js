export default function getMimeType(extension) {
  switch (extension.toLowerCase()) {
    case 'appimage': return 'application/x-executable'
    case 'yml': return 'text/yaml'
    // TODO тут добавь остальные типы
    default: return 'application/binary'
  }
}